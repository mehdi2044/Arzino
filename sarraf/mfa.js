'use strict';
/* Two-step login (TOTP authenticator app: Google Authenticator, Microsoft Authenticator, Authy …) — free, no SMS.
   Used by Sarrafino and the admin panel. The database also enforces it: once a user turns it on,
   their data opens only for a session that passed the 6-digit code (see migration_005.sql). */
I18N.addPhrases({
  tr: {
    'ورود دو مرحله‌ای': 'İki adımlı giriş', 'کد ۶ رقمی برنامه‌ی Authenticator را وارد کنید': 'Authenticator uygulamasındaki 6 haneli kodu girin',
    'کد ۶ رقمی': '6 haneli kod', 'تأیید و ورود': 'Doğrula ve gir', 'کد اشتباه است یا منقضی شده. دوباره امتحان کنید.': 'Kod yanlış ya da süresi dolmuş. Tekrar deneyin.',
    'خروج و ورود با حساب دیگر': 'Çıkış yap ve başka hesapla gir', '🔐 امنیت حساب': '🔐 Hesap güvenliği',
    'ورود دو مرحله‌ای فعال است ✅': 'İki adımlı giriş açık ✅', 'ورود دو مرحله‌ای خاموش است': 'İki adımlı giriş kapalı',
    'بعد از رمز، یک کد ۶ رقمی از برنامه‌ی Authenticator گوشی شما هم لازم است. اگر کسی رمز شما را بداند، بدون گوشی شما نمی‌تواند وارد شود.': 'Şifreden sonra telefonunuzdaki Authenticator uygulamasından 6 haneli bir kod da gerekir. Şifrenizi bilen biri telefonunuz olmadan giremez.',
    'فعال کردن ورود دو مرحله‌ای': 'İki adımlı girişi aç', 'خاموش کردن': 'Kapat',
    'مرحله ۱: برنامه‌ی Google Authenticator یا Microsoft Authenticator را روی گوشی نصب کنید.': '1. adım: Telefonunuza Google Authenticator veya Microsoft Authenticator kurun.',
    'مرحله ۲: در برنامه «+» را بزنید و این QR را اسکن کنید (یا کد زیر را دستی وارد کنید).': '2. adım: Uygulamada «+»ya basın ve bu QR kodu tarayın (ya da aşağıdaki kodu elle girin).',
    'مرحله ۳: کد ۶ رقمی که برنامه نشان می‌دهد را اینجا بنویسید.': '3. adım: Uygulamanın gösterdiği 6 haneli kodu buraya yazın.',
    'کد دستی:': 'Elle giriş kodu:', 'فعال شد. از این به بعد هنگام ورود کد خواسته می‌شود.': 'Açıldı. Bundan sonra girişte kod istenecek.',
    'ورود دو مرحله‌ای خاموش شود؟': 'İki adımlı giriş kapatılsın mı?', 'خاموش شد': 'Kapatıldı', 'انصراف': 'Vazgeç',
    'اگر گوشی‌تان گم شد، مدیر سامانه می‌تواند ورود دو مرحله‌ای حساب شما را بازنشانی کند.': 'Telefonunuzu kaybederseniz sistem yöneticisi iki adımlı girişinizi sıfırlayabilir.',
  },
  en: {
    'ورود دو مرحله‌ای': 'Two-step login', 'کد ۶ رقمی برنامه‌ی Authenticator را وارد کنید': 'Enter the 6-digit code from your Authenticator app',
    'کد ۶ رقمی': '6-digit code', 'تأیید و ورود': 'Verify and sign in', 'کد اشتباه است یا منقضی شده. دوباره امتحان کنید.': 'The code is wrong or expired. Try again.',
    'خروج و ورود با حساب دیگر': 'Sign out and use another account', '🔐 امنیت حساب': '🔐 Account security',
    'ورود دو مرحله‌ای فعال است ✅': 'Two-step login is on ✅', 'ورود دو مرحله‌ای خاموش است': 'Two-step login is off',
    'بعد از رمز، یک کد ۶ رقمی از برنامه‌ی Authenticator گوشی شما هم لازم است. اگر کسی رمز شما را بداند، بدون گوشی شما نمی‌تواند وارد شود.': 'After your password, a 6-digit code from the Authenticator app on your phone is also needed. Someone who knows your password cannot get in without your phone.',
    'فعال کردن ورود دو مرحله‌ای': 'Turn on two-step login', 'خاموش کردن': 'Turn off',
    'مرحله ۱: برنامه‌ی Google Authenticator یا Microsoft Authenticator را روی گوشی نصب کنید.': 'Step 1: Install Google Authenticator or Microsoft Authenticator on your phone.',
    'مرحله ۲: در برنامه «+» را بزنید و این QR را اسکن کنید (یا کد زیر را دستی وارد کنید).': 'Step 2: Tap “+” in the app and scan this QR code (or type the code below).',
    'مرحله ۳: کد ۶ رقمی که برنامه نشان می‌دهد را اینجا بنویسید.': 'Step 3: Type the 6-digit code the app shows.',
    'کد دستی:': 'Manual code:', 'فعال شد. از این به بعد هنگام ورود کد خواسته می‌شود.': 'Turned on. From now on a code is asked at sign-in.',
    'ورود دو مرحله‌ای خاموش شود؟': 'Turn off two-step login?', 'خاموش شد': 'Turned off', 'انصراف': 'Cancel',
    'اگر گوشی‌تان گم شد، مدیر سامانه می‌تواند ورود دو مرحله‌ای حساب شما را بازنشانی کند.': 'If you lose your phone, the platform admin can reset your two-step login.',
  },
  ar: {
    'ورود دو مرحله‌ای': 'تسجيل الدخول بخطوتين', 'کد ۶ رقمی برنامه‌ی Authenticator را وارد کنید': 'أدخل الرمز المكوّن من 6 أرقام من تطبيق Authenticator',
    'کد ۶ رقمی': 'رمز من 6 أرقام', 'تأیید و ورود': 'تحقّق وادخل', 'کد اشتباه است یا منقضی شده. دوباره امتحان کنید.': 'الرمز خاطئ أو منتهي الصلاحية. حاول مرة أخرى.',
    'خروج و ورود با حساب دیگر': 'الخروج والدخول بحساب آخر', '🔐 امنیت حساب': '🔐 أمان الحساب',
    'ورود دو مرحله‌ای فعال است ✅': 'تسجيل الدخول بخطوتين مفعّل ✅', 'ورود دو مرحله‌ای خاموش است': 'تسجيل الدخول بخطوتين غير مفعّل',
    'بعد از رمز، یک کد ۶ رقمی از برنامه‌ی Authenticator گوشی شما هم لازم است. اگر کسی رمز شما را بداند، بدون گوشی شما نمی‌تواند وارد شود.': 'بعد كلمة المرور يلزم أيضاً رمز من 6 أرقام من تطبيق Authenticator على هاتفك. من يعرف كلمة مرورك لا يستطيع الدخول دون هاتفك.',
    'فعال کردن ورود دو مرحله‌ای': 'تفعيل الدخول بخطوتين', 'خاموش کردن': 'إيقاف',
    'مرحله ۱: برنامه‌ی Google Authenticator یا Microsoft Authenticator را روی گوشی نصب کنید.': 'الخطوة 1: ثبّت Google Authenticator أو Microsoft Authenticator على هاتفك.',
    'مرحله ۲: در برنامه «+» را بزنید و این QR را اسکن کنید (یا کد زیر را دستی وارد کنید).': 'الخطوة 2: اضغط «+» في التطبيق وامسح رمز QR هذا (أو أدخل الرمز أدناه يدوياً).',
    'مرحله ۳: کد ۶ رقمی که برنامه نشان می‌دهد را اینجا بنویسید.': 'الخطوة 3: اكتب الرمز المكوّن من 6 أرقام الذي يظهره التطبيق.',
    'کد دستی:': 'الرمز اليدوي:', 'فعال شد. از این به بعد هنگام ورود کد خواسته می‌شود.': 'تم التفعيل. من الآن سيُطلب الرمز عند الدخول.',
    'ورود دو مرحله‌ای خاموش شود؟': 'إيقاف الدخول بخطوتين؟', 'خاموش شد': 'تم الإيقاف', 'انصراف': 'إلغاء',
    'اگر گوشی‌تان گم شد، مدیر سامانه می‌تواند ورود دو مرحله‌ای حساب شما را بازنشانی کند.': 'إذا فقدت هاتفك يستطيع مدير المنصة إعادة ضبط الدخول بخطوتين لحسابك.',
  },
});
const MFA = (() => {
  const _t = (s, v) => I18N.tr(s, v);
  const ui = () => (typeof toast === 'function' ? toast : alert);
  async function verified(sb) {
    const {data} = await sb.auth.mfa.listFactors();
    return (data?.totp || []).filter(f => f.status === 'verified');
  }
  // returns true when the session may continue; otherwise draws the code screen and calls done() after success
  async function gate(sb, root, done, onOut) {
    let f;
    try {
      const {data, error} = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error || !data || data.currentLevel === 'aal2' || data.nextLevel !== 'aal2') return true;
      f = (await verified(sb))[0]; if (!f) return true;
    } catch (e) { return true; }        // the database still refuses data without the code
    root.innerHTML = `<div class="auth"><div class="auth-lang">${NAV.btn()}<span style="flex:1"></span>${THEME.btn()}${HELP.ctxBtn()}${I18N.picker('lang-sel', true)}</div>
      <div class="hero3d"><div class="coin">🔐</div><h1>${_t('ورود دو مرحله‌ای')}</h1><div class="muted">${_t('کد ۶ رقمی برنامه‌ی Authenticator را وارد کنید')}</div></div>
      <div class="card" style="margin-top:18px"><div class="fld"><label>${_t('کد ۶ رقمی')}</label>
        <input class="in num" id="mfaCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" dir="ltr" style="font-size:26px;letter-spacing:8px;text-align:center"></div>
        <button class="btn p w" id="mfaGo">${_t('تأیید و ورود')}</button>
        <button class="lnk" id="mfaOut" type="button">${_t('خروج و ورود با حساب دیگر')}</button></div></div>`;
    I18N.bindPickers();
    const inp = root.querySelector('#mfaCode'); inp.focus();
    const go = async () => {
      const code = inp.value.replace(/\D/g, ''); if (code.length !== 6) return;
      root.querySelector('#mfaGo').disabled = true;
      const r = await sb.auth.mfa.challengeAndVerify({factorId: f.id, code});
      root.querySelector('#mfaGo').disabled = false;
      if (r.error) { inp.value = ''; inp.focus(); return ui()(_t('کد اشتباه است یا منقضی شده. دوباره امتحان کنید.')); }
      done();
    };
    inp.oninput = () => { if (inp.value.replace(/\D/g, '').length === 6) go(); };
    root.querySelector('#mfaGo').onclick = go;
    root.querySelector('#mfaOut').onclick = async () => { await sb.auth.signOut(); onOut ? onOut() : location.reload(); };
    return false;
  }
  function card(helpKey) {
    return `<div class="card" id="mfaCard"><h3>${_t('🔐 امنیت حساب')}${helpKey && window.HELP ? HELP.btn(helpKey) : ''}</h3><div id="mfaBody" class="muted">…</div></div>`;
  }
  async function bindCard(sb) {
    const body = document.getElementById('mfaBody'); if (!body) return;
    const on = (await verified(sb)).length > 0;
    body.innerHTML = `<p style="margin-top:0"><b>${on ? _t('ورود دو مرحله‌ای فعال است ✅') : _t('ورود دو مرحله‌ای خاموش است')}</b></p>
      <p class="hint">${_t('بعد از رمز، یک کد ۶ رقمی از برنامه‌ی Authenticator گوشی شما هم لازم است. اگر کسی رمز شما را بداند، بدون گوشی شما نمی‌تواند وارد شود.')}</p>
      <div class="btns">${on ? `<button class="btn r" id="mfaOff">${_t('خاموش کردن')}</button>` : `<button class="btn p" id="mfaOn">${_t('فعال کردن ورود دو مرحله‌ای')}</button>`}</div>
      <p class="hint">${_t('اگر گوشی‌تان گم شد، مدیر سامانه می‌تواند ورود دو مرحله‌ای حساب شما را بازنشانی کند.')}</p>`;
    const off = document.getElementById('mfaOff'), onB = document.getElementById('mfaOn');
    if (off) off.onclick = async () => {
      if (!confirm(_t('ورود دو مرحله‌ای خاموش شود؟'))) return;
      for (const f of await verified(sb)) { const {error} = await sb.auth.mfa.unenroll({factorId: f.id}); if (error) return ui()(error.message); }
      await sb.auth.refreshSession(); ui()(_t('خاموش شد')); bindCard(sb);
    };
    if (onB) onB.onclick = () => enroll(sb, body);
  }
  async function enroll(sb, body) {
    const {data: all} = await sb.auth.mfa.listFactors();
    for (const f of (all?.all || all?.totp || []).filter(f => f.status !== 'verified')) await sb.auth.mfa.unenroll({factorId: f.id});
    const {data, error} = await sb.auth.mfa.enroll({factorType: 'totp', friendlyName: 'Sarrafino ' + new Date().toISOString().slice(0, 16)});
    if (error) return ui()(error.message);
    const qr = data.totp.qr_code, secret = data.totp.secret;
    body.innerHTML = `<p>${_t('مرحله ۱: برنامه‌ی Google Authenticator یا Microsoft Authenticator را روی گوشی نصب کنید.')}</p>
      <p>${_t('مرحله ۲: در برنامه «+» را بزنید و این QR را اسکن کنید (یا کد زیر را دستی وارد کنید).')}</p>
      <div style="text-align:center"><img id="mfaQr" alt="QR" style="width:200px;height:200px;background:#fff;border-radius:12px;padding:8px"></div>
      <p class="small" style="text-align:center">${_t('کد دستی:')} <b dir="ltr" style="user-select:all;letter-spacing:1px">${secret}</b></p>
      <p>${_t('مرحله ۳: کد ۶ رقمی که برنامه نشان می‌دهد را اینجا بنویسید.')}</p>
      <div class="pair"><input class="in num" id="mfaNew" inputmode="numeric" maxlength="6" dir="ltr" style="font-size:22px;letter-spacing:6px;text-align:center"><button class="btn p" id="mfaVer" style="flex:none">${_t('تأیید و ورود')}</button></div>
      <div class="btns"><button class="btn g" id="mfaCancel">${_t('انصراف')}</button></div>`;
    document.getElementById('mfaQr').src = qr.startsWith('data:') ? qr : 'data:image/svg+xml;utf-8,' + encodeURIComponent(qr);
    document.getElementById('mfaCancel').onclick = async () => { await sb.auth.mfa.unenroll({factorId: data.id}); bindCard(sb); };
    document.getElementById('mfaVer').onclick = async () => {
      const code = document.getElementById('mfaNew').value.replace(/\D/g, '');
      const r = await sb.auth.mfa.challengeAndVerify({factorId: data.id, code});
      if (r.error) return ui()(_t('کد اشتباه است یا منقضی شده. دوباره امتحان کنید.'));
      ui()(_t('فعال شد. از این به بعد هنگام ورود کد خواسته می‌شود.')); bindCard(sb);
    };
  }
  return {gate, card, bindCard};
})();
