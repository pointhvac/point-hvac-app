/**
 * Point HVAC - Authentication Logic
 * Login form handler, cihaz kaydi ve dogrulama.
 * Yalnizca login.html sayfasinda yuklenir.
 */

// Zaten oturum aciksa anasayfaya yonlendir
(async function checkExistingSession() {
  if (!SupabaseConfig.isConfigured()) return;
  var client = SupabaseConfig.getClient();
  if (!client) return;
  try {
    var result = await client.auth.getSession();
    if (result.data && result.data.session) {
      window.location.href = 'index.html';
    }
  } catch (e) { /* offline, login sayfasinda kal */ }
})();

/**
 * Login form submit handler
 */
async function handleLogin(event) {
  event.preventDefault();

  var email = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;
  var errorEl = document.getElementById('loginError');
  var btn = document.getElementById('loginBtn');

  // UI reset
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Giris yapiliyor...';

  try {
    if (!SupabaseConfig.isConfigured()) {
      throw new Error('Supabase yapilandirmasi eksik. Yoneticiyle iletisime gecin.');
    }

    var client = SupabaseConfig.getClient();
    if (!client) throw new Error('Supabase baglantisi kurulamadi');

    // 1. Supabase ile kimlik dogrulama
    var authResult = await client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authResult.error) {
      var msg = authResult.error.message;
      if (msg === 'Invalid login credentials') {
        throw new Error('E-posta veya sifre hatali');
      } else if (msg.indexOf('Email not confirmed') >= 0) {
        throw new Error('E-posta dogrulanmamis. Yoneticiyle iletisime gecin.');
      }
      throw new Error(msg);
    }

    var userId = authResult.data.user.id;

    // 2. Cihaz ID al
    var deviceId = await _getDeviceId();

    // 3. Cihaz kaydi kontrol
    var devResult = await client
      .from('user_devices')
      .select('device_id')
      .eq('user_id', userId)
      .single();

    if (devResult.error && devResult.error.code !== 'PGRST116') {
      // PGRST116 = satir bulunamadi (ilk giris) - bu normal
      throw new Error('Cihaz dogrulama hatasi: ' + devResult.error.message);
    }

    if (!devResult.data) {
      // ILK GIRIS - bu cihazi kaydet
      var insertResult = await client
        .from('user_devices')
        .insert({
          user_id: userId,
          device_id: deviceId,
          device_info: {
            platform: _getPlatform(),
            userAgent: navigator.userAgent.substring(0, 200),
            registered_at: new Date().toISOString()
          }
        });

      if (insertResult.error) {
        throw new Error('Cihaz kaydedilemedi: ' + insertResult.error.message);
      }

    } else if (devResult.data.device_id !== deviceId) {
      // FARKLI CIHAZ - TAMAMEN ENGELLE
      await client.auth.signOut();
      throw new Error(
        'Bu hesap baska bir cihaza kayitlidir.\n' +
        'Cihaz degisikligi icin yoneticiyle iletisime gecin.'
      );
    }
    // else: ayni cihaz - devam

    // 4. Profil bilgisini cek
    var fullName = '';
    try {
      var profileResult = await client
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      if (profileResult.data && profileResult.data.full_name) {
        fullName = profileResult.data.full_name;
      }
    } catch (pe) { /* */ }
    // Fallback: user_metadata
    if (!fullName && authResult.data.user.user_metadata && authResult.data.user.user_metadata.full_name) {
      fullName = authResult.data.user.user_metadata.full_name;
    }

    // 5. Kullanici bilgisini localStorage'a kaydet
    setSetting('current_user', {
      id: userId,
      email: authResult.data.user.email,
      fullName: fullName
    });

    // 5. Anasayfaya yonlendir
    window.location.href = 'index.html';

  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Giris Yap';
  }
}

/** Cihaz ID al: Capacitor Device || localStorage UUID */
async function _getDeviceId() {
  if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Device) {
    try {
      var info = await Capacitor.Plugins.Device.getId();
      if (info && (info.identifier || info.uuid)) {
        return info.identifier || info.uuid;
      }
    } catch (e) { /* fallback */ }
  }
  var id = localStorage.getItem('phvac_device_id');
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    localStorage.setItem('phvac_device_id', id);
  }
  return id;
}

/** Platform bilgisi */
function _getPlatform() {
  if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    return 'android-native';
  }
  return 'web';
}
