/**
 * Point HVAC - PDF Teklif Export
 * jsPDF + jsPDF-AutoTable ile profesyonel teklif PDF'i olusturur.
 */
const PdfExport = (() => {

  let _loaded = false;

  /** Kutuphaneleri CDN'den lazy-load et. */
  async function ensureLibs() {
    if (_loaded) return;
    if (typeof jspdf === 'undefined') {
      await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
    }
    if (typeof jspdf !== 'undefined' && !jspdf.jsPDF.prototype.autoTable) {
      await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js');
    }
    _loaded = true;
  }

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function() { reject(new Error('Kutuphane yuklenemedi')); };
      document.head.appendChild(s);
    });
  }

  /** Teklif numarasi olustur: TKL-YYYYMMDD-XXXX */
  function _generateTeklifNo() {
    var d = new Date();
    var ds = String(d.getFullYear())
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');
    var seq = String(Math.floor(Math.random() * 9000) + 1000);
    return 'TKL-' + ds + '-' + seq;
  }

  function _formatDateTR(d) {
    return String(d.getDate()).padStart(2, '0') + '.'
      + String(d.getMonth() + 1).padStart(2, '0') + '.'
      + d.getFullYear();
  }

  function _formatDateFile(d) {
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  var MODUL_LABELS = {
    fan: 'Fan', santral: 'Santral', hucreli: 'Hucreli',
    cihaz: 'Cihaz', aksa: 'AKSA'
  };

  /**
   * DIA listesini PDF teklif olarak indir.
   * @param {Array} items - DIA listesi
   * @param {Object} options - { currency: 'EUR'|'TRY'|'USD' }
   */
  async function exportDIA(items, options) {
    options = options || {};
    if (!items || !items.length) {
      App.showToast('Liste bos, PDF olusturulamaz', 'error');
      return;
    }

    try {
      await ensureLibs();
    } catch (e) {
      App.showToast('PDF kutuphanesi yuklenemedi', 'error');
      return;
    }

    try {
      var currency = options.currency || (typeof CurrencyManager !== 'undefined' ? CurrencyManager.getActiveCurrency() : 'EUR');
      var currSymbol = (typeof CurrencyManager !== 'undefined') ? CurrencyManager.getSymbol(currency) : 'EUR';

      var doc = new jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica');

      var pageW = doc.internal.pageSize.getWidth();   // 297mm
      var pageH = doc.internal.pageSize.getHeight();   // 210mm
      var margin = 14;
      var teklifNo = _generateTeklifNo();
      var now = new Date();

      // ===== HEADER =====
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('POINT HVAC', margin, 18);

      doc.setFontSize(14);
      doc.setTextColor(26, 26, 46);
      doc.text('TEKLIF', margin, 28);

      // Sag taraf bilgiler
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text('Teklif No: ' + teklifNo, pageW - margin, 14, { align: 'right' });
      doc.text('Tarih: ' + _formatDateTR(now), pageW - margin, 20, { align: 'right' });
      doc.text('Para Birimi: ' + currSymbol, pageW - margin, 26, { align: 'right' });

      // Ayirici cizgi
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageW - margin, 32);

      // ===== FIYAT FORMATLAMA =====
      function fmtPrice(val) {
        if (val == null || val === 0) return '-';
        var converted = val;
        if (currency !== 'EUR' && typeof CurrencyManager !== 'undefined') {
          converted = CurrencyManager.convert(val, currency);
        }
        return converted.toLocaleString('tr-TR', {
          minimumFractionDigits: 2, maximumFractionDigits: 2
        }) + ' ' + currSymbol;
      }

      function fmtNum(val) {
        if (val == null) return '-';
        return val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }

      // ===== TABLO VERILERI =====
      var bodyRows = items.map(function(item, idx) {
        return [
          idx + 1,
          MODUL_LABELS[item.modul] || item.modul || '-',
          (item.kategori || '-').substring(0, 30),
          item.model || '-',
          item.debi ? fmtNum(item.debi) : '-',
          item.basinc ? fmtNum(item.basinc) : '-',
          fmtPrice(item.listeFiyat || item.fiyat),
          item.iskonto ? '%' + item.iskonto : '-',
          fmtPrice(item.netFiyat),
          item.motorGucu || item.gucW || '-',
          item.voltaj || '-'
        ];
      });

      var headers = ['#', 'Modul', 'Kategori', 'Model', 'Debi\n(m3/h)', 'Basinc\n(Pa)',
        'Liste Fiyat', 'Iskonto', 'Net Fiyat', 'Motor\n(kW)', 'Voltaj'];

      doc.autoTable({
        startY: 36,
        head: [headers],
        body: bodyRows,
        margin: { left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          lineColor: [220, 220, 220],
          lineWidth: 0.2
        },
        headStyles: {
          fillColor: [26, 26, 46],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 18 },
          2: { cellWidth: 34 },
          3: { cellWidth: 28 },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 28, halign: 'right' },
          7: { cellWidth: 16, halign: 'center' },
          8: { cellWidth: 28, halign: 'right' },
          9: { cellWidth: 16, halign: 'center' },
          10: { cellWidth: 16, halign: 'center' }
        }
      });

      // ===== TOPLAM =====
      var finalY = doc.lastAutoTable.finalY + 8;
      var totalNet = items.reduce(function(sum, i) { return sum + (i.netFiyat || i.fiyat || 0); }, 0);

      // Toplam kutusu
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(0.3);
      doc.roundedRect(pageW - margin - 80, finalY - 6, 80, 14, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 46);
      doc.text('TOPLAM:', pageW - margin - 75, finalY + 2);
      doc.setTextColor(0, 102, 204);
      doc.text(fmtPrice(totalNet), pageW - margin - 4, finalY + 2, { align: 'right' });

      // ===== FOOTER =====
      var totalPages = doc.internal.getNumberOfPages();
      for (var i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        var footerY = pageH - 10;

        // Alt cizgi
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(156, 163, 175);
        doc.text('* Fiyatlar KDV haricdir. Teklif 30 gun gecerlidir.', margin, footerY);
        doc.text('Point HVAC | HVAC Secim ve Fiyatlandirma', pageW - margin, footerY, { align: 'right' });
        doc.text('Sayfa ' + i + ' / ' + totalPages, pageW / 2, footerY, { align: 'center' });
      }

      // ===== KAYDET =====
      var fileName = 'Point_HVAC_Teklif_' + _formatDateFile(now) + '.pdf';
      doc.save(fileName);
      App.showToast('PDF teklif indirildi', 'success');

    } catch (e) {
      console.error('PDF olusturma hatasi:', e);
      App.showToast('PDF olusturulurken hata olustu', 'error');
    }
  }

  return { exportDIA };
})();
