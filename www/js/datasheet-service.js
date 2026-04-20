/**
 * Point HVAC - Datasheet Service
 * LAN'daki Flask datasheet sunucusuna baglanarak urun datasheetlerini (PDF) indirir.
 */
const DatasheetService = (() => {

  const STORAGE_KEY_SERVER = 'datasheet_server';
  const STORAGE_KEY_APIKEY = 'datasheet_apikey';
  const DEFAULT_PORT = 1463;
  const DEFAULT_API_KEY = 'phvac-mobile-2026-secret';
  const TIMEOUT_MS = 30000;

  /** Sunucu URL'ini al (ornek: http://192.168.1.100:1463) */
  function getServerUrl() {
    return getSetting(STORAGE_KEY_SERVER, '');
  }

  /** Sunucu URL'ini kaydet */
  function setServerUrl(url) {
    url = (url || '').trim().replace(/\/+$/, '');
    if (url && !url.startsWith('http')) {
      // IP adresi veya hostname -> LAN varsay, http ekle
      url = 'http://' + url;
    }
    // Port yoksa: sadece LAN (http) icin varsayilan port ekle
    // HTTPS (Cloudflare Tunnel vb.) icin port ekleme - standart 443 kullanilir
    if (url && url.startsWith('http://') && !/:(\d+)/.test(url.replace(/^http:\/\//, ''))) {
      url += ':' + DEFAULT_PORT;
    }
    setSetting(STORAGE_KEY_SERVER, url);
  }

  /** API Key'i al */
  function getApiKey() {
    return getSetting(STORAGE_KEY_APIKEY, DEFAULT_API_KEY);
  }

  /** API Key'i kaydet */
  function setApiKey(key) {
    setSetting(STORAGE_KEY_APIKEY, (key || '').trim());
  }

  /** Sunucu ayarlanmis mi? */
  function isConfigured() {
    return !!getServerUrl();
  }

  /** Timeout destekli fetch */
  function _fetchWithTimeout(url, options, timeoutMs) {
    return new Promise(function(resolve, reject) {
      var timer = setTimeout(function() {
        reject(new Error('Baglanti zaman asimi (' + (timeoutMs / 1000) + 's)'));
      }, timeoutMs || TIMEOUT_MS);

      fetch(url, options).then(function(resp) {
        clearTimeout(timer);
        resolve(resp);
      }).catch(function(err) {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  /**
   * Sunucu baglanti testi
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  async function testConnection() {
    var server = getServerUrl();
    if (!server) {
      return { ok: false, message: 'Sunucu adresi ayarlanmamis' };
    }

    try {
      var resp = await _fetchWithTimeout(server + '/api/heartbeat', {
        method: 'GET',
        headers: { 'X-API-Key': getApiKey() }
      }, 5000);

      if (resp.status === 204 || resp.ok) {
        return { ok: true, message: 'Baglanti basarili' };
      }
      return { ok: false, message: 'Sunucu yanit verdi ama hata: HTTP ' + resp.status };
    } catch (err) {
      return { ok: false, message: 'Sunucuya ulasilamadi: ' + err.message };
    }
  }

  /**
   * Tek urun icin datasheet PDF indir
   * @param {Object} params - {model, debi, basinc, sheet, lang}
   * @returns {Promise<Blob>} PDF blob
   */
  async function downloadDatasheet(params) {
    var server = getServerUrl();
    if (!server) throw new Error('Sunucu adresi ayarlanmamis');

    var body = {
      model: params.model,
      debi: parseFloat(params.debi) || 0,
      basinc: parseFloat(params.basinc) || 0,
      sheet: params.sheet || '',
      lang: params.lang || 'tr'
    };

    console.log('[Datasheet] İstek gonderiliyor:', server + '/api/mobile/datasheet', JSON.stringify(body));

    var resp;
    try {
      resp = await _fetchWithTimeout(server + '/api/mobile/datasheet', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify(body)
      }, TIMEOUT_MS);
    } catch (fetchErr) {
      console.error('[Datasheet] Fetch hatasi:', fetchErr);
      throw new Error('Sunucuya baglanilamadi: ' + fetchErr.message);
    }

    console.log('[Datasheet] Yanit:', resp.status, resp.statusText, 'Content-Type:', resp.headers.get('content-type'));

    if (!resp.ok) {
      var errText = '';
      try {
        var errJson = await resp.json();
        errText = errJson.message || '';
      } catch (e) {
        errText = 'HTTP ' + resp.status;
      }
      console.error('[Datasheet] Sunucu hatasi:', resp.status, errText);
      throw new Error(errText || 'Datasheet indirilemedi (HTTP ' + resp.status + ')');
    }

    // Content-type kontrolu - PDF veya binary ise kabul et
    var contentType = (resp.headers.get('content-type') || '').toLowerCase();
    console.log('[Datasheet] Content-Type:', contentType);

    if (contentType.indexOf('application/pdf') === -1 &&
        contentType.indexOf('octet-stream') === -1 &&
        contentType.indexOf('application/') === -1) {
      // Muhtemelen JSON hata yaniti
      try {
        var json = await resp.json();
        throw new Error(json.message || 'Beklenmeyen yanit tipi: ' + contentType);
      } catch (parseErr) {
        if (parseErr.message.indexOf('Beklenmeyen') !== -1) throw parseErr;
        throw new Error('Beklenmeyen yanit tipi: ' + contentType);
      }
    }

    // ArrayBuffer olarak oku, sonra Blob'a cevir (daha iyi uyumluluk)
    try {
      var arrayBuf = await resp.arrayBuffer();
      console.log('[Datasheet] PDF boyutu:', arrayBuf.byteLength, 'bytes');
      if (arrayBuf.byteLength < 100) {
        throw new Error('PDF dosyasi cok kucuk (' + arrayBuf.byteLength + ' bytes) - olusturulamamisolabilir');
      }
      return new Blob([arrayBuf], { type: 'application/pdf' });
    } catch (blobErr) {
      console.error('[Datasheet] Blob olusturma hatasi:', blobErr);
      throw new Error('PDF verisi okunamadi: ' + blobErr.message);
    }
  }

  /**
   * DIA listesindeki tum fan urunleri icin ZIP olarak datasheet indir
   * Sunucu tum PDF'leri tek ZIP dosyasinda dondurur.
   * @param {Array} diaList - DIA listesi
   * @param {string} lang - Dil (tr/en)
   * @param {Function} onProgress - İlerleme callback: (step, message)
   * @returns {Promise<Blob>} ZIP blob
   */
  async function downloadAllDatasheets(diaList, lang, onProgress) {
    var server = getServerUrl();
    if (!server) throw new Error('Sunucu adresi ayarlanmamis');

    // Sadece fan modulu urunlerini filtrele
    var fanItems = diaList.filter(function(item) {
      return item.modul === 'fan';
    });

    console.log('[Datasheet] Toplam urun:', diaList.length, '| Fan urun:', fanItems.length);

    if (!fanItems.length) {
      throw new Error('Listede fan urunu bulunamadi');
    }

    // items listesini hazirla
    var items = fanItems.map(function(item) {
      return {
        model: item.model,
        debi: parseFloat(item.debi) || 0,
        basinc: parseFloat(item.basinc) || 0,
        sheet: item.kategori || ''
      };
    });

    console.log('[Datasheet] ZIP istegi gonderiliyor:', items.length, 'urun');
    if (onProgress) onProgress('prepare', fanItems.length + ' urun hazirlaniyor...');

    // Sunucuya tek istek - tum PDF'ler ZIP olarak donecek
    // Timeout: urun basina 60sn (Playwright PDF olusturma suresi icin)
    var zipTimeout = Math.max(TIMEOUT_MS, items.length * 60000);

    var resp;
    try {
      resp = await _fetchWithTimeout(server + '/api/mobile/datasheet-zip', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify({ items: items, lang: lang || 'tr' })
      }, zipTimeout);
    } catch (fetchErr) {
      console.error('[Datasheet] ZIP fetch hatasi:', fetchErr);
      throw new Error('Sunucuya baglanilamadi: ' + fetchErr.message);
    }

    console.log('[Datasheet] ZIP yanit:', resp.status, 'Content-Type:', resp.headers.get('content-type'));

    if (!resp.ok) {
      var errText = '';
      try {
        var errJson = await resp.json();
        errText = errJson.message || '';
      } catch (e) {
        errText = 'HTTP ' + resp.status;
      }
      throw new Error(errText || 'ZIP indirilemedi (HTTP ' + resp.status + ')');
    }

    if (onProgress) onProgress('download', 'ZIP indiriliyor...');

    var arrayBuf = await resp.arrayBuffer();
    console.log('[Datasheet] ZIP boyutu:', arrayBuf.byteLength, 'bytes');

    if (arrayBuf.byteLength < 100) {
      throw new Error('ZIP dosyasi cok kucuk (' + arrayBuf.byteLength + ' bytes)');
    }

    return new Blob([arrayBuf], { type: 'application/zip' });
  }

  /**
   * Dosya blob'u kaydet/paylas
   * @param {Blob} blob - PDF veya ZIP blob
   * @param {string} fileName - Dosya adi
   * @param {string} mimeType - MIME tipi (varsayilan: application/pdf)
   */
  async function shareFile(blob, fileName, mimeType) {
    mimeType = mimeType || 'application/pdf';
    await ShareHelper.shareFile({
      fileName: fileName,
      data: blob,
      mimeType: mimeType,
      dialogTitle: 'Datasheet Paylas',
      webFallback: function() {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  }

  /**
   * PDF blob'u kaydet/paylas (geriye uyumluluk)
   */
  function sharePdf(blob, fileName) {
    return shareFile(blob, fileName, 'application/pdf');
  }

  return {
    getServerUrl: getServerUrl,
    setServerUrl: setServerUrl,
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    isConfigured: isConfigured,
    testConnection: testConnection,
    downloadDatasheet: downloadDatasheet,
    downloadAllDatasheets: downloadAllDatasheets,
    sharePdf: sharePdf,
    shareFile: shareFile
  };
})();
