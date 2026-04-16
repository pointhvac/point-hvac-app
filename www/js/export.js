/**
 * Point HVAC - Excel Export (SheetJS)
 * DIA listesini Excel dosyasina aktarir.
 */

const ExcelExport = (() => {

  /** SheetJS kutuphanesinin yuklu oldugunu kontrol et. */
  function _checkXLSX() {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS yuklu degil');
    }
  }

  /**
   * DIA listesini Excel olarak indir.
   * @param {Array} items - DIA listesi
   * @param {string} fileName - Dosya adi (opsiyonel)
   */
  async function exportDIA(items, fileName) {
    if (!items || !items.length) {
      App.showToast('Liste bos, export edilecek veri yok', 'error');
      return;
    }

    try {
      _checkXLSX();
    } catch (e) {
      App.showToast('Excel kutuphanesi yuklenemedi', 'error');
      return;
    }

    // Veri tablosu olustur
    const rows = items.map((item, idx) => ({
      'No': idx + 1,
      'Modul': modulLabel(item.modul),
      'Kategori': item.kategori || '-',
      'Model': item.model || '-',
      'Debi (m3/h)': item.debi || '-',
      'Basinc (Pa)': item.basinc || '-',
      'Liste Fiyat (EUR)': item.listeFiyat || item.fiyat || '-',
      'Iskonto (%)': item.iskonto || '-',
      'Net Fiyat (EUR)': item.netFiyat || '-',
      'Motor (kW)': item.motorGucu || item.gucW || '-',
      'Voltaj': item.voltaj || '-',
      'Not': item.not || '-'
    }));

    // Toplam satiri
    const totalNet = items.reduce((sum, i) => sum + (i.netFiyat || i.fiyat || 0), 0);
    rows.push({
      'No': '',
      'Modul': '',
      'Kategori': '',
      'Model': 'TOPLAM',
      'Debi (m3/h)': '',
      'Basinc (Pa)': '',
      'Liste Fiyat (EUR)': '',
      'Iskonto (%)': '',
      'Net Fiyat (EUR)': totalNet,
      'Motor (kW)': '',
      'Voltaj': '',
      'Not': ''
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Kolon genislikleri
    ws['!cols'] = [
      { wch: 4 },  // No
      { wch: 12 }, // Modul
      { wch: 20 }, // Kategori
      { wch: 18 }, // Model
      { wch: 12 }, // Debi
      { wch: 10 }, // Basinc
      { wch: 14 }, // Liste Fiyat
      { wch: 10 }, // Iskonto
      { wch: 14 }, // Net Fiyat
      { wch: 10 }, // Motor
      { wch: 8 },  // Voltaj
      { wch: 16 }  // Not
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DIA Listesi');

    const fn = fileName || ('Point_HVAC_DIA_' + formatDate() + '.xlsx');

    if (typeof ShareHelper !== 'undefined' && ShareHelper.isNative()) {
      // Android: native paylasim dialogu
      try {
        var base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        await ShareHelper.shareFile({
          fileName: fn,
          data: base64,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Excel Listesini Paylas',
          text: 'Point HVAC - DIA Listesi'
        });
        App.showToast('Excel paylasildi', 'success');
      } catch (se) {
        console.error('Paylasim hatasi:', se);
        XLSX.writeFile(wb, fn);
        App.showToast('Excel kaydedildi', 'success');
      }
    } else {
      // Web: normal download
      XLSX.writeFile(wb, fn);
      App.showToast('Excel dosyasi indirildi', 'success');
    }
  }

  function modulLabel(modul) {
    const labels = {
      fan: 'Fan', santral: 'Santral', hucreli: 'Hucreli',
      cihaz: 'Cihaz', aksa: 'AKSA'
    };
    return labels[modul] || modul || '-';
  }

  function formatDate() {
    const d = new Date();
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  return { exportDIA };
})();
