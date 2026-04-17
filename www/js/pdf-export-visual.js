/**
 * Point HVAC - PDF Teklif Export (Gorselli)
 * pdf-export.js ile ayni teklif + urun gorsel sayfalari.
 */
const PdfExportVisual = (() => {

  // ===== RENK PALETİ =====
  const PRIMARY    = [200, 0, 42];
  const DARK_GRAY  = [61, 61, 61];
  const MID_GRAY   = [107, 107, 107];
  const LIGHT_GRAY = [245, 245, 245];
  const BLUE       = [128, 0, 32];
  const WHITE      = [255, 255, 255];
  const BORDER     = [220, 220, 220];

  const MODUL_LABELS = {
    fan: 'Fan', santral: 'Santral', hucreli: 'Hucreli',
    cihaz: 'Cihaz', aksa: 'AKSA'
  };

  // ===== YARDIMCI =====
  function _checkLibs() {
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
      throw new Error('jsPDF yuklu degil');
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
      } catch (_) {}
    }
    doc.setFont('helvetica', 'normal');
    return 'helvetica';
  }

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

  /** Kategori/sheet adi -> gorsel dosya adi. */
  function _sheetToFilename(sheetName) {
    const trMap = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u',
                    'Ç':'C','Ğ':'G','İ':'I','Ö':'O','Ş':'S','Ü':'U',' ':'_' };
    let name = sheetName.trim().split('').map(c => trMap[c] !== undefined ? trMap[c] : c).join('').toLowerCase();
    name = name.split('').filter(c => /[a-z0-9_]/.test(c)).join('');
    while (name.indexOf('__') !== -1) name = name.replace(/__/g, '_');
    return name.replace(/^_+|_+$/g, '');
  }

  /** Modul ve kategori icin gorsel URL'i dondur. */
  function _getImageUrl(item) {
    var folders = { fan: 'fans', santral: 'santral', hucreli: 'hucreli', cihaz: 'cihaz' };
    var folder = folders[item.modul];
    if (!folder || !item.kategori) return null;
    return '../assets/' + folder + '/' + _sheetToFilename(item.kategori) + '.png';
  }

  // ===== ANA FONKSİYON =====
  async function exportDIA(items, options) {
    options = options || {};
    if (!items || !items.length) {
      App.showToast('Liste bos, PDF olusturulamaz', 'error');
      return;
    }
    try { _checkLibs(); }
    catch (e) { App.showToast('PDF kutuphanesi yuklenemedi', 'error'); return; }

    try {
      const currency = options.currency
        || (typeof CurrencyManager !== 'undefined' ? CurrencyManager.getActiveCurrency() : 'EUR');

      const doc    = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW  = doc.internal.pageSize.getWidth();
      const pageH  = doc.internal.pageSize.getHeight();
      const ML = 15, MR = 15, MT = 12, MB = 12;
      const contentW = pageW - ML - MR;

      const fontName = await _registerFont(doc);
      const teklifNo = _generateTeklifNo();
      const now      = new Date();

      // ========== HEADER ==========
      const logoData = await _loadImageDataURL('../assets/logos/logo_siyah.png');
      const logoW = 52, logoH = 18;
      const topY  = MT;

      function drawHeader() {
        if (logoData) {
          try { doc.addImage(logoData, 'PNG', ML, topY, logoW, logoH); } catch (_) {}
        }
        doc.setFont(fontName, 'bold');
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, DARK_GRAY);
        doc.text('POINT HAVALANDIRMA SiSTEMLERi', pageW - MR, topY + 4, { align: 'right' });
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, MID_GRAY);
        doc.text('Dagyaka Mah. 2022. Cad. No:18/1',        pageW - MR, topY + 9,  { align: 'right' });
        doc.text('KahramanKazan / ANKARA',                 pageW - MR, topY + 13, { align: 'right' });
        doc.text('+90 (312) 394 57 69 | info@pointhvac.com', pageW - MR, topY + 17, { align: 'right' });
        doc.setTextColor.apply(doc, PRIMARY);
        doc.text('www.pointhvac.com', pageW - MR, topY + 21, { align: 'right' });
        const hLineY = topY + logoH + 6;
        doc.setDrawColor.apply(doc, PRIMARY);
        doc.setLineWidth(0.7);
        doc.line(ML, hLineY, pageW - MR, hLineY);
        return hLineY;
      }

      const hLineY = drawHeader();

      // ========== TEKLiF BANNER ==========
      let y = hLineY + 4;
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7.5, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, WHITE);
      doc.text('TEKLiF', ML + 3, y + 5.2);
      y += 7.5;

      // Meta (4 alan, 2 satir)
      y += 6;
      const col1X = ML + 2;
      const col2X = ML + contentW / 2;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, DARK_GRAY);
      doc.text('Teklif No:',   col1X, y);
      doc.text('Tarih:',       col2X, y);
      doc.setFont(fontName, 'bold');
      doc.text(teklifNo,       col1X + 20, y);
      doc.text(_fmtDateTR(now), col2X + 13, y);
      y += 5;
      doc.setFont(fontName, 'normal');
      doc.text('Para Birimi:', col1X, y);
      doc.text('Hazirlayan:',  col2X, y);
      doc.setFont(fontName, 'bold');
      doc.text(currency,       col1X + 22, y);
      var _preparedBy = (typeof getSetting === 'function' && getSetting('current_user', null) && getSetting('current_user', null).fullName) || '';
      doc.text(_preparedBy,    col2X + 21, y);
      y += 7;

      // ========== MUSTERI BILGILERI (SAYFA 1) ==========
      const ci = options.customerInfo || {};
      if (ci.firma || ci.kisi || ci.proje) {
        doc.setDrawColor.apply(doc, BORDER);
        doc.setLineWidth(0.3);
        doc.line(ML, y, pageW - MR, y);
        y += 5;
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, DARK_GRAY);
        if (ci.firma) {
          doc.text('Firma:', col1X, y);
          doc.setFont(fontName, 'bold');
          doc.text(ci.firma, col1X + 20, y);
          doc.setFont(fontName, 'normal');
          y += 5;
        }
        if (ci.kisi) {
          doc.text('Ilgili Kisi:', col1X, y);
          doc.setFont(fontName, 'bold');
          doc.text(ci.kisi, col1X + 20, y);
          doc.setFont(fontName, 'normal');
          y += 5;
        }
        if (ci.proje) {
          doc.text('Proje:', col1X, y);
          doc.setFont(fontName, 'bold');
          doc.text(ci.proje, col1X + 20, y);
          doc.setFont(fontName, 'normal');
          y += 5;
        }
        y += 2;
      }

      // ========== YARDIMCI FONKSIYONLAR ==========
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
      const fmtKat = (k) => formatKategori(k);

      // ========== FiYAT OZETi (SAYFA 1) ==========
      const araToplam = items.reduce((s, i) => {
        let t = s + (i.netFiyat || i.fiyat || 0);
        if (i.modul === 'santral' && i.otomasyonTotal) t += i.otomasyonTotal;
        if (i.modul === 'hucreli') { t += (i.g2NetFiyat || 0) + (i.g4NetFiyat || 0); }
        return t;
      }, 0);
      const kdvIc          = araToplam * 0.20;
      const genelToplamIc  = araToplam + kdvIc;
      const genelToplamDis = araToplam;

      const sumW = contentW * 0.55;
      const sumX = pageW - MR - sumW;
      const rowH = 6.5;

      function drawSumRow(label, value, opts) {
        opts = opts || {};
        if (opts.bg) {
          doc.setFillColor.apply(doc, opts.bg);
          doc.rect(sumX, y, sumW, rowH, 'F');
        }
        doc.setFont(fontName, opts.bold ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, opts.color || DARK_GRAY);
        doc.text(label, sumX + 3, y + 4.5);
        doc.text(value, sumX + sumW - 3, y + 4.5, { align: 'right' });
        y += rowH;
      }

      drawSumRow('ARA TOPLAM',                  fmtPrice(araToplam));
      drawSumRow('YURT ICI - KDV %20',          fmtPrice(kdvIc),         { color: PRIMARY });
      drawSumRow('GENEL TOPLAM (KDV Dahil)',    fmtPrice(genelToplamIc), { bg: PRIMARY, color: WHITE, bold: true });
      y += 2;
      drawSumRow('YURT DISI - KDV %0 (Ihracat)', fmtPrice(0),            { color: BLUE });
      drawSumRow('GENEL TOPLAM (KDV Haric)',    fmtPrice(genelToplamDis), { bg: BLUE, color: WHITE, bold: true });

      y += 6;

      // ========== NOTLAR (SAYFA 1) ==========
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, DARK_GRAY);
      var notes = [
        '* Fiyatlar KDV harictir.',
        '* Bu teklif 30 gun gecerlidir.',
        '* Yurt disi satislarda KDV %0 uygulanir (ihracat faturasi).'
      ];
      for (var n of notes) { doc.text(n, ML, y); y += 4.5; }
      y += 4;

      // ========== BANKA BILGILERi (SAYFA 1) ==========
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, WHITE);
      doc.text('BANKA BILGILERi', ML + 3, y + 4.9);
      y += 7;

      doc.autoTable({
        startY: y,
        head: [['Banka', 'Doviz', 'IBAN']],
        body: [
          ['HALKBANK / SARAY', 'TRY (TL)', 'TR98 0001 2001 4380 0010 1013 58'],
          ['HALKBANK / SARAY', 'USD ($)',  'TR27 0001 2001 4380 0053 1005 05'],
          ['HALKBANK / SARAY', 'EUR',      'TR83 0001 2001 4380 0058 1004 29']
        ],
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

      // ========== SAYFA 2+: URUN TABLOSU (GORSELLI) ==========
      doc.addPage();
      y = MT + 4;

      // Gorselleri onceden yukle
      const imageCache = {};
      for (const it of items) {
        const imgUrl = _getImageUrl(it);
        if (imgUrl && !imageCache[imgUrl]) {
          imageCache[imgUrl] = await _loadImageDataURL(imgUrl);
        }
      }

      const rows = [];
      const rowImages = [];
      let rowNum = 1;
      items.forEach((it) => {
        const imgUrl = _getImageUrl(it);
        rows.push([
          rowNum++,
          MODUL_LABELS[it.modul] || it.modul || '-',
          fmtKat(it.kategori),
          it.model || '-',
          it.debi   ? fmtNum(it.debi)   : '-',
          it.basinc ? fmtNum(it.basinc) : '-',
          fmtPrice(it.netFiyat || it.fiyat),
          it.motorGucu || it.gucW || '-',
          it.voltaj || '-',
          ''
        ]);
        rowImages.push(imgUrl ? (imageCache[imgUrl] || null) : null);

        if (it.modul === 'santral' && it.otomasyonTotal) {
          rows.push([
            rowNum++, 'Santral', fmtKat(it.kategori), 'Otomasyon (MCC+DCC)',
            '-', '-', fmtPrice(it.otomasyonTotal), '-', '-', ''
          ]);
          rowImages.push(null);
        }
        if (it.modul === 'hucreli' && it.g2 && it.g2NetFiyat) {
          rows.push([
            rowNum++, 'Hucreli', fmtKat(it.kategori), 'G2 Filtre',
            '-', '-', fmtPrice(it.g2NetFiyat), '-', '-', ''
          ]);
          rowImages.push(null);
        }
        if (it.modul === 'hucreli' && it.g4 && it.g4NetFiyat) {
          rows.push([
            rowNum++, 'Hucreli', fmtKat(it.kategori), 'G4 Filtre',
            '-', '-', fmtPrice(it.g4NetFiyat), '-', '-', ''
          ]);
          rowImages.push(null);
        }
      });

      doc.autoTable({
        startY: y,
        head: [['#', 'Modul', 'Kategori', 'Model', 'Debi\n(m3/h)', 'Basinc\n(Pa)', 'Net Fiyat', 'Motor\n(kW)', 'Voltaj', 'Gorsel']],
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
          0: { cellWidth:  7, halign: 'center' },
          1: { cellWidth: 14, halign: 'center' },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 16, halign: 'right' },
          5: { cellWidth: 16, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' },
          7: { cellWidth: 15, halign: 'center' },
          8: { cellWidth: 15, halign: 'center' },
          9: { cellWidth: 25, halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && rowImages[data.row.index]) {
            data.cell.styles.minCellHeight = 22;
          }
        },
        didDrawCell: function(data) {
          if (data.section === 'body' && data.column.index === 9) {
            var img = rowImages[data.row.index];
            if (img) {
              var pad = 1.5;
              var cw = data.cell.width - pad * 2;
              var ch = data.cell.height - pad * 2;
              var sz = Math.min(cw, ch);
              try {
                doc.addImage(img, 'PNG',
                  data.cell.x + (data.cell.width - sz) / 2,
                  data.cell.y + (data.cell.height - sz) / 2,
                  sz, sz);
              } catch(_) {}
            }
          }
        }
      });

      // ========== FOOTER (her sayfa) ==========
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const fY = pageH - MB + 2;
        doc.setDrawColor.apply(doc, PRIMARY);
        doc.setLineWidth(0.35);
        doc.line(ML, fY - 4, pageW - MR, fY - 4);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, MID_GRAY);
        doc.text('Point HVAC | HVAC Secim ve Fiyatlandirma', ML, fY);
        doc.text('Sayfa ' + p + ' / ' + totalPages, pageW - MR, fY, { align: 'right' });
      }

      // ========== KAYDET / PAYLAS ==========
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
            dialogTitle: 'Teklifi Paylas',
            text: 'Point HVAC - Teklif No: ' + teklifNo
          });
          App.showToast('PDF paylasildi', 'success');
        } catch (se) {
          console.error('Paylasim hatasi:', se);
          doc.save(fileName);
          App.showToast('PDF kaydedildi', 'success');
        }
      } else {
        doc.save(fileName);
        App.showToast('Gorselli PDF teklif indirildi', 'success');
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
            pdfType: 'visual'
          }).then(function(r) {
            if (r.success) console.log('[PdfExportVisual] Teklif Supabase\'e yuklendi');
            else console.warn('[PdfExportVisual] Teklif yukleme hatasi:', r.error || r.warning);
          });
        } catch (uploadErr) {
          console.warn('[PdfExportVisual] Supabase upload hatasi:', uploadErr);
        }
      }

    } catch (e) {
      console.error('PDF olusturma hatasi:', e);
      App.showToast('PDF olusturulurken hata olustu', 'error');
    }
  }

  return { exportDIA };
})();
