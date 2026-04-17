/**
 * Point HVAC - Proposal Storage
 * PDF teklifleri Supabase Storage'a yukler.
 * Metadata'yi proposals tablosuna kaydeder.
 * Gecmis teklifleri listeler, indirir, siler.
 */
const ProposalStorage = (() => {

  /**
   * PDF'i Supabase Storage'a yukle ve metadata kaydet.
   * @param {Object} opts
   *   - pdfBase64: base64 string (data URI degil, saf base64)
   *   - teklifNo: teklif numarasi (orn: 'OZY-2026-1704-1430')
   *   - currency: 'EUR', 'TRY', 'USD'
   *   - totalAmount: toplam tutar (sayi)
   *   - itemCount: urun sayisi
   *   - customerInfo: { firma, kisi, proje }
   *   - pdfType: 'standard' veya 'visual'
   * @returns {{ success: boolean, error?: string, warning?: string }}
   */
  async function uploadProposal(opts) {
    try {
      var client = SupabaseConfig.getClient();
      if (!client) return { success: false, error: 'Supabase baglantisi yok' };

      var sessionResult = await client.auth.getSession();
      var session = sessionResult.data ? sessionResult.data.session : null;
      if (!session) return { success: false, error: 'Oturum bulunamadi' };

      var userId = session.user.id;
      var fileName = (opts.teklifNo || 'teklif') + '.pdf';
      var storagePath = userId + '/' + fileName;

      // Base64 -> Uint8Array
      var binaryString = atob(opts.pdfBase64);
      var bytes = new Uint8Array(binaryString.length);
      for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Supabase Storage'a yukle
      var uploadResult = await client.storage
        .from('proposals')
        .upload(storagePath, bytes.buffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadResult.error) {
        console.error('[ProposalStorage] Upload hatasi:', uploadResult.error);
        return { success: false, error: 'Dosya yuklenemedi: ' + uploadResult.error.message };
      }

      // Metadata kaydet
      var metaResult = await client
        .from('proposals')
        .insert({
          user_id: userId,
          proposal_no: opts.teklifNo || '',
          file_path: storagePath,
          file_size: bytes.length,
          currency: opts.currency || 'EUR',
          total_amount: opts.totalAmount || 0,
          item_count: opts.itemCount || 0,
          customer_info: opts.customerInfo || {},
          pdf_type: opts.pdfType || 'standard'
        });

      if (metaResult.error) {
        console.error('[ProposalStorage] Metadata hatasi:', metaResult.error);
        return { success: true, warning: 'PDF yuklendi fakat metadata kaydedilemedi' };
      }

      return { success: true };

    } catch (e) {
      console.error('[ProposalStorage] Yukleme hatasi:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Kullanicinin tum tekliflerini listele.
   * @returns {Array} proposals (created_at DESC)
   */
  async function listProposals() {
    try {
      var client = SupabaseConfig.getClient();
      if (!client) return [];

      var result = await client
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (result.error) {
        console.error('[ProposalStorage] Liste hatasi:', result.error);
        return [];
      }

      return result.data || [];
    } catch (e) {
      console.error('[ProposalStorage] Liste hatasi:', e);
      return [];
    }
  }

  /**
   * Teklif dosyasi icin signed download URL olustur.
   * @param {string} filePath - orn: 'user-uuid/OZY-2026-1704-1430.pdf'
   * @returns {string|null} 60 saniyelik signed URL
   */
  async function getDownloadUrl(filePath) {
    try {
      var client = SupabaseConfig.getClient();
      if (!client) return null;

      var result = await client.storage
        .from('proposals')
        .createSignedUrl(filePath, 60);

      if (result.error) {
        console.error('[ProposalStorage] URL hatasi:', result.error);
        return null;
      }

      return result.data.signedUrl;
    } catch (e) {
      console.error('[ProposalStorage] URL hatasi:', e);
      return null;
    }
  }

  /**
   * Teklifi indir ve paylas (native) veya kaydet (web).
   * @param {Object} proposal - proposals tablosundan gelen kayit
   */
  async function downloadAndShare(proposal) {
    try {
      var url = await getDownloadUrl(proposal.file_path);
      if (!url) {
        if (typeof App !== 'undefined') App.showToast('Dosya indirilemedi', 'error');
        return;
      }

      var response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var blob = await response.blob();
      var fileName = (proposal.proposal_no || 'teklif') + '.pdf';

      // Native: ShareHelper ile paylas
      if (typeof ShareHelper !== 'undefined' && ShareHelper.isNative()) {
        var reader = new FileReader();
        reader.onloadend = async function() {
          var base64 = reader.result.split(',')[1];
          try {
            await ShareHelper.shareFile({
              fileName: fileName,
              data: base64,
              mimeType: 'application/pdf',
              dialogTitle: 'Teklifi Paylas',
              text: 'Point HVAC - Teklif No: ' + proposal.proposal_no
            });
          } catch (se) {
            console.error('[ProposalStorage] Paylasim hatasi:', se);
          }
        };
        reader.readAsDataURL(blob);
      } else {
        // Web: dosya indir
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }

      if (typeof App !== 'undefined') App.showToast('Teklif indirildi', 'success');
    } catch (e) {
      console.error('[ProposalStorage] Indirme hatasi:', e);
      if (typeof App !== 'undefined') App.showToast('Teklif indirme basarisiz', 'error');
    }
  }

  /**
   * Teklifi sil (storage + veritabani).
   * @param {Object} proposal - proposals tablosundan gelen kayit
   * @returns {boolean} basarili mi
   */
  async function deleteProposal(proposal) {
    try {
      var client = SupabaseConfig.getClient();
      if (!client) return false;

      // Storage'dan sil
      await client.storage.from('proposals').remove([proposal.file_path]);

      // Veritabanindan sil
      await client.from('proposals').delete().eq('id', proposal.id);

      return true;
    } catch (e) {
      console.error('[ProposalStorage] Silme hatasi:', e);
      return false;
    }
  }

  return {
    uploadProposal: uploadProposal,
    listProposals: listProposals,
    getDownloadUrl: getDownloadUrl,
    downloadAndShare: downloadAndShare,
    deleteProposal: deleteProposal
  };
})();
