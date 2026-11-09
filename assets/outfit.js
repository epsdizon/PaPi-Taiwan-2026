/* PaPi Taiwan 2026 — what to wear: little clothing drawings, and the rules that pick them from the weather. */
window.OUTFIT = (() => {
  'use strict';

  const INK = '#1D2742';
  const art = (body) => `<svg class="wear-art" viewBox="0 0 64 64" aria-hidden="true"><g fill-rule="evenodd" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
  const line = (d, w = 2.4, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  const dot = (x, y, r = 1.6, f = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="none"/>`;

  // Shared shapes: a long-sleeved top, and the opening at its neck
  const LONG = 'M24 9 14 12C10 13.4 7.7 16.4 7 21L4.5 49 11.8 50.2 16.5 27V55H47.5V27L52.2 50.2 59.5 49 57 21C56.3 16.4 54 13.4 50 12L40 9Q32 6.6 24 9Z';
  const NECK = (y, deep) => `M24 ${y}Q32 ${y - 2.4} 40 ${y}C38.3 ${y + deep * 0.75} 35.4 ${y + deep} 32 ${y + deep}C28.6 ${y + deep} 25.7 ${y + deep * 0.75} 24 ${y}Z`;
  const CUFFS = line('M5.1 44.6 12.6 45.9M58.9 44.6 51.4 45.9');

  const ITEMS = {
    tee: {
      label: 'T-shirt',
      svg: art(`<path d="M24 10 14 13 5 22 11.5 30 17 26.5V55H47V26.5L52.5 30 59 22 50 13 40 10Q32 7.6 24 10Z" fill="#FFD166"/>`
        + `<path d="${NECK(10, 5.4)}" fill="#E9B949"/>${line('M11.5 30 17 26.5M52.5 30 47 26.5', 2)}`),
    },
    longsleeve: {
      label: 'Long sleeves',
      svg: art(`<path d="${LONG}" fill="#FFFFFF"/>`
        + line('M17.2 23H46.8M17.2 30H46.8M17.2 37H46.8M17.2 44H46.8M17.2 51H46.8', 3, '#3D6FB6')
        + `<path d="${LONG}" fill="none"/><path d="${NECK(9, 5.2)}" fill="#E6EBF5"/>${CUFFS}`),
    },
    hoodie: {
      label: 'Hoodie or sweater',
      svg: art(`<path d="M22.6 12.5C21.2 6.4 25.8 3.4 32 3.4S42.8 6.4 41.4 12.5Z" fill="#C95A42"/>`
        + `<path d="${LONG}" fill="#EF7B5B"/><path d="M24 9.6C26 15 28.8 17.6 32 17.6S38 15 40 9.6C37 8 27 8 24 9.6Z" fill="#C95A42"/>`
        + line('M28.8 16.6V25M35.2 16.6V25', 2) + dot(28.8, 26, 1.5) + dot(35.2, 26, 1.5)
        + `<path d="M22 39H42L45 49.5H19Z" fill="none"/>${line('M16.5 51H47.5', 2)}${CUFFS}`),
    },
    jacket: {
      label: 'Light jacket',
      svg: art(`<path d="${LONG}" fill="#2A9D8F"/><path d="M24 9V5.2Q32 3.2 40 5.2V9Q32 7.4 24 9Z" fill="#1E7F74"/>`
        + line('M32 8.2V55') + `<rect x="30.4" y="16" width="3.2" height="5.4" rx="1" fill="#E9F5F3"/>`
        + line('M20.5 39.5 27.5 38.5M43.5 39.5 36.5 38.5M16.5 50.8H47.5', 2) + CUFFS),
    },
    puffer: {
      label: 'Warm jacket',
      svg: art(`<path d="M23 9 13.5 12.5C9 14.2 6.6 17.6 5.8 22.4L3.4 48 12.2 49.6 16 29V56H48V29L51.8 49.6 60.6 48 58.2 22.4C57.4 17.6 55 14.2 50.5 12.5L41 9Q32 7 23 9Z" fill="#3D5A98"/>`
        + `<path d="M23.4 9.4V4.4Q32 2.4 40.6 4.4V9.4Q32 7.6 23.4 9.4Z" fill="#2C4478"/>`
        + line('M16 21.5Q24 24 32 21.5Q40 24 48 21.5M16 29.5Q24 32 32 29.5Q40 32 48 29.5M16 37.5Q24 40 32 37.5Q40 40 48 37.5M16 45.5Q24 48 32 45.5Q40 48 48 45.5M6.2 30 14.6 31.6M5.2 39 13.4 40.6M57.8 30 49.4 31.6M58.8 39 50.6 40.6', 1.8)
        + line('M32 4V56')),
    },
    raincoat: {
      label: 'Rain jacket',
      svg: art(`<path d="M22.3 13.5C20.6 6.4 25.5 2.6 32 2.6S43.4 6.4 41.7 13.5Z" fill="#DDAE1F"/>`
        + `<path d="M23.5 11 14 14C10 15.4 7.8 18.4 7 23L5 47.5 12 48.7 16 29 14.5 59H49.5L48 29 52 48.7 59 47.5 57 23C56.2 18.4 54 15.4 50 14L40.5 11C38.6 14.6 35.6 16.4 32 16.4S25.4 14.6 23.5 11Z" fill="#F4C430"/>`
        + line('M32 16.4V59') + dot(35.6, 24) + dot(35.6, 33) + dot(35.6, 42) + dot(35.6, 51)
        + `<rect x="18.5" y="41" width="8.5" height="7" rx="1.2" fill="#F4C430"/><rect x="38.5" y="41" width="8.5" height="7" rx="1.2" fill="#F4C430"/>`),
    },
    jeans: {
      label: 'Long pants',
      svg: art(`<path d="M18 7H46L49.5 57H38L32 25 26 57H14.5Z" fill="#4A6FA5"/>`
        + line('M18.3 12H45.7M32 12V20Q32 23.2 29.6 24.2', 2.2)
        + line('M19.3 12.2Q20.6 18 26 18.6M44.7 12.2Q43.4 18 38 18.6M14.9 52H26.9M37.1 52H49.1', 1.9)
        + line('M23 7V12M41 7V12', 1.9)),
    },
    sneakers: {
      label: 'Comfy sneakers',
      svg: art(`<path d="M6.6 45.5C6 37.5 8 30.6 11.8 25.6L19.6 27.6C22.6 28.3 24.8 27 26 24L28.2 19.5H34.8C37.4 25 42.6 29.4 49.2 31.9L55.2 34.2C59 35.6 60.6 38.6 60.6 42V45.5Z" fill="#FFFFFF"/>`
        + `<path d="M6.6 45.5C6 37.5 8 30.6 11.8 25.6L15.6 26.6C13.6 31.6 13 38.4 14 45.5Z" fill="#E63946"/>`
        + `<path d="M5.4 45.5H61.6V48.6C61.6 51 60 52.6 57.6 52.6H9.4C7.2 52.6 5.4 50.8 5.4 48.6Z" fill="#D9DEE8"/>`
        + line('M29.6 23.4 34.6 22.2M31.6 27.2 37.4 25.6M34.4 30.8 40.4 28.8', 2) + line('M46.4 45.5C49 41.2 54 39.4 60.2 40.2', 2)),
    },
    umbrella: {
      label: 'Umbrella',
      svg: art(`<path d="M5 33C6 19 17.5 9 32 9S58 19 59 33Q53.6 29.4 48.2 33 42.8 29.4 37.4 33 32 29.4 26.6 33 21.2 29.4 15.8 33 10.4 29.4 5 33Z" fill="#E63946"/>`
        + line('M32 9Q21.5 15 15.8 33M32 9Q28.6 19 26.6 33M32 9Q35.4 19 37.4 33M32 9Q42.5 15 48.2 33', 1.9)
        + line('M32 9V4.6M32 33V51.5C32 56.2 25.6 56.2 25.6 51.5')),
    },
    beanie: {
      label: 'Beanie',
      svg: art(`<path d="M13 41C13 27 21 18.5 32 18.5S51 27 51 41Z" fill="#D62828"/>`
        + `<rect x="11" y="39.5" width="42" height="12.5" rx="3" fill="#A61E1E"/>`
        + line('M17 42V49.5M22 42V49.5M27 42V49.5M32 42V49.5M37 42V49.5M42 42V49.5M47 42V49.5', 1.6, '#F2B8B8')
        + '<circle cx="32" cy="14" r="6.6" fill="#FFFFFF"/>'),
    },
    scarf: {
      label: 'Scarf',
      svg: art(`<path d="M27 28.4H35L33.6 56H25Z" fill="#C95A42"/>`
        + `<path d="M12 20C12 13.5 21 9 32 9S52 13.5 52 20 43 31 32 31 12 26.5 12 20ZM19.2 20C19.2 23.3 24.9 25.4 32 25.4S44.8 23.3 44.8 20 39.1 14.6 32 14.6 19.2 16.7 19.2 20Z" fill="#EF7B5B"/>`
        + `<path d="M33.4 27.4 41.6 26.4 44 53H35.2Z" fill="#EF7B5B"/>`
        + line('M25.6 49.4H33.9M35.7 46.6H43.4', 2.6, '#FFD166')
        + line('M26.6 56V60M29.4 56V60M32.2 56V60M36.4 53V57.4M39.6 53V57.4M42.8 53V57.4', 1.8)),
    },
    cap: {
      label: 'Cap',
      svg: art(`<path d="M44 39C50.5 39 57 40.2 61 43.6 56.2 45.2 49.4 45.6 44 45Z" fill="#1D3A45"/>`
        + `<path d="M12 39C12 26.5 21 18 32.5 18S52 26.5 52 39Z" fill="#2E6F82"/>`
        + line('M32.5 18C30 25 29.4 32 30 39M12 39H52', 2) + dot(32.5, 18, 2) + dot(42, 27.5, 1.2)),
    },
  };

  /* Pick the day's clothes.
     lo, hi: °C. rain: % chance (or null). ic: the weather icon ('rain', 'storm', 'sun', 'partly'...).
     wet: the place is usually drizzly (used when there's no forecast yet). */
  function pick({ lo, hi, rain = null, ic = '', wet = false }) {
    const rainy = (rain ?? 0) >= 50 || /rain|storm/.test(ic) || (rain === null && !ic && wet);
    const showers = !rainy && (rain ?? 0) >= 25;
    const k = [hi >= 24 ? 'tee' : 'longsleeve'];
    if (lo < 13) k.push('puffer'); // cold rain: the warm jacket and an umbrella, not two coats
    else if (lo < 17) k.push(rainy ? 'hoodie' : 'jacket');
    else if (lo < 20) k.push('hoodie');
    if (rainy && lo >= 13) k.push('raincoat');
    k.push('jeans', 'sneakers');
    if (rainy || showers) k.push('umbrella');
    if (lo < 15) k.push('beanie');
    if (lo < 11) k.push('scarf');
    if (!rainy && !showers && /sun|partly/.test(ic) && hi >= 24) k.push('cap');
    const kids = rainy ? 'For the kids: rain jackets, the stroller rain cover and spare socks.'
      : lo < 15 ? 'For the kids: one more layer than the grown-ups, and a beanie.'
        : 'For the kids: one more layer than the grown-ups for the evening.';
    return { items: k.map((key) => Object.assign({ key }, ITEMS[key])), kids };
  }

  return { ITEMS, pick };
})();
