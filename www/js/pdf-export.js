/**
 * Point HVAC - PDF Teklif Export
 * jsPDF + jsPDF-AutoTable ile A4 portre teklif PDF'i üretir.
 * Font: Tahoma (www/fonts/tahoma.ttf, tahomabd.ttf) – yoksa helvetica'ya düşer.
 */
const PdfExport = (() => {

  // ===== RENK PALETİ (spec) =====
  const PRIMARY    = [200, 0, 42];     // #C8002A
  const DARK_GRAY  = [61, 61, 61];     // #3D3D3D
  const MID_GRAY   = [107, 107, 107];  // #6B6B6B
  const LIGHT_GRAY = [245, 245, 245];  // #F5F5F5
  const BLUE       = [0, 85, 170];     // #0055AA
  const WHITE      = [255, 255, 255];
  const BORDER     = [220, 220, 220];

  const MODUL_LABELS = {
    fan: 'Fan', santral: 'Santral', hucreli: 'Hücreli',
    cihaz: 'Cihaz', aksa: 'AKSA'
  };

  // ===== YARDIMCI =====
  function _checkLibs() {
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
      throw new Error('jsPDF yüklü değil');
    }
  }

  function _arrayBufferToBase64(buf) {
    let binary = '';
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return window.btoa(binary);
  }

  /** Tahoma fontunu yüklemeye çalış; başarısızsa helvetica döner. */
  async function _registerFont(doc) {
    const tryPaths = [
      ['../fonts/tahoma.ttf',   '../fonts/tahomabd.ttf'],
      ['./fonts/tahoma.ttf',    './fonts/tahomabd.ttf'],
      ['/fonts/tahoma.ttf',     '/fonts/tahomabd.ttf']
    ];
    for (const [reg, bold] of tryPaths) {
      try {
        const [r1, r2] = await Promise.all([fetch(reg), fetch(bold)]);
        if (!r1.ok || !r2.ok) continue;
        const [b1, b2] = await Promise.all([r1.arrayBuffer(), r2.arrayBuffer()]);
        doc.addFileToVFS('Tahoma.ttf',   _arrayBufferToBase64(b1));
        doc.addFileToVFS('TahomaBd.ttf', _arrayBufferToBase64(b2));
        doc.addFont('Tahoma.ttf',   'Tahoma', 'normal');
        doc.addFont('TahomaBd.ttf', 'Tahoma', 'bold');
        doc.setFont('Tahoma', 'normal');
        return 'Tahoma';
      } catch (_) { /* sonraki yolu dene */ }
    }
    doc.setFont('helvetica', 'normal');
    return 'helvetica';
  }

  /** PNG'yi fetch edip dataURL döner; başarısızsa null. */
  async function _loadImageDataURL(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const blob = await r.blob();
      return await new Promise((res) => {
        const fr = new FileReader();
        fr.onload  = () => res(fr.result);
        fr.onerror = () => res(null);
        fr.readAsDataURL(blob);
      });
    } catch (_) { return null; }
  }

  /** Format: OZY-YYYY-GGAA-SSDD  (yıl-gün+ay-saat+dakika) */
  function _generateTeklifNo() {
    const d   = new Date();
    const yyyy = String(d.getFullYear());
    const gg  = String(d.getDate()).padStart(2, '0');
    const aa  = String(d.getMonth() + 1).padStart(2, '0');
    const ss  = String(d.getHours()).padStart(2, '0');
    const dd  = String(d.getMinutes()).padStart(2, '0');
    return 'OZY-' + yyyy + '-' + gg + aa + '-' + ss + dd;
  }

  function _fmtDateTR(d) {
    return String(d.getDate()).padStart(2, '0') + '.'
         + String(d.getMonth() + 1).padStart(2, '0') + '.'
         + d.getFullYear();
  }

  function _fmtDateFile(d) {
    return d.getFullYear() + '-'
         + String(d.getMonth() + 1).padStart(2, '0') + '-'
         + String(d.getDate()).padStart(2, '0');
  }

  // ===== ANA FONKSİYON =====
  /**
   * DIA listesini PDF teklif olarak indir/paylaş.
   * @param {Array}  items
   * @param {Object} options - { currency }
   */
  async function exportDIA(items, options) {
    options = options || {};
    if (!items || !items.length) {
      App.showToast('Liste boş, PDF oluşturulamaz', 'error');
      return;
    }
    try { _checkLibs(); }
    catch (e) { App.showToast('PDF kütüphanesi yüklenemedi', 'error'); return; }

    try {
      const currency = options.currency
        || (typeof CurrencyManager !== 'undefined' ? CurrencyManager.getActiveCurrency() : 'EUR');

      // A4 portre, mm
      const doc    = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW  = doc.internal.pageSize.getWidth();   // 210
      const pageH  = doc.internal.pageSize.getHeight();  // 297
      const ML = 15, MR = 15, MT = 12, MB = 12;
      const contentW = pageW - ML - MR;

      const fontName = await _registerFont(doc);
      const teklifNo = _generateTeklifNo();
      const now      = new Date();

      // ========== HEADER ==========
      const logoData = await _loadImageDataURL('../assets/logos/logo_siyah.png');
      const logoW = 52, logoH = 18;
      const topY  = MT;

      if (logoData) {
        try { doc.addImage(logoData, 'PNG', ML, topY, logoW, logoH); } catch (_) {}
      }

      // Sağ: şirket bilgileri
      doc.setFont(fontName, 'bold');
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, DARK_GRAY);
      doc.text('POINT HAVALANDIRMA SİSTEMLERİ', pageW - MR, topY + 4, { align: 'right' });

      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, MID_GRAY);
      doc.text('Dağyaka Mah. 2022. Cad. No:18/1',        pageW - MR, topY + 9,  { align: 'right' });
      doc.text('KahramanKazan / ANKARA',                 pageW - MR, topY + 13, { align: 'right' });
      doc.text('+90 (312) 394 57 69 | info@pointhvac.com', pageW - MR, topY + 17, { align: 'right' });
      doc.setTextColor.apply(doc, PRIMARY);
      doc.text('www.pointhvac.com', pageW - MR, topY + 21, { align: 'right' });

      // Alt kırmızı çizgi (≈2pt = 0.7mm)
      const hLineY = topY + logoH + 6;
      doc.setDrawColor.apply(doc, PRIMARY);
      doc.setLineWidth(0.7);
      doc.line(ML, hLineY, pageW - MR, hLineY);

      // ========== TEKLİF BANNER ==========
      let y = hLineY + 4;
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7.5, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, WHITE);
      doc.text('TEKLİF', ML + 3, y + 5.2);
      y += 7.5;

      // Meta satırı (3 kolon)
      y += 6;
      const col1X = ML + 2;
      const col2X = ML + contentW / 3;
      const col3X = ML + (2 * contentW) / 3;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, DARK_GRAY);
      doc.text('Teklif No:',   col1X, y);
      doc.text('Tarih:',       col2X, y);
      doc.text('Para Birimi:', col3X, y);
      doc.setFont(fontName, 'bold');
      doc.text(teklifNo,       col1X + 20, y);
      doc.text(_fmtDateTR(now), col2X + 13, y);
      doc.text(currency,       col3X + 22, y);
      y += 7;

      // ========== ÜRÜN TABLOSU ==========
      function fmtPrice(val) {
        if (val == null || val === 0) return '-';
        let conv = val;
        if (currency !== 'EUR' && typeof CurrencyManager !== 'undefined') {
          conv = CurrencyManager.convert(val, currency);
        }
        return conv.toLocaleString('tr-TR', {
          minimumFractionDigits: 2, maximumFractionDigits: 2
        }) + ' ' + currency;
      }
      function fmtNum(val) {
        if (val == null) return '-';
        return val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }

      const rows = items.map((it, i) => [
        i + 1,
        MODUL_LABELS[it.modul] || it.modul || '-',
        it.kategori || '-',
        it.model || '-',
        it.debi   ? fmtNum(it.debi)   : '-',
        it.basinc ? fmtNum(it.basinc) : '-',
        fmtPrice(it.netFiyat || it.fiyat),
        it.motorGucu || it.gucW || '-',
        it.voltaj || '-'
      ]);

      doc.autoTable({
        startY: y,
        head: [[
          '#', 'Modül', 'Kategori', 'Model',
          'Debi\n(m³/h)', 'Basınç\n(Pa)',
          'Net Fiyat', 'Motor\n(kW)', 'Voltaj'
        ]],
        body: rows,
        margin: { left: ML, right: MR },
        styles: {
          font: fontName, fontSize: 8, cellPadding: 2.4,
          overflow: 'linebreak',
          lineColor: BORDER, lineWidth: 0.1,
          textColor: DARK_GRAY, valign: 'middle'
        },
        headStyles: {
          fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold',
          fontSize: 8, halign: 'center', valign: 'middle'
        },
        alternateRowStyles: { fillColor: LIGHT_GRAY },
        columnStyles: {
          0: { cellWidth:  8, halign: 'center' },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 38 },
          3: { cellWidth: 22 },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 24, halign: 'right' },
          7: { cellWidth: 18, halign: 'center' },
          8: { cellWidth: 18, halign: 'center' }
        }
      });

      y = doc.lastAutoTable.finalY + 5;

      // ========== FİYAT ÖZETİ (sağa hizalı) ==========
      const araToplam      = items.reduce((s, i) => s + (i.netFiyat || i.fiyat || 0), 0);
      const kdvIc          = araToplam * 0.20;
      const genelToplamIc  = araToplam + kdvIc;
      const kdvDis         = 0;
      const genelToplamDis = araToplam;

      const sumW = contentW * 0.55;
      const sumX = pageW - MR - sumW;
      const rowH = 6.5;

      function drawSumRow(label, value, opts) {
        opts = opts || {};
        const bg    = opts.bg;
        const color = opts.color || DARK_GRAY;
        const bold  = opts.bold === true;
        if (bg) {
          doc.setFillColor.apply(doc, bg);
          doc.rect(sumX, y, sumW, rowH, 'F');
        }
        doc.setFont(fontName, bold ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, color);
        doc.text(label, sumX + 3, y + 4.5);
        doc.text(value, sumX + sumW - 3, y + 4.5, { align: 'right' });
        y += rowH;
      }

      drawSumRow('ARA TOPLAM',                  fmtPrice(araToplam));
      drawSumRow('YURT İÇİ – KDV %20',          fmtPrice(kdvIc),         { color: PRIMARY });
      drawSumRow('GENEL TOPLAM (KDV Dahil)',    fmtPrice(genelToplamIc), { bg: PRIMARY, color: WHITE, bold: true });
      y += 2; // boş ayraç satır
      drawSumRow('YURT DIŞI – KDV %0 (İhracat)', fmtPrice(kdvDis),        { color: BLUE });
      drawSumRow('GENEL TOPLAM (KDV Hariç)',    fmtPrice(genelToplamDis), { bg: BLUE, color: WHITE, bold: true });

      y += 6;

      // ========== NOTLAR ==========
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, DARK_GRAY);
      const notes = [
        '• Fiyatlar KDV hariçtir.',
        '• Bu teklif 30 gün geçerlidir.',
        '• Yurt dışı satışlarda KDV %0 uygulanır (ihracat faturası).'
      ];
      for (const n of notes) { doc.text(n, ML, y); y += 4.5; }

      y += 4;

      // ========== BANKA BİLGİLERİ ==========
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, WHITE);
      doc.text('BANKA BİLGİLERİ', ML + 3, y + 4.9);
      y += 7;

      const bankRows = [
        ['HALKBANK / SARAY', 'TRY (TL)', 'TR98 0001 2001 4380 0010 1013 58'],
        ['HALKBANK / SARAY', 'USD ($)',  'TR27 0001 2001 4380 0053 1005 05'],
        ['HALKBANK / SARAY', 'EUR (€)',  'TR83 0001 2001 4380 0058 1004 29']
      ];

      doc.autoTable({
        startY: y,
        head: [['Banka', 'Döviz', 'IBAN']],
        body: bankRows,
        margin: { left: ML, right: MR },
        styles: {
          font: fontName, fontSize: 9, cellPadding: 2.4,
          lineColor: BORDER, lineWidth: 0.1,
          textColor: DARK_GRAY, valign: 'middle'
        },
        headStyles: {
          fillColor: LIGHT_GRAY, textColor: DARK_GRAY,
          fontStyle: 'bold', halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 30 },
          2: { cellWidth: contentW - 85, fontStyle: 'bold', textColor: PRIMARY }
        }
      });

      // ========== FOOTER (her sayfa) ==========
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const fY = pageH - MB + 2;
        doc.setDrawColor.apply(doc, PRIMARY);
        doc.setLineWidth(0.35); // ~1pt
        doc.line(ML, fY - 4, pageW - MR, fY - 4);

        doc.setFont(fontName, 'normal');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, MID_GRAY);
        doc.text('Point HVAC | HVAC Seçim ve Fiyatlandırma', ML, fY);
        doc.text('Sayfa ' + p + ' / ' + totalPages, pageW - MR, fY, { align: 'right' });
      }

      // ========== KAYDET / PAYLAŞ ==========
      const fileName = 'Point_HVAC_Teklif_' + _fmtDateFile(now) + '.pdf';

      if (typeof ShareHelper !== 'undefined' && ShareHelper.isNative()) {
        try {
          const dataUri = doc.output('datauristring');
          const commaIdx = dataUri.indexOf(',');
          const base64 = commaIdx >= 0 ? dataUri.substring(commaIdx + 1) : dataUri;
          await ShareHelper.shareFile({
            fileName: fileName,
            data: base64,
            mimeType: 'application/pdf',
            dialogTitle: 'Teklifi Paylaş',
            text: 'Point HVAC - Teklif No: ' + teklifNo
          });
          App.showToast('PDF paylaşıldı', 'success');
        } catch (se) {
          console.error('Paylaşım hatası:', se);
          doc.save(fileName);
          App.showToast('PDF kaydedildi', 'success');
        }
      } else {
        doc.save(fileName);
        App.showToast('PDF teklif indirildi', 'success');
      }

    } catch (e) {
      console.error('PDF oluşturma hatası:', e);
      App.showToast('PDF oluşturulurken hata oluştu', 'error');
    }
  }

  return { exportDIA };
})();
