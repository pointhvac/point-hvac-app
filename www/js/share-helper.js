/**
 * Point HVAC - Native Share Helper
 * Android'de Capacitor Filesystem + Share pluginleri ile native paylasim dialogu acar.
 * Web'de normal download yapar.
 */
const ShareHelper = (() => {

  /** Capacitor ortami mi? */
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  /** Capacitor Filesystem plugin'ini al. */
  function _fs() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
  }

  /** Capacitor Share plugin'ini al. */
  function _share() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;
  }

  /** ArrayBuffer/Uint8Array -> base64 */
  function _arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = '';
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  /** Blob -> base64 */
  function _blobToBase64(blob) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function() {
        // data:...;base64,XXXX
        var dataUrl = reader.result;
        var commaIdx = dataUrl.indexOf(',');
        resolve(commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Dosyayi paylas (Android) veya indir (web).
   * @param {Object} opts
   *   - fileName: 'ornek.pdf'
   *   - data: base64 string, Blob, ArrayBuffer veya Uint8Array
   *   - mimeType: 'application/pdf' vs.
   *   - dialogTitle: 'Teklif Paylas'
   *   - webFallback: function() { ... } - web'de calisacak fallback (doc.save() gibi)
   */
  async function shareFile(opts) {
    opts = opts || {};
    // Web'de normal download
    if (!isNative()) {
      if (typeof opts.webFallback === 'function') {
        opts.webFallback();
        return { shared: false, downloaded: true };
      }
      throw new Error('Web fallback yok');
    }

    var Filesystem = _fs();
    var Share = _share();
    if (!Filesystem || !Share) {
      // Plugin yuklu degil, fallback'e dus
      if (typeof opts.webFallback === 'function') {
        opts.webFallback();
        return { shared: false, downloaded: true };
      }
      throw new Error('Capacitor pluginleri bulunamadi');
    }

    // Base64'e cevir
    var base64;
    if (typeof opts.data === 'string') {
      base64 = opts.data;
    } else if (opts.data instanceof Blob) {
      base64 = await _blobToBase64(opts.data);
    } else if (opts.data instanceof ArrayBuffer || opts.data instanceof Uint8Array) {
      base64 = _arrayBufferToBase64(opts.data);
    } else {
      throw new Error('Desteklenmeyen veri tipi');
    }

    // Cache dizinine yaz
    var writeResult = await Filesystem.writeFile({
      path: opts.fileName,
      data: base64,
      directory: 'CACHE',
      recursive: true
    });

    var fileUri = writeResult.uri;

    // Native paylasim dialogu ac
    await Share.share({
      title: opts.dialogTitle || opts.fileName,
      text: opts.text || opts.fileName,
      url: fileUri,
      dialogTitle: opts.dialogTitle || 'Paylas'
    });

    return { shared: true, uri: fileUri };
  }

  return { isNative, shareFile };
})();
