'use strict';
/* Sarrafino → More → "Dedicated Arzino": the exchange's own Arzino link and its price APIs (package "arzino_wl") */
const WL_SCOPES = [['fiat', 'همه‌ی ارزها (فیات)'], ['crypto', 'همه‌ی رمزارزها'], ['metal', 'فلزات (انس طلا و نقره)'], ['irt', 'قیمت‌های تومانی'], ['asset', 'فقط یک ارز']];
const wlCfg = () => S.ex?.settings?.wl || {};
const wlLink = () => location.origin + location.pathname.replace(/sarraf\/[^/]*$/, '') + '?x=' + encodeURIComponent(wlCfg().slug || S.ex.id);

// the exchange's own prices on top of the market (used for automatic board rates in the panel)
async function wlMergeMarket() {
  if (!feat('arzino_wl') || !(wlCfg().sources || []).length || !S.market) return;
  try {
    const {data} = await sb.rpc('public_wl', {p_key: S.ex.id}); if (!data) return;
    const m = S.market;
    S.market = WLX.merge(m, WLX.overrides(data, c => c === 'USD' ? 1 : c === 'IRT' ? ((m.iran?.USD || m.toman_per_usd) ? 1 / (m.iran?.USD || m.toman_per_usd) : null) : m.usd?.[c]));
  } catch (e) { console.warn(e); }
}

