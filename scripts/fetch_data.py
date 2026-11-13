#!/usr/bin/env python3
"""Arzino data engine.

Runs on GitHub Actions every few minutes. Pulls prices for fiat currencies,
gold, silver, crypto and the Iranian Toman, then writes compact JSON files the
web app reads:

  latest.json        current prices (USD per unit) + Iranian market (Toman)
  charts/<ID>.json   OHLC series: m1 (~26h of 1-minute), h1 (~32 days), d1 (~1 year)
  history/iran.json  our own rolling history of Iranian market prices
  status.json        what worked / what failed on the last run

Only the Python standard library is used.
"""
import json
import os
import re
import sys
import time
import traceback
import urllib.parse
import urllib.request
import http.cookiejar

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
NOW = int(time.time())
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")

STATUS = {"run": NOW, "ok": [], "errors": []}

# id: (yahoo symbol, invert)   price stored as "USD per 1 unit"
YAHOO = {
    "EUR": ("EURUSD=X", False),
    "GBP": ("GBPUSD=X", False),
    "TRY": ("TRY=X", True),
    "CAD": ("CAD=X", True),
    "CNY": ("CNY=X", True),
    "CHF": ("CHF=X", True),
    "AED": ("AED=X", True),
    "JPY": ("JPY=X", True),
    "AUD": ("AUDUSD=X", False),
    "RUB": ("RUB=X", True),
    "XAU": ("GC=F", False),
    "XAG": ("SI=F", False),
    "BTC": ("BTC-USD", False),
    "ETH": ("ETH-USD", False),
    "USDT": ("USDT-USD", False),
    "XRP": ("XRP-USD", False),
    "TRX": ("TRX-USD", False),
}

# Binance spot fallback (USDT quoted ~ USD)
BINANCE = {"BTC": "BTCUSDT", "ETH": "ETHUSDT", "XRP": "XRPUSDT",
           "TRX": "TRXUSDT", "XAU": "PAXGUSDT", "EUR": "EURUSDT"}

COOKIES = http.cookiejar.CookieJar()
OPENER = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(COOKIES))


