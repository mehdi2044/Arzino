'use strict';
/* صرافینو — rate board, board image, WhatsApp sharing, receipts */

const BOARD_THEMES = {
  navy:   {bg:['#071427','#0f2b52','#071427'], glow1:'rgba(247,215,122,.30)', glow2:'rgba(25,199,155,.22)', card:'rgba(255,255,255,.07)', line:'rgba(255,255,255,.10)', text:'#ffffff', muted:'rgba(255,255,255,.65)', buy:'#4ee6b4', sell:'#f7d77a', accent:'#f2c14e', name:'سرمه‌ای و طلایی'},
  emerald:{bg:['#03271f','#065f4b','#03271f'], glow1:'rgba(247,215,122,.32)', glow2:'rgba(255,255,255,.10)', card:'rgba(255,255,255,.08)', line:'rgba(255,255,255,.12)', text:'#ffffff', muted:'rgba(255,255,255,.7)', buy:'#b9ffe4', sell:'#ffd978', accent:'#f2c14e', name:'زمردی'},
  light:  {bg:['#f6f8fc','#e8eef7','#f6f8fc'], glow1:'rgba(217,165,33,.18)', glow2:'rgba(15,164,122,.14)', card:'#ffffff', line:'#e1e8f1', text:'#0b1f3a', muted:'#5b6b82', buy:'#0a8a62', sell:'#b07a00', accent:'#d9a521', name:'روشن'},
};
const CCY_COLORS = {USD:['#1f6f43','#3fb27a'], EUR:['#1e3a8a','#3b82f6'], TRY:['#9f1239','#ef4444'], IRT:['#166534','#22c55e'], USDT:['#0f766e','#26a17b'],
  GBP:['#4c1d95','#8b5cf6'], AED:['#7c2d12','#ea580c'], CAD:['#991b1b','#f87171'], CHF:['#b91c1c','#f43f5e'], CNY:['#a16207','#facc15'], IQD:['#065f46','#10b981']};

const settings = () => S.ex?.settings || {};
const boardRows = () => (settings().board_rows?.length ? settings().board_rows : BOARD_DEFAULT);
async function saveSettings(patch) {
  const next = {...settings(), ...patch};
  const {error} = await sb.from('exchanges').update({settings: next}).eq('id', S.ex.id);
  if (error) { err(error); return false; }
  S.ex.settings = next; return true;
}
function normPhone(p) {
  let d = String(p || '').replace(/[۰-۹]/g, x => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('00')) d = d.slice(2);
  if (/^05\d{9}$/.test(d)) d = '90' + d.slice(1);        // Turkey mobile
  if (/^09\d{9}$/.test(d)) d = '98' + d.slice(1);        // Iran mobile
  return d.length >= 10 ? d : '';
}
const waLink = (phone, text) => `https://wa.me/${phone ? normPhone(phone) : ''}?text=${encodeURIComponent(text)}`;
const faNum = (v, d) => { if (v == null || !isFinite(v)) return '—'; return new Intl.NumberFormat(settings().board_digits === 'en' ? 'en-US' : 'fa-IR', {maximumFractionDigits: d ?? (Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 100 ? 1 : 3)}).format(v); };
function roundRate(v, quote) {
  if (!isFinite(v)) return null;
  if (quote === 'IRT') { const r = Number(settings().round_irt || 10); return Math.round(v / r) * r; }
  const d = v >= 1000 ? 0 : v >= 100 ? 1 : v >= 1 ? 3 : 5;
  return +v.toFixed(d);
}

