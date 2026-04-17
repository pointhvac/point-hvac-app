/**
 * Point HVAC - Doviz Kuru Yonetimi
 * EUR bazli fiyatlari TL/USD'ye cevirir.
 * Birincil kaynak: TCMB (Turkiye Cumhuriyet Merkez Bankasi)
 * Yedek: open.er-api.com, frankfurter.app, exchangerate-api.com
 */
const CurrencyManager = (() => {

  const CACHE_KEY = 'currency_rates';
  const CACHE_DURATION = 10 * 60 * 1000; // 10 dakika

  // TCMB XML endpoint (API key gereksiz)
  const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

  // Yedek JSON API'ler (TCMB basarisiz olursa)
  const FALLBACK_URLS = [
    'https://open.er-api.com/v6/latest/EUR',
    'https://api.frankfurter.app/latest?from=EUR&to=TRY,USD',
    'https://api.exchangerate-api.com/v4/latest/EUR'
  ];

  const SYMBOLS = { EUR: 'EUR', TRY: 'TL', USD: 'USD' };

  let _rates = { EUR: 1, TRY: null, USD: null };
  let _activeCurrency = 'EUR';
  let _loading = false;
  let _listeners = [];
  let _source = null; // Kur kaynagi bilgisi

  /** Baslat: kayitli para birimi ve cache'li kurlari yukle. */
  function init() {
    _activeCurrency = getSetting('currency', 'EUR');
    const cached = getSetting(CACHE_KEY, null);
    if (cached && cached.rates && cached.timestamp) {
      _rates = { EUR: 1, TRY: cached.rates.TRY, USD: cached.rates.USD };
      _source = cached.source || null;
    }
    // Arka planda guncel kurlari cek
    fetchRates();
  }

  /** TCMB XML'den kurlari parse et. */
  async function _tryTCMB() {
    var resp = await fetch(TCMB_URL, { cache: 'no-store' });
    if (!resp.ok) throw new Error('TCMB HTTP ' + resp.status);
    var text = await resp.text();
    var parser = new DOMParser();
    var xml = parser.parseFromString(text, 'text/xml');

    // EUR ve USD döviz alış kurlarını bul
    var currencies = xml.querySelectorAll('Currency');
    var usdRate = null, eurRate = null;
    for (var i = 0; i < currencies.length; i++) {
      var code = currencies[i].getAttribute('Kod') || currencies[i].getAttribute('CurrencyCode');
      var forexBuying = currencies[i].querySelector('ForexBuying');
      if (!forexBuying || !forexBuying.textContent) continue;
      var rate = parseFloat(forexBuying.textContent);
      if (isNaN(rate)) continue;
      if (code === 'USD') usdRate = rate;
      if (code === 'EUR') eurRate = rate;
    }

    if (!eurRate || !usdRate) throw new Error('TCMB: EUR/USD bulunamadi');

    // TCMB kurlari TRY bazli (1 EUR = eurRate TRY, 1 USD = usdRate TRY)
    // Biz EUR bazli calisiyoruz: 1 EUR = eurRate TRY, 1 EUR = eurRate/usdRate USD
    return {
      TRY: eurRate,
      USD: eurRate / usdRate
    };
  }

  /** Yedek JSON API'yi dene. */
  async function _tryFallback(url) {
    var resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var data = await resp.json();
    if (!data || !data.rates) throw new Error('Gecersiz yanit');
    var rates = data.rates;
    if (rates.TRY == null || rates.USD == null) throw new Error('TRY/USD eksik');
    return { TRY: rates.TRY, USD: rates.USD };
  }

  /** Kurlari cek: once TCMB, basarisiz olursa yedek API'ler. */
  async function _fetchAll() {
    // 1. TCMB
    try {
      var r = await _tryTCMB();
      return { rates: r, source: 'TCMB' };
    } catch (e) {
      console.warn('TCMB hatasi:', e.message);
    }

    // 2. Yedek API'ler
    for (var i = 0; i < FALLBACK_URLS.length; i++) {
      try {
        var r = await _tryFallback(FALLBACK_URLS[i]);
        return { rates: r, source: FALLBACK_URLS[i] };
      } catch (e) {
        console.warn('Kur API hatasi (' + FALLBACK_URLS[i] + '):', e.message);
      }
    }

    return null;
  }

  /** API'den kurlari cek ve cache'le. */
  async function fetchRates() {
    if (_loading) return;
    // Cache hala gecerliyse tekrar cekme
    const cached = getSetting(CACHE_KEY, null);
    if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      if (_rates.TRY == null && cached.rates) {
        _rates = { EUR: 1, TRY: cached.rates.TRY, USD: cached.rates.USD };
        _source = cached.source || null;
        _notify();
      }
      return;
    }
    _loading = true;
    var result = await _fetchAll();
    if (result) {
      _rates = { EUR: 1, TRY: result.rates.TRY, USD: result.rates.USD };
      _source = result.source;
      setSetting(CACHE_KEY, { rates: result.rates, source: result.source, timestamp: Date.now() });
      _notify();
    } else {
      console.warn('Tum kur API\'leri basarisiz oldu');
    }
    _loading = false;
  }

  /** Cache'i sifirla ve guncel kurlari zorla cek. */
  async function forceRefresh() {
    if (_loading) return false;
    setSetting(CACHE_KEY, null);
    _loading = true;
    var result = await _fetchAll();
    if (result) {
      _rates = { EUR: 1, TRY: result.rates.TRY, USD: result.rates.USD };
      _source = result.source;
      setSetting(CACHE_KEY, { rates: result.rates, source: result.source, timestamp: Date.now() });
      _notify();
    }
    _loading = false;
    return !!result;
  }

  /** Yukleme durumu. */
  function isLoading() { return _loading; }

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

  /** Kur kaynagi (TCMB veya yedek API URL). */
  function getSource() { return _source; }

  /** Son guncelleme zamani (timestamp). */
  function getLastUpdate() {
    var cached = getSetting(CACHE_KEY, null);
    return (cached && cached.timestamp) ? cached.timestamp : null;
  }

  /** Son guncelleme zamanini formatli dondur (gg.aa.yyyy ss:dd). */
  function getLastUpdateText() {
    var ts = getLastUpdate();
    if (!ts) return null;
    var d = new Date(ts);
    var gg = String(d.getDate()).padStart(2, '0');
    var aa = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    var ss = String(d.getHours()).padStart(2, '0');
    var dd = String(d.getMinutes()).padStart(2, '0');
    return gg + '.' + aa + '.' + yyyy + ' ' + ss + ':' + dd;
  }

  /** Kur/para birimi degisikliginde cagirilacak listener ekle. */
  function onChange(fn) { _listeners.push(fn); }

  function _notify() { _listeners.forEach(fn => { try { fn(_activeCurrency, _rates); } catch(e) {} }); }

  return {
    init, fetchRates, forceRefresh, isLoading, convert, getRates, hasRates,
    getActiveCurrency, setActiveCurrency, getSymbol, getSource,
    getLastUpdate, getLastUpdateText, onChange
  };
})();
