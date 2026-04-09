/**
 * Point HVAC - Yardimci Fonksiyonlar
 */

/** Guvenli sayi donusumu. Turkce formati destekler (virgul = nokta). */
function toFloat(x) {
  if (x == null) return null;
  if (typeof x === 'number') return x;
  let s = String(x).trim();
  if (!s) return null;
  s = s.replace(',', '.');
  const cleaned = s.replace(/[^\d.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Para birimi formatlama (EUR). */
function formatCurrency(val, decimals = 2) {
  if (val == null) return '-';
  return val.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) + ' EUR';
}

/** Sayi formatlama (Turkce). */
function formatNumber(val, decimals = 0) {
  if (val == null) return '-';
  return val.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/** localStorage'dan ayar oku. */
function getSetting(key, defaultVal) {
  try {
    const v = localStorage.getItem('phvac_' + key);
    return v !== null ? JSON.parse(v) : defaultVal;
  } catch { return defaultVal; }
}

/** localStorage'a ayar yaz. */
function setSetting(key, val) {
  try {
    localStorage.setItem('phvac_' + key, JSON.stringify(val));
  } catch { /* quota exceeded */ }
}

/** Aktif firma. */
function getActiveFirma() {
  return getSetting('firma', 'point');
}
function setActiveFirma(firma) {
  setSetting('firma', firma);
}

/** Basit bildirim sesi cal. */
function playSound(name) {
  try {
    const audio = new Audio(`/assets/sounds/${name}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch { /* ses calmadi */ }
}

/** Debounce. */
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
