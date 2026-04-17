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

    /** USD bazli degeri EUR'ya cevir */
    function _usdToEur(val) {
      if (typeof CurrencyManager !== 'undefined' && CurrencyManager.hasRates()) {
        var rates = CurrencyManager.getRates();
        if (rates.USD) return val / rates.USD;
      }
      return val;
    }

    // Veri tablosu olustur
    const rows = [];
    let rowNum = 1;
    items.forEach((item) => {
      const rawNet = item.netFiyat || 0;
      const rawList = item.listeFiyat || item.fiyat || 0;
      const birimTag = item.birim === 'USD' ? ' (USD)' : '';
      rows.push({
        'No': rowNum++,
        'Modul': modulLabel(item.modul),
        'Kategori': formatKategori(item.kategori),
        'Model': (item.model || '-') + birimTag,
        'Debi (m3/h)': item.debi || '-',
        'Basinc (Pa)': item.basinc || '-',
        'Liste Fiyat (EUR)': item.birim === 'USD' ? _usdToEur(rawList) : (rawList || '-'),
        'Iskonto (%)': item.iskonto || '-',
        'Net Fiyat (EUR)': item.birim === 'USD' ? _usdToEur(rawNet) : (rawNet || '-'),
        'Motor (kW)': item.motorGucu || item.gucW || '-',
        'Voltaj': item.voltaj || '-',
        'Not': item.not || '-'
      });
      // Santral otomasyon (MCC+DCC) alt kalemi
      if (item.modul === 'santral' && item.otomasyonTotal) {
        rows.push({
          'No': rowNum++,
          'Modul': 'Santral',
          'Kategori': formatKategori(item.kategori),
          'Model': 'Otomasyon (MCC+DCC)',
          'Debi (m3/h)': '-',
          'Basinc (Pa)': '-',
          'Liste Fiyat (EUR)': '-',
          'Iskonto (%)': '-',
          'Net Fiyat (EUR)': item.otomasyonTotal,
          'Motor (kW)': '-',
          'Voltaj': '-',
          'Not': '-'
        });
      }
      // Hucreli G2/G4 filtre alt kalemleri
      if (item.modul === 'hucreli' && item.g2 && item.g2NetFiyat) {
        rows.push({
          'No': rowNum++,
          'Modul': 'Hucreli',
          'Kategori': formatKategori(item.kategori),
          'Model': 'G2 Filtre',
          'Debi (m3/h)': '-',
          'Basinc (Pa)': '-',
          'Liste Fiyat (EUR)': '-',
          'Iskonto (%)': '-',
          'Net Fiyat (EUR)': item.g2NetFiyat,
          'Motor (kW)': '-',
          'Voltaj': '-',
          'Not': '-'
        });
      }
      if (item.modul === 'hucreli' && item.g4 && item.g4NetFiyat) {
        rows.push({
          'No': rowNum++,
          'Modul': 'Hucreli',
          'Kategori': formatKategori(item.kategori),
          'Model': 'G4 Filtre',
          'Debi (m3/h)': '-',
          'Basinc (Pa)': '-',
          'Liste Fiyat (EUR)': '-',
          'Iskonto (%)': '-',
          'Net Fiyat (EUR)': item.g4NetFiyat,
          'Motor (kW)': '-',
          'Voltaj': '-',
          'Not': '-'
        });
      }
    });

    // Toplam satiri (USD itemleri EUR'ya cevir)
    const totalNet = items.reduce((sum, i) => {
      let raw = i.netFiyat || i.fiyat || 0;
      if (i.birim === 'USD') raw = _usdToEur(raw);
      let t = sum + raw;
      if (i.modul === 'santral' && i.otomasyonTotal) t += i.otomasyonTotal;
      if (i.modul === 'hucreli') { t += (i.g2NetFiyat || 0) + (i.g4NetFiyat || 0); }
      return t;
    }, 0);
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

    const fn = fileName || (_generateTeklifNo() + '.xlsx');

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

  function _generateTeklifNo() {
    const d   = new Date();
    const yyyy = String(d.getFullYear());
    const gg  = String(d.getDate()).padStart(2, '0');
    const aa  = String(d.getMonth() + 1).padStart(2, '0');
    const ss  = String(d.getHours()).padStart(2, '0');
    const dd  = String(d.getMinutes()).padStart(2, '0');
    return 'OZY-' + yyyy + '-' + gg + aa + '-' + ss + dd;
  }

  return { exportDIA };
})();
