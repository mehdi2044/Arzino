'use strict';
/* Product names and logos of the four parts (Arzino, Sarrafino, sales page, admin panel).
   Set by the platform admin (admin → Settings → Names and logos), stored as the public setting "brand",
   cached on the device so pages show the right name without flicker. */
const BRAND = (() => {
  const SB = {url: 'https://byecgsxfoiglaozubfyx.supabase.co', key: 'sb_publishable_TAVJpLKC1x0iVFL4F0R_Gw_uKyzJS6T'};
  const LS = 'arzino.brand';
  const DEF = {
    arzino: {name: {fa: 'ارزینو', tr: 'Arzino', en: 'Arzino', ar: 'أرزينو'}},
    sarrafino: {name: {fa: 'صرافینو', tr: 'Sarrafino', en: 'Sarrafino', ar: 'صرافينو'}},
    sales: {name: {fa: 'صرافینو', tr: 'Sarrafino', en: 'Sarrafino', ar: 'صرافينو'}},
    admin: {name: {fa: 'پنل مدیریت', tr: 'Yönetim paneli', en: 'Admin panel', ar: 'لوحة الإدارة'}},
  };
  let B = {};
  try { B = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) {}
  const lang = () => (window.I18N ? I18N.lang : 'fa');
  const B_ = {
    DEF,
    get all() { return B; },
    name(part, l = lang()) { const n = B[part] && B[part].name; return (n && (n[l] || n.en || n.fa)) || DEF[part].name[l] || DEF[part].name.en; },
    defName(part, l = lang()) { return DEF[part].name[l]; },
    logo(part) { return (B[part] && B[part].logo) || ''; },
    // the logo as an <img>, or the first letter of the name in its place
    mark(part, fallback) { const l = B_.logo(part); return l ? `<img src="${l}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : (fallback ?? B_.name(part).trim()[0]); },
    // replace the default product name inside a text (page titles etc.)
    swap(part, text) { const d = DEF[part].name[lang()], n = B_.name(part); return d && n && d !== n ? String(text).split(d).join(n) : text; },
    // replace the default name in every text of a page part (sales page, help texts)
    swapDom(part, root = document.body) {
      const d = DEF[part].name[lang()], n = B_.name(part); if (!d || d === n) return;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: x => x.parentNode && /^(SCRIPT|STYLE|TEXTAREA)$/.test(x.parentNode.nodeName) ? 2 : 1});
      for (let x; (x = w.nextNode());) if (x.nodeValue.includes(d)) x.nodeValue = x.nodeValue.split(d).join(n);
    },
    async load() {
      try {
        const r = await fetch(`${SB.url}/rest/v1/platform_settings?key=eq.brand&select=value`, {headers: {apikey: SB.key, Authorization: 'Bearer ' + SB.key}, cache: 'no-store'});
        const rows = await r.json(); const v = (Array.isArray(rows) && rows[0] && rows[0].value) || {};
        if (JSON.stringify(v) !== JSON.stringify(B)) { B = v; try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {} window.dispatchEvent(new CustomEvent('brandchange')); }
      } catch (e) {}
    },
    set(v) { B = v || {}; try { localStorage.setItem(LS, JSON.stringify(B)); } catch (e) {} window.dispatchEvent(new CustomEvent('brandchange')); },
  };
  return B_;
})();
