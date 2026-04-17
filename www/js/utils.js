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

/** Para birimi formatlama. currency verilmezse CurrencyManager aktif birimi kullanir. */
function formatCurrency(val, decimals = 2, currency) {
  if (val == null) return '-';
  var cur = currency || (typeof CurrencyManager !== 'undefined' ? CurrencyManager.getActiveCurrency() : 'EUR');
  var displayVal = val;
  if (cur !== 'EUR' && typeof CurrencyManager !== 'undefined') {
    displayVal = CurrencyManager.convert(val, cur);
  }
  var symbol = (typeof CurrencyManager !== 'undefined') ? CurrencyManager.getSymbol(cur) : 'EUR';
  return displayVal.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) + ' ' + symbol;
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

/** Kategori etiket haritasi - ozel isimler */
var KATEGORI_LABELS = {
  '(50)IGK+ISI+DX':         'Isı Geri Kazanım Santrali',
  '(50)IGK+ISI+DX+SUS':     'Susturuculu Isı Geri Kazanım Santrali',
  '(50)IGK+KH+ISI+DX':      'Karışım Havalı Isı Geri Kazanım',
  '(50)TH+ISI':              'Taze Havalı Santral (Sulu Batarya)',
  '(50)TH+ISI+DX':           'Taze Havalı Santral (Sulu+DX Batarya)',
  '(50)TH+DX':               'Taze Havalı Santral (DX Batarya)',
  '(50)KH+ISI+DX':           'Karışım Havalı Santral',
  '(60)HKS IGK+ISI+DX':      'Hijyenik Klima Santrali',
  '(50)TAMBUR+ISI+DX':       'Rotorlu Klima Santrali',
  '(50)TAMBUR+ISI+DX+SUS':   'Susturuculu Rotorlu Klima Santrali'
};

/** Kategori adini formatla: once haritaya bak, yoksa titleCase uygula. */
function formatKategori(key) {
  if (!key) return '-';
  return KATEGORI_LABELS[key] || titleCaseTR(key);
}

/** Turkce Title Case: her kelimenin ilk harfi buyuk, gerisi kucuk. */
function titleCaseTR(str) {
  if (!str) return str;
  return str.split(' ').map(function(word) {
    return word.split('+').map(function(part) {
      if (!part) return part;
      // Parantezli on ek: (50)TAMBUR -> (50)Tambur
      var m = part.match(/^(\([^)]*\))(.+)$/);
      if (m) {
        return m[1] + m[2].charAt(0).toLocaleUpperCase('tr-TR') + m[2].slice(1).toLocaleLowerCase('tr-TR');
      }
      return part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1).toLocaleLowerCase('tr-TR');
    }).join('+');
  }).join(' ');
}

/** Debounce. */
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
