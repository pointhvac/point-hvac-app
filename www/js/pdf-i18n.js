/**
 * Point HVAC - PDF Internationalization (i18n)
 * Turkish / English translation dictionary for PDF exports.
 */
const PdfI18n = (() => {

  const TRANSLATIONS = {
    tr: {
      // --- Header & Meta ---
      companyName:   'POINT HAVALANDIRMA S\u0130STEMLER\u0130',
      banner:        'TEKL\u0130F',
      quoteNo:       'Teklif No:',
      date:          'Tarih:',
      currency:      'Para Birimi:',
      preparedBy:    'Haz\u0131rlayan:',

      // --- Customer Info ---
      company:       'Firma:',
      contactPerson: '\u0130lgili Ki\u015Fi:',
      project:       'Proje:',

      // --- Table Headers ---
      thModule:      'Mod\u00FCl',
      thCategory:    'Kategori',
      thModel:       'Model',
      thFlowRate:    'Debi\n(m\u00B3/h)',
      thPressure:    'Bas\u0131n\u00E7\n(Pa)',
      thNetPrice:    'Net Fiyat',
      thMotor:       'Motor\n(kW)',
      thVoltage:     'Voltaj',
      thImage:       'G\u00F6rsel',

      // --- Module Labels ---
      modulFan:      'Fan',
      modulSantral:  'Santral',
      modulHucreli:  'H\u00FCcreli',
      modulCihaz:    'Cihaz',
      modulAksa:     'AKSA',
      subOtomasyon:  'Otomasyon (MCC+DCC)',
      subG2:         'G2 Filtre',
      subG4:         'G4 Filtre',

      // --- Price Summary ---
      subtotal:          'ARA TOPLAM',
      domesticVat:       'YURT \u0130\u00C7\u0130 \u2013 KDV %20',
      grandTotalVatIncl: 'GENEL TOPLAM (KDV Dahil)',
      exportVat:         'YURT DI\u015EI \u2013 KDV %0 (\u0130hracat)',
      grandTotalVatExcl: 'GENEL TOPLAM (KDV Hari\u00E7)',

      // --- Notes ---
      notes: [
        'Fiyatlar KDV hari\u00E7tir.',
        'Bu teklif 30 g\u00FCn ge\u00E7erlidir.',
        'Yurt d\u0131\u015F\u0131 sat\u0131\u015Flarda KDV %0 uygulan\u0131r (ihracat faturas\u0131).'
      ],

      // --- Bank Info ---
      bankTitle:   'BANKA B\u0130LG\u0130LER\u0130',
      bankCol:     'Banka',
      currencyCol: 'D\u00F6viz',

      // --- Warranty ---
      warrantyTitle: 'Garanti \u015Eartlar\u0131',
      warranty: [
        'Cihazlar\u0131n sevk ve kon\u015Fimento tarihi esas olan teslim tarihinden itibaren 2 y\u0131l garantilidir.',
        'Voltaj farkl\u0131l\u0131klar\u0131ndan kaynaklanacak elektrik ar\u0131zalar\u0131 garanti d\u0131\u015F\u0131ndad\u0131r.',
        'Cihazlar\u0131m\u0131z\u0131 kullanaca\u011F\u0131n\u0131z mahaldeki voltaj\u0131n limitleri (3 FAZ 380/415V, 50HZ) haricinde olmas\u0131 durumunda voltaj reg\u00FClat\u00F6r\u00FC konulmas\u0131n\u0131 tavsiye ederiz.'
      ],

      // --- Contract Terms ---
      contractTitle: 'S\u00F6zle\u015Fme \u015Eartlar\u0131',
      contract: [
        'Bu teklif sadece malzeme bedelini kapsamaktad\u0131r. Sahadaki kabul i\u015Flemleri, testler, bak\u0131m faaliyetleri vb. hususlar teklif kapsam\u0131nda de\u011Fildir.',
        'Cihazlar\u0131n nakliyesi, nakliye sigortas\u0131 yerinde montaj i\u015Fleri ALICI\'ya aittir.',
        'Yatayda ve d\u00FC\u015Feyde ihtiya\u00E7 halinde kullan\u0131lacak vin\u00E7, forklift vb. ta\u015F\u0131ma ve kald\u0131rma ara\u00E7lar\u0131 ALICI taraf\u0131ndan temin edilecektir.',
        'Mod\u00FCler halde teslim edilecek klima santrallar\u0131n\u0131n mod\u00FCllerinin ba\u011Flanmas\u0131, yerine montaj\u0131 ve cihazlar i\u00E7in gerekli t\u00FCm elektrik ve mekanik ba\u011Flant\u0131lar\u0131n\u0131n yap\u0131lmas\u0131 (s\u0131cak/so\u011Fuk su, do\u011Falgaz, drenaj, iki/\u00FC\u00E7 yollu vana, motoru ve montaj\u0131 vb.) ALICI\'n\u0131n sorumlulu\u011Fundad\u0131r.',
        'Cihazlar i\u00E7in gereken elektrik beslemeleri (Voltaj, Frekans, Faz) teklif ekindeki ke\u015Fif \u00F6zetinde listelenen cihazlar\u0131n teknik bilgilerinde belirtilen de\u011Ferlere uygun olmal\u0131, cihaz topraklamalar\u0131 ilgili standartlara uygun olarak yap\u0131lmal\u0131d\u0131r.',
        'Uygun standartta kablolar (tip, kesit, \u00E7ap vb.) kullan\u0131larak, cihaz elektrik panosu, ba\u011Flant\u0131 kutusu ya da cihaza kadar kablolamalar\u0131 tamamlanmal\u0131d\u0131r.',
        'MCC (g\u00FC\u00E7) ve DDC (otomatik kontrol) panolar\u0131 ile BMS (Bina Y\u00F6netim Sistemi) tedarik, montaj ve entegrasyonlar\u0131 ALICI taraf\u0131ndan yap\u0131lacakt\u0131r.'
      ],

      // --- Final Note ---
      finalNote: 'L\u00FCtfen teklifteki \u00FCr\u00FCnlerin teknik \u00F6zelliklerini ve adetlerini kontrol ediniz. HYT Grup fiyatlar ve \u00FCr\u00FCnlerin fonksiyonlar\u0131 de\u011Fi\u015Fmemek \u00FCzere, \u00FCr\u00FCnler \u00FCzerinde teknik de\u011Fi\u015Fiklikler yapma ve/veya \u00FCr\u00FCn kodlar\u0131nda de\u011Fi\u015Fiklik yapma hakk\u0131m\u0131z\u0131 sakl\u0131 tutar. Boyutlar ve a\u011F\u0131rl\u0131klar de\u011Fi\u015Febilir.',
      finalNoteShort: 'L\u00FCtfen teklifteki \u00FCr\u00FCnlerin teknik \u00F6zelliklerini ve adetlerini kontrol ediniz. Fiyatlar ve \u00FCr\u00FCnlerin fonksiyonlar\u0131 de\u011Fi\u015Fmemek \u00FCzere, teknik de\u011Fi\u015Fiklik ve \u00FCr\u00FCn kodu de\u011Fi\u015Fikli\u011Fi hakk\u0131m\u0131z sakl\u0131d\u0131r.',

      // --- Important Warning (visual only) ---
      warningTitle: '\u00D6NEML\u0130 UYARI',
      warningBody: 'Bu dok\u00FCman resmi bir teklif niteli\u011Fi ta\u015F\u0131mamaktad\u0131r. Sipari\u015F \u00F6n tasar\u0131m ve fiyatland\u0131rma ama\u00E7l\u0131 haz\u0131rlanm\u0131\u015F olup, ba\u011Flay\u0131c\u0131 bir s\u00F6zle\u015Fme h\u00FCkm\u00FC yoktur. Belirtilen fiyatlar, teknik \u00F6zellikler ve teslimat ko\u015Fullar\u0131 bilgilendirme ama\u00E7l\u0131d\u0131r ve de\u011Fi\u015Fikli\u011Fe tabidir. Bu teklifin onayland\u0131\u011F\u0131 takdirde, kesinle\u015Fmi\u015F sipari\u015F i\u00E7in Point Havaland\u0131rma Sistemleri\'nden g\u00FCncel fiyat ve stok bilgilerini i\u00E7eren resmi teklifin talep edilmesi gerekmektedir. Resmi teklif, firma taraf\u0131ndan onaylanarak ka\u015Feli ve imzal\u0131 olarak sunulacakt\u0131r.',

      // --- Footer ---
      footerText: 'Point HVAC | HVAC Se\u00E7im ve Fiyatland\u0131rma',
      page:       'Sayfa',

      // --- Share/Dialog ---
      shareTitle: 'Teklifi Payla\u015F',
      shareText:  'Point HVAC - Teklif No: ',

      // --- Toast Messages ---
      toastEmpty:         'Liste bo\u015F, PDF olu\u015Fturulamaz',
      toastLibFail:       'PDF k\u00FCt\u00FCphanesi y\u00FCklenemedi',
      toastShared:        'PDF payla\u015F\u0131ld\u0131',
      toastSaved:         'PDF kaydedildi',
      toastDownloaded:    'PDF teklif indirildi',
      toastDownloadedVis: 'G\u00F6rselli PDF teklif indirildi',
      toastError:         'PDF olu\u015Fturulurken hata olu\u015Ftu'
    },

    en: {
      // --- Header & Meta ---
      companyName:   'POINT HVAC SYSTEMS',
      banner:        'QUOTATION',
      quoteNo:       'Quote No:',
      date:          'Date:',
      currency:      'Currency:',
      preparedBy:    'Prepared by:',

      // --- Customer Info ---
      company:       'Company:',
      contactPerson: 'Contact Person:',
      project:       'Project:',

      // --- Table Headers ---
      thModule:      'Module',
      thCategory:    'Category',
      thModel:       'Model',
      thFlowRate:    'Flow Rate\n(m\u00B3/h)',
      thPressure:    'Pressure\n(Pa)',
      thNetPrice:    'Net Price',
      thMotor:       'Motor\n(kW)',
      thVoltage:     'Voltage',
      thImage:       'Image',

      // --- Module Labels ---
      modulFan:      'Fan',
      modulSantral:  'AHU',
      modulHucreli:  'Plenum Fan',
      modulCihaz:    'Equipment',
      modulAksa:     'AKSA',
      subOtomasyon:  'Automation (MCC+DCC)',
      subG2:         'G2 Filter',
      subG4:         'G4 Filter',

      // --- Price Summary ---
      subtotal:          'SUBTOTAL',
      domesticVat:       'DOMESTIC \u2013 VAT 20%',
      grandTotalVatIncl: 'GRAND TOTAL (VAT Included)',
      exportVat:         'EXPORT \u2013 VAT 0% (Export)',
      grandTotalVatExcl: 'GRAND TOTAL (VAT Excluded)',

      // --- Notes ---
      notes: [
        'Prices are exclusive of VAT.',
        'This quotation is valid for 30 days.',
        'VAT 0% applies for international sales (export invoice).'
      ],

      // --- Bank Info ---
      bankTitle:   'BANK DETAILS',
      bankCol:     'Bank',
      currencyCol: 'Currency',

      // --- Warranty ---
      warrantyTitle: 'Warranty Terms',
      warranty: [
        'Equipment is warranted for 2 years from the delivery date based on the shipping and bill of lading date.',
        'Electrical faults caused by voltage fluctuations are not covered under warranty.',
        'If the voltage at your installation site exceeds the limits (3 Phase 380/415V, 50Hz), we recommend installing a voltage regulator.'
      ],

      // --- Contract Terms ---
      contractTitle: 'Contract Terms',
      contract: [
        'This quotation covers material costs only. On-site acceptance procedures, tests, maintenance activities, etc. are not included in the scope.',
        'Transportation, transport insurance, and on-site installation of equipment are the responsibility of the BUYER.',
        'Cranes, forklifts, and other lifting/carrying equipment needed for horizontal and vertical movement shall be provided by the BUYER.',
        'Assembly of modular air handling unit sections, on-site installation, and all required electrical and mechanical connections (hot/cold water, natural gas, drainage, two/three-way valves, motors and installation, etc.) are the responsibility of the BUYER.',
        'Electrical power supplies (Voltage, Frequency, Phase) for the equipment must comply with the technical specifications listed in the quotation appendix, and equipment grounding must be performed in accordance with relevant standards.',
        'Cabling up to the equipment electrical panel, junction box, or equipment must be completed using cables of appropriate standards (type, cross-section, diameter, etc.).',
        'Supply, installation, and integration of MCC (power) and DDC (automatic control) panels with BMS (Building Management System) shall be performed by the BUYER.'
      ],

      // --- Final Note ---
      finalNote: 'Please verify the technical specifications and quantities of the products in this quotation. HYT Group reserves the right to make technical modifications and/or product code changes without altering prices and product functions. Dimensions and weights are subject to change.',
      finalNoteShort: 'Please verify the technical specifications and quantities of the products in this quotation. We reserve the right to make technical modifications and product code changes without altering prices and product functions.',

      // --- Important Warning (visual only) ---
      warningTitle: 'IMPORTANT NOTICE',
      warningBody: 'This document does not constitute an official quotation. It has been prepared for preliminary design and pricing purposes and does not have binding contractual effect. The prices, technical specifications, and delivery conditions stated herein are for informational purposes and are subject to change. If this quotation is approved, an official quotation containing current pricing and stock information must be requested from Point HVAC Systems for a confirmed order. The official quotation will be presented stamped and signed by the company.',

      // --- Footer ---
      footerText: 'Point HVAC | HVAC Selection and Pricing',
      page:       'Page',

      // --- Share/Dialog ---
      shareTitle: 'Share Quotation',
      shareText:  'Point HVAC - Quote No: ',

      // --- Toast Messages ---
      toastEmpty:         'List is empty, cannot generate PDF',
      toastLibFail:       'PDF library failed to load',
      toastShared:        'PDF shared',
      toastSaved:         'PDF saved',
      toastDownloaded:    'PDF quotation downloaded',
      toastDownloadedVis: 'Visual PDF quotation downloaded',
      toastError:         'Error occurred while generating PDF'
    }
  };

  // ===== KATEGORI CEVIRILERI =====
  var KATEGORI_LABELS_EN = {
    // --- Santral kategorileri ---
    '(50)IGK+ISI+DX':         'Heat Recovery AHU',
    '(50)IGK+ISI+DX+SUS':     'Heat Recovery AHU with Silencer',
    '(50)IGK+KH+ISI+DX':      'Mixed Air Heat Recovery AHU',
    '(50)TH+ISI':              'Fresh Air AHU (Water Coil)',
    '(50)TH+ISI+DX':           'Fresh Air AHU (Water+DX Coil)',
    '(50)TH+DX':               'Fresh Air AHU (DX Coil)',
    '(50)KH+ISI+DX':           'Mixed Air AHU',
    '(60)HKS IGK+ISI+DX':      'Hygienic AHU',
    '(50)TAMBUR+ISI+DX':       'Rotary Heat Recovery AHU',
    '(50)TAMBUR+ISI+DX+SUS':   'Rotary Heat Recovery AHU with Silencer',

    // --- Fan kategorileri ---
    'Kanal Tipi Yuvarlak Fanlar':       'Circular Duct Fans',
    'Kanal Tipi Dikd\u00F6rtgen Fanlar':    'Rectangular Duct Fans',
    'Harici Motorlu Dikd\u00F6rtgen Fan M': 'External Motor Rectangular Fan M',
    'Harici Motorlu Dikd\u00F6rtgen Fan T': 'External Motor Rectangular Fan T',
    'Harici Motorlu Ex-Proof Fanlar':   'External Motor Ex-Proof Fans',
    'Rad.Yat. \u00C7at\u0131 Tipi Fan':            'Radial Horiz. Roof Fan',
    'Rad.Yat. D\u0131\u015Ftan \u00C7at\u0131 Tipi Fan M':  'Radial Horiz. External Roof Fan M',
    'Rad.Yat. D\u0131\u015Ftan \u00C7at\u0131 Tipi Fan T':  'Radial Horiz. External Roof Fan T',
    'Rad. Ex. D\u0131\u015Ftan \u00C7at\u0131 Tipi Fan T':  'Radial Ex. External Roof Fan T',
    'Rad.Dik. \u00C7at\u0131 Tipi Fan':            'Radial Vert. Roof Fan',
    'Rad.Dik. D\u0131\u015Ftan \u00C7at\u0131 Tipi Fan M':  'Radial Vert. External Roof Fan M',
    'Rad.Dik. D\u0131\u015Ftan \u00C7at\u0131 Tipi Fan T':  'Radial Vert. External Roof Fan T',
    'Rad.Yat. \u00C7at\u0131 Tipi Fan EC':         'Radial Horiz. Roof Fan EC',
    'Rad.Dik. \u00C7at\u0131 Tipi Fan EC':         'Radial Vert. Roof Fan EC',
    'Kanal Tipi Dikd\u00F6rtgen EC Fanlar': 'Rectangular Duct EC Fans',
    'Aksiyel \u00C7at\u0131 Tipi Fan':             'Axial Roof Fan',
    'Bas\u0131n\u00E7land\u0131rma Fanlar\u0131 EX':        'Pressurization Fans EX',
    'Bas\u0131n\u00E7land\u0131rma Fanlar\u0131 EX \u00C7at\u0131':  'Pressurization Fans EX Roof',
    'Bas\u0131n\u00E7land\u0131rma Fanlar\u0131 EX H\u00FCcre': 'Pressurization Fans EX Plenum',
    'Duvar Tipi Aksiyal Fan':           'Wall Mount Axial Fan',
    'Duvar Tipi Aksiyel Fan EX':        'Wall Mount Axial Fan EX',
    'Bas\u0131n\u00E7land\u0131rma Fanlar\u0131':           'Pressurization Fans',
    'Bas\u0131n\u00E7land\u0131rma Fanlar\u0131 \u00C7at\u0131 Tip': 'Pressurization Fans Roof Type',
    'Bas\u0131n\u00E7land\u0131rma Fanlar\u0131 H\u00FCcreli':  'Pressurization Fans Plenum',
    'Duman Tahliye Fanlar\u0131':           'Smoke Exhaust Fans',
    'Duman Tahliye Fanlar\u0131 \u00C7at\u0131 Tip':  'Smoke Exhaust Fans Roof Type',
    'Duman Tahliye Fanlar\u0131 H\u00FCcreli':  'Smoke Exhaust Fans Plenum',
    'Duman Tahliye Fanlar\u0131 F400':      'Smoke Exhaust Fans F400',
    'Duman Tahliye Fanlar\u0131 \u00C7at\u0131 F400': 'Smoke Exhaust Fans Roof F400',
    'Duman Tahliye Fanlar\u0131 H\u00FCcreF400': 'Smoke Exhaust Fans Plenum F400',

    // --- Hucreli kategorileri ---
    'PLUG FANLI H\u00DCCRELI':  'Plug Fan Plenum Unit',
    'SEYREK KANAT H\u00DCCRELI': 'Wide Blade Plenum Unit',
    'SIK KANAT H\u00DCCRELI':    'Narrow Blade Plenum Unit',

    // --- Cihaz kategorileri ---
    'Aksiyel Jet Fan':              'Axial Jet Fan',
    'Cift Cidarli':                 'Double Wall',
    'ECO':                          'ECO',
    'ECO EC':                       'ECO EC',
    'Hucreli Tip Paket Siginak':    'Plenum Type Package Shelter',
    'IP IGK':                       'IP HRU',
    'Isitici':                      'Heater',
    'Kanal Tipi Paket Siginak':     'Duct Type Package Shelter',
    'Kanal Tipi Paket Siginak W':   'Duct Type Package Shelter W',
    'Radyal Jet Fan':               'Radial Jet Fan',

    // --- AKSA kategorileri ---
    '688 Motor-Pervane':            '688 Motor-Impeller',
    'Dekoratif Aspirat\u00F6rler':      'Decorative Exhaust Fans',
    'Dikd\u00F6rtgen Kanal Fanlar\u0131':     'Rectangular Duct Fans',
    'EC Fanlar':                    'EC Fans',
    'End\u00FCstriyel Fanlar':          'Industrial Fans',
    'End\u00FCstriyel Radyal':          'Industrial Radial',
    'So\u011Futma-Motor-Pervane':       'Cooling Motor-Impeller',
    'Tanjansiyel Radyal':           'Tangential Radial'
  };

  /**
   * Kategori adini dile gore formatla.
   * EN: once KATEGORI_LABELS_EN'e bak, yoksa orijinal formatKategori kullan.
   * TR: mevcut formatKategori fonksiyonunu kullan.
   */
  function formatKategoriI18n(key, lang) {
    if (!key) return '-';
    if (lang === 'en' && KATEGORI_LABELS_EN[key]) {
      return KATEGORI_LABELS_EN[key];
    }
    // TR veya eslesmeyenler icin mevcut formatKategori kullan
    if (typeof formatKategori === 'function') {
      return formatKategori(key);
    }
    return key;
  }

  function get(lang) {
    return TRANSLATIONS[lang] || TRANSLATIONS.tr;
  }

  function getModulLabels(lang) {
    var t = get(lang);
    return {
      fan:     t.modulFan,
      santral: t.modulSantral,
      hucreli: t.modulHucreli,
      cihaz:   t.modulCihaz,
      aksa:    t.modulAksa
    };
  }

  function formatDate(d, lang) {
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    if (lang === 'en') return mm + '/' + dd + '/' + yyyy;
    return dd + '.' + mm + '.' + yyyy;
  }

  function formatNumber(val, lang, decimals) {
    if (val == null) return '-';
    var locale = (lang === 'en') ? 'en-US' : 'tr-TR';
    return val.toLocaleString(locale, {
      minimumFractionDigits: decimals || 0,
      maximumFractionDigits: decimals || 0
    });
  }

  function formatPrice(val, lang, currencyCode) {
    if (val == null || val === 0) return '-';
    var locale = (lang === 'en') ? 'en-US' : 'tr-TR';
    return val.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ' + (currencyCode || 'EUR');
  }

  return {
    get: get,
    getModulLabels: getModulLabels,
    formatKategori: formatKategoriI18n,
    formatDate: formatDate,
    formatNumber: formatNumber,
    formatPrice: formatPrice
  };
})();
