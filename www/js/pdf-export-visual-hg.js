/**
 * Havalandırma Grup - PDF Teklif Export (Görselli)
 * Point HVAC şablonu baz alınarak HG firması için uyarlanmıştır.
 */
const PdfExportVisualHG = (() => {

  // ===== RENK PALETİ (HG Kurumsal) =====
  const PRIMARY    = [25, 17, 118];    // #191176 - Koyu Lacivert
  const ACCENT     = [250, 179, 14];   // #fab30e - Altın Sarısı
  const DARK_GRAY  = [61, 61, 61];
  const MID_GRAY   = [107, 107, 107];
  const LIGHT_GRAY = [245, 245, 245];
  const WHITE      = [255, 255, 255];
  const BORDER     = [220, 220, 220];

  // ===== FİRMA BİLGİLERİ =====
  const COMPANY = {
    name: 'HAVALANDIRMA GRUP İNŞAAT MAKİNA TESİSAT İMALAT SAN. VE TİC. LTD. ŞTİ.',
    shortName: 'HAVALANDIRMA GRUP',
    address1: '88 Oto 2. Bölge, Havalandırmacılar Cad.',
    address2: '2275. Sokak No:1  06378 Yenimahalle / ANKARA',
    phone: '+90 (312) 395 59 80',
    fax: '+90 (312) 395 59 84',
    email: 'muhasebe@havalandirmagrup.com',
    web: 'www.havalandirmagrup.com.tr',
    vergiDairesi: 'İVEDİK VERGİ DAİRESİ MÜDÜRLÜĞÜ',
    vergiNo: '4590302801',
    mersisNo: '0459-0302-8010-0013',
    ticaretSicilNo: '285359',
    logo: '../assets/logos/hg.png',
    quotePrefix: 'HG'
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

  async function _loadCompressedImage(url, maxPx) {
    maxPx = maxPx || 200;
    try {
      var dataUrl = await _loadImageDataURL(url);
      if (!dataUrl) return null;
      return await new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
          var w = img.width, h = img.height;
          var scale = Math.min(maxPx / w, maxPx / h, 1);
          var nw = Math.round(w * scale);
          var nh = Math.round(h * scale);
          var canvas = document.createElement('canvas');
          canvas.width = nw;
          canvas.height = nh;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, nw, nh);
          ctx.drawImage(img, 0, 0, nw, nh);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = function() { resolve(null); };
        img.src = dataUrl;
      });
    } catch (_) { return null; }
  }

  function _sheetToFilename(sheetName) {
    const trMap = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u',
                    'Ç':'C','Ğ':'G','İ':'I','Ö':'O','Ş':'S','Ü':'U',' ':'_' };
    let name = sheetName.trim().split('').map(c => trMap[c] !== undefined ? trMap[c] : c).join('').toLowerCase();
    name = name.split('').filter(c => /[a-z0-9_]/.test(c)).join('');
    while (name.indexOf('__') !== -1) name = name.replace(/__/g, '_');
    return name.replace(/^_+|_+$/g, '');
  }

  function _getImageUrl(item) {
    var folders = { fan: 'fans', santral: 'santral', hucreli: 'hucreli', cihaz: 'cihaz' };
    var folder = folders[item.modul];
    if (!folder || !item.kategori) return null;
    return '../assets/' + folder + '/' + _sheetToFilename(item.kategori) + '.png';
  }

  // ===== ANA FONKSİYON =====
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

      const doc    = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW  = doc.internal.pageSize.getWidth();
      const pageH  = doc.internal.pageSize.getHeight();
      const ML = 15, MR = 15, MT = 12, MB = 12;
      const contentW = pageW - ML - MR;

      const fontName = await _registerFont(doc);

      // Teklif numarası - HG prefix ile
      var teklifNo;
      if (typeof QuoteNumberService !== 'undefined') {
        var quoteResult = await QuoteNumberService.getNextNumber('hg');
        teklifNo = quoteResult.teklifNo;
      } else {
        var _d = new Date();
        teklifNo = COMPANY.quotePrefix + '-' + _d.getFullYear() + '-' + String(_d.getDate()).padStart(2,'0') + String(_d.getMonth()+1).padStart(2,'0') + '-' + String(_d.getHours()).padStart(2,'0') + String(_d.getMinutes()).padStart(2,'0');
      }
      const now = new Date();

      // ========== HEADER ==========
      const logoData = await _loadImageDataURL(COMPANY.logo);
      const logoW = 42, logoH = 18;
      const topY  = MT;

      function drawHeader() {
        // Logo (sol)
        if (logoData) {
          try { doc.addImage(logoData, 'PNG', ML, topY, logoW, logoH); } catch (_) {}
        }

        // Firma bilgileri (sağ)
        doc.setFont(fontName, 'bold');
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, PRIMARY);
        doc.text(COMPANY.shortName, pageW - MR, topY + 4, { align: 'right' });

        doc.setFont(fontName, 'normal');
        doc.setFontSize(8);
        doc.setTextColor.apply(doc, MID_GRAY);
        doc.text(COMPANY.address1,        pageW - MR, topY + 9,  { align: 'right' });
        doc.text(COMPANY.address2,        pageW - MR, topY + 13, { align: 'right' });
        doc.text('Tel: ' + COMPANY.phone + ' | Fax: ' + COMPANY.fax, pageW - MR, topY + 17, { align: 'right' });
        doc.text(COMPANY.email,           pageW - MR, topY + 21, { align: 'right' });

        doc.setTextColor.apply(doc, ACCENT);
        doc.setFont(fontName, 'bold');
        doc.text(COMPANY.web, pageW - MR, topY + 25, { align: 'right' });

        // Ayırıcı çizgi - Accent renk (altın sarısı)
        const hLineY = topY + logoH + 10;
        doc.setDrawColor.apply(doc, ACCENT);
        doc.setLineWidth(1.0);
        doc.line(ML, hLineY, pageW - MR, hLineY);
        return hLineY;
      }

      const hLineY = drawHeader();

      // ========== TEKLİF BANNER ==========
      let y = hLineY + 4;
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 9, 'F');
      // Accent şerit (banner üstü)
      doc.setFillColor.apply(doc, ACCENT);
      doc.rect(ML, y, contentW, 1.5, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(12);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.banner, ML + 3, y + 6.5);
      y += 9;

      // Meta (4 alan, 2 satır)
      y += 6;
      const col1X = ML + 2;
      const col2X = ML + contentW / 2;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, DARK_GRAY);
      doc.text(t.quoteNo,   col1X, y);
      doc.text(t.date,      col2X, y);
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

      // ========== MÜŞTERİ BİLGİLERİ ==========
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
          doc.text(t.company, col1X, y);
          doc.setFont(fontName, 'bold');
          doc.text(ci.firma, col1X + 20, y);
          doc.setFont(fontName, 'normal');
          y += 5;
        }
        if (ci.kisi) {
          doc.text(t.contactPerson, col1X, y);
          doc.setFont(fontName, 'bold');
          doc.text(ci.kisi, col1X + 22, y);
          doc.setFont(fontName, 'normal');
          y += 5;
        }
        if (ci.proje) {
          doc.text(t.project, col1X, y);
          doc.setFont(fontName, 'bold');
          doc.text(ci.proje, col1X + 20, y);
          doc.setFont(fontName, 'normal');
          y += 5;
        }
        y += 2;
      }

      // ========== YARDIMCI FONKSİYONLAR ==========
      function fmtPrice(val) {
        if (val == null || val === 0) return '-';
        let conv = val;
        if (currency !== 'EUR' && typeof CurrencyManager !== 'undefined') {
          conv = CurrencyManager.convert(val, currency);
        }
        return PdfI18n.formatPrice(conv, lang, currency);
      }
      function fmtNum(val) {
        return PdfI18n.formatNumber(val, lang);
      }
      const fmtKat = (k) => PdfI18n.formatKategori(k, lang);

      // ========== FİYAT ÖZETİ ==========
      const araToplam = items.reduce((s, i) => {
        let t = s + (i.netFiyat || i.fiyat || 0);
        if (i.modul === 'santral' && i.otomasyonTotal) t += i.otomasyonTotal;
        if (i.modul === 'hucreli') { t += (i.g2NetFiyat || 0) + (i.g4NetFiyat || 0); }
        return t;
      }, 0);
      const kdvIc          = araToplam * 0.20;
      const genelToplamIc  = araToplam + kdvIc;
      const genelToplamDis = araToplam;

      const sumW = contentW * 0.62;
      const sumX = pageW - MR - sumW;
      const rowH = 7;

      function drawSumRow(label, value, opts) {
        opts = opts || {};
        var rh = opts.height || rowH;
        var fs = opts.fontSize || 9;
        if (opts.bg) {
          doc.setFillColor.apply(doc, opts.bg);
          doc.rect(sumX, y, sumW, rh, 'F');
        } else if (opts.bgLight) {
          doc.setFillColor.apply(doc, opts.bgLight);
          doc.rect(sumX, y, sumW, rh, 'F');
        }
        doc.setFont(fontName, opts.bold ? 'bold' : 'normal');
        doc.setFontSize(fs);
        doc.setTextColor.apply(doc, opts.color || DARK_GRAY);
        doc.text(label, sumX + 4, y + rh * 0.65);
        doc.text(value, sumX + sumW - 4, y + rh * 0.65, { align: 'right' });
        y += rh;
      }

      drawSumRow(t.subtotal, fmtPrice(araToplam), { bold: true, bgLight: LIGHT_GRAY });
      drawSumRow(t.domesticVat, fmtPrice(kdvIc), { color: ACCENT });
      drawSumRow(t.grandTotalVatIncl, fmtPrice(genelToplamIc), { bg: PRIMARY, color: WHITE, bold: true, height: 9, fontSize: 11 });
      y += 2;
      drawSumRow(t.exportVat, fmtPrice(0), { color: PRIMARY });
      drawSumRow(t.grandTotalVatExcl, fmtPrice(genelToplamDis), { bg: ACCENT, color: PRIMARY, bold: true, height: 9, fontSize: 11 });

      y += 6;

      // ========== NOTLAR ==========
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor.apply(doc, DARK_GRAY);
      var notes = t.notes.map(function(n) { return '\u2022 ' + n; });
      for (var n of notes) { doc.text(n, ML, y); y += 4; }
      y += 4;

      // ========== BANKA BİLGİLERİ ==========
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 7, 'F');
      // Accent şerit (banka başlık üstü)
      doc.setFillColor.apply(doc, ACCENT);
      doc.rect(ML, y, contentW, 1.2, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.bankTitle, ML + 3, y + 5.2);
      y += 7;

      doc.autoTable({
        startY: y,
        head: [[t.bankCol, t.currencyCol, 'IBAN']],
        body: [
          // Banka bilgileri daha sonra güncellenecek
          ['- ', 'TRY (TL)', 'Bilgi eklenecek'],
          ['- ', 'USD ($)',  'Bilgi eklenecek'],
          ['- ', 'EUR (€)',  'Bilgi eklenecek']
        ],
        margin: { left: ML, right: MR },
        styles: {
          font: fontName, fontSize: 8, cellPadding: 2.2,
          lineColor: BORDER, lineWidth: 0.1,
          textColor: DARK_GRAY, valign: 'middle'
        },
        headStyles: {
          fillColor: LIGHT_GRAY, textColor: DARK_GRAY,
          fontStyle: 'bold', halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 28 },
          2: { cellWidth: contentW - 78, fontStyle: 'bold', textColor: PRIMARY }
        }
      });

      // ========== GARANTİ ŞARTLARI ==========
      y = doc.lastAutoTable.finalY + 3;

      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 6.5, 'F');
      doc.setFillColor.apply(doc, ACCENT);
      doc.rect(ML, y, contentW, 1.2, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.warrantyTitle, ML + contentW / 2, y + 4.8, { align: 'center' });
      y += 9;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor.apply(doc, DARK_GRAY);

      t.warranty.forEach(function(item) {
        var lines = doc.splitTextToSize('\u2022  ' + item, contentW - 4);
        doc.text(lines, ML + 2, y);
        y += lines.length * 3;
      });

      y += 4;

      // ========== SÖZLEŞME ŞARTLARI ==========
      doc.setFillColor.apply(doc, PRIMARY);
      doc.rect(ML, y, contentW, 6.5, 'F');
      doc.setFillColor.apply(doc, ACCENT);
      doc.rect(ML, y, contentW, 1.2, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, WHITE);
      doc.text(t.contractTitle, ML + contentW / 2, y + 4.8, { align: 'center' });
      y += 9;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor.apply(doc, DARK_GRAY);

      t.contract.forEach(function(item, idx) {
        var prefix = (idx + 1) + ')  ';
        var lines = doc.splitTextToSize(prefix + item, contentW - 4);
        doc.text(lines, ML + 2, y);
        y += lines.length * 3 + 0.5;
      });

      y += 2;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(6);
      doc.setTextColor.apply(doc, MID_GRAY);
      var sonNotLines = doc.splitTextToSize(t.finalNoteShort, contentW - 4);
      doc.text(sonNotLines, ML + 2, y);
      y += sonNotLines.length * 2.8 + 3;

      // ========== ÖNEMLİ UYARI NOTU ==========
      var uyariBoxH = 22;
      doc.setDrawColor.apply(doc, PRIMARY);
      doc.setLineWidth(0.4);
      doc.rect(ML, y, contentW, uyariBoxH, 'S');
      // Accent üst çizgi
      doc.setDrawColor.apply(doc, ACCENT);
      doc.setLineWidth(1.0);
      doc.line(ML, y, pageW - MR, y);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, PRIMARY);
      doc.text(t.warningTitle, ML + contentW / 2, y + 4.5, { align: 'center' });

      var uyariY = y + 7.5;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(6);
      doc.setTextColor.apply(doc, DARK_GRAY);
      var uyariLines = doc.splitTextToSize(t.warningBody, contentW - 8);
      doc.text(uyariLines, ML + 4, uyariY);

      // ========== SAYFA: ÜRÜN TABLOSU (GÖRSELLİ) ==========
      doc.addPage();
      y = MT + 4;

      // Görselleri önceden yükle
      const imageCache = {};
      for (const it of items) {
        const imgUrl = _getImageUrl(it);
        if (imgUrl && !imageCache[imgUrl]) {
          imageCache[imgUrl] = await _loadCompressedImage(imgUrl, 400);
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
            rowNum++, MODUL_LABELS.santral, fmtKat(it.kategori), t.subOtomasyon,
            '-', '-', fmtPrice(it.otomasyonTotal), '-', '-', ''
          ]);
          rowImages.push(null);
        }
        if (it.modul === 'hucreli' && it.g2 && it.g2NetFiyat) {
          rows.push([
            rowNum++, MODUL_LABELS.hucreli, fmtKat(it.kategori), t.subG2,
            '-', '-', fmtPrice(it.g2NetFiyat), '-', '-', ''
          ]);
          rowImages.push(null);
        }
        if (it.modul === 'hucreli' && it.g4 && it.g4NetFiyat) {
          rows.push([
            rowNum++, MODUL_LABELS.hucreli, fmtKat(it.kategori), t.subG4,
            '-', '-', fmtPrice(it.g4NetFiyat), '-', '-', ''
          ]);
          rowImages.push(null);
        }
      });

      doc.autoTable({
        startY: y,
        head: [['#', t.thModule, t.thCategory, t.thModel, t.thFlowRate, t.thPressure, t.thNetPrice, t.thMotor, t.thVoltage, t.thImage]],
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
          fontSize: 7, halign: 'center', valign: 'middle',
          cellPadding: 1.8
        },
        alternateRowStyles: { fillColor: LIGHT_GRAY },
        columnStyles: {
          0: { cellWidth:  7, halign: 'center' },
          1: { cellWidth: 14, halign: 'center' },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 16, halign: 'right' },
          5: { cellWidth: 16, halign: 'right' },
          6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
          7: { cellWidth: 15, halign: 'center' },
          8: { cellWidth: 15, halign: 'center' },
          9: { cellWidth: 25, halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && rowImages[data.row.index]) {
            data.cell.styles.minCellHeight = 22;
          }
          if (data.column.index === 9 && data.section === 'body') {
            data.cell.styles.fillColor = [255, 255, 255];
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
              var imgX = data.cell.x + (data.cell.width - sz) / 2;
              var imgY = data.cell.y + (data.cell.height - sz) / 2;
              try {
                doc.addImage(img, 'JPEG', imgX, imgY, sz, sz);
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
        // Accent renk footer çizgisi
        doc.setDrawColor.apply(doc, ACCENT);
        doc.setLineWidth(0.5);
        doc.line(ML, fY - 4, pageW - MR, fY - 4);
        doc.setFont(fontName, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor.apply(doc, MID_GRAY);
        doc.text(COMPANY.name, ML, fY);
        doc.setTextColor.apply(doc, PRIMARY);
        doc.setFont(fontName, 'bold');
        doc.text(t.page + ' ' + p + ' / ' + totalPages, pageW - MR, fY, { align: 'right' });
      }

      // ========== KAYDET / PAYLAŞ ==========
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
        App.showToast(t.toastDownloadedVis, 'success');
      }

      // ========== SUPABASE UPLOAD ==========
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
            pdfType: 'visual-hg'
          }).then(function(r) {
            if (r.success) console.log('[PdfExportVisualHG] Teklif Supabase\'e yüklendi');
            else console.warn('[PdfExportVisualHG] Teklif yükleme hatası:', r.error || r.warning);
          });
        } catch (uploadErr) {
          console.warn('[PdfExportVisualHG] Supabase upload hatası:', uploadErr);
        }
      }

    } catch (e) {
      console.error('PDF oluşturma hatası:', e);
      var _t = (typeof PdfI18n !== 'undefined') ? PdfI18n.get(options.lang || 'tr') : { toastError: 'PDF oluşturulurken hata oluştu' };
      App.showToast(_t.toastError, 'error');
    }
  }

  return { exportDIA };
})();
