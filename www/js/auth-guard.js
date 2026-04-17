/**
 * Point HVAC - Auth Guard
 * Her sayfada oturum ve cihaz dogrulamasi yapar.
 * Oturum yoksa veya cihaz eslesmiyorsa login sayfasina yonlendirir.
 */
const AuthGuard = (() => {

  /** www root'a gore relatif yolu hesapla */
  function _getBasePath() {
    var path = window.location.pathname.toLowerCase();
    var subDirs = ['/dia/', '/fan/', '/santral/', '/hucreli/', '/cihaz/', '/aksa/', '/teklifler/'];
    for (var i = 0; i < subDirs.length; i++) {
      if (path.indexOf(subDirs[i]) >= 0) return '../';
    }
    return './';
  }

  /** Cihaz ID al: Capacitor Device plugin || localStorage UUID */
  async function getDeviceId() {
    // Capacitor Device plugin (stabil hardware ID)
    if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Device) {
      try {
        var info = await Capacitor.Plugins.Device.getId();
        if (info && (info.identifier || info.uuid)) {
          return info.identifier || info.uuid;
        }
      } catch (e) {
        console.warn('[AuthGuard] Device plugin hatasi:', e);
      }
    }
    // Fallback: localStorage UUID
    var id = localStorage.getItem('phvac_device_id');
    if (!id) {
      id = _generateUUID();
      localStorage.setItem('phvac_device_id', id);
    }
    return id;
  }

  function _generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /** Ana oturum kontrol fonksiyonu */
  async function check() {
    // Supabase konfigurasyonu kontrol
    if (!SupabaseConfig.isConfigured()) {
      console.warn('[AuthGuard] Supabase henuz yapilandirilmadi, auth guard devre disi');
      return;
    }

    var client = SupabaseConfig.getClient();
    if (!client) {
      window.location.href = _getBasePath() + 'login.html';
      return;
    }

    try {
      // Mevcut oturumu kontrol et
      var result = await client.auth.getSession();
      var session = result.data ? result.data.session : null;

      if (!session) {
        // Oturum yok - login sayfasina yonlendir
        _clearLocalUser();
        window.location.href = _getBasePath() + 'login.html';
        return;
      }

      // Oturum var - cihaz dogrulamasi yap
      var deviceId = await getDeviceId();
      var userId = session.user.id;

      var devResult = await client
        .from('user_devices')
        .select('device_id')
        .eq('user_id', userId)
        .single();

      if (devResult.error && devResult.error.code === 'PGRST116') {
        // Hic cihaz kaydi yok - ilk giris login sayfasindan yapilmali
        await client.auth.signOut();
        _clearLocalUser();
        window.location.href = _getBasePath() + 'login.html';
        return;
      }

      if (devResult.data && devResult.data.device_id !== deviceId) {
        // FARKLI CIHAZ - oturumu kapat ve engelle
        await client.auth.signOut();
        _clearLocalUser();
        alert('Bu hesap baska bir cihaza kayitlidir.\nGiris yapabilmek icin yoneticiyle iletisime gecin.');
        window.location.href = _getBasePath() + 'login.html';
        return;
      }

      // Her sey tamam - profil bilgisini cek ve kaydet
      var fullName = '';
      // Once profiles tablosundan dene
      try {
        var profileResult = await client
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        if (profileResult.data && profileResult.data.full_name) {
          fullName = profileResult.data.full_name;
        }
      } catch (pe) { /* */ }
      // Fallback: user_metadata'dan al
      if (!fullName && session.user.user_metadata && session.user.user_metadata.full_name) {
        fullName = session.user.user_metadata.full_name;
      }

      setSetting('current_user', {
        id: session.user.id,
        email: session.user.email,
        fullName: fullName
      });

    } catch (networkErr) {
      // Ag hatasi - offline mod
      var cached = getSetting('current_user', null);
      if (cached) {
        console.warn('[AuthGuard] Ag baglantisi yok, onbellekteki oturum kullaniliyor');
        return; // Erisime izin ver
      }
      // Onbellekte oturum yok - giris gerekli
      window.location.href = _getBasePath() + 'login.html';
    }
  }

  /** localStorage'daki kullanici bilgisini temizle */
  function _clearLocalUser() {
    if (typeof setSetting === 'function') {
      setSetting('current_user', null);
    }
  }

  /** Mevcut kullaniciyi senkron olarak al */
  function getCurrentUser() {
    return getSetting('current_user', null);
  }

  /** Cikis yap */
  async function logout() {
    try {
      var client = SupabaseConfig.getClient();
      if (client) {
        await client.auth.signOut();
      }
    } catch (e) {
      console.warn('[AuthGuard] SignOut hatasi:', e);
    }
    localStorage.removeItem('phvac_supabase_auth');
    _clearLocalUser();
    window.location.href = _getBasePath() + 'login.html';
  }

  // Script yuklenince otomatik calistir
  if (!window._authGuardRan) {
    window._authGuardRan = true;
    check();
  }

  return { check, getCurrentUser, logout, getDeviceId };
})();
