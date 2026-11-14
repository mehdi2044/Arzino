'use strict';
/* Shared language engine for Arzino and Sarraf — Persian · Türkçe · English
   One saved choice ('arzino.lang') drives both apps: text, direction (RTL/LTR), dates and numbers. */
(function (w) {
  const LANGS = {
    fa: {name: 'فارسی', short: 'FA', dir: 'rtl', date: 'fa-IR-u-ca-persian', num: 'fa-IR'},
    tr: {name: 'Türkçe', short: 'TR', dir: 'ltr', date: 'tr-TR', num: 'en-US'},
    en: {name: 'English', short: 'EN', dir: 'ltr', date: 'en-GB', num: 'en-US'},
  };
  const DICT = {fa: {}, tr: {}, en: {}};
  const PH = {tr: {}, en: {}};          // phrase book: Persian source text -> translation
  const KEY = 'arzino.lang';
  function detect() {
    try { const s = localStorage.getItem(KEY); if (LANGS[s]) return s; } catch {}
    const n = (navigator.language || 'fa').slice(0, 2).toLowerCase();
    return LANGS[n] ? n : 'fa';
  }
  const I = {
    LANGS, lang: detect(),
    add(d) { for (const l of Object.keys(DICT)) Object.assign(DICT[l], d[l] || {}); },
    t(k, v) {
      let s = DICT[I.lang][k] ?? DICT.en[k] ?? DICT.fa[k] ?? k;
      if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => (v[x] ?? m));
      return s;
    },
    has: k => DICT[I.lang][k] != null,
    addPhrases(d) { for (const l of Object.keys(PH)) Object.assign(PH[l], d[l] || {}); },
    // translate a Persian source phrase; {x} placeholders filled from v
    tr(s, v) {
      if (s == null) return '';
      let r = I.lang === 'fa' ? s : (PH[I.lang][s] ?? PH.en[s] ?? s);
      if (v) r = r.replace(/\{(\w+)\}/g, (m, x) => (v[x] ?? m));
      return r;
    },
    get dir() { return LANGS[I.lang].dir; },
    get rtl() { return LANGS[I.lang].dir === 'rtl'; },
    dateLocale(digits) { return I.lang === 'fa' ? (digits === 'en' ? 'en-US-u-ca-persian' : 'fa-IR-u-ca-persian') : LANGS[I.lang].date; },
    numLocale(digits) { return I.lang === 'fa' && digits !== 'en' ? 'fa-IR' : 'en-US'; },
    apply(root = document) {
      const html = document.documentElement;
      html.lang = I.lang; html.dir = LANGS[I.lang].dir;
      root.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = I.t(e.dataset.i18n); });
      root.querySelectorAll('[data-i18n-html]').forEach(e => { e.innerHTML = I.t(e.dataset.i18nHtml); });
      root.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = I.t(e.dataset.i18nPh); });
      root.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = I.t(e.dataset.i18nTitle); });
      if (I.has('doc.title')) document.title = I.t('doc.title');
    },
    set(l) {
      if (!LANGS[l] || l === I.lang) return;
      I.lang = l; try { localStorage.setItem(KEY, l); } catch {}
      I.apply(); w.dispatchEvent(new CustomEvent('langchange', {detail: l}));
    },
    // compact language picker: <select class="lang-sel">
    picker(cls = 'lang-sel', full) {
      return `<select class="${cls}" aria-label="Language" title="Language · Dil · زبان">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === I.lang ? 'selected' : ''}>${full ? v.name : v.short}</option>`).join('')}</select>`;
    },
    bindPickers(root = document) { root.querySelectorAll('select.lang-sel').forEach(s => { s.value = I.lang; s.onchange = () => I.set(s.value); }); },
    // big numbers in words: 25.76 million
    words(v, fmt) {
      if (!isFinite(v) || Math.abs(v) < 1000) return '';
      const u = I.lang === 'fa' ? [[1e12, 'هزار میلیارد'], [1e9, 'میلیارد'], [1e6, 'میلیون'], [1e3, 'هزار']]
        : I.lang === 'tr' ? [[1e12, 'trilyon'], [1e9, 'milyar'], [1e6, 'milyon'], [1e3, 'bin']]
        : [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
      for (const [n, w2] of u) if (Math.abs(v) >= n) return fmt(v / n, v / n >= 100 ? 1 : 2) + ' ' + w2;
      return '';
    },
  };
  // names shared by both apps
  I.add({
    fa: {
      'c.USD': 'دلار آمریکا', 'c.EUR': 'یورو', 'c.TRY': 'لیر ترکیه', 'c.CAD': 'دلار کانادا', 'c.CNY': 'یوان چین', 'c.CHF': 'فرانک سوئیس',
      'c.GBP': 'پوند انگلیس', 'c.AED': 'درهم امارات', 'c.JPY': 'ین ژاپن', 'c.AUD': 'دلار استرالیا', 'c.RUB': 'روبل روسیه', 'c.IRT': 'تومان ایران',
      'c.IQD': 'دینار عراق', 'c.XAU': 'انس جهانی طلا', 'c.XAG': 'انس جهانی نقره', 'c.G18': 'طلای ۱۸ عیار (گرم)', 'c.G24': 'طلای ۲۴ عیار (گرم)',
      'c.MESGHAL': 'مثقال طلا', 'c.SEKE': 'سکه امامی', 'c.SEKE_B': 'سکه بهار آزادی', 'c.NIM': 'نیم سکه', 'c.ROB': 'ربع سکه',
      'c.BTC': 'بیت‌کوین', 'c.ETH': 'اتریوم', 'c.USDT': 'تتر', 'c.XRP': 'ریپل', 'c.TRX': 'ترون',
      's.USD': 'دلار', 's.EUR': 'یورو', 's.TRY': 'لیر', 's.IRT': 'تومان', 's.USDT': 'تتر', 's.GBP': 'پوند', 's.AED': 'درهم', 's.CAD': 'دلار کانادا',
      's.CHF': 'فرانک', 's.CNY': 'یوان', 's.IQD': 'دینار عراق',
      'u.toman': 'تومان', 'u.rial': 'ریال', 'lang.label': 'زبان',
    },
    tr: {
      'c.USD': 'ABD Doları', 'c.EUR': 'Euro', 'c.TRY': 'Türk Lirası', 'c.CAD': 'Kanada Doları', 'c.CNY': 'Çin Yuanı', 'c.CHF': 'İsviçre Frangı',
      'c.GBP': 'İngiliz Sterlini', 'c.AED': 'BAE Dirhemi', 'c.JPY': 'Japon Yeni', 'c.AUD': 'Avustralya Doları', 'c.RUB': 'Rus Rublesi', 'c.IRT': 'İran Tümeni',
      'c.IQD': 'Irak Dinarı', 'c.XAU': 'Altın (ons)', 'c.XAG': 'Gümüş (ons)', 'c.G18': '18 ayar altın (gram)', 'c.G24': '24 ayar altın (gram)',
      'c.MESGHAL': 'Altın miskal', 'c.SEKE': 'İmami altın sikke', 'c.SEKE_B': 'Bahar-ı Azadi sikke', 'c.NIM': 'Yarım sikke', 'c.ROB': 'Çeyrek sikke',
      'c.BTC': 'Bitcoin', 'c.ETH': 'Ethereum', 'c.USDT': 'Tether (USDT)', 'c.XRP': 'XRP', 'c.TRX': 'TRON',
      's.USD': 'Dolar', 's.EUR': 'Euro', 's.TRY': 'Lira', 's.IRT': 'Tümen', 's.USDT': 'Tether', 's.GBP': 'Sterlin', 's.AED': 'Dirhem', 's.CAD': 'Kanada Doları',
      's.CHF': 'Frank', 's.CNY': 'Yuan', 's.IQD': 'Irak Dinarı',
      'u.toman': 'Tümen', 'u.rial': 'Riyal', 'lang.label': 'Dil',
    },
    en: {
      'c.USD': 'US Dollar', 'c.EUR': 'Euro', 'c.TRY': 'Turkish Lira', 'c.CAD': 'Canadian Dollar', 'c.CNY': 'Chinese Yuan', 'c.CHF': 'Swiss Franc',
      'c.GBP': 'British Pound', 'c.AED': 'UAE Dirham', 'c.JPY': 'Japanese Yen', 'c.AUD': 'Australian Dollar', 'c.RUB': 'Russian Ruble', 'c.IRT': 'Iranian Toman',
      'c.IQD': 'Iraqi Dinar', 'c.XAU': 'Gold (ounce)', 'c.XAG': 'Silver (ounce)', 'c.G18': '18K gold (gram)', 'c.G24': '24K gold (gram)',
      'c.MESGHAL': 'Gold mesghal', 'c.SEKE': 'Emami gold coin', 'c.SEKE_B': 'Bahar Azadi coin', 'c.NIM': 'Half coin', 'c.ROB': 'Quarter coin',
      'c.BTC': 'Bitcoin', 'c.ETH': 'Ethereum', 'c.USDT': 'Tether (USDT)', 'c.XRP': 'XRP', 'c.TRX': 'TRON',
      's.USD': 'Dollar', 's.EUR': 'Euro', 's.TRY': 'Lira', 's.IRT': 'Toman', 's.USDT': 'Tether', 's.GBP': 'Pound', 's.AED': 'Dirham', 's.CAD': 'Canadian $',
      's.CHF': 'Franc', 's.CNY': 'Yuan', 's.IQD': 'Iraqi Dinar',
      'u.toman': 'Toman', 'u.rial': 'Rial', 'lang.label': 'Language',
    },
  });
  w.I18N = I;
  w.t = I.t;
  w._ = I.tr;
  I.apply();
})(window);
