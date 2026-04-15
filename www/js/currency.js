/**
 * Point HVAC - Doviz Kuru Yonetimi
 * EUR bazli fiyatlari TL/USD'ye cevirir.
 * Kaynak: frankfurter.app (API key gereksiz, ucretsiz)
 */
const CurrencyManager = (() => {

  const CACHE_KEY = 'currency_rates';
  const CACHE_DURATION = 10 * 60 * 1000; // 10 dakika
  const API_URL = 'https://api.frankfurter.app/latest?from=EUR&to=TRY,USD';

  const SYMBOLS = { EUR: 'EUR', TRY: 'TL', USD: 'USD' };

  let _rates = { EUR: 1, TRY: null, USD: null };
  let _activeCurrency = 'EUR';
  let _loading = false;
  let _listeners = [];

  /** Baslat: kayitli para birimi ve cache'li kurlari yukle. */
  function init() {
    _activeCurrency = getSetting('currency', 'EUR');
    const cached = getSetting(CACHE_KEY, null);
    if (cached && cached.rates && cached.timestamp) {
      _rates = { EUR: 1, TRY: cached.rates.TRY, USD: cached.rates.USD };
    }
    // Arka planda guncel kurlari cek
    fetchRates();
  }

  /** API'den kurlari cek ve cache'le. */
  async function fetchRates() {
    if (_loading) return;
    // Cache hala gecerliyse tekrar cekme
    const cached = getSetting(CACHE_KEY, null);
    if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      if (_rates.TRY == null && cached.rates) {
        _rates = { EUR: 1, TRY: cached.rates.TRY, USD: cached.rates.USD };
        _notify();
      }
      return;
    }
    _loading = true;
    try {
      const resp = await fetch(API_URL);
      if (!resp.ok) throw new Error('API error ' + resp.status);
      const data = await resp.json();
      _rates = { EUR: 1, TRY: data.rates.TRY, USD: data.rates.USD };
      setSetting(CACHE_KEY, {
        rates: { TRY: data.rates.TRY, USD: data.rates.USD },
        timestamp: Date.now()
      });
      _notify();
    } catch (e) {
      console.warn('Doviz kuru alinamadi:', e.message);
    } finally {
      _loading = false;
    }
  }

  /** EUR tutarini aktif veya belirtilen para birimine cevir. */
  function convert(eurAmount, currency) {
    const cur = currency || _activeCurrency;
    if (cur === 'EUR' || !_rates[cur]) return eurAmount;
    return eurAmount * _rates[cur];
  }

  /** Aktif para birimini getir. */
  function getActiveCurrency() { return _activeCurrency; }

  /** Aktif para birimini ayarla ve kaydet. */
  function setActiveCurrency(cur) {
    if (!SYMBOLS[cur]) return;
    _activeCurrency = cur;
    setSetting('currency', cur);
    _notify();
  }

  /** Guncel kur objesi. */
  function getRates() { return { ..._rates }; }

  /** Para birimi sembolu. */
  function getSymbol(cur) { return SYMBOLS[cur || _activeCurrency] || cur; }

  /** EUR disindaki kurlar mevcut mu? */
  function hasRates() { return _rates.TRY != null && _rates.USD != null; }

  /** Kur/para birimi degisikliginde cagirilacak listener ekle. */
  function onChange(fn) { _listeners.push(fn); }

  function _notify() { _listeners.forEach(fn => { try { fn(_activeCurrency, _rates); } catch(e) {} }); }

  return {
    init, fetchRates, convert, getRates, hasRates,
    getActiveCurrency, setActiveCurrency, getSymbol, onChange
  };
})();
