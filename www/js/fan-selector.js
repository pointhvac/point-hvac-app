/**
 * Point HVAC - Fan Secim Algoritmasi
 * Python FanSelector sinifinin JavaScript portu.
 */

const FanSelector = (() => {

  /**
   * Basinc degerleri arasinda hedef degere en yakin >= degeri bul.
   * Basinca yukariya yuvarla (ceil mantigi).
   */
  function findClosestPressure(target, pressureValues) {
    if (!pressureValues || !pressureValues.length) return null;
    // target'a esit veya buyuk olan en kucuk degeri bul
    const suitable = pressureValues.filter(v => v >= target);
    if (suitable.length > 0) return Math.min(...suitable);
    // Hicbiri yoksa en buyuk degeri don
    return Math.max(...pressureValues);
  }

  /**
   * Fan sheet verisinden debi matrisini olustur.
   * sheetData: { basinc_values: [...], models: [{ model, debi_values: [...] }] }
   * Donus: { basincValues, modelList, debiMatrix: Map("model|basinc" -> debi) }
   */
  function buildDebiMatrix(sheetData) {
    const basincValues = sheetData.basinc_values || [];
    const modelList = [];
    const debiMatrix = new Map();

    for (const item of (sheetData.models || [])) {
      const model = item.model;
      if (!model) continue;
      modelList.push(model);
      const debiVals = item.debi_values || [];
      for (let i = 0; i < basincValues.length; i++) {
        const debi = i < debiVals.length ? debiVals[i] : null;
        if (debi != null) {
          debiMatrix.set(model + '|' + basincValues[i], debi);
        }
      }
    }

    return { basincValues, modelList, debiMatrix };
  }

  /**
   * Fiyat ve filtre verilerini yukle.
   * priceData: sheet icerisindeki fiyat arrayi [{ model, fiyat, kontrol_ekipman, motor_gucu, voltaj, ses_seviyesi, devir }]
   * filters: { motorGucuMin, motorGucuMax, voltaj, sesSeviyesiMin, sesSeviyesiMax, devirMin, devirMax }
   * Donus: { priceDict, motorDict, kontrolDict, voltajDict, sesDict, devirDict, filteredModels }
   */
  function loadPrices(priceData, filters) {
    const priceDict = new Map();
    const motorDict = new Map();
    const kontrolDict = new Map();
    const voltajDict = new Map();
    const sesDict = new Map();
    const devirDict = new Map();
    const filteredModels = new Set();

    if (!priceData) return { priceDict, motorDict, kontrolDict, voltajDict, sesDict, devirDict, filteredModels };

    for (const item of priceData) {
      const model = (item.model || '').trim();
      if (!model) continue;

      const fiyat = item.fiyat;
      const motorGucu = item.motor_gucu;
      const kontrolEkipman = item.kontrol_ekipman || '';
      const voltaj = item.voltaj || '';
      const sesSeviyesi = item.ses_seviyesi;
      const devir = item.devir;

      priceDict.set(model, fiyat || 0);
      if (motorGucu != null) motorDict.set(model, motorGucu);
      if (kontrolEkipman) kontrolDict.set(model, kontrolEkipman);
      if (voltaj) voltajDict.set(model, voltaj);
      if (sesSeviyesi != null) sesDict.set(model, sesSeviyesi);
      if (devir != null) devirDict.set(model, devir);

      // Gelismis filtre uygula
      let passes = true;
      if (filters) {
        if (filters.motorGucuMin != null && (motorGucu == null || motorGucu < filters.motorGucuMin)) passes = false;
        if (filters.motorGucuMax != null && (motorGucu == null || motorGucu > filters.motorGucuMax)) passes = false;
        if (filters.voltaj && voltaj && String(filters.voltaj) !== String(voltaj)) passes = false;
        if (filters.sesSeviyesiMin != null && (sesSeviyesi == null || sesSeviyesi < filters.sesSeviyesiMin)) passes = false;
        if (filters.sesSeviyesiMax != null && (sesSeviyesi == null || sesSeviyesi > filters.sesSeviyesiMax)) passes = false;
        if (filters.devirMin != null && (devir == null || devir < filters.devirMin)) passes = false;
        if (filters.devirMax != null && (devir == null || devir > filters.devirMax)) passes = false;
      }

      if (passes) filteredModels.add(model);
    }

    return { priceDict, motorDict, kontrolDict, voltajDict, sesDict, devirDict, filteredModels };
  }

  /**
   * Ana fan secim fonksiyonu (toleransli).
   *
   * @param {Object} params
   *   - debiReq: number (istenen debi m3/h)
   *   - basincReq: number (istenen basinc Pa)
   *   - sheetData: sheet JSON objesi
   *   - priceData: fiyat arrayi
   *   - filters: gelismis filtreler (opsiyonel)
   *   - toleransAcik: boolean (default true, %10 tolerans)
   *   - iskonto: number (iskonto yuzdesi)
   *
   * @returns {{ result, candidates, error }}
   */
  function selectFan(params) {
    const {
      debiReq, basincReq, sheetData, priceData,
      filters = null, toleransAcik = true, iskonto = 0
    } = params;

    if (!debiReq || !basincReq) {
      return { result: null, candidates: [], error: 'Debi ve basinc degerleri gereklidir.' };
    }

    // 1. Debi matrisini olustur
    const { basincValues, modelList, debiMatrix } = buildDebiMatrix(sheetData);
    if (!basincValues.length || !modelList.length) {
      return { result: null, candidates: [], error: 'Bu kategoride veri bulunamadi.' };
    }

    // 2. Fiyat ve filtre verilerini yukle
    const { priceDict, motorDict, kontrolDict, voltajDict, sesDict, devirDict, filteredModels } =
      loadPrices(priceData, filters);

    // 3. Basinc yuvarla (en yakin >= deger)
    const closestBasinc = findClosestPressure(basincReq, basincValues);
    if (closestBasinc == null) {
      return { result: null, candidates: [], error: 'Uygun basinc degeri bulunamadi.' };
    }

    // 4. Kontrol edilecek modeller (filtre varsa filtered, yoksa tumu)
    const hasFilters = filters && Object.values(filters).some(v => v != null && v !== '');
    const modelsToCheck = hasFilters ? [...filteredModels] : modelList;

    if (modelsToCheck.length === 0) {
      return { result: null, candidates: [], error: 'Filtre kriterlerine uygun model bulunamadi.' };
    }

    // 5. Tolerans esigi
    const threshold = toleransAcik ? debiReq * 0.90 : debiReq;

    // 6. Modelleri kategorize et
    const tamKarsilayan = [];   // debi >= debiReq
    const toleransIcinde = [];  // threshold <= debi < debiReq

    for (const model of modelsToCheck) {
      const debi = debiMatrix.get(model + '|' + closestBasinc);
      if (debi == null) continue;

      const fiyat = priceDict.get(model) || 0;

      const entry = {
        model,
        debi,
        fiyat,
        motorGucu: motorDict.get(model) || null,
        kontrolEkipman: kontrolDict.get(model) || '',
        voltaj: voltajDict.get(model) || '',
        sesSeviyesi: sesDict.get(model) || null,
        devir: devirDict.get(model) || null,
        toleransli: false,
        meets: false
      };

      if (debi >= debiReq) {
        entry.meets = true;
        tamKarsilayan.push(entry);
      } else if (toleransAcik && debi >= threshold) {
        entry.toleransli = true;
        toleransIcinde.push(entry);
      }
    }

    // 7. Tum uygun modeller
    const tumUygun = [...tamKarsilayan, ...toleransIcinde];

    if (tumUygun.length === 0) {
      // En yuksek debili modeli bul (uyari ile)
      let bestModel = null;
      let bestDebi = -1;
      for (const model of modelsToCheck) {
        const debi = debiMatrix.get(model + '|' + closestBasinc);
        if (debi != null && debi > bestDebi) {
          bestDebi = debi;
          bestModel = model;
        }
      }
      if (bestModel) {
        const fiyat = priceDict.get(bestModel) || 0;
        const net = PriceCalc.applyDiscount(fiyat, iskonto);
        return {
          result: {
            model: bestModel,
            debi: bestDebi,
            basinc: closestBasinc,
            girilenDebi: debiReq,
            girilenBasinc: basincReq,
            listeFiyat: fiyat,
            iskonto,
            netFiyat: net,
            motorGucu: motorDict.get(bestModel) || null,
            kontrolEkipman: kontrolDict.get(bestModel) || '',
            voltaj: voltajDict.get(bestModel) || '',
            sesSeviyesi: sesDict.get(bestModel) || null,
            devir: devirDict.get(bestModel) || null,
            toleransli: false,
            uyari: 'Tam karsilayan model bulunamadi. En yuksek debili model secildi.'
          },
          candidates: [],
          error: null
        };
      }
      return { result: null, candidates: [], error: 'Hicbir uygun model bulunamadi.' };
    }

    // 8. En ucuz modeli sec
    tumUygun.sort((a, b) => a.fiyat - b.fiyat);
    const selected = tumUygun[0];

    // 9. Fiyat hesapla
    const net = PriceCalc.applyDiscount(selected.fiyat, iskonto);

    // 10. Sonuc
    const result = {
      model: selected.model,
      debi: selected.debi,
      basinc: closestBasinc,
      girilenDebi: debiReq,
      girilenBasinc: basincReq,
      listeFiyat: selected.fiyat,
      iskonto,
      netFiyat: net,
      motorGucu: selected.motorGucu,
      kontrolEkipman: selected.kontrolEkipman,
      voltaj: selected.voltaj,
      sesSeviyesi: selected.sesSeviyesi,
      devir: selected.devir,
      toleransli: selected.toleransli,
      uyari: null
    };

    // 11. Tum adaylar (fiyata gore sirali)
    const candidates = tumUygun.map(c => ({
      ...c,
      netFiyat: PriceCalc.applyDiscount(c.fiyat, iskonto),
      selected: c.model === selected.model
    }));

    return { result, candidates, error: null };
  }

  /**
   * Belirli bir sheet icin mevcut basinc degerlerini getir.
   */
  function getAvailablePressures(sheetData) {
    return (sheetData && sheetData.basinc_values) || [];
  }

  /**
   * Belirli bir sheet icin model sayisini getir.
   */
  function getModelCount(sheetData) {
    return (sheetData && sheetData.models) ? sheetData.models.length : 0;
  }

  /**
   * Fan gorsel dosya adini belirle (sheet adina gore).
   */
  function getFanImageName(sheetName) {
    if (!sheetName) return null;
    const name = sheetName
      .toLowerCase()
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
      .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return name;
  }

  return {
    selectFan,
    findClosestPressure,
    buildDebiMatrix,
    loadPrices,
    getAvailablePressures,
    getModelCount,
    getFanImageName
  };

})();