def http(url, data=None, headers=None, timeout=20):
    h = {"User-Agent": UA, "Accept": "*/*", "Accept-Language": "en-US,en;q=0.9,fa;q=0.8"}
    if headers:
        h.update(headers)
    if isinstance(data, dict):
        data = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=data, headers=h)
    with OPENER.open(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def jget(url, **kw):
    return json.loads(http(url, **kw))


def note_ok(k):
    STATUS["ok"].append(k)


def note_err(k, e):
    STATUS["errors"].append(f"{k}: {type(e).__name__}: {str(e)[:160]}")


def r6(x):
    if x is None:
        return None
    return float(f"{x:.6g}")


def load(path, default):
    try:
        with open(os.path.join(OUT, path)) as f:
            return json.load(f)
    except Exception:
        return default


def save(path, obj):
    p = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
    with open(p, "w") as f:
        json.dump(obj, f, separators=(",", ":"), ensure_ascii=False)


def inv_bar(b):
    t, o, h, l, c = b
    return [t, r6(1 / o), r6(1 / l), r6(1 / h), r6(1 / c)]


# ---------------------------------------------------------------- Yahoo
def yahoo(sym, interval, period1=None, rng=None):
    q = {"interval": interval, "includePrePost": "false"}
    if rng:
        q["range"] = rng
    else:
        q["period1"] = str(period1)
        q["period2"] = str(NOW + 60)
    last = None
    for host in ("query1", "query2"):
        try:
            url = f"https://{host}.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?" + urllib.parse.urlencode(q)
            d = jget(url)
            res = d["chart"]["result"][0]
            ts = res.get("timestamp") or []
            qq = res["indicators"]["quote"][0]
            bars = []
            for i, t in enumerate(ts):
                o, h, l, c = qq["open"][i], qq["high"][i], qq["low"][i], qq["close"][i]
                if None in (o, h, l, c) or c <= 0:
                    continue
                bars.append([int(t), r6(o), r6(h), r6(l), r6(c)])
            return res["meta"], bars
        except Exception as e:  # try next host
            last = e
    raise last


def binance_klines(sym, interval, start_ms=None, limit=1000):
    q = {"symbol": sym, "interval": interval, "limit": limit}
    if start_ms:
        q["startTime"] = start_ms
    d = jget("https://data-api.binance.vision/api/v3/klines?" + urllib.parse.urlencode(q))
    return [[int(k[0] / 1000), r6(float(k[1])), r6(float(k[2])), r6(float(k[3])), r6(float(k[4]))] for k in d]


# ---------------------------------------------------------------- Iran market
def to_num(s):
    if s is None:
        return None
    s = str(s)
    s = s.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٬,", "0123456789  ")).replace(" ", "")
    try:
        v = float(s)
        return v if v > 0 else None
    except ValueError:
        return None


def iran_tgju():
    """tgju.org public ticker json (prices in Rial)."""
    keys = {
        "USD": "price_dollar_rl", "EUR": "price_eur", "GBP": "price_gbp",
        "TRY": "price_try", "AED": "price_aed", "CAD": "price_cad",
        "CNY": "price_cny", "CHF": "price_chf", "AUD": "price_aud",
        "JPY": "price_jpy", "RUB": "price_rub",
        "SEKE": "sekee", "SEKE_B": "sekeb", "NIM": "nim", "ROB": "rob",
        "G18": "geram18", "G24": "geram24", "MESGHAL": "mesghal",
        "USDT": "crypto-tether-irr",
    }
    last = None
    for n in (1, 2, 3, 4):
        try:
            d = jget(f"https://call{n}.tgju.org/ajax.json?rev={NOW}")
            cur = d.get("current", d)
            out = {}
            for k, src in keys.items():
                it = cur.get(src)
                if isinstance(it, dict):
                    v = to_num(it.get("p"))
                    if v:
                        out[k] = v / 10.0  # rial -> toman
            if out.get("USD"):
                # JPY/RUB on tgju are quoted per 10 / per 100 units at times; sanity-check later
                return out
            last = ValueError("no price_dollar_rl")
        except Exception as e:
            last = e
    raise last


def iran_bonbast():
    """bonbast.com free-market cash rates (Toman)."""
    html = http("https://www.bonbast.com/")
    m = re.search(r"param\s*[:=]\s*[\"']([^\"']+)[\"']", html)
    if not m:
        raise ValueError("token not found")
    d = jget("https://www.bonbast.com/json", data={"param": m.group(1)},
             headers={"Referer": "https://www.bonbast.com/", "X-Requested-With": "XMLHttpRequest",
                      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"})
    mp = {"USD": "usd1", "EUR": "eur1", "GBP": "gbp1", "TRY": "try1", "AED": "aed1",
          "CAD": "cad1", "CNY": "cny1", "CHF": "chf1", "AUD": "aud1", "JPY": "jpy1",
          "RUB": "rub1", "SEKE": "emami1", "SEKE_B": "azadi1", "G18": "gol18", "MESGHAL": "mithqal"}
    out = {}
    for k, s in mp.items():
        v = to_num(d.get(s))
        if v:
            out[k] = v
    if not out.get("USD"):
        raise ValueError("no usd1")
    # bonbast quotes JPY per 10 and RUB per 1? keep raw; sanity filter later
    return out


def iran_nobitex():
    d = jget("https://api.nobitex.ir/market/stats?srcCurrency=usdt,btc,eth&dstCurrency=rls")
    st = d["stats"]
    out = {"USDT": float(st["usdt-rls"]["latest"]) / 10.0}
    for c in ("btc", "eth"):
        try:
            out[c.upper()] = float(st[f"{c}-rls"]["latest"]) / 10.0
        except Exception:
            pass
    return out


def iran_wallex():
    d = jget("https://api.wallex.ir/v1/markets")
    sym = d["result"]["symbols"]
    out = {"USDT": float(sym["USDTTMN"]["stats"]["lastPrice"])}
    return out


def nobitex_udf(resolution, seconds):
    q = {"symbol": "USDTIRT", "resolution": resolution, "from": NOW - seconds, "to": NOW}
    d = jget("https://api.nobitex.ir/market/udf/history?" + urllib.parse.urlencode(q))
    if d.get("s") != "ok":
        raise ValueError(d.get("s"))
    return [[int(t), r6(o / 10), r6(h / 10), r6(l / 10), r6(c / 10)]
            for t, o, h, l, c in zip(d["t"], d["o"], d["h"], d["l"], d["c"])]


def wallex_udf(resolution, seconds):
    q = {"symbol": "USDTTMN", "resolution": resolution, "from": NOW - seconds, "to": NOW}
    d = jget("https://api.wallex.ir/v1/udf/history?" + urllib.parse.urlencode(q))
    if d.get("s") != "ok":
        raise ValueError(d.get("s"))
    return [[int(t), r6(float(o)), r6(float(h)), r6(float(l)), r6(float(c))]
            for t, o, h, l, c in zip(d["t"], d["o"], d["h"], d["l"], d["c"])]


def tgju_daily(key="price_dollar_rl", n=400):
    """Daily OHLC history from tgju (rial) -> toman bars, oldest first."""
    q = {"lang": "en", "order_dir": "desc", "start": 0, "length": n}
    d = jget(f"https://api.tgju.org/v1/market/indicator/summary-table-data/{key}?" + urllib.parse.urlencode(q))
    bars = []
    for row in d.get("data", []):
        # row: [open, low, high, close, change, pct, gregorian_date, jalali_date]
        try:
            o, l, h, c = (to_num(re.sub(r"<[^>]+>", "", str(x))) for x in row[:4])
            ds = re.sub(r"<[^>]+>", "", str(row[6]))
            t = int(time.mktime(time.strptime(ds.strip()[:10], "%Y/%m/%d")))
            if o and h and l and c:
                bars.append([t, r6(o / 10), r6(h / 10), r6(l / 10), r6(c / 10)])
        except Exception:
            continue
    bars.sort()
    if len(bars) < 5:
        raise ValueError("too few rows")
    return bars


# ---------------------------------------------------------------- main
def main():
    os.makedirs(os.path.join(OUT, "charts"), exist_ok=True)
    prev = load("latest.json", {})
    usd = {"USD": 1.0}
    chg = {}
    src = {}

    # ---- global markets via Yahoo (+ Binance fallback)
    for aid, (sym, inv) in YAHOO.items():
        old = load(f"charts/{aid}.json", {})
        ch = {"id": aid, "m1": old.get("m1", []), "h1": old.get("h1", []), "d1": old.get("d1", []),
              "u": old.get("u", {})}
        got = False
        try:
            meta, m1 = yahoo(sym, "1m", period1=NOW - 26 * 3600)
            if inv:
                m1 = [inv_bar(b) for b in m1]
            if m1:
                ch["m1"] = m1
                ch["u"]["m1"] = NOW
            price = meta.get("regularMarketPrice")
            if price:
                usd[aid] = r6(1 / price if inv else price)
                got = True
            if NOW - ch["u"].get("h1", 0) > 25 * 60 or not ch["h1"]:
                _, h1 = yahoo(sym, "60m", period1=NOW - 32 * 86400)
                if h1:
                    ch["h1"] = [inv_bar(b) for b in h1] if inv else h1
                    ch["u"]["h1"] = NOW
            if NOW - ch["u"].get("d1", 0) > 3 * 3600 or not ch["d1"]:
                _, d1 = yahoo(sym, "1d", rng="1y")
                if d1:
                    ch["d1"] = [inv_bar(b) for b in d1] if inv else d1
                    ch["u"]["d1"] = NOW
            src[aid] = "yahoo"
            note_ok(f"yahoo:{aid}")
        except Exception as e:
            note_err(f"yahoo:{aid}", e)
        if not got and aid in BINANCE:
            try:
                bs = BINANCE[aid]
                m1 = binance_klines(bs, "1m", start_ms=(NOW - 26 * 3600) * 1000, limit=1000)
                m1 += binance_klines(bs, "1m", start_ms=(m1[-1][0] + 60) * 1000, limit=1000) if m1 else []
                ch["m1"] = m1
                ch["h1"] = binance_klines(bs, "1h", start_ms=(NOW - 32 * 86400) * 1000)
                ch["d1"] = binance_klines(bs, "1d", start_ms=(NOW - 366 * 86400) * 1000)
                ch["u"] = {"m1": NOW, "h1": NOW, "d1": NOW}
                usd[aid] = m1[-1][4]
                got = True
                src[aid] = "binance"
                note_ok(f"binance:{aid}")
            except Exception as e:
                note_err(f"binance:{aid}", e)
        if not got and prev.get("usd", {}).get(aid):
            usd[aid] = prev["usd"][aid]
            src[aid] = "stale"
        # 24h change
        try:
            series = ch["m1"] or ch["h1"]
            last = series[-1][4]
            ref = None
            for b in series:
                if b[0] >= series[-1][0] - 86400:
                    ref = b[1]
                    break
            if ref:
                chg[aid] = round((last / ref - 1) * 100, 3)
        except Exception:
            pass
        save(f"charts/{aid}.json", ch)

    # Fallback for any fiat still missing: open.er-api.com (daily)
    missing = [a for a in YAHOO if a not in usd]
    if missing:
        try:
            d = jget("https://open.er-api.com/v6/latest/USD")
            for a in missing:
                if a in d.get("rates", {}):
                    usd[a] = r6(1 / d["rates"][a])
                    src[a] = "er-api"
            note_ok("er-api")
        except Exception as e:
            note_err("er-api", e)

    # ---- Iranian market (Toman)
    iran = {}
    iran_src = {}
    for name, fn in (("bonbast", iran_bonbast), ("tgju", iran_tgju),
                     ("nobitex", iran_nobitex), ("wallex", iran_wallex)):
        try:
            got = fn()
            for k, v in got.items():
                if k not in iran:
                    iran[k] = v
                    iran_src[k] = name
            note_ok(f"iran:{name}")
        except Exception as e:
            note_err(f"iran:{name}", e)

    # sanity: compare each Iranian fiat price with USD cross; fix per-10/per-100 quoting
    tpu = iran.get("USD") or iran.get("USDT")
    if tpu:
        for k, v in list(iran.items()):
            if k in usd and k not in ("USD",):
                theo = usd[k] * tpu
                if theo <= 0:
                    continue
                ratio = v / theo
                fixed = False
                for f in (10, 100, 1000):
                    if 0.7 < ratio / f < 1.4:
                        iran[k] = v / f
                        fixed = True
                        break
                if not fixed and not (0.6 < ratio < 1.6):
                    del iran[k]  # nonsense value, drop it
    if not tpu and prev.get("iran", {}).get("USD"):
        iran = prev["iran"]
        iran_src = {k: "stale" for k in iran}
    iran = {k: r6(v) for k, v in iran.items()}

    # ---- Toman chart (Toman per USD): Nobitex USDT/IRT candles, else our own history
    irt_old = load("charts/IRT.json", {})
    irt = {"id": "IRT", "unit": "toman_per_usd", "m1": irt_old.get("m1", []),
           "h1": irt_old.get("h1", []), "d1": irt_old.get("d1", []), "u": irt_old.get("u", {})}
    for name, udf in (("wallex", wallex_udf), ("nobitex", nobitex_udf)):
        try:
            irt["m1"] = udf("1", 26 * 3600)
            if NOW - irt["u"].get("h1", 0) > 25 * 60 or not irt["h1"]:
                irt["h1"] = udf("60", 32 * 86400)
                irt["u"]["h1"] = NOW
            if NOW - irt["u"].get("d1", 0) > 3 * 3600 or not irt["d1"]:
                irt["d1"] = udf("D", 366 * 86400)
                irt["u"]["d1"] = NOW
            irt["src"] = name + "-usdt"
            note_ok(f"chart:IRT:{name}")
            break
        except Exception as e:
            note_err(f"chart:IRT:{name}", e)
    # tgju free-market daily history (cash dollar) is preferred for the 1-year view
    try:
        if NOW - irt["u"].get("tg", 0) > 3 * 3600 or irt.get("d1src") != "tgju":
            irt["d1"] = tgju_daily()
            irt["d1src"] = "tgju"
            irt["u"]["tg"] = NOW
        note_ok("chart:IRT:tgju")
    except Exception as e:
        note_err("chart:IRT:tgju", e)

    # rolling history of the Iranian market (our own record, every run)
    hist = load("history/iran.json", {"r": [], "h": [], "d": []})
    if iran:
        snap = [NOW, iran]
        hist["r"] = [x for x in hist["r"] if x[0] > NOW - 3 * 86400] + [snap]
        if not hist["h"] or NOW - hist["h"][-1][0] >= 3600:
            hist["h"] = [x for x in hist["h"] if x[0] > NOW - 35 * 86400] + [snap]
        if not hist["d"] or NOW - hist["d"][-1][0] >= 86400:
            hist["d"] = [x for x in hist["d"] if x[0] > NOW - 400 * 86400] + [snap]
        save("history/iran.json", hist)
    if not irt["m1"] and hist["r"]:
        def to_bars(rows):
            return [[t, v["USD"], v["USD"], v["USD"], v["USD"]] for t, v in rows if v.get("USD")]
        irt["m1"], irt["h1"], irt["d1"] = to_bars(hist["r"]), to_bars(hist["h"]), to_bars(hist["d"])
        irt["src"] = "history"
    save("charts/IRT.json", irt)

    latest = {
        "t": NOW,
        "usd": usd,
        "chg": chg,
        "src": src,
        "iran": iran,
        "iran_src": iran_src,
        "toman_per_usd": iran.get("USD") or iran.get("USDT"),
    }
    save("latest.json", latest)
    save("status.json", STATUS)
    print(json.dumps(STATUS, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        STATUS["errors"].append("fatal: " + traceback.format_exc()[-800:])
        save("status.json", STATUS)
        raise