function wlCard() {
  if (!isMgr()) return '';
  if (!feat('arzino_wl')) return `<div class="card"><h3>🌐 ${_('ارزینوی اختصاصی')}${HELP.btn('sarraf.wl')} <span class="pill">🔒</span></h3>
    <p class="hint" style="margin-top:0">${_('یک ارزینوی کامل با نام و لوگوی صرافی شما، نرخ خرید و فروش شما در بالای آن، بدون تبلیغ دیگران، و منبع قیمت دلخواه برای هر بخش.')}</p>
    <div class="btns"><button class="btn p" data-plans>⭐ ${_('دیدن پلن‌ها')}</button></div></div>`;
  const c = wlCfg(), src = c.sources || [];
  return `<div class="card"><h3>🌐 ${_('ارزینوی اختصاصی')}${HELP.btn('sarraf.wl')}</h3>
    <div class="preview">🔗 <a href="${wlLink()}" target="_blank" rel="noopener" dir="ltr">${esc(wlLink())}</a>
      <div class="btns"><button class="btn g" id="wlCopy">📋 ${_('کپی لینک')}</button><a class="btn wa" target="_blank" rel="noopener" href="${waLink('', _('نرخ لحظه‌ای ارز و طلا در برنامه‌ی {n}:', {n: c.title || S.ex.name}) + '\n' + wlLink())}">📤 ${_('فرستادن لینک')}</a></div></div>
    <div class="grid g2" style="margin-top:10px">
      <div class="fld"><label>${_('نام کوتاه لینک (انگلیسی)')}</label><input class="in" id="wlSlug" dir="ltr" value="${esc(c.slug || '')}" placeholder="ario-ex"></div>
      <div class="fld"><label>${_('نام برنامه (خالی = نام صرافی)')}</label><input class="in" id="wlTitle" value="${esc(c.title || '')}" placeholder="${esc(S.ex.name)}"></div>
    </div>
    <label class="chk"><input type="checkbox" id="wlBoard" ${c.show_board !== false ? 'checked' : ''}> ${_('نرخ خرید و فروش ما بالای برنامه نمایش داده شود')}</label>
    <div class="btns"><button class="btn p" id="wlSave">💾 ${_('ذخیره')}</button></div>
    <h4 style="margin:16px 0 6px">🔌 ${_('منبع قیمت دلخواه (API)')}</h4>
    <p class="hint" style="margin-top:0">${_('برای هر بخش یا حتی یک ارز، آدرس API خودتان را بدهید. بخش‌هایی که منبع ندارند مثل قبل از منابع پیش‌فرض ارزینو قیمت می‌گیرند.')}</p>
    <div class="list">${src.map((s, i) => `<div class="row" data-wls="${i}"><div class="ic">${s.scope === 'asset' ? '🎯' : '🔌'}</div><div class="m"><b>${_(WL_SCOPES.find(x => x[0] === s.scope)?.[1] || s.scope)}${s.scope === 'asset' ? ' · ' + esc(s.asset || '') : ''}</b>
      <span dir="ltr">${esc((s.url || '').replace(/^https?:\/\//, '').slice(0, 48))}</span></div><div class="e small">${esc(s.unit || 'USD')}</div></div>`).join('') || `<div class="empty">${_('هنوز منبعی اضافه نشده؛ همه‌ی قیمت‌ها از منابع پیش‌فرض است.')}</div>`}</div>
    <div class="btns"><button class="btn g" id="wlAdd">+ ${_('افزودن منبع قیمت')}</button></div></div>`;
}

function bindWlCard(el) {
  if (!$('wlSave')) return;
  $('wlCopy').onclick = () => navigator.clipboard?.writeText(wlLink()).then(() => toast(_('لینک کپی شد')));
  $('wlSave').onclick = async () => {
    const slug = $('wlSlug').value.trim().toLowerCase();
    if (slug && !/^[a-z0-9][a-z0-9-]{2,30}$/.test(slug)) return toast(_('نام کوتاه: فقط حروف انگلیسی، عدد و خط تیره (۳ تا ۳۱ حرف)'));
    if (slug) { const {data: owner} = await sb.rpc('wl_slug_owner', {p_slug: slug}); if (owner && owner !== S.ex.id) return toast(_('این نام کوتاه را صرافی دیگری گرفته است'));
    }
    if (await saveSettings({wl: {...wlCfg(), slug, title: $('wlTitle').value.trim(), show_board: $('wlBoard').checked}})) { toast(_('ذخیره شد')); render(); }
  };
  $('wlAdd').onclick = () => wlSourceForm(null);
  el.querySelectorAll('[data-wls]').forEach(r => r.onclick = () => wlSourceForm(+r.dataset.wls));
}

function wlSourceForm(idx) {
  const list = [...(wlCfg().sources || [])], s = idx == null ? {scope: 'fiat', kind: 'map', mode: 'price', unit: 'USD', ttl: 60} : {...list[idx]};
  openSheet(`<h2>🔌 ${idx == null ? _('افزودن منبع قیمت') : _('ویرایش منبع قیمت')}${HELP.btn('sarraf.wl')}</h2>
    <div class="grid g2">
      <div class="fld"><label>${_('برای کدام بخش؟')}</label><select class="in" id="sScope">${WL_SCOPES.map(([k, l]) => `<option value="${k}" ${s.scope === k ? 'selected' : ''}>${_(l)}</option>`).join('')}</select></div>
      <div class="fld" id="sAssetF"><label>${_('کد ارز (مثلاً USD یا BTC یا SEKE)')}</label><input class="in" id="sAsset" dir="ltr" value="${esc(s.asset || '')}" placeholder="USD"></div>
    </div>
    <div class="fld"><label>${_('آدرس API')}</label><input class="in" id="sUrl" dir="ltr" value="${esc(s.url || '')}" placeholder="https://api.example.com/rates"></div>
    <div class="fld"><label>${_('هدر کلید (اختیاری، مثلاً X-API-Key: …)')}</label><input class="in" id="sHead" dir="ltr" value="${esc(s.header || '')}" placeholder="Authorization: Bearer …"></div>
    <div class="btns" style="margin-top:0"><button class="btn g" id="sTest">🔍 ${_('آزمایش API')}</button></div>
    <pre class="wlraw" id="sRaw" hidden></pre>
    <div class="grid g2">
      <div class="fld"><label>${_('شکل پاسخ')}</label><select class="in" id="sKind"><option value="one" ${s.kind === 'one' ? 'selected' : ''}>${_('یک عدد (قیمت یک ارز)')}</option><option value="map" ${s.kind !== 'one' ? 'selected' : ''}>${_('فهرست قیمت چند ارز')}</option></select></div>
      <div class="fld"><label>${_('مسیر عدد یا فهرست در پاسخ')}</label><input class="in" id="sPath" dir="ltr" value="${esc(s.path || '')}" placeholder="rates  /  data.price"></div>
      <div class="fld"><label>${_('قیمت‌ها به چه ارزی است؟')}</label><input class="in" id="sUnit" dir="ltr" value="${esc(s.unit || 'USD')}" placeholder="USD / USDT / TRY / IRT"></div>
      <div class="fld"><label>${_('معنی عدد')}</label><select class="in" id="sMode"><option value="price" ${s.mode !== 'per' ? 'selected' : ''}>${_('قیمت ۱ واحد از این ارز')}</option><option value="per" ${s.mode === 'per' ? 'selected' : ''}>${_('چند واحد از این ارز = ۱ واحد ارز پایه')}</option></select></div>
    </div>
    <details class="fld"><summary class="muted small">${_('تنظیمات فهرست‌های آرایه‌ای (پیشرفته)')}</summary>
      <div class="grid g3" style="margin-top:8px">
        <div class="fld"><label>${_('فیلد کد')}</label><input class="in" id="sKey" dir="ltr" value="${esc(s.key || '')}" placeholder="symbol"></div>
        <div class="fld"><label>${_('فیلد قیمت')}</label><input class="in" id="sVal" dir="ltr" value="${esc(s.val || '')}" placeholder="price"></div>
        <div class="fld"><label>${_('حذف از انتهای کد')}</label><input class="in" id="sStrip" dir="ltr" value="${esc(s.strip || '')}" placeholder="USDT"></div>
      </div>
      <div class="fld"><label>${_('هر چند ثانیه دوباره خوانده شود')}</label><input class="in num" id="sTtl" inputmode="numeric" value="${s.ttl || 60}"></div></details>
    <div class="preview" id="sOut">${_('آدرس را بنویسید و «آزمایش API» را بزنید تا قیمت‌های پیداشده را ببینید.')}</div>
    <div class="btns"><button class="btn p" id="sGo">💾 ${_('ذخیره منبع')}</button>${idx != null ? `<button class="btn r" id="sDel">${_('حذف')}</button>` : ''}<button class="btn g" id="sX">${_('انصراف')}</button></div>`, () => {
    let body = null;
    const read = () => ({id: s.id || 's' + Date.now().toString(36), scope: $('sScope').value, asset: $('sAsset').value.trim().toUpperCase(), url: $('sUrl').value.trim(),
      header: $('sHead').value.trim(), kind: $('sScope').value === 'asset' ? $('sKind').value : 'map', path: $('sPath').value.trim(), unit: ($('sUnit').value.trim() || 'USD').toUpperCase(),
      mode: $('sMode').value, key: $('sKey').value.trim(), val: $('sVal').value.trim(), strip: $('sStrip').value.trim(), ttl: Math.max(30, +$('sTtl').value || 60)});
    const sync = () => { const a = $('sScope').value === 'asset'; $('sAssetF').hidden = !a; $('sKind').disabled = !a; if (!a) $('sKind').value = 'map'; if ($('sScope').value === 'irt') $('sUnit').value = 'IRT'; preview(); };
    const usdOf = c => c === 'USD' ? 1 : c === 'IRT' ? (S.market?.iran?.USD ? 1 / S.market.iran.USD : null) : S.market?.usd?.[c];
    const preview = () => {
      if (body == null) return;
      const x = WLX.extract(read(), body, usdOf);
      $('sOut').innerHTML = x.found.length ? `✅ ${_('{n} قیمت پیدا شد:', {n: fmt(x.found.length, 0)})}<br><span dir="ltr" class="small">${x.found.slice(0, 14).map(([c, v, u]) => `${esc(c)} = ${fmt(v)} ${esc(u)}`).join(' · ')}${x.found.length > 14 ? ' …' : ''}</span>`
        : `⚠️ ${_('قیمتی پیدا نشد. «مسیر» و «شکل پاسخ» را بررسی کنید؛ پاسخ API بالای همین بخش نمایش داده شده است.')}`;
    };
    ['sScope'].forEach(id => $(id).onchange = sync); ['sKind', 'sMode'].forEach(id => $(id).onchange = preview);
    ['sPath', 'sUnit', 'sAsset', 'sKey', 'sVal', 'sStrip'].forEach(id => $(id).oninput = preview);
    sync();
    $('sTest').onclick = async () => {
      const u = $('sUrl').value.trim(); if (!/^https?:\/\//i.test(u)) return toast(_('آدرس باید با https:// شروع شود'));
      $('sTest').disabled = true; $('sOut').textContent = _('در حال دریافت…');
      const {data, error} = await sb.rpc('wl_test', {p_ex: S.ex.id, p_url: u, p_header: $('sHead').value.trim() || null});
      $('sTest').disabled = false;
      if (error) return err(error);
      if (!data || data.error || !(data.status >= 200 && data.status < 400)) { $('sOut').textContent = '❌ ' + _('پاسخی دریافت نشد:') + ' ' + (data?.error || data?.status || ''); return; }
      body = data.body; $('sRaw').hidden = false; $('sRaw').textContent = JSON.stringify(body, null, 1).slice(0, 1500);
      preview();
    };
    $('sX').onclick = closeSheet;
    if ($('sDel')) $('sDel').onclick = async () => { list.splice(idx, 1); if (await saveSettings({wl: {...wlCfg(), sources: list}})) { closeSheet(); toast(_('حذف شد')); render(); } };
    $('sGo').onclick = async () => {
      const v = read();
      if (!/^https?:\/\//i.test(v.url)) return toast(_('آدرس باید با https:// شروع شود'));
      if (v.scope === 'asset' && !v.asset) return toast(_('کد ارز را بنویسید'));
      if (idx == null) list.push(v); else list[idx] = v;
      if (await saveSettings({wl: {...wlCfg(), sources: list}})) { closeSheet(); toast(_('ذخیره شد')); await loadMarket(); render(); }
    };
  });
}
