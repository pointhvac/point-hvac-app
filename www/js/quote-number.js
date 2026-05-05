/**
 * Point HVAC - Quote Number Service
 * Supabase RPC uzerinden atomik, auto-increment teklif numarasi uretir.
 * Format: OZY-YYYY-NNNN (ornek: OZY-2026-0001)
 * HG Format: HG-YYYY-NNNN (ornek: HG-2026-0001)
 */
const QuoteNumberService = (() => {

  // Firma bazli RPC ve prefix haritalari
  const FIRMA_CONFIG = {
    point: { rpcName: 'get_next_quote_number', prefix: 'OZY' },
    hg:    { rpcName: 'get_next_quote_number_hg', prefix: 'HG' }
  };

  /**
   * Supabase RPC ile bir sonraki teklif numarasini al.
   * @param {string} [firma='point'] - 'point' veya 'hg'
   * @returns {Promise<{success: boolean, teklifNo: string, source: string}>}
   */
  async function getNextNumber(firma) {
    firma = firma || 'point';
    var config = FIRMA_CONFIG[firma] || FIRMA_CONFIG.point;

    try {
      var client = null;
      if (typeof SupabaseConfig !== 'undefined') {
        client = SupabaseConfig.getClient();
      }
      if (!client) {
        console.warn('[QuoteNumberService] Supabase baglantisi yok, fallback kullaniliyor');
        return { success: false, teklifNo: _fallbackNumber(config.prefix), source: 'fallback' };
      }

      var sessionResult = await client.auth.getSession();
      var session = sessionResult.data ? sessionResult.data.session : null;
      if (!session) {
        console.warn('[QuoteNumberService] Oturum bulunamadi, fallback kullaniliyor');
        return { success: false, teklifNo: _fallbackNumber(config.prefix), source: 'fallback' };
      }

      var result = await client.rpc(config.rpcName);

      if (result.error) {
        console.error('[QuoteNumberService] RPC hatasi (' + config.rpcName + '):', result.error);
        return { success: false, teklifNo: _fallbackNumber(config.prefix), source: 'fallback' };
      }

      var teklifNo = result.data;
      if (!teklifNo || typeof teklifNo !== 'string' || !teklifNo.startsWith(config.prefix + '-')) {
        console.error('[QuoteNumberService] Gecersiz RPC yaniti:', teklifNo);
        return { success: false, teklifNo: _fallbackNumber(config.prefix), source: 'fallback' };
      }

      console.log('[QuoteNumberService] Teklif no alindi:', teklifNo);
      return { success: true, teklifNo: teklifNo, source: 'database' };

    } catch (e) {
      console.error('[QuoteNumberService] Beklenmeyen hata:', e);
      return { success: false, teklifNo: _fallbackNumber(config.prefix), source: 'fallback' };
    }
  }

  /**
   * Fallback: veritabanina ulasilamazsa timestamp bazli numara uret.
   * @param {string} prefix - 'OZY' veya 'HG'
   */
  function _fallbackNumber(prefix) {
    prefix = prefix || 'OZY';
    var d    = new Date();
    var yyyy = String(d.getFullYear());
    var gg   = String(d.getDate()).padStart(2, '0');
    var aa   = String(d.getMonth() + 1).padStart(2, '0');
    var ss   = String(d.getHours()).padStart(2, '0');
    var dd   = String(d.getMinutes()).padStart(2, '0');
    return prefix + '-' + yyyy + '-' + gg + aa + '-' + ss + dd;
  }

  return {
    getNextNumber: getNextNumber
  };

})();