/* ---------------------------------------------------------------- board view */
function vBoard(el) {
  const st = settings(), rows = boardRows();
  const sb_ = st.spread_buy ?? 0.3, ss_ = st.spread_sell ?? 0.3;
  const times = st.board_times || ['10:00', '14:00', '18:00'];
  el.innerHTML = `
  <div class="card"><h3>📋 نرخ‌های امروز صرافی <span class="muted small">${S.board.length ? 'آخرین ذخیره: ' + jd(Math.max(...S.board.map(r => +new Date(r.updated_at)))) : ''}</span></h3>
    <p class="hint" style="margin-top:-6px">«خرید» = نرخی که از مشتری می‌خرید · «فروش» = نرخی که به مشتری می‌فروشید. این نرخ‌ها پیش‌فرض فرم معامله و تابلو هستند.</p>
    <div class="grid g3 keep" style="margin:10px 0">
      <div class="fld"><label>درصد کمتر از بازار برای خرید</label><input class="in num" id="spB" inputmode="decimal" value="${sb_}"></div>
      <div class="fld"><label>درصد بیشتر از بازار برای فروش</label><input class="in num" id="spS" inputmode="decimal" value="${ss_}"></div>
      <div class="fld"><label>گرد کردن نرخ تومان</label><select class="in" id="rIrt">${[1, 10, 50, 100, 1000].map(v => `<option value="${v}" ${Number(st.round_irt || 10) === v ? 'selected' : ''}>${v === 1 ? 'بدون گرد کردن' : 'به ' + fmt(v) + ' تومان'}</option>`).join('')}</select></div>
    </div>
    <div class="tbl-wrap"><table class="tbl" id="bTbl"><tr><th>ارز</th><th>بازار</th><th>خرید</th><th>فروش</th><th></th></tr>
    ${rows.map(([c, q], i) => { const r = S.board.find(x => x.ccy === c && x.quote === q); return `<tr>
      <td>${CCY[c].fa} → ${CCY[q].fa}</td><td class="n muted">${fmt(mktRate(c, q))}</td>
      <td><input class="in num" data-bb="${i}" value="${r?.buy ?? ''}" inputmode="decimal"></td>
      <td><input class="in num" data-bs="${i}" value="${r?.sell ?? ''}" inputmode="decimal"></td>
      <td><button class="ibtn small" data-del="${i}" title="حذف ردیف">✕</button></td></tr>`; }).join('')}</table></div>
    <div class="pair" style="margin-top:8px"><select class="in" id="addC">${ccyOpts('AED')}</select><select class="in" id="addQ">${ccyOpts('TRY', ['TRY','IRT','USD','EUR'])}</select><button class="btn g" id="addRow" style="flex:none">+ ردیف</button></div>
    <div class="btns"><button class="btn g" id="bFill">⚡ پر کردن از بازار با درصدهای بالا</button><button class="btn p" id="bSave">💾 ذخیره نرخ‌ها</button></div></div>

  <div class="card"><h3>🖼 تابلوی دیجیتال برای واتس‌اپ</h3>
    <div class="grid g2">
      <div><canvas id="bCanvas" class="board-prev"></canvas>
        <div class="seg" id="bSize" style="margin:10px auto 0;display:flex;justify-content:center"><button class="on" data-s="post">پست (۴:۵)</button><button data-s="story">استوری (۹:۱۶)</button><button data-s="square">مربع</button></div></div>
      <div>
        <div class="btns" style="margin-top:0"><button class="btn wa w" id="bShare">📤 ارسال تصویر در واتس‌اپ</button></div>
        <div class="btns"><button class="btn g" id="bText">💬 ارسال متنی نرخ‌ها</button><button class="btn g" id="bDl">⬇️ دانلود تصویر</button></div>
        <div class="preview" style="margin-top:12px">
          <b>ارسال خصوصی به همه‌ی مشتری‌ها:</b> در واتس‌اپ یک «لیست پخش» (Broadcast list) بسازید و مشتری‌ها را در آن بگذارید. بعد از زدن «ارسال تصویر»، همان لیست را انتخاب کنید. پیام برای هر نفر جداگانه و خصوصی می‌رود. فقط کسانی که شماره‌ی صرافی را ذخیره کرده‌اند پیام را دریافت می‌کنند.
        </div>
        <div class="fld" style="margin-top:12px"><label>⏰ ساعت‌های یادآوری ارسال تابلو (هر روز)</label>
          <div class="pair">${[0, 1, 2].map(i => `<input class="in" type="time" data-time="${i}" value="${times[i] || ''}">`).join('')}</div>
          <p class="hint">در این ساعت‌ها، داشبورد یادآوری «وقت ارسال تابلو» نشان می‌دهد.</p></div>
      </div>
    </div></div>

  ${isMgr() ? '' : '<!--'}<div class="card"><h3>🎨 ظاهر و اطلاعات تابلو</h3>
    <div class="logo-up fld"><div class="coin" id="logoPrev">${st.logo ? `<img src="${st.logo}">` : 'ص'}</div>
      <div><label class="btn g" style="cursor:pointer">🖼 انتخاب لوگو<input type="file" id="logoIn" accept="image/*" hidden></label> ${st.logo ? '<button class="btn r" id="logoDel">حذف</button>' : ''}<p class="hint">تصویر مربعی بهتر است. خودکار کوچک می‌شود.</p></div></div>
    <div class="grid g2">
      <div class="fld"><label>تلفن / واتس‌اپ صرافی</label><input class="in" id="stPhone" dir="ltr" value="${esc(st.phone || '')}" placeholder="+90 5xx xxx xx xx"></div>
      <div class="fld"><label>آدرس</label><input class="in" id="stAddr" value="${esc(st.address || '')}" placeholder="استانبول، …"></div>
      <div class="fld"><label>متن پایین تابلو</label><input class="in" id="stNote" value="${esc(st.board_note || '')}" placeholder="نرخ‌ها لحظه‌ای است؛ پیش از معامله تماس بگیرید"></div>
      <div class="fld"><label>رنگ تابلو</label><select class="in" id="stTheme">${Object.entries(BOARD_THEMES).map(([k, t]) => `<option value="${k}" ${(st.board_theme || 'navy') === k ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
      <div class="fld"><label>ارقام تابلو</label><select class="in" id="stDigits"><option value="fa" ${st.board_digits !== 'en' ? 'selected' : ''}>فارسی (۱۲۳)</option><option value="en" ${st.board_digits === 'en' ? 'selected' : ''}>انگلیسی (123)</option></select></div>
      <div class="fld"><label>تابلوی زنده (لینک عمومی + تلویزیون مغازه)</label><label class="chk"><input type="checkbox" id="stPub" ${st.board_public ? 'checked' : ''}> فعال باشد</label></div>
    </div>
    <div id="pubBox"></div>
    <div class="btns"><button class="btn p" id="stSave">💾 ذخیره تنظیمات تابلو</button></div></div>${isMgr() ? '' : '-->'}`;

  // --- rates table
  const readRows = () => rows.map(([c, q], i) => ({c, q, buy: num(el.querySelector(`[data-bb="${i}"]`).value), sell: num(el.querySelector(`[data-bs="${i}"]`).value)}));
  $('bFill').onclick = () => {
    const pb = num($('spB').value) || 0, ps = num($('spS').value) || 0;
    rows.forEach(([c, q], i) => { const m = mktRate(c, q); if (!m) return;
      el.querySelector(`[data-bb="${i}"]`).value = roundRate(m * (1 - pb / 100), q);
      el.querySelector(`[data-bs="${i}"]`).value = roundRate(m * (1 + ps / 100), q); });
    toast('از بازار پر شد؛ در صورت نیاز ویرایش و ذخیره کنید');
  };
  $('rIrt').onchange = () => { S.ex.settings = {...settings(), round_irt: Number($('rIrt').value)}; };
  $('bSave').onclick = async () => {
    const data = readRows().map(r => ({exchange_id: S.ex.id, ccy: r.c, quote: r.q, buy: isFinite(r.buy) ? r.buy : null, sell: isFinite(r.sell) ? r.sell : null, updated_at: new Date().toISOString(), updated_by: S.user.id}));
    const {error} = await sb.from('rates').upsert(data); if (error) return err(error);
    await saveSettings({spread_buy: num($('spB').value) || 0, spread_sell: num($('spS').value) || 0, round_irt: Number($('rIrt').value)});
    toast('نرخ‌ها ذخیره شد ✅'); await loadExchangeData(); vBoard(el);
  };
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { const r = [...rows]; r.splice(+b.dataset.del, 1); if (await saveSettings({board_rows: r})) vBoard(el); });
  $('addRow').onclick = async () => { const c = $('addC').value, q = $('addQ').value; if (c === q) return toast('دو ارز باید متفاوت باشند');
    if (rows.some(([a, b]) => a === c && b === q)) return toast('این ردیف وجود دارد'); if (await saveSettings({board_rows: [...rows, [c, q]]})) vBoard(el); };

  // --- image
  let size = 'post';
  const redraw = () => drawBoard($('bCanvas'), size);
  $('bSize').onclick = e => { const b = e.target.closest('button'); if (!b) return; size = b.dataset.s; $('bSize').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); redraw(); };
  redraw();
  $('bShare').onclick = () => shareCanvas($('bCanvas'), `board-${size}.png`, boardText(true));
  $('bDl').onclick = () => downloadCanvas($('bCanvas'), `board-${new Date().toISOString().slice(0, 10)}.png`);
  $('bText').onclick = () => window.open(waLink('', boardText()), '_blank');
  el.querySelectorAll('[data-time]').forEach(i => i.onchange = () => saveSettings({board_times: [...el.querySelectorAll('[data-time]')].map(x => x.value).filter(Boolean)}));

  // --- settings (owner / partner only)
  if (!isMgr()) return;
  $('logoIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; const url = await shrinkImage(f, 256); if (await saveSettings({logo: url})) { toast('لوگو ذخیره شد'); vBoard(el); } };
  if ($('logoDel')) $('logoDel').onclick = async () => { if (await saveSettings({logo: null})) vBoard(el); };
  const livePreview = () => { S.ex.settings = {...settings(), phone: $('stPhone').value.trim(), address: $('stAddr').value.trim(), board_note: $('stNote').value.trim(), board_theme: $('stTheme').value, board_digits: $('stDigits').value}; redraw(); };
  ['stPhone', 'stAddr', 'stNote'].forEach(id => $(id).oninput = livePreview); ['stTheme', 'stDigits'].forEach(id => $(id).onchange = livePreview);
  const pubInfo = () => {
    const url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'board.html?ex=' + S.ex.id;
    $('pubBox').innerHTML = settings().board_public ? `<div class="preview">🔗 لینک تابلوی زنده: <a href="${url}" target="_blank" rel="noopener" dir="ltr">${url}</a>
      <div class="btns"><button class="btn g" id="pubCopy">📋 کپی لینک</button><a class="btn g" href="${url}&tv=1" target="_blank" rel="noopener">📺 حالت تلویزیون</a><a class="btn wa" href="${waLink('', 'نرخ‌های لحظه‌ای ' + S.ex.name + ':\n' + url)}" target="_blank" rel="noopener">📤 فرستادن لینک</a></div></div>` : '';
    if ($('pubCopy')) $('pubCopy').onclick = () => navigator.clipboard?.writeText(url).then(() => toast('لینک کپی شد'));
  };
  pubInfo();
  $('stSave').onclick = async () => {
    if (await saveSettings({phone: $('stPhone').value.trim(), address: $('stAddr').value.trim(), board_note: $('stNote').value.trim(), board_theme: $('stTheme').value, board_digits: $('stDigits').value, board_public: $('stPub').checked})) { toast('تنظیمات تابلو ذخیره شد ✅'); pubInfo(); render(); }
  };
}
function boardText(short) {
  const rows = boardRows().map(([c, q]) => ({c, q, r: S.board.find(x => x.ccy === c && x.quote === q)})).filter(x => x.r?.buy || x.r?.sell);
  const lines = [`🏦 ${S.ex.name}`, `📅 ${jd(Date.now(), {weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit', hour12:false})}`, ''];
  for (const {c, q, r} of rows) lines.push(`${CCY[c].fa} به ${CCY[q].fa}:  خرید ${faNum(Number(r.buy))}  |  فروش ${faNum(Number(r.sell))}`);
  if (!short) { if (settings().board_note) lines.push('', settings().board_note); if (settings().phone) lines.push('📞 ' + settings().phone); }
  return lines.join('\n');
}

/* ---------------------------------------------------------------- canvas helpers */
async function ensureFont() { try { await Promise.all([document.fonts.load('900 60px Vazirmatn'), document.fonts.load('600 30px Vazirmatn')]); } catch {} }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function loadImg(src) { return new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
function coin(ctx, cx, cy, r, ccy) {
  const [a, b] = CCY_COLORS[ccy] || ['#334155', '#64748b'];
  const g = ctx.createRadialGradient(cx - r * .35, cy - r * .4, r * .1, cx, cy, r);
  g.addColorStop(0, b); g.addColorStop(1, a);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = r * .5; ctx.shadowOffsetY = r * .18;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r * .82, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = r * .06; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `900 ${r * (CCY[ccy].s.length > 2 ? .5 : .8)}px Vazirmatn, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(CCY[ccy].s, cx, cy + r * .04);
}
function bgPaint(ctx, W, H, T) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.bg[0]); g.addColorStop(.5, T.bg[1]); g.addColorStop(1, T.bg[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, c] of [[W * .9, H * .05, W * .7, T.glow1], [W * .05, H * .95, W * .8, T.glow2]]) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  ctx.save(); ctx.globalAlpha = .06; ctx.strokeStyle = T.text; ctx.lineWidth = 2;
  for (let i = -H; i < W; i += 70) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); }
  ctx.restore();
}
async function drawBoard(canvas, size = 'post') {
  await ensureFont();
  const st = settings(), T = BOARD_THEMES[st.board_theme || 'navy'];
  const W = 1080, H = size === 'story' ? 1920 : size === 'square' ? 1080 : 1350;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d'); ctx.direction = 'rtl';
  bgPaint(ctx, W, H, T);
  const logo = await loadImg(st.logo);
  let y = size === 'story' ? 150 : 70;
  // logo coin
  const lr = 70;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  const gg = ctx.createRadialGradient(W / 2 - 25, y + lr - 30, 5, W / 2, y + lr, lr + 8);
  gg.addColorStop(0, '#fff6c9'); gg.addColorStop(.4, '#f7d77a'); gg.addColorStop(.75, '#d9a521'); gg.addColorStop(1, '#8f6500');
  ctx.beginPath(); ctx.arc(W / 2, y + lr, lr + 8, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(W / 2, y + lr, lr, 0, Math.PI * 2); ctx.clip();
  if (logo) { ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - lr, y, lr * 2, lr * 2); ctx.drawImage(logo, W / 2 - lr, y, lr * 2, lr * 2); }
  else { ctx.fillStyle = '#0b1f3a'; ctx.fillRect(W / 2 - lr, y, lr * 2, lr * 2); ctx.fillStyle = '#f7d77a'; ctx.font = '900 72px Vazirmatn'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((S.ex.name || 'ص').trim()[0], W / 2, y + lr + 4); }
  ctx.restore();
  y += lr * 2 + 60;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = T.text; ctx.font = '900 62px Vazirmatn';
  ctx.fillText(S.ex.name, W / 2, y);
  y += 52; ctx.font = '600 32px Vazirmatn'; ctx.fillStyle = T.accent;
  const dfmt = new Intl.DateTimeFormat((st.board_digits === 'en' ? 'en-US' : 'fa-IR') + '-u-ca-persian', {weekday:'long', day:'numeric', month:'long', year:'numeric'}).format(new Date());
  const tfmt = new Intl.DateTimeFormat(st.board_digits === 'en' ? 'en-US' : 'fa-IR', {hour:'2-digit', minute:'2-digit', hour12:false}).format(new Date());
  ctx.fillText(`تابلوی نرخ ارز · ${dfmt} · ساعت ${tfmt}`, W / 2, y);
  y += 40;
  // table card
  const rows = boardRows().map(([c, q]) => ({c, q, r: S.board.find(x => x.ccy === c && x.quote === q)})).filter(x => x.r?.buy || x.r?.sell);
  const footH = 190, x0 = 60, cw = W - 120;
  const avail = H - y - footH - 40;
  const headH = 76, rowH = Math.min(150, Math.max(92, (avail - headH) / Math.max(rows.length, 1)));
  const ch = headH + rowH * Math.max(rows.length, 1) + 16;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  rr(ctx, x0, y, cw, ch, 36); ctx.fillStyle = T.card; ctx.fill(); ctx.restore();
  rr(ctx, x0, y, cw, ch, 36); ctx.strokeStyle = T.line; ctx.lineWidth = 2; ctx.stroke();
  const colBuy = x0 + cw * .40, colSell = x0 + cw * .14;
  ctx.font = '800 30px Vazirmatn'; ctx.fillStyle = T.muted; ctx.textAlign = 'right';
  ctx.fillText('ارز', x0 + cw - 40, y + 50);
  ctx.textAlign = 'center'; ctx.fillStyle = T.buy; ctx.fillText('خرید از شما', colBuy, y + 50);
  ctx.fillStyle = T.sell; ctx.fillText('فروش به شما', colSell, y + 50);
  let ry = y + headH;
  if (!rows.length) { ctx.fillStyle = T.muted; ctx.font = '600 34px Vazirmatn'; ctx.fillText('نرخی ذخیره نشده است', W / 2, ry + 60); }
  rows.forEach(({c, q, r}, i) => {
    if (i) { ctx.strokeStyle = T.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 30, ry); ctx.lineTo(x0 + cw - 30, ry); ctx.stroke(); }
    const cy = ry + rowH / 2, cr = Math.min(40, rowH * .3);
    coin(ctx, x0 + cw - 40 - cr, cy, cr, c);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = T.text; ctx.font = `800 ${Math.min(40, rowH * .3)}px Vazirmatn`;
    ctx.fillText(CCY[c].fa, x0 + cw - 60 - cr * 2, cy - rowH * .14);
    ctx.fillStyle = T.muted; ctx.font = `600 ${Math.min(26, rowH * .2)}px Vazirmatn`;
    ctx.fillText('به ' + CCY[q].fa, x0 + cw - 60 - cr * 2, cy + rowH * .2);
    ctx.textAlign = 'center'; ctx.font = `900 ${Math.min(56, rowH * .4)}px Vazirmatn`;
    ctx.fillStyle = T.buy; ctx.fillText(r.buy ? faNum(Number(r.buy)) : '—', colBuy, cy + 4);
    ctx.fillStyle = T.sell; ctx.fillText(r.sell ? faNum(Number(r.sell)) : '—', colSell, cy + 4);
    ry += rowH;
  });
  // footer
  let fy = H - footH + 30; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  if (st.board_note) { ctx.fillStyle = T.muted; ctx.font = '600 28px Vazirmatn'; ctx.fillText(st.board_note, W / 2, fy); fy += 50; }
  const contact = [st.phone ? '📞 ' + st.phone : '', st.address ? '📍 ' + st.address : ''].filter(Boolean).join('     ');
  if (contact) {
    ctx.font = '800 32px Vazirmatn'; const tw = Math.min(W - 120, ctx.measureText(contact).width + 80);
    rr(ctx, (W - tw) / 2, fy - 42, tw, 64, 32); ctx.fillStyle = T.accent; ctx.fill();
    ctx.fillStyle = st.board_theme === 'light' ? '#fff' : '#2b1d00'; ctx.fillText(contact, W / 2, fy);
  }
}
function canvasBlob(canvas) { return new Promise(r => canvas.toBlob(r, 'image/png')); }
async function shareCanvas(canvas, name, text) {
  const blob = await canvasBlob(canvas), file = new File([blob], name, {type: 'image/png'});
  if (navigator.canShare && navigator.canShare({files: [file]})) {
    try { await navigator.share({files: [file], text}); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  downloadCanvas(canvas, name);
  toast('تصویر دانلود شد؛ در واتس‌اپ آن را برای مشتری یا لیست پخش بفرستید');
}
function downloadCanvas(canvas, name) { const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function shrinkImage(file, size) {
  return new Promise(res => { const fr = new FileReader(); fr.onload = () => { const img = new Image(); img.onload = () => {
    const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
    const s = Math.min(img.width, img.height); x.fillStyle = '#fff'; x.fillRect(0, 0, size, size);
    x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size); res(c.toDataURL('image/png')); }; img.src = fr.result; }; fr.readAsDataURL(file); });
}

/* ---------------------------------------------------------------- receipts */
function receiptText(x) {
  const c = cust(x.customer_id);
  const out = [`🏦 ${S.ex.name}`, `🧾 رسید ${TYPE[x.type]?.[1] || ''} شماره ${x.no}`, `📅 ${jd(x.occurred_at)}`];
  if (c && !c.is_walkin) out.push(`👤 ${c.name}`);
  const m = x.meta || {};
  if (x.type === 'trade') {
    out.push(`➖ شما دادید: ${money(m.give.amt, m.give.ccy)}`, `➕ شما گرفتید: ${money(m.get.amt, m.get.ccy)}`, `💱 نرخ: ${fmt(m.rate)}`);
  } else {
    const l = (x.lines || []).find(l => l.party === 'box') || (x.lines || [])[0];
    if (l) out.push(`💵 مبلغ: ${money(Math.abs(l.amount), l.currency)}`);
  }
  if (x.note) out.push(`📝 ${x.note}`);
  if (c && !c.is_walkin) {
    const b = Object.entries(balOf('customer', 'customer_id', c.id)).filter(([, v]) => Math.abs(v) > 1e-9);
    out.push('', '📊 مانده‌ی حساب شما:');
    out.push(b.length ? b.map(([cc, v]) => `• ${money(Math.abs(v), cc)} ${v > 0 ? 'بدهکار' : 'طلبکار'}`).join('\n') : '• تسویه ✅');
    const t = Object.entries(balOf('trust', 'customer_id', c.id)).filter(([, v]) => Math.abs(v) > 1e-9);
    if (t.length) out.push('🤝 امانت: ' + t.map(([cc, v]) => `${money(Math.abs(v), cc)} ${v > 0 ? 'نزد شما' : 'نزد ما'}`).join('، '));
  }
  out.push('', 'با تشکر از اعتماد شما 🌿');
  if (settings().phone) out.push('📞 ' + settings().phone);
  return out.join('\n');
}
async function drawReceipt(canvas, x) {
  await ensureFont();
  const st = settings(), W = 1080, txt = receiptText(x).split('\n');
  const H = Math.max(1100, 420 + txt.length * 64);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d'); ctx.direction = 'rtl';
  bgPaint(ctx, W, H, BOARD_THEMES.navy);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; rr(ctx, 60, 200, W - 120, H - 260, 40); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  const logo = await loadImg(st.logo);
  ctx.save(); ctx.beginPath(); ctx.arc(W / 2, 200, 90, 0, Math.PI * 2); ctx.fillStyle = '#f7d77a'; ctx.fill(); ctx.beginPath(); ctx.arc(W / 2, 200, 80, 0, Math.PI * 2); ctx.clip();
  if (logo) ctx.drawImage(logo, W / 2 - 80, 120, 160, 160); else { ctx.fillStyle = '#0b1f3a'; ctx.fillRect(W / 2 - 80, 120, 160, 160); ctx.fillStyle = '#f7d77a'; ctx.font = '900 80px Vazirmatn'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.ex.name.trim()[0], W / 2, 205); }
  ctx.restore();
  let y = 350; ctx.textBaseline = 'alphabetic';
  txt.forEach((line, i) => {
    if (!line) { y += 24; return; }
    ctx.textAlign = i < 2 ? 'center' : 'right';
    ctx.fillStyle = i === 0 ? '#0b1f3a' : i === 1 ? '#0a7f60' : '#1f2a3d';
    ctx.font = i === 0 ? '900 52px Vazirmatn' : i === 1 ? '800 38px Vazirmatn' : '600 34px Vazirmatn';
    ctx.fillText(line, i < 2 ? W / 2 : W - 110, y); y += i < 2 ? 70 : 60;
  });
}
function receiptSheet(x) {
  const c = cust(x.customer_id), phone = c && !c.is_walkin ? normPhone(c.phone) : '';
  openSheet(`<h2>🧾 رسید ${TYPE[x.type]?.[1] || ''} #${x.no}</h2>
    <div class="preview" style="white-space:pre-line">${esc(receiptText(x))}</div>
    ${!phone && c && !c.is_walkin ? '<p class="hint">برای ارسال مستقیم، شماره‌ی واتس‌اپ مشتری را در پرونده‌اش وارد کنید.</p>' : ''}
    <div class="btns">${phone ? `<a class="btn wa" href="${waLink(phone, receiptText(x))}" target="_blank" rel="noopener">💬 ارسال متن رسید به ${esc(c.name)}</a>` : `<a class="btn wa" href="${waLink('', receiptText(x))}" target="_blank" rel="noopener">💬 ارسال متن در واتس‌اپ</a>`}
      <button class="btn gold" id="rcImg">🖼 رسید تصویری</button></div>
    <div class="btns"><button class="btn g" id="rcCopy">📋 کپی</button><button class="btn g" id="rcClose">بستن</button></div><canvas id="rcCanvas" style="display:none"></canvas>`, () => {
    $('rcClose').onclick = closeSheet;
    $('rcCopy').onclick = () => navigator.clipboard?.writeText(receiptText(x)).then(() => toast('کپی شد'));
    $('rcImg').onclick = async () => { await drawReceipt($('rcCanvas'), x); shareCanvas($('rcCanvas'), `receipt-${x.no}.png`, phone ? '' : receiptText(x)); };
  });
}

/* ---------------------------------------------------------------- reminders */
function dueBoardSlot() {
  const times = settings().board_times || ['10:00', '14:00', '18:00'];
  const now = new Date(), hm = now.getHours() * 60 + now.getMinutes(), day = now.toISOString().slice(0, 10);
  let due = null;
  for (const t of times) { const [h, m] = t.split(':').map(Number); if (h * 60 + m <= hm) due = t; }
  if (!due) return null;
  const key = `sarraf.sent.${S.ex.id}.${day}.${due}`;
  try { if (localStorage.getItem(key)) return null; } catch {}
  return {time: due, key};
}
