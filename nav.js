'use strict';
/* Arzino · Sarrafino — shared "back" navigation and in-app help (four languages).
   NAV: every screen change is a browser-history step, so the on-screen ↩ button, the browser back button and
   the Android back key all go one step back. Open sheets / pop-ups close first.
   HELP: a ❔ button opens a full explanation of the current section in the chosen language. */
(function (w) {
  const tt = k => (w.I18N ? I18N.t(k) : k);
  if (w.I18N) I18N.add({
    fa: {'nav.back': 'بازگشت', 'nav.backT': 'بازگشت به صفحه‌ی قبل', 'help.btn': 'راهنما', 'help.btnT': 'راهنمای این بخش', 'help.close': 'متوجه شدم',
      'help.all': 'همه‌ی راهنماها', 'help.allT': '📖 راهنمای کامل', 'help.none': 'برای این بخش هنوز راهنما نوشته نشده است.', 'th.dark': 'حالت شب', 'th.light': 'حالت روز'},
    tr: {'nav.back': 'Geri', 'nav.backT': 'Önceki sayfaya dön', 'help.btn': 'Yardım', 'help.btnT': 'Bu bölümün rehberi', 'help.close': 'Anladım',
      'help.all': 'Tüm rehberler', 'help.allT': '📖 Tam kullanım rehberi', 'help.none': 'Bu bölüm için henüz rehber yazılmadı.', 'th.dark': 'Gece modu', 'th.light': 'Gündüz modu'},
    en: {'nav.back': 'Back', 'nav.backT': 'Go back to the previous page', 'help.btn': 'Help', 'help.btnT': 'Guide to this section', 'help.close': 'Got it',
      'help.all': 'All guides', 'help.allT': '📖 Full user guide', 'help.none': 'No guide has been written for this section yet.', 'th.dark': 'Night mode', 'th.light': 'Day mode'},
    ar: {'nav.back': 'رجوع', 'nav.backT': 'العودة إلى الصفحة السابقة', 'help.btn': 'مساعدة', 'help.btnT': 'دليل هذا القسم', 'help.close': 'فهمت',
      'help.all': 'كل الأدلة', 'help.allT': '📖 دليل الاستخدام الكامل', 'help.none': 'لم يُكتب دليل لهذا القسم بعد.', 'th.dark': 'الوضع الليلي', 'th.light': 'الوضع النهاري'},
  });

  /* ------------------------------------------------------------------ styles */
  const css = `
.navback{gap:4px}.navback .ar{font-size:18px;line-height:1}.navback[hidden]{display:none!important}
.hlp{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1px solid rgba(25,199,155,.45);background:rgba(25,199,155,.12);
  color:#0fa47a;font:800 14px/1 Vazirmatn,Tahoma,sans-serif;cursor:pointer;vertical-align:middle;margin-inline:6px;padding:0;flex:none}
.hlp:hover{background:rgba(25,199,155,.22)}
[data-theme=dark] .hlp{color:#4ee6b4}
.hlp-bg{position:fixed;inset:0;background:rgba(3,8,18,.55);backdrop-filter:blur(3px);z-index:9990;opacity:0;pointer-events:none;transition:opacity .18s}
.hlp-bg.show{opacity:1;pointer-events:auto}
.hlp-box{position:fixed;left:0;right:0;margin:0 auto;top:50%;transform:translateY(-46%) scale(.98);width:min(640px,calc(100vw - 20px));box-sizing:border-box;max-height:86vh;overflow:auto;z-index:9991;opacity:0;pointer-events:none;
  background:var(--bg2,var(--card,#fff));color:var(--text,#0b1324);border:1px solid var(--line,#dce4ee);border-radius:22px;padding:18px 18px 14px;
  box-shadow:0 30px 70px rgba(0,0,0,.35);transition:all .18s;font-family:Vazirmatn,Tahoma,sans-serif;line-height:1.85;font-size:15px;text-align:start}
.hlp-box.show{opacity:1;pointer-events:auto;transform:translateY(-50%) scale(1)}
.hlp-box h2{margin:0 0 6px;font-size:19px;display:flex;align-items:center;gap:8px}
.hlp-box h4{margin:14px 0 4px;font-size:15.5px;color:#0fa47a}[data-theme=dark] .hlp-box h4{color:#4ee6b4}
.hlp-box p{margin:6px 0}.hlp-box ul{margin:4px 0;padding-inline-start:20px}.hlp-box li{margin:3px 0}
.hlp-box .tip{background:rgba(242,193,78,.14);border:1px solid rgba(242,193,78,.4);border-radius:12px;padding:8px 12px;margin:10px 0}
.hlp-box .hlp-x{position:sticky;bottom:0;display:block;width:100%;margin-top:14px;border:0;border-radius:14px;padding:12px;font:800 15px Vazirmatn,Tahoma,sans-serif;
  background:linear-gradient(145deg,#0fa47a,#19c79b);color:#fff;cursor:pointer;box-shadow:0 -12px 16px var(--bg2,var(--card,#fff))}
.hlp-box .hlp-all{display:block;width:100%;margin-top:14px;border:1px solid var(--line,#dce4ee);background:transparent;color:inherit;border-radius:14px;padding:11px;font:800 14.5px Vazirmatn,Tahoma,sans-serif;cursor:pointer}
.hlp-box .hlp-list button{display:flex;width:100%;text-align:start;gap:10px;align-items:center;border:1px solid var(--line,#dce4ee);background:transparent;color:inherit;
  border-radius:14px;padding:10px 12px;margin:6px 0;font:700 15px Vazirmatn,Tahoma,sans-serif;cursor:pointer}
.hlp-box .hlp-list button:hover{background:rgba(25,199,155,.08)}
.hlp-ctx{font-weight:800}
.subbar{display:flex;align-items:center;gap:8px;margin:-2px 0 12px;min-height:36px}
.subbar .t{flex:1;min-width:0;font-weight:800;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.subbar .ibtn{height:36px;min-width:36px;padding:0 12px;font-size:14px;font-weight:800;border-radius:12px;display:inline-flex;align-items:center;gap:5px;cursor:pointer;
  border:1px solid var(--line,#dce4ee);background:var(--bg2,var(--card,#fff));color:var(--text,#0b1324);box-shadow:none;flex:none;white-space:nowrap}
.subbar .ibtn .lbl{display:inline!important}
.subbar .arzbtn{padding:0 10px 0 5px;text-decoration:none;color:inherit}.subbar .arzbtn img{width:26px;height:26px;border-radius:8px;object-fit:cover}
.subbar .themebtn{padding:0;width:38px;justify-content:center;font-size:17px}
.subbar .hlp-ctx{color:#0fa47a}[data-theme=dark] .subbar .hlp-ctx{color:#4ee6b4}
@media(max-width:360px){.subbar .ibtn{padding:0 9px}.subbar .t{font-size:14px}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ------------------------------------------------------------------ THEME: one day/night choice for every page */
  const TKEY = 'arzino.theme', mq = matchMedia('(prefers-color-scheme: dark)');
  const THEME = {
    get pref() { try { return localStorage.getItem(TKEY) || localStorage.getItem('sarraf.theme') || 'auto'; } catch (e) { return 'auto'; } },
    get dark() { const p = THEME.pref; return p === 'dark' || (p === 'auto' && mq.matches); },
    apply() {
      const d = THEME.dark; document.documentElement.dataset.theme = d ? 'dark' : 'light';
      const m = document.querySelector('meta[name=theme-color]'); if (m && !m.dataset.fixed) m.content = d ? '#060c18' : '#0b1f3a';
      document.querySelectorAll('[data-themebtn]').forEach(b => { b.innerHTML = THEME.icon(); b.title = tt(d ? 'th.light' : 'th.dark'); b.setAttribute('aria-label', b.title); });
      w.dispatchEvent(new CustomEvent('themechange', {detail: d}));
    },
    set(p) { try { localStorage.setItem(TKEY, p); localStorage.removeItem('sarraf.theme'); } catch (e) {} THEME.apply(); },
    toggle() { THEME.set(THEME.dark ? 'light' : 'dark'); },
    icon() { return THEME.dark ? '☀️' : '🌙'; },
    btn(extra = '') { const d = THEME.dark; return `<button type="button" class="ibtn themebtn ${extra}" data-themebtn title="${tt(d ? 'th.light' : 'th.dark')}" aria-label="${tt(d ? 'th.light' : 'th.dark')}">${THEME.icon()}</button>`; },
  };
  mq.addEventListener && mq.addEventListener('change', () => { if (THEME.pref === 'auto') THEME.apply(); });
  document.addEventListener('click', e => { if (e.target.closest('[data-themebtn]')) { e.preventDefault(); THEME.toggle(); } });
  THEME.apply();
  w.THEME = THEME;

  /* ------------------------------------------------------------------ NAV */
  const depth = () => (history.state && history.state.nd) || 0;
  if (!history.state || history.state.nd == null) { try { history.replaceState(Object.assign({}, history.state, {nd: 0}), ''); } catch (e) {} }
  let handler = null, restoring = false, skip = 0, queue = [];
  const layers = [];                         // open pop-ups, newest last: {key, close}
  const NAV = {
    fallback: null,                          // page to open when there is no earlier step (e.g. '../')
    onBack(fn) { handler = fn; },
    get restoring() { return restoring; },
    // record a new screen; st = whatever the app needs to redraw it later
    push(st) {
      if (restoring) return;
      if (skip) { queue.push(['push', st]); return; }
      try { history.pushState(Object.assign({}, st, {nd: depth() + 1}), ''); } catch (e) {}
      NAV.update();
    },
    replace(st) {
      if (skip) { queue.push(['replace', st]); return; }
      try { history.replaceState(Object.assign({}, st, {nd: depth()}), ''); } catch (e) {}
    },
    // a sheet / dialog was opened: back closes it first
    opened(key, close) {
      const l = layers.find(x => x.key === key);
      if (l) { l.close = close; return; }
      layers.push({key, close});
      if (skip) { queue.push(['layer', key]); return; }
      try { history.pushState(Object.assign({}, history.state, {nd: depth() + 1, layer: key}), ''); } catch (e) {}
      NAV.update();
    },
    // the app closed it itself (save / cancel): drop the extra history step quietly
    closed(key) {
      const i = layers.findIndex(x => x.key === key); if (i < 0) return;
      layers.splice(i, 1);
      if (history.state && history.state.layer === key) { skip++; history.back(); }
    },
    sameSite() {
      try { return !!document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1; } catch (e) { return false; }
    },
    can() { return layers.length > 0 || depth() > 0 || NAV.sameSite() || !!NAV.fallback; },
    back() {
      if (layers.length || depth() > 0 || NAV.sameSite()) history.back();
      else if (NAV.fallback) location.href = NAV.fallback;
    },
    btn(extra = '') {
      const arrow = w.I18N && I18N.rtl ? '→' : '←';
      return `<button type="button" class="ibtn navback ${extra}" data-navback title="${tt('nav.backT')}" aria-label="${tt('nav.backT')}" ${NAV.can() ? '' : 'hidden'}><span class="ar">${arrow}</span><span class="lbl">${tt('nav.back')}</span></button>`;
    },
    // slim bar under the header: [back] title [help]
    bar(title, extra = '') { return `<div class="subbar">${NAV.btn()}<div class="t">${title || ''}</div>${extra}${THEME.btn()}${w.HELP ? HELP.ctxBtn() : ''}</div>`; },
    update() { const c = NAV.can(); document.querySelectorAll('[data-navback]').forEach(b => { b.hidden = !c; }); },
  };
  addEventListener('popstate', e => {
    if (skip) {
      skip--;
      if (!skip && queue.length) {
        const q = queue; queue = [];
        for (const [k, v] of q) {
          if (k === 'push') NAV.push(v); else if (k === 'replace') NAV.replace(v);
          else try { history.pushState(Object.assign({}, history.state, {nd: depth() + 1, layer: v}), ''); } catch (er) {}
        }
      }
      NAV.update(); return;
    }
    if (layers.length) { const l = layers.pop(); try { l.close(true); } catch (er) {} NAV.update(); return; }
    restoring = true;
    try { handler && handler(e.state || {}); } finally { restoring = false; }
    NAV.update();
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-navback]'); if (b) { e.preventDefault(); NAV.back(); } });

  /* ------------------------------------------------------------------ HELP */
  const T = {}, ORDER = [];
  let bg, box;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  // tiny markup: "## heading", "- bullet", "! tip", **bold**, blank line = new paragraph
  function md(src) {
    const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    let out = '', list = false;
    for (const raw of String(src).split('\n')) {
      const l = raw.trim();
      if (/^- /.test(l)) { if (!list) { out += '<ul>'; list = true; } out += '<li>' + inl(l.slice(2)) + '</li>'; continue; }
      if (list) { out += '</ul>'; list = false; }
      if (!l) continue;
      if (l.startsWith('## ')) out += '<h4>' + inl(l.slice(3)) + '</h4>';
      else if (l.startsWith('! ')) out += '<div class="tip">💡 ' + inl(l.slice(2)) + '</div>';
      else out += '<p>' + inl(l) + '</p>';
    }
    return out + (list ? '</ul>' : '');
  }
  function ensure() {
    if (box) return;
    bg = document.createElement('div'); bg.className = 'hlp-bg';
    box = document.createElement('div'); box.className = 'hlp-box'; box.setAttribute('role', 'dialog');
    document.body.append(bg, box);
    bg.onclick = () => HELP.close();
  }
  const pick = k => { const e = T[k]; return e && (e[w.I18N ? I18N.lang : 'fa'] || e.en || e.fa); };
  const HELP = {
    ctx: null,                                   // function returning the help key of the current screen
    add(obj) { for (const [k, v] of Object.entries(obj)) { if (!T[k]) ORDER.push(k); T[k] = Object.assign(T[k] || {}, v); } },
    has: k => !!T[k],
    title: k => (pick(k) || [k])[0],
    btn(k) { return `<button type="button" class="hlp" data-help="${k}" title="${tt('help.btnT')}" aria-label="${tt('help.btnT')}">?</button>`; },
    ctxBtn(extra = '') { return `<button type="button" class="ibtn hlp-ctx ${extra}" data-helpctx title="${tt('help.btnT')}" aria-label="${tt('help.btnT')}">❔<span class="lbl"> ${tt('help.btn')}</span></button>`; },
    allBtn(prefix, cls = 'btn g') { return `<button type="button" class="${cls}" data-helpall="${prefix}">${tt('help.allT')}</button>`; },
    show(html) {
      ensure();
      box.innerHTML = html + `<button type="button" class="hlp-x">${tt('help.close')}</button>`;
      box.querySelector('.hlp-x').onclick = () => HELP.close();
      if (w.BRAND) { BRAND.swapDom('sarrafino', box); BRAND.swapDom('arzino', box); }   // names chosen by the admin
      box.scrollTop = 0; bg.classList.add('show'); box.classList.add('show');
      NAV.opened('help', () => { bg.classList.remove('show'); box.classList.remove('show'); });
    },
    open(k) {
      const e = pick(k);
      if (!e) return HELP.show(`<h2>❔ ${tt('help.btn')}</h2><p>${tt('help.none')}</p>`);
      HELP.show(`<h2>❔ ${esc(e[0])}</h2>${md(e[1])}`);
      const p = k.split('.')[0] + '.';
      if (ORDER.filter(x => x.startsWith(p)).length > 1) {
        const more = document.createElement('div'); more.innerHTML = HELP.allBtn(p, 'hlp-all');
        box.insertBefore(more.firstChild, box.lastChild);
      }
    },
    index(prefix) {
      const keys = ORDER.filter(k => k.startsWith(prefix) && pick(k));
      HELP.show(`<h2>${tt('help.allT')}</h2><div class="hlp-list">${keys.map(k => `<button type="button" data-hk="${k}">❔ ${esc(pick(k)[0])}</button>`).join('')}</div>`);
      box.querySelectorAll('[data-hk]').forEach(b => b.onclick = () => { const k = b.dataset.hk; HELP.close(); setTimeout(() => HELP.open(k), 60); });
    },
    close() {
      if (!box || !box.classList.contains('show')) return;
      bg.classList.remove('show'); box.classList.remove('show'); NAV.closed('help');
    },
  };
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-help],[data-helpctx],[data-helpall]'); if (!h) return;
    e.preventDefault(); e.stopPropagation();
    if (h.dataset.help) HELP.open(h.dataset.help);
    else if (h.dataset.helpall) { HELP.close(); setTimeout(() => HELP.index(h.dataset.helpall), 60); }
    else HELP.open(HELP.ctx ? HELP.ctx() : '');
  }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape') HELP.close(); });

  /* ------------------------------------------------------------------ show / hide password (every password field) */
  const eyeCss = document.createElement('style');
  eyeCss.textContent = `.pw-wrap{display:flex;align-items:stretch;gap:8px;width:100%}
.pw-wrap>input{flex:1 1 auto;min-width:0;width:auto!important}
.pw-eye{flex:none;width:50px;min-height:44px;border:1px solid var(--line,#dce4ee);border-radius:12px;background:var(--soft,var(--bg2,#f2f6fb));
  cursor:pointer;font-size:20px;line-height:1;color:inherit;display:grid;place-items:center;padding:0;transition:background .15s,border-color .15s}
.pw-eye:hover{border-color:#19c79b;background:rgba(25,199,155,.1)}.pw-eye:active{transform:scale(.96)}`;
  document.head.appendChild(eyeCss);
  const EYE = {fa: ['نمایش رمز', 'پنهان کردن رمز'], tr: ['Şifreyi göster', 'Şifreyi gizle'], en: ['Show password', 'Hide password'], ar: ['إظهار كلمة المرور', 'إخفاء كلمة المرور']};
  const eyeT = i => (EYE[w.I18N ? I18N.lang : 'fa'] || EYE.en)[i];
  function eyes(root) {
    (root.querySelectorAll ? root : document).querySelectorAll('input[type=password]:not([data-eye])').forEach(inp => {
      inp.dataset.eye = '1';
      const wrap = document.createElement('span'); wrap.className = 'pw-wrap';
      inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pw-eye'; b.textContent = '👁'; b.title = eyeT(0); b.setAttribute('aria-label', eyeT(0));
      b.onclick = () => { const show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; b.textContent = show ? '🙈' : '👁'; b.title = eyeT(show ? 1 : 0); b.setAttribute('aria-label', b.title); inp.focus(); };
      wrap.appendChild(b);
    });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) eyes(n.matches && n.matches('input') ? n.parentNode : n); })
    .observe(document.documentElement, {childList: true, subtree: true});
  document.addEventListener('DOMContentLoaded', () => eyes(document));

  /* ------------------------------------------------------------------ install on the phone (iPhone has no automatic prompt) */
  const ua = navigator.userAgent || '';
  const G = {
    fa: {t: '📲 نصب روی گوشی', ios: `## آیفون و آیپد
1) این صفحه را در **Safari** باز کنید. اگر از داخل واتس‌اپ یا اینستاگرام آمده‌اید، از منوی ⋯ گزینه‌ی «باز کردن در Safari» را بزنید.
2) دکمه‌ی **اشتراک‌گذاری** (مربع با فلش رو به بالا) را بزنید. در iOS 26 اول روی ⋯ پایین صفحه بزنید.
3) پایین‌تر بروید و **Add to Home Screen** (افزودن به صفحه‌ی اصلی) را بزنید.
4) «Open as Web App» روشن بماند و **Add** را بزنید.
! حالا آیکون روی صفحه‌ی اصلی گوشی است و مثل یک برنامه، تمام‌صفحه و بدون نوار مرورگر باز می‌شود.`, and: `## اندروید
1) صفحه را در **Chrome** باز کنید.
2) منوی ⋮ بالای صفحه را بزنید.
3) **Install app** یا **Add to Home screen** را بزنید و تأیید کنید.`},
    tr: {t: '📲 Telefona yükle', ios: `## iPhone ve iPad
1) Bu sayfayı **Safari**'de açın. WhatsApp veya Instagram içinden geldiyseniz ⋯ menüsünden “Safari'de aç”ı seçin.
2) **Paylaş** düğmesine (yukarı oklu kare) dokunun. iOS 26'da önce alttaki ⋯'ya dokunun.
3) Aşağı kaydırıp **Ana Ekrana Ekle**'ye dokunun.
4) “Web Uygulaması Olarak Aç” açık kalsın, **Ekle**'ye dokunun.
! Simge artık ana ekranda; bir uygulama gibi tam ekran ve tarayıcı çubuğu olmadan açılır.`, and: `## Android
1) Sayfayı **Chrome**'da açın.
2) Üstteki ⋮ menüsüne dokunun.
3) **Uygulamayı yükle** veya **Ana ekrana ekle**'ye dokunup onaylayın.`},
    en: {t: '📲 Install on your phone', ios: `## iPhone and iPad
1) Open this page in **Safari**. If you came from inside WhatsApp or Instagram, choose “Open in Safari” from the ⋯ menu.
2) Tap the **Share** button (a square with an up arrow). On iOS 26 tap ⋯ at the bottom first.
3) Scroll down and tap **Add to Home Screen**.
4) Keep “Open as Web App” on and tap **Add**.
! The icon is now on your Home Screen and opens full screen like an app, without the browser bar.`, and: `## Android
1) Open the page in **Chrome**.
2) Tap the ⋮ menu at the top.
3) Tap **Install app** or **Add to Home screen** and confirm.`},
    ar: {t: '📲 التثبيت على الهاتف', ios: `## آيفون وآيباد
1) افتح هذه الصفحة في **Safari**. إذا جئت من داخل واتساب أو إنستغرام فاختر «فتح في Safari» من قائمة ⋯.
2) اضغط زر **المشاركة** (مربع بسهم للأعلى). في iOS 26 اضغط أولاً ⋯ أسفل الشاشة.
3) مرّر للأسفل واضغط **إضافة إلى الشاشة الرئيسية**.
4) أبقِ «فتح كتطبيق ويب» مفعّلاً واضغط **إضافة**.
! أصبحت الأيقونة على شاشتك الرئيسية وتفتح بملء الشاشة كتطبيق، دون شريط المتصفح.`, and: `## أندرويد
1) افتح الصفحة في **Chrome**.
2) اضغط قائمة ⋮ في الأعلى.
3) اضغط **تثبيت التطبيق** أو **إضافة إلى الشاشة الرئيسية** وأكّد.`},
  };
  let bip = null;
  addEventListener('beforeinstallprompt', e => { bip = e; });
  const INSTALL = {
    ios: /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    get standalone() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
    get can() { return !INSTALL.standalone; },
    label() { return (G[w.I18N ? I18N.lang : 'fa'] || G.en).t; },
    guide() {
      const g = G[w.I18N ? I18N.lang : 'fa'] || G.en;
      HELP.show(`<h2>${esc(g.t)}</h2>${md(INSTALL.ios ? g.ios : /Android/.test(ua) ? g.and : g.ios + '\n' + g.and)}`);
    },
    async run() {
      if (bip) { bip.prompt(); try { await bip.userChoice; } catch (e) {} bip = null; return; }
      INSTALL.guide();
    },
  };
  /* ------------------------------------------------------------------ thousands separators while typing numbers */
  const VD = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
  const ascii = x => String(x ?? '').replace(/[۰-۹]/g, d => FA.indexOf(d)).replace(/[٠-٩]/g, d => AR.indexOf(d)).replace(/٫/g, '.');
  const bare = x => ascii(x).replace(/[’'ʼ٬,\s\u2066-\u2069\u200e\u200f]/g, '');
  const faOf = el => !!(w.GROUP_FA && w.GROUP_FA(el));
  function grouped(raw, fa) {
    const m = raw.match(/^(-?)(\d*)(\.?)(\d*)$/); if (!m) return raw;            // not a plain number: leave it
    const out = m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, '’') + (m[3] ? (fa ? '٫' : '.') : '') + m[4];
    return fa ? out.replace(/\d/g, d => FA[d]) : out;
  }
  const isNumInput = el => el && el.tagName === 'INPUT' && !el.dataset.nogrp && !/^(time|tel|email|password|date|number|checkbox|radio|file|hidden)$/i.test(el.type) &&
    el.getAttribute('maxlength') !== '6' && !/^mfa/.test(el.id || '') && (el.classList.contains('num') || /^(decimal|numeric)$/.test(el.getAttribute('inputmode') || ''));
  Object.defineProperty(HTMLInputElement.prototype, 'value', {configurable: true, enumerable: VD.enumerable,
    get() { const v = VD.get.call(this); return this.dataset && this.dataset.grp ? bare(v) : v; },
    set(v) { if (this.dataset && this.dataset.grp) VD.set.call(this, grouped(bare(v), faOf(this))); else VD.set.call(this, v); }});
  function markNums(root) {
    const list = root.querySelectorAll ? [...root.querySelectorAll('input')] : []; if (root.tagName === 'INPUT') list.push(root);
    for (const el of list) if (!el.dataset.grp && isNumInput(el)) { el.dataset.grp = '1'; VD.set.call(el, grouped(bare(VD.get.call(el)), faOf(el))); }
  }
  document.addEventListener('input', e => {                            // capture: runs before the page's own handlers
    const el = e.target; if (!el || !el.dataset || !el.dataset.grp) return;
    const raw = VD.get.call(el), pos = el.selectionStart ?? raw.length;
    const keep = bare(raw.slice(0, pos)).replace(/[^\d.\-]/g, '').length;
    let clean = bare(raw).replace(/[^\d.\-]/g, '').replace(/(?!^)-/g, ''); const k = clean.indexOf('.'); if (k >= 0) clean = clean.slice(0, k + 1) + clean.slice(k + 1).replace(/\./g, '');
    const out = grouped(clean, faOf(el)); if (out === raw) return;
    VD.set.call(el, out);
    let i = 0, n = 0; while (i < out.length && n < keep) { if (/[\d.٫\-۰-۹]/.test(out[i])) n++; i++; }
    try { el.setSelectionRange(i, i); } catch (er) {}
  }, true);
  // typed numbers are always laid out left to right (otherwise right-to-left pages swap the groups); alignment stays as the page sets it
  document.head.insertAdjacentHTML('beforeend', '<style>input[data-grp]{direction:ltr}:where(html[dir=rtl]) :where(input[data-grp]){text-align:right}</style>');
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) markNums(n); }).observe(document.documentElement, {childList: true, subtree: true});
  document.addEventListener('DOMContentLoaded', () => markNums(document)); if (document.readyState !== 'loading') markNums(document);

  NAV.shown = el => VD.get.call(el);                                   // what the field shows (with separators)
  w.NAV = NAV; w.HELP = HELP; w.INSTALL = INSTALL;
})(window);
