# ارزینو (Arzino)

آدرس: https://arzino.kiagroup.tr — صرافینو: https://arzino.kiagroup.tr/sarrafino/ (و sarrafino.kiagroup.tr) — میزبانی: Cloudflare Pages از شاخه‌ی main. آدرس قدیمی github.io بازدیدکننده‌ها را با تنظیماتشان به آدرس تازه می‌برد.

نرخ لحظه‌ای ارز، تومان، طلا، نقره، سکه و رمزارز — با نمودار (۱۵ دقیقه تا ۱ سال)، مبدل، ماشین‌حساب و نرخ دستی.

- اپ: `index.html` + `app.js` + `app.css` (PWA، قابل نصب روی اندروید، آیفون و دسکتاپ)
- داده: `scripts/fetch_data.py` هر ۵ دقیقه با GitHub Actions اجرا می‌شود و خروجی را در شاخه `data` می‌گذارد.
