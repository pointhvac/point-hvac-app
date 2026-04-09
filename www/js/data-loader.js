/**
 * Point HVAC - JSON Veri Yukleme ve Cache
 */

const DataLoader = (() => {
  const _cache = {};

  /**
   * Base URL belirle. Modul sayfalarindan (fan/, santral/ vb.)
   * cagirildiginda relative path dogru calissin.
   */
  function getBaseUrl() {
    // Eger URL '/fan/index.html' gibi bir alt dizindeyse '../' kullan
    const path = location.pathname;
    if (path.includes('/fan/') || path.includes('/santral/') ||
        path.includes('/hucreli/') || path.includes('/cihaz/') ||
        path.includes('/aksa/') || path.includes('/dia/')) {
      return '../';
    }
    return './';
  }

  /** JSON dosyasini yukle (cache ile). */
  async function load(relativePath) {
    const url = getBaseUrl() + relativePath;
    if (_cache[url]) return _cache[url];
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Veri yuklenemedi: ${url}`);
    const data = await resp.json();
    _cache[url] = data;
    return data;
  }

  /** Fan modelleri index'ini yukle. */
  async function loadFanIndex() {
    return load('data/fan_modeller/_index.json');
  }

  /** Belirli bir fan sheet'ini yukle. */
  async function loadFanSheet(fileName) {
    return load(`data/fan_modeller/${fileName}`);
  }

  /** Fan fiyatlarini yukle. */
  async function loadFanPrices() {
    return load('data/fan_fiyatlar.json');
  }

  /** Santral modellerini yukle. */
  async function loadSantralModels() {
    return load('data/santral_modeller.json');
  }

  /** Motor guclerini yukle. */
  async function loadMotorPowers() {
    return load('data/motor_gucleri.json');
  }

  /** Plug fan (hucreli) verilerini yukle. */
  async function loadPlugFan() {
    return load('data/plug_fan.json');
  }

  /** Isi geri kazanim (cihaz) verilerini yukle. */
  async function loadIsiGeriKazanim() {
    return load('data/isi_geri_kazanim.json');
  }

  /** AKSA fiyat verilerini yukle. */
  async function loadAksa() {
    return load('data/aksa_fiyat.json');
  }

  return {
    load, loadFanIndex, loadFanSheet, loadFanPrices,
    loadSantralModels, loadMotorPowers, loadPlugFan,
    loadIsiGeriKazanim, loadAksa
  };
})();
