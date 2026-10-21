# PaPi Taiwan 2026

Our family trip to Taiwan, **Dec 4 to 9, 2026**.

Live site: https://epsdizon.github.io/PaPi-Taiwan-2026/

## What's on the site

- **Days**: each day drawn as its own Taipei-MRT-style line, with times, tips, photos, a map link, and a "Show driver" card with the place name in Chinese. During the trip it opens on today and marks the next stop.
- **Food**: the three must-eats (Din Tai Fung, Chun Shui Tang's original store, Ichiran) plus every food stop by day, with prices you can change.
- **Budget**: each adult's share and the group total in pesos and NT dollars. The exchange rate updates by itself every few hours. Change the number of adults and kids, car seats per van, or any price, and every total follows. "Check price" opens a search for the current price.
- **Packing**: things to confirm before the trip, a toddler packing list, and good-to-know tips. Ticks are saved on each phone.
- Two plans: **Slow & kid-friendly** (default) and **Original pace**. Switch on the cover.
- Works offline after the first visit, and can be added to the phone's home screen.

## Changing the plan

Everything lives in [`assets/data.js`](assets/data.js):

- `settings`: default number of adults and kids, car seats per van, shopping money, hotel cost.
- `plans.slow` and `plans.original`: each has `stops` (day, time, what, place, how to get there, tip), `food` (with NT$ prices) and `budget` (with NT$ prices).
- `places`: names in English and Chinese, addresses for the driver card, and which Wikipedia pages to borrow photos from.

Price edits made on the website are saved only on that phone. To change a price for everyone, edit `data.js`.

After adding a place with new Chinese characters, run `python tools/build_assets.py` so the characters are added to the site's font. They still show without it, just in the phone's own font.

To preview a trip day, add `?today=2026-12-06&time=10:15` to the address.

## Credits

- Photos load from Wikipedia and Wikimedia Commons under their free licenses. Tap any photo on the site to see the photographer and license.
- Exchange rate: the free [Currency API](https://github.com/fawazahmed0/exchange-api) by Fawaz Ahmed, with [Exchange Rate API](https://www.exchangerate-api.com) as a backup.
- Fonts: Sofia Sans and Noto Sans TC, both under the SIL Open Font License.
- Prices are estimates checked in October 2026.
