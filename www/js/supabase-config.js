/**
 * Point HVAC - Supabase Configuration
 * Supabase client singleton.
 * ONEMLI: Asagidaki URL ve KEY degerlerini kendi Supabase projenizden alin.
 */
const SupabaseConfig = (() => {
  // ============================================================
  // SUPABASE PROJE BILGILERI
  // Supabase Dashboard > Settings > API adresinden alinir
  // ============================================================
  const SUPABASE_URL = 'https://xxjgysousrcsxgrskdzs.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4amd5c291c3Jjc3hncnNrZHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDAzMjEsImV4cCI6MjA5MTk3NjMyMX0.ZVjjqfzGmwmByKhNUBU0E0MTXEFwsw-sXB3AvupB0BU';

  let _client = null;

  function getClient() {
    if (_client) return _client;
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.error('[SupabaseConfig] Supabase SDK yuklenemedi');
      return null;
    }
    _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
        storageKey: 'phvac_supabase_auth'
      }
    });
    return _client;
  }

  function isConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
  }

  return { getClient, isConfigured, SUPABASE_URL, SUPABASE_ANON_KEY };
})();
