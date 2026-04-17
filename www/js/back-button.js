/**
 * Point HVAC - Android Donanim Geri Tusu Yonetimi
 * Capacitor App plugin ile telefonun fiziksel geri tusunu yakalar.
 *  - Ana sayfa (data-page="home"): cikis onay dialogu gosterir
 *  - Alt sayfalar: tarayici gecmisinde geri gider, gecmis yoksa ana sayfaya doner
 */
(function() {

  /** Capacitor native ortaminda miyiz? */
  function isNative() {
    return !!(window.Capacitor
      && window.Capacitor.isNativePlatform
      && window.Capacitor.isNativePlatform());
  }

  /** Su anki sayfa ana sayfa mi? */
  function isHomepage() {
    return !!(document.body && document.body.getAttribute('data-page') === 'home');
  }

  /** Alt sayfalardan ana sayfaya goreceli yol uret. */
  function getHomeUrl() {
    var path = (window.location.pathname || '').toLowerCase();
    var subDirs = ['/dia/', '/fan/', '/santral/', '/hucreli/', '/cihaz/', '/aksa/', '/teklifler/'];
    for (var i = 0; i < subDirs.length; i++) {
      if (path.indexOf(subDirs[i]) >= 0) return '../index.html';
    }
    return 'index.html';
  }

  /** Cikis onay dialogu (varsa custom modal, yoksa native confirm) */
  function confirmExit(onConfirm) {
    // Eger toast/modal sistemi varsa onu kullanmak yerine basit native confirm
    var ok = window.confirm('Uygulamadan cikmak istiyor musunuz?');
    if (ok) onConfirm();
  }

  /** Geri tusu yonetimini baslat */
  function setup() {
    if (!isNative()) return;
    var Plugins = window.Capacitor && window.Capacitor.Plugins;
    var CapApp = Plugins && Plugins.App;
    if (!CapApp || typeof CapApp.addListener !== 'function') return;

    CapApp.addListener('backButton', function(ev) {
      if (isHomepage()) {
        confirmExit(function() {
          if (typeof CapApp.exitApp === 'function') {
            CapApp.exitApp();
          } else if (typeof CapApp.minimizeApp === 'function') {
            CapApp.minimizeApp();
          }
        });
      } else {
        // Alt sayfalar: gecmise geri don
        if (window.history && window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = getHomeUrl();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
