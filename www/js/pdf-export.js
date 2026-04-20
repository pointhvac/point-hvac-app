/**
 * Point HVAC - PDF Teklif Export
 * jsPDF + jsPDF-AutoTable ile A4 portre teklif PDF'i \u00FCretir.
 * Font: Tahoma (www/fonts/tahoma.ttf, tahomabd.ttf) \u2013 yoksa helvetica'ya d\u00FC\u015Fer.
 */
const PdfExport = (() => {

  // ===== RENK PALET\u0130 (spec) =====
  const PRIMARY    = [200, 0, 42];     // #C8002A
  const DARK_GRAY  = [61, 61, 61];     // #3D3D3D
  const MID_GRAY   = [107, 107, 107];  // #6B6B6B
  const LIGHT_GRAY = [245, 245, 245];  // #F5F5F5
  const BLUE       = [128, 0, 32];     // #800020 bordo
  const WHITE      = [255, 255, 255];
  const BORDER     = [220, 220, 220];

  // ===== YARDIMCI =====
  function _checkLibs() {
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
      throw new Error('jsPDF y\u00FCkl\u00FC de\u011Fil');
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

  /** Tahoma fontunu y\u00FCklemeye \u00E7al\u0131\u015F; ba\u015Far\u0131s\u0131zsa helvetica d\u00F6ner. */
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

  /** PNG'yi fetch edip dataURL d\u00F6ner; ba\u015Far\u0131s\u0131zsa null. */
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

  function _fmtDateFile(d) {
    return d.getFullYear() + '-'
         + String(d.getMonth() + 1).padStart(2, '0') + '-'
         + String(d.getDate()).padStart(2, '0');
  }

  // ===== ANA FONKS\u0130YON =====
  /**
   * DIA listesini PDF teklif olarak indir/payla\u015F.
   * @param {Array}  items
   * @param {Object} options - { currency, lang }
   */
  async function exportDIA(items, options) {
    options = options || {};
    var lang = options.lang || 'tr';
    var t = PdfI18n.get(lang);
    var MODUL_LABELS = PdfI18n.getModulLabels(lang);

    if (!items || !items.length) {
      App.showToast(t.toastEmpty, 'error');
      return;
    }
    try { _checkLibs(); }
    catch (e) { App.showToast(t.toastLibFail, 'error'); return; }

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
      var teklifNo;
      if (typeof QuoteNumberService !== 'undefined') {
        var quoteResult = await QuoteNumberService.getNextNumber();
        teklifNo = quoteResult.teklifNo;
      } else {
        var _d = new Date();
        teklifNo = 'OZY-' + _d.getFullYear() + '-' + String(_d.getDate()).padStart(2,'0') + String(_d.getMonth()+1).padStart(2,'0') + '-' + String(_d.getHours()).padStart(2,'0') + String(_d.getMinutes()).padStart(2,'0');
      }
      const now      = new Date();

      // ========== HEADER ==========
      const logoData = await _loadImageDataURL('../assets/logos/logo_siyah.png');
      const logoW = 52, logoH = 18;
      const topY  = MT;

      if (logoData) {
        try { doc.addImage(logoData, 'PNG', ML, topY, logoW, logoH); } catch (_) {}
      }

      // Sa\u011F: \u015Firket bilgileri
      doc.setFont(fontName, 'bold');
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, DARK_GRAY);
      doc.text(t.companyName, pageW - MR, topY + 4, { align: 'right' });

      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, MID_GRAY);
      doc.text('Da\u011Fyaka Mah. 2022. Cad. No:18/1',        pageW - MR, topY + 9,  { align: 'right' });
      doc.text('KahramanKazan / ANKARA',                 pageW - MR, topY + 13, { align: 'right' });
      doc.text('+90 (312) 394 57 69 | info@pointhvac.com', pageW - MR, topY + 17, { align: 'right' });
      doc.setTextColor.apply(doc, PRIMARY);
      doc.text('www.pointhvac.com', pageW - MR, topY + 21, { align: 'right' });

      // Alt k\u0131rm\u0131z\u0131 \u00E7izgi (\u22482pt = 0.7mm)
      const hLineY = topY + logoH + 6;
      doc.setDrawColor.apply(doc, PRIMARY);
      doc.setLineWidth(0.8);
      doc.line(ML, hLineY, pageW - MR, hLineY);

      // ========== TEKL\u0130F BANNER ==========
      let y = hLineY + 4;
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 8.5, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(12);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.banner, ML + 3, y + 5.8);
      y += 8.5;

      // Meta sat\u0131rlar\u0131 (4 alan, 2 sat\u0131r)
      y += 6;
      const col1X = ML + 2;
      const col2X = ML + contentW / 2;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, DARK_GRAY);
      doc.text(t.quoteNo,   col1X, y);
      doc.text(t.date,       col2X, y);
      doc.setFont(fontName, 'bold');
      doc.text(teklifNo,       col1X + 20, y);
      doc.text(PdfI18n.formatDate(now, lang), col2X + 13, y);
      y += 5;
      doc.setFont(fontName, 'normal');
      doc.text(t.currency, col1X, y);
      doc.text(t.preparedBy,  col2X, y);
      doc.setFont(fontName, 'bold');
      doc.text(currency,       col1X + 22, y);
      var _preparedBy = (typeof getSetting === 'function' && getSetting('current_user', null) && getSetting('current_user', null).fullName) || '';
      doc.text(_preparedBy,    col2X + 21, y);
      y += 7;

      // ========== \u00DCR\u00DCN TABLOSU ==========
      /** USD bazli degeri EUR'ya cevir */
      function _usdToEur(val) {
        if (typeof CurrencyManager !== 'undefined' && CurrencyManager.hasRates()) {
          var rates = CurrencyManager.getRates();
          if (rates.USD) return val / rates.USD;
        }
        return val;
      }
      function fmtPrice(val, birim) {
        if (val == null || val === 0) return '-';
        let eurVal = (birim === 'USD') ? _usdToEur(val) : val;
        let conv = eurVal;
        if (currency !== 'EUR' && typeof CurrencyManager !== 'undefined') {
          conv = CurrencyManager.convert(eurVal, currency);
        }
        return PdfI18n.formatPrice(conv, lang, currency);
      }
      function fmtNum(val) {
        return PdfI18n.formatNumber(val, lang);
      }

      const rows = [];
      let rowNum = 1;
      const fmtKat = (k) => PdfI18n.formatKategori(k, lang);
      items.forEach((it) => {
        rows.push([
          rowNum++,
          MODUL_LABELS[it.modul] || it.modul || '-',
          fmtKat(it.kategori),
          it.model || '-',
          it.debi   ? (typeof it.debi === 'string' ? it.debi : fmtNum(it.debi)) : '-',
          it.basinc ? fmtNum(it.basinc) : '-',
          fmtPrice(it.netFiyat || it.fiyat, it.birim),
          it.motorGucu || it.gucW || '-',
          it.voltaj || '-'
        ]);
        // Santral otomasyon (MCC+DCC) alt kalemi
        if (it.modul === 'santral' && it.otomasyonTotal) {
          rows.push([
            rowNum++,
            MODUL_LABELS.santral,
            fmtKat(it.kategori),
            t.subOtomasyon,
            '-',
            '-',
            fmtPrice(it.otomasyonTotal),
            '-',
            '-'
          ]);
        }
        // H\u00FCcreli G2/G4 filtre alt kalemleri
        if (it.modul === 'hucreli' && it.g2 && it.g2NetFiyat) {
          rows.push([
            rowNum++,
            MODUL_LABELS.hucreli,
            fmtKat(it.kategori),
            t.subG2,
            '-',
            '-',
            fmtPrice(it.g2NetFiyat),
            '-',
            '-'
          ]);
        }
        if (it.modul === 'hucreli' && it.g4 && it.g4NetFiyat) {
          rows.push([
            rowNum++,
            MODUL_LABELS.hucreli,
            fmtKat(it.kategori),
            t.subG4,
            '-',
            '-',
            fmtPrice(it.g4NetFiyat),
            '-',
            '-'
          ]);
        }
      });

      doc.autoTable({
        startY: y,
        head: [[
          '#', t.thModule, t.thCategory, t.thModel,
          t.thFlowRate, t.thPressure,
          t.thNetPrice, t.thMotor, t.thVoltage
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
          6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
          7: { cellWidth: 18, halign: 'center' },
          8: { cellWidth: 18, halign: 'center' }
        }
      });

      y = doc.lastAutoTable.finalY + 7;

      // ========== F\u0130YAT \u00D6ZET\u0130 (sa\u011Fa hizal\u0131) ==========
      const araToplam      = items.reduce((s, i) => {
        let raw = i.netFiyat || i.fiyat || 0;
        if (i.birim === 'USD') raw = _usdToEur(raw);
        let t = s + raw;
        if (i.modul === 'santral' && i.otomasyonTotal) t += i.otomasyonTotal;
        if (i.modul === 'hucreli') { t += (i.g2NetFiyat || 0) + (i.g4NetFiyat || 0); }
        return t;
      }, 0);
      const kdvIc          = araToplam * 0.20;
      const genelToplamIc  = araToplam + kdvIc;
      const kdvDis         = 0;
      const genelToplamDis = araToplam;

      const sumW = contentW * 0.62;
      const sumX = pageW - MR - sumW;
      const rowH = 7;

      function drawSumRow(label, value, opts) {
        opts = opts || {};
        var rh = opts.height || rowH;
        var fs = opts.fontSize || 9;
        const bg    = opts.bg;
        const color = opts.color || DARK_GRAY;
        const bold  = opts.bold === true;
        if (bg) {
          doc.setFillColor.apply(doc, bg);
          doc.rect(sumX, y, sumW, rh, 'F');
        } else if (opts.bgLight) {
          doc.setFillColor.apply(doc, opts.bgLight);
          doc.rect(sumX, y, sumW, rh, 'F');
        }
        doc.setFont(fontName, bold ? 'bold' : 'normal');
        doc.setFontSize(fs);
        doc.setTextColor.apply(doc, color);
        doc.text(label, sumX + 4, y + rh * 0.65);
        doc.text(value, sumX + sumW - 4, y + rh * 0.65, { align: 'right' });
        y += rh;
      }

      drawSumRow(t.subtotal, fmtPrice(araToplam), { bold: true, bgLight: LIGHT_GRAY });
      drawSumRow(t.domesticVat,          fmtPrice(kdvIc),         { color: PRIMARY });
      drawSumRow(t.grandTotalVatIncl,    fmtPrice(genelToplamIc), { bg: PRIMARY, color: WHITE, bold: true, height: 9, fontSize: 11 });
      y += 2; // bo\u015F ay\u0131ra\u00E7 sat\u0131r
      drawSumRow(t.exportVat, fmtPrice(kdvDis),        { color: BLUE });
      drawSumRow(t.grandTotalVatExcl,    fmtPrice(genelToplamDis), { bg: BLUE, color: WHITE, bold: true, height: 9, fontSize: 11 });

      y += 8;

      // ========== NOTLAR ==========
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, DARK_GRAY);
      var notes = t.notes.map(function(n) { return '\u2022 ' + n; });
      for (const n of notes) { doc.text(n, ML, y); y += 4.5; }

      y += 4;

      // ========== BANKA B\u0130LG\u0130LER\u0130 ==========
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.bankTitle, ML + 3, y + 4.9);
      y += 7;

      const bankRows = [
        ['HALKBANK / SARAY', 'TRY (TL)', 'TR98 0001 2001 4380 0010 1013 58'],
        ['HALKBANK / SARAY', 'USD ($)',  'TR27 0001 2001 4380 0053 1005 05'],
        ['HALKBANK / SARAY', 'EUR (\u20AC)',  'TR83 0001 2001 4380 0058 1004 29']
      ];

      doc.autoTable({
        startY: y,
        head: [[t.bankCol, t.currencyCol, 'IBAN']],
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

      // ========== GARANT\u0130 \u015EARTLARI ==========
      y = doc.lastAutoTable.finalY + 6;

      // Sayfa ta\u015Fma kontrol\u00FC yard\u0131mc\u0131s\u0131
      function _checkPageBreak(needed) {
        if (y + needed > pageH - MB - 8) {
          doc.addPage();
          y = MT + 4;
        }
      }

      _checkPageBreak(50);

      // Garanti \u015Eartlar\u0131 Banner
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.warrantyTitle, ML + contentW / 2, y + 4.9, { align: 'center' });
      y += 12;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, DARK_GRAY);

      t.warranty.forEach(function(item) {
        _checkPageBreak(8);
        var lines = doc.splitTextToSize('*  ' + item, contentW - 6);
        doc.text(lines, ML + 3, y);
        y += lines.length * 3.8;
      });

      y += 6;

      // ========== S\u00D6ZLE\u015EME \u015EARTLARI ==========
      _checkPageBreak(80);

      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.contractTitle, ML + contentW / 2, y + 4.9, { align: 'center' });
      y += 12;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, DARK_GRAY);

      t.contract.forEach(function(item, idx) {
        _checkPageBreak(10);
        var prefix = (idx + 1) + ')  ';
        var lines = doc.splitTextToSize(prefix + item, contentW - 6);
        doc.text(lines, ML + 3, y);
        y += lines.length * 3.8 + 1.5;
      });

      // Son uyar\u0131 paragraf\u0131
      y += 2;
      _checkPageBreak(14);
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor.apply(doc, DARK_GRAY);
      var sonNotLines = doc.splitTextToSize(t.finalNote, contentW - 6);
      doc.text(sonNotLines, ML + 3, y);
      y += sonNotLines.length * 3.5 + 4;

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
        doc.text(t.footerText, ML, fY);
        doc.text(t.page + ' ' + p + ' / ' + totalPages, pageW - MR, fY, { align: 'right' });
      }

      // ========== KAYDET / PAYLA\u015E ==========
      const fileName = teklifNo + '.pdf';

      if (typeof ShareHelper !== 'undefined' && ShareHelper.isNative()) {
        try {
          const dataUri = doc.output('datauristring');
          const commaIdx = dataUri.indexOf(',');
          const base64 = commaIdx >= 0 ? dataUri.substring(commaIdx + 1) : dataUri;
          await ShareHelper.shareFile({
            fileName: fileName,
            data: base64,
            mimeType: 'application/pdf',
            dialogTitle: t.shareTitle,
            text: t.shareText + teklifNo
          });
          App.showToast(t.toastShared, 'success');
        } catch (se) {
          console.error('Share error:', se);
          doc.save(fileName);
          App.showToast(t.toastSaved, 'success');
        }
      } else {
        doc.save(fileName);
        App.showToast(t.toastDownloaded, 'success');
      }

      // ========== SUPABASE UPLOAD (arka planda) ==========
      if (typeof ProposalStorage !== 'undefined') {
        try {
          var pdfDataUri = doc.output('datauristring');
          var commaPos = pdfDataUri.indexOf(',');
          var cleanBase64 = commaPos >= 0 ? pdfDataUri.substring(commaPos + 1) : pdfDataUri;
          ProposalStorage.uploadProposal({
            pdfBase64: cleanBase64,
            teklifNo: teklifNo,
            currency: currency,
            totalAmount: araToplam,
            itemCount: items.length,
            customerInfo: typeof getSetting === 'function' ? getSetting('customerInfo', {}) : {},
            pdfType: 'standard'
          }).then(function(r) {
            if (r.success) console.log('[PdfExport] Teklif Supabase\'e yuklendi');
            else console.warn('[PdfExport] Teklif yukleme hatasi:', r.error || r.warning);
          });
        } catch (uploadErr) {
          console.warn('[PdfExport] Supabase upload hatasi:', uploadErr);
        }
      }

    } catch (e) {
      console.error('PDF olu\u015Fturma hatas\u0131:', e);
      var _t = (typeof PdfI18n !== 'undefined') ? PdfI18n.get(options.lang || 'tr') : { toastError: 'PDF olu\u015Fturulurken hata olu\u015Ftu' };
      App.showToast(_t.toastError, 'error');
    }
  }

  return { exportDIA };
})();
