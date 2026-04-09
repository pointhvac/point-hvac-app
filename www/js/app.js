/**
 * Point HVAC - Uygulama Yonetimi
 * Toast bildirimleri, DIA badge, navigasyon yardimcilari
 */

const App = (() => {

  /** Toast bildirim goster. */
  function showToast(message, type = '', duration = 3000) {
    // Varsa oncekini kaldir
    const old = document.querySelector('.toast');
    if (old) old.remove();

    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('show'));
    });

    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 350);
    }, duration);
  }

  /** DIA listesine urun ekle (localStorage'da sakla). */
  function addToDIA(item) {
    const list = getDIAList();
    list.push({
      ...item,
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      addedAt: new Date().toISOString()
    });
    setSetting('dia_list', list);
    updateDIABadge();
    showToast('DIA listesine eklendi', 'success');
    playSound('click');
  }

  /** DIA listesini getir. */
  function getDIAList() {
    return getSetting('dia_list', []);
  }

  /** DIA listesini temizle. */
  function clearDIAList() {
    setSetting('dia_list', []);
    updateDIABadge();
  }

  /** DIA listesinden urun sil. */
  function removeFromDIA(id) {
    const list = getDIAList().filter(item => item.id !== id);
    setSetting('dia_list', list);
    updateDIABadge();
  }

  /** DIA badge guncelle (sayfadaki sepet ikonu). */
  function updateDIABadge() {
    const badge = document.querySelector('.dia-badge .count');
    if (!badge) return;
    const count = getDIAList().length;
    badge.textContent = count;
    badge.parentElement.style.display = count > 0 ? 'flex' : 'none';
  }

  /** Sayfa yukleme spinner'i goster/gizle. */
  function setLoading(show) {
    let overlay = document.getElementById('loadingOverlay');
    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;z-index:9999';
        overlay.innerHTML = '<div class="spinner" style="width:40px;height:40px;border-width:4px"></div>';
        document.body.appendChild(overlay);
      }
    } else if (overlay) {
      overlay.remove();
    }
  }

  /** Geri navigasyon. */
  function goBack() {
    if (document.referrer && document.referrer.includes(location.host)) {
      history.back();
    } else {
      location.href = '../index.html';
    }
  }

  return {
    showToast,
    addToDIA,
    getDIAList,
    clearDIAList,
    removeFromDIA,
    updateDIABadge,
    setLoading,
    goBack
  };

})();
