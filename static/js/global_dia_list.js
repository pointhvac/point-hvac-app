/**
 * TOPLU DIA LİSTESİ - Cross-Module Global Selection List
 * localStorage tabanlı, tüm modüllerde çalışan ortak DIA listesi
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'phvac_global_dia_list';
  var PANEL_STATE_KEY = 'phvac_global_dia_panel_open';
  var SOUND_PREF_KEY = 'phvac_add_sound';
  var VOLUME_PREF_KEY = 'phvac_add_sound_volume';

  // ==================== SES SECENEKLERI ====================
  var SOUND_OPTIONS = [
    { id: 'ding',          label: 'Ding (Varsayilan)', icon: '\uD83D\uDD14', type: 'synth' },
    { id: 'dog_bark',      label: 'Kopek Havlamasi',   icon: '\uD83D\uDC36', type: 'file', file: 'dog_bark.mp3' },
    { id: 'cat_meow',      label: 'Kedi Miyavlamasi',  icon: '\uD83D\uDC31', type: 'file', file: 'cat_meow.mp3' },
    { id: 'horn',          label: 'Korna Sesi',        icon: '\uD83D\uDCE2', type: 'file', file: 'horn.mp3' },
    { id: 'goal_fans',     label: 'Gol! Taraftar',     icon: '\u26BD',       type: 'file', file: 'goal_fans.mp3' },
    { id: 'airhorn',       label: 'Air Horn',          icon: '\uD83C\uDFBA', type: 'file', file: 'airhorn.mp3' },
    { id: 'cash_register', label: 'Kasa / Para Sesi',  icon: '\uD83D\uDCB0', type: 'file', file: 'cash_register.mp3' },
    { id: 'tada',          label: 'Tada! Basari',      icon: '\uD83C\uDF89', type: 'file', file: 'tada.mp3' },
    { id: 'level_up',      label: 'Level Up',          icon: '\uD83C\uDFAE', type: 'file', file: 'level_up.mp3' },
    { id: 'quack',         label: 'Ordek Sesi',        icon: '\uD83E\uDD86', type: 'file', file: 'quack.mp3' },
    { id: 'minecraft_xp',  label: 'Minecraft XP',      icon: '\u2B50',       type: 'file', file: 'minecraft_xp.mp3' },
    { id: 'onayliyorum',   label: 'Onayliyorum',        icon: '\u2705',       type: 'file', file: 'onayliyorum.mp3' },
    { id: 'none',          label: 'Ses Yok (Sessiz)',   icon: '\uD83D\uDD07', type: 'none' }
  ];

  function _getSoundPref(){ return localStorage.getItem(SOUND_PREF_KEY) || 'ding'; }
  function _setSoundPref(id){ localStorage.setItem(SOUND_PREF_KEY, id); }
  function _getVolume(){ return parseFloat(localStorage.getItem(VOLUME_PREF_KEY) || '0.5'); }
  function _setVolume(v){ localStorage.setItem(VOLUME_PREF_KEY, String(v)); }

  // ==================== localStorage CRUD ====================
  function getList(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }

  function saveList(list){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(e){}
  }

  function addItem(item){
    var list = getList();
    item.id = (item.source_module||'item') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2,4);
    item.added_at = new Date().toISOString();
    // Defaults
    item.sira_no = item.sira_no || '';
    item.proje_basligi = item.proje_basligi || '';
    item.urun_proje_no = item.urun_proje_no || '';
    item.kodu = item.kodu || '';
    item.aciklama = item.aciklama || '';
    item.miktar = item.miktar || '1';
    item.birim = item.birim || '';
    item.birim_fiyat = item.birim_fiyat || '';
    item.ind1 = item.ind1 || '';
    item.son_birim_fiyati = item.son_birim_fiyati || '';
    item.doviz_turu = item.doviz_turu || '';
    item.hava_debisi_1 = item.hava_debisi_1 || '';
    item.basinc_degeri_1 = item.basinc_degeri_1 || '';
    item.basinc_1 = item.basinc_1 || '';
    item.otomasyon_dis_unite = item.otomasyon_dis_unite || '';
    item.dis_unite = item.dis_unite || '';
    item.not3 = item.not3 || '';
    item.extra_rows = item.extra_rows || [];
    list.push(item);
    saveList(list);
    updateBadge();
    renderPanelContent();
    _playAddSound();
    return item;
  }

  // ==================== SES EFEKTI ====================
  function _playSynthDing(volume){
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var now = ctx.currentTime;
      var vol = volume || 0.5;
      // Nota 1
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 880;
      gain1.gain.setValueAtTime(vol * 0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);
      // Nota 2 (daha yuksek)
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 1174;
      gain2.gain.setValueAtTime(vol * 0.6, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.3);
      setTimeout(function(){ ctx.close(); }, 500);
    } catch(e){}
  }

  function _playFileSound(filename, volume){
    try {
      var audio = new Audio('/static/sounds/' + filename);
      audio.volume = volume || 0.5;
      audio.play().catch(function(){});
    } catch(e){}
  }

  function _playAddSound(){
    var pref = _getSoundPref();
    var vol = _getVolume();
    if(pref === 'none') return;
    if(pref === 'ding'){ _playSynthDing(vol); return; }
    var opt = SOUND_OPTIONS.find(function(o){ return o.id === pref; });
    if(opt && opt.type === 'file' && opt.file){
      _playFileSound(opt.file, vol);
    } else {
      _playSynthDing(vol);
    }
  }

  function _previewSound(soundId){
    var vol = _getVolume();
    if(soundId === 'none') return;
    if(soundId === 'ding'){ _playSynthDing(vol); return; }
    var opt = SOUND_OPTIONS.find(function(o){ return o.id === soundId; });
    if(opt && opt.type === 'file' && opt.file){
      _playFileSound(opt.file, vol);
    }
  }

  function removeItem(id){
    var list = getList().filter(function(x){ return x.id !== id; });
    saveList(list);
    updateBadge();
    renderPanelContent();
  }

  function updateItem(id, fields){
    var list = getList();
    for(var i=0;i<list.length;i++){
      if(list[i].id === id){
        for(var key in fields){
          if(fields.hasOwnProperty(key)) list[i][key] = fields[key];
        }
        break;
      }
    }
    saveList(list);
    renderPanelContent();
  }

  function clearList(){
    saveList([]);
    updateBadge();
    renderPanelContent();
  }

  // ==================== DIA EXPORT ====================
  function generateDIAText(list){
    var rows = [];
    list.forEach(function(item){
      // Ana satır: 17 tab-separated kolon
      // DIA Kolon Sirasi: Sira No | Proje Basligi | Urun Proje No | Kodu | Aciklama | Miktar | Birim | Birim Fiyat | Ind.1 | Doviz Turu | Son Birim Fiyati | Hava Debisi 1 | Basinc Degeri 1 | Basinc 1 | Otomasyon | Dis Unite | Not3
      var mainRow = [
        item.sira_no || '',
        item.proje_basligi || '',
        item.urun_proje_no || '',
        item.kodu || '',
        item.aciklama || '',
        item.miktar || '1',
        item.birim || '',
        item.birim_fiyat || '',
        item.ind1 || '',
        item.doviz_turu || '',
        item.son_birim_fiyati || '',
        item.hava_debisi_1 || '',
        item.basinc_degeri_1 || '',
        item.basinc_1 || '',
        item.otomasyon_dis_unite || '',
        item.dis_unite || '',
        item.not3 || ''
      ].join('\t');
      rows.push(mainRow);

      // Extra rows (filtre, otomasyon vb.)
      if(item.extra_rows && item.extra_rows.length > 0){
        item.extra_rows.forEach(function(extra){
          var extraRow = [
            '',
            extra.proje_basligi || '',
            extra.urun_proje_no || '',
            extra.kodu || '',
            extra.aciklama || '',
            extra.miktar || '1',
            extra.birim || '',
            extra.birim_fiyat || '',
            extra.ind1 || '',
            extra.doviz_turu || '',
            extra.son_birim_fiyati || '',
            extra.hava_debisi_1 || '',
            extra.basinc_degeri_1 || '',
            extra.basinc_1 || '',
            extra.otomasyon_dis_unite || '',
            extra.dis_unite || '',
            extra.not3 || ''
          ].join('\t');
          rows.push(extraRow);
        });
      }
    });
    return rows.join('\n');
  }

  function copyDIAToClipboard(){
    var list = getList();
    if(list.length === 0){
      _showToast('Toplu liste bos! Once urun ekleyin.', 'warning');
      return;
    }
    var text = generateDIAText(list);
    var totalRows = 0;
    list.forEach(function(item){ totalRows += 1 + (item.extra_rows ? item.extra_rows.length : 0); });

    navigator.clipboard.writeText(text).then(function(){
      _showToast('DIA icin ' + totalRows + ' satir kopyalandi!', 'success');
    }).catch(function(){
      // Fallback
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      _showToast('DIA icin ' + totalRows + ' satir kopyalandi!', 'success');
    });
  }

  // ==================== TOAST ====================
  function _showToast(msg, type){
    var existing = document.getElementById('gdlToast');
    if(existing) existing.remove();

    var colors = {
      success: {bg:'#d4edda',border:'#28a745',text:'#155724'},
      warning: {bg:'#fff3cd',border:'#ffc107',text:'#856404'},
      error:   {bg:'#f8d7da',border:'#dc3545',text:'#721c24'}
    };
    var c = colors[type] || colors.success;

    var toast = document.createElement('div');
    toast.id = 'gdlToast';
    toast.style.cssText = 'position:fixed;bottom:140px;right:24px;z-index:99995;padding:12px 20px;border-radius:12px;border:2px solid '+c.border+';background:'+c.bg+';color:'+c.text+';font-family:Inter,Segoe UI,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:350px;animation:gdlToastIn .3s ease';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function(){ if(toast.parentNode) toast.remove(); }, 4000);
  }

  // ==================== UI: FAB + PANEL ====================
  var activeFilter = 'all';

  function renderFAB(){
    // Eğer zaten varsa tekrar oluşturma
    if(document.getElementById('gdlFab')) return;

    var fab = document.createElement('div');
    fab.id = 'gdlFab';
    fab.title = 'Toplu DIA Listesi';
    fab.onclick = togglePanel;
    fab.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg><span id="gdlBadge" style="display:none">0</span>';
    document.body.appendChild(fab);
  }

  function renderPanel(){
    if(document.getElementById('gdlPanel')) return;

    var panel = document.createElement('div');
    panel.id = 'gdlPanel';
    panel.innerHTML = '<div id="gdlPanelInner">' +
      '<div class="gdl-header">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>' +
          '<span style="font-size:16px;font-weight:700">Toplu DIA Listesi</span>' +
          '<span id="gdlCount" style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">0</span>' +
        '</div>' +
        '<button class="gdl-sound-btn" onclick="GlobalDIAList.toggleSoundSettings()" title="Ses Ayarlari">\uD83D\uDD0A</button>' +
        '<button class="gdl-close-btn" onclick="GlobalDIAList.toggle()" title="Kapat">&times;</button>' +
      '</div>' +
      '<div class="gdl-sound-settings" id="gdlSoundSettings" style="display:none"></div>' +
      '<div class="gdl-filters" id="gdlFilters"></div>' +
      '<div class="gdl-body" id="gdlBody"></div>' +
      '<div class="gdl-footer">' +
        '<div style="display:flex;gap:8px;flex:1">' +
          '<button class="gdl-btn gdl-btn-success" onclick="GlobalDIAList.copyDIA()">DIA Kopyala</button>' +
          '<button class="gdl-btn gdl-btn-danger" onclick="GlobalDIAList.confirmClear()">Temizle</button>' +
        '</div>' +
        '<div id="gdlSummary" style="font-size:11px;color:#6B7280;text-align:right;min-width:120px"></div>' +
      '</div>' +
    '</div>';
    document.body.appendChild(panel);

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'gdlOverlay';
    overlay.onclick = function(){ togglePanel(); };
    document.body.appendChild(overlay);
  }

  function togglePanel(){
    var panel = document.getElementById('gdlPanel');
    var overlay = document.getElementById('gdlOverlay');
    if(!panel) return;

    var isOpen = panel.classList.contains('open');
    if(isOpen){
      panel.classList.remove('open');
      overlay.classList.remove('open');
    } else {
      renderPanelContent();
      panel.classList.add('open');
      overlay.classList.add('open');
    }
  }

  function updateBadge(){
    var badge = document.getElementById('gdlBadge');
    if(!badge) return;
    var count = getList().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  function renderPanelContent(){
    var list = getList();
    var countEl = document.getElementById('gdlCount');
    var bodyEl = document.getElementById('gdlBody');
    var summaryEl = document.getElementById('gdlSummary');
    var filtersEl = document.getElementById('gdlFilters');
    if(!bodyEl) return;

    if(countEl) countEl.textContent = list.length;

    // Modül filtre chip'leri
    var modules = {};
    list.forEach(function(item){
      var m = item.source_module || 'diger';
      if(!modules[m]) modules[m] = 0;
      modules[m]++;
    });

    var filterHTML = '<button class="gdl-chip' + (activeFilter==='all'?' active':'') + '" onclick="GlobalDIAList.setFilter(\'all\')">Tumu (' + list.length + ')</button>';
    var moduleLabels = {fan:'Fan',santral:'Santral',hucreli:'Hucreli',cihaz:'Cihaz'};
    var moduleColors = {fan:'#3B82F6',santral:'#8B5CF6',hucreli:'#F59E0B',cihaz:'#10B981'};
    for(var m in modules){
      filterHTML += '<button class="gdl-chip' + (activeFilter===m?' active':'') + '" style="--chip-color:' + (moduleColors[m]||'#6B7280') + '" onclick="GlobalDIAList.setFilter(\'' + m + '\')">' + (moduleLabels[m]||m) + ' (' + modules[m] + ')</button>';
    }
    if(filtersEl) filtersEl.innerHTML = filterHTML;

    // Filtrelenmiş liste
    var filtered = activeFilter === 'all' ? list : list.filter(function(x){ return x.source_module === activeFilter; });

    if(filtered.length === 0){
      bodyEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#9CA3AF"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 12px;display:block;opacity:0.4"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg><div style="font-size:14px;font-weight:600">Liste Bos</div><div style="font-size:12px;margin-top:4px">Modullerden urun ekleyerek baslayın</div></div>';
    } else {
      var html = '';
      filtered.forEach(function(item){
        var mc = moduleColors[item.source_module] || '#6B7280';
        var ml = moduleLabels[item.source_module] || item.source_label || item.source_module;
        var extraInfo = '';
        if(item.extra_rows && item.extra_rows.length > 0){
          item.extra_rows.forEach(function(er){
            extraInfo += '<div class="gdl-extra-row"><span class="gdl-extra-tag">+</span> ' + _escapeHtml(er.kodu||'') + (er.birim_fiyat ? ' <span style="color:#6B7280">(' + er.birim_fiyat + ' ' + (er.doviz_turu||'') + ')</span>' : '') + (er.not3 ? ' <span style="color:#9CA3AF;font-size:10px">' + _escapeHtml(er.not3).substring(0,50) + '</span>' : '') + '</div>';
          });
        }

        html += '<div class="gdl-item" data-id="' + item.id + '" draggable="true" ondragstart="GlobalDIAList._onDragStart(event)" ondragover="GlobalDIAList._onDragOver(event)" ondrop="GlobalDIAList._onDrop(event)" ondragend="GlobalDIAList._onDragEnd(event)">' +
          '<div class="gdl-drag-handle" title="Surukle">&#9776;</div>' +
          '<div class="gdl-item-left" style="border-left-color:' + mc + '">' +
            '<div class="gdl-item-header">' +
              '<span class="gdl-module-tag" style="background:' + mc + '">' + ml + '</span>' +
              '<span class="gdl-model">' + _escapeHtml(item.kodu) + '</span>' +
            '</div>' +
            '<div class="gdl-item-details">' +
              (item.hava_debisi_1 ? '<span>Debi: ' + item.hava_debisi_1 + ' m\u00B3/h</span>' : '') +
              (item.basinc_degeri_1 ? '<span>Basinc: ' + item.basinc_degeri_1 + ' Pa</span>' : '') +
              (item.birim_fiyat ? '<span>Fiyat: ' + item.birim_fiyat + ' ' + (item.doviz_turu||'') + '</span>' : '') +
              (item.ind1 ? '<span>Isk: %' + item.ind1 + '</span>' : '') +
            '</div>' +
            '<div class="gdl-item-edit">' +
              '<label>Proje:<input type="text" value="' + _escapeAttr(item.proje_basligi) + '" onchange="GlobalDIAList.update(\'' + item.id + '\',{proje_basligi:this.value})" placeholder="Proje basligi"></label>' +
              '<label>Proje No:<input type="text" value="' + _escapeAttr(item.urun_proje_no) + '" onchange="GlobalDIAList.update(\'' + item.id + '\',{urun_proje_no:this.value})" placeholder="Urun proje no"></label>' +
              '<label>Adet:<input type="number" value="' + _escapeAttr(item.miktar) + '" min="1" style="width:60px" onchange="GlobalDIAList.update(\'' + item.id + '\',{miktar:this.value})"></label>' +
            '</div>' +
            extraInfo +
          '</div>' +
          '<button class="gdl-delete-btn" onclick="GlobalDIAList.remove(\'' + item.id + '\')" title="Sil">&times;</button>' +
        '</div>';
      });
      bodyEl.innerHTML = html;
    }

    // Özet
    var totalRows = 0;
    list.forEach(function(item){ totalRows += 1 + (item.extra_rows ? item.extra_rows.length : 0); });
    if(summaryEl) summaryEl.innerHTML = 'Toplam: <strong>' + list.length + '</strong> urun, <strong>' + totalRows + '</strong> DIA satiri';
  }

  function setFilter(f){
    activeFilter = f;
    renderPanelContent();
  }

  // ==================== SES AYARLARI UI ====================
  function toggleSoundSettings(){
    var el = document.getElementById('gdlSoundSettings');
    if(!el) return;
    if(el.style.display === 'none'){
      renderSoundSettings();
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  function renderSoundSettings(){
    var el = document.getElementById('gdlSoundSettings');
    if(!el) return;
    var currentSound = _getSoundPref();
    var currentVolume = _getVolume();

    var html = '<div class="gdl-sound-title">' +
      '<span>\uD83D\uDD0A Ses Ayarlari</span>' +
      '<button class="gdl-sound-close" onclick="GlobalDIAList.toggleSoundSettings()">&times;</button>' +
    '</div>';

    // Volume slider
    html += '<div class="gdl-volume-row">' +
      '<label>Ses Seviyesi:</label>' +
      '<input type="range" min="0" max="1" step="0.05" value="' + currentVolume + '" ' +
        'oninput="GlobalDIAList._onVolumeChange(this.value)" ' +
        'class="gdl-volume-slider">' +
      '<span id="gdlVolumeLabel" class="gdl-volume-label">' + Math.round(currentVolume * 100) + '%</span>' +
    '</div>';

    // Sound cards grid
    html += '<div class="gdl-sound-grid">';
    SOUND_OPTIONS.forEach(function(opt){
      var isActive = opt.id === currentSound;
      html += '<div class="gdl-sound-card' + (isActive ? ' active' : '') + '" ' +
        'onclick="GlobalDIAList._selectSound(\'' + opt.id + '\')" ' +
        'title="' + opt.label + '">' +
        '<div class="gdl-sound-icon">' + opt.icon + '</div>' +
        '<div class="gdl-sound-label">' + opt.label + '</div>' +
        (isActive ? '<div class="gdl-sound-check">\u2713</div>' : '') +
        '<button class="gdl-sound-preview" onclick="event.stopPropagation();GlobalDIAList._previewSound(\'' + opt.id + '\')" title="Dinle">\u25B6</button>' +
      '</div>';
    });
    html += '</div>';

    el.innerHTML = html;
  }

  function _selectSound(id){
    _setSoundPref(id);
    renderSoundSettings();
    _previewSound(id);
  }

  function _onVolumeChange(val){
    _setVolume(parseFloat(val));
    var lbl = document.getElementById('gdlVolumeLabel');
    if(lbl) lbl.textContent = Math.round(val * 100) + '%';
  }

  function confirmClear(){
    if(getList().length === 0){
      _showToast('Liste zaten bos!', 'warning');
      return;
    }
    if(confirm('Toplu DIA listesindeki tum urünler silinecek. Emin misiniz?')){
      clearList();
      _showToast('Toplu liste temizlendi', 'success');
    }
  }

  // ==================== DRAG & DROP ====================
  var draggedId = null;

  function _onDragStart(e){
    var item = e.target.closest('.gdl-item');
    if(!item) return;
    draggedId = item.getAttribute('data-id');
    item.classList.add('gdl-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
  }

  function _onDragOver(e){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var target = e.target.closest('.gdl-item');
    if(!target || target.getAttribute('data-id') === draggedId) return;
    // Üst/alt yarıya göre indicator göster
    var rect = target.getBoundingClientRect();
    var midY = rect.top + rect.height / 2;
    target.classList.remove('gdl-drop-above', 'gdl-drop-below');
    if(e.clientY < midY){
      target.classList.add('gdl-drop-above');
    } else {
      target.classList.add('gdl-drop-below');
    }
  }

  function _onDrop(e){
    e.preventDefault();
    var target = e.target.closest('.gdl-item');
    if(!target || !draggedId) return;
    var targetId = target.getAttribute('data-id');
    if(targetId === draggedId) return;

    var rect = target.getBoundingClientRect();
    var midY = rect.top + rect.height / 2;
    var insertBefore = e.clientY < midY;

    // Liste sırasını değiştir
    var list = getList();
    var dragIdx = -1, targetIdx = -1;
    for(var i = 0; i < list.length; i++){
      if(list[i].id === draggedId) dragIdx = i;
      if(list[i].id === targetId) targetIdx = i;
    }
    if(dragIdx < 0 || targetIdx < 0) return;

    var dragged = list.splice(dragIdx, 1)[0];
    // splice sonrası targetIdx güncelle
    var newTargetIdx = -1;
    for(var j = 0; j < list.length; j++){
      if(list[j].id === targetId){ newTargetIdx = j; break; }
    }
    if(insertBefore){
      list.splice(newTargetIdx, 0, dragged);
    } else {
      list.splice(newTargetIdx + 1, 0, dragged);
    }
    saveList(list);
    renderPanelContent();
    _clearDropIndicators();
    draggedId = null;
  }

  function _onDragEnd(e){
    draggedId = null;
    _clearDropIndicators();
    var el = e.target.closest('.gdl-item');
    if(el) el.classList.remove('gdl-dragging');
  }

  function _clearDropIndicators(){
    document.querySelectorAll('.gdl-drop-above,.gdl-drop-below,.gdl-dragging').forEach(function(el){
      el.classList.remove('gdl-drop-above', 'gdl-drop-below', 'gdl-dragging');
    });
  }

  // ==================== HELPERS ====================
  function _escapeHtml(str){
    if(!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _escapeAttr(str){
    if(!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ==================== STYLES ====================
  function injectStyles(){
    if(document.getElementById('gdlStyles')) return;
    var style = document.createElement('style');
    style.id = 'gdlStyles';
    style.textContent = '\
@keyframes gdlToastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}\
@keyframes gdlFabPulse{0%,100%{box-shadow:0 4px 15px rgba(59,130,246,0.4)}50%{box-shadow:0 4px 25px rgba(59,130,246,0.7)}}\
\
#gdlFab{\
  position:fixed;bottom:80px;right:20px;z-index:99991;\
  width:56px;height:56px;border-radius:16px;\
  background:linear-gradient(135deg,#3B82F6,#8B5CF6);\
  color:#fff;border:none;cursor:pointer;\
  display:flex;align-items:center;justify-content:center;\
  box-shadow:0 4px 15px rgba(59,130,246,0.4);\
  transition:transform .2s,box-shadow .2s;\
}\
#gdlFab:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(59,130,246,0.6)}\
\
#gdlBadge{\
  position:absolute;top:-4px;right:-4px;\
  background:#EF4444;color:#fff;\
  width:22px;height:22px;border-radius:50%;\
  font-size:11px;font-weight:700;\
  display:flex;align-items:center;justify-content:center;\
  border:2px solid #fff;\
  box-shadow:0 2px 6px rgba(239,68,68,0.4);\
}\
\
#gdlOverlay{\
  position:fixed;inset:0;z-index:99992;\
  background:rgba(0,0,0,0.3);backdrop-filter:blur(2px);\
  opacity:0;pointer-events:none;transition:opacity .3s;\
}\
#gdlOverlay.open{opacity:1;pointer-events:auto}\
\
#gdlPanel{\
  position:fixed;top:0;right:-500px;bottom:0;z-index:99993;\
  width:480px;max-width:95vw;\
  transition:right .3s cubic-bezier(.4,0,.2,1);\
}\
#gdlPanel.open{right:0}\
\
#gdlPanelInner{\
  height:100%;display:flex;flex-direction:column;\
  background:#fff;box-shadow:-4px 0 30px rgba(0,0,0,0.15);\
  font-family:Inter,Segoe UI,sans-serif;\
}\
\
.gdl-header{\
  display:flex;align-items:center;justify-content:space-between;\
  padding:16px 20px;\
  background:linear-gradient(135deg,#3B82F6,#8B5CF6);\
  color:#fff;\
}\
.gdl-close-btn{\
  background:rgba(255,255,255,0.15);border:none;color:#fff;\
  width:32px;height:32px;border-radius:8px;font-size:20px;\
  cursor:pointer;display:flex;align-items:center;justify-content:center;\
  transition:background .2s;\
}\
.gdl-close-btn:hover{background:rgba(255,255,255,0.3)}\
\
.gdl-sound-btn{\
  background:rgba(255,255,255,0.15);border:none;color:#fff;\
  width:32px;height:32px;border-radius:8px;font-size:16px;\
  cursor:pointer;display:flex;align-items:center;justify-content:center;\
  transition:background .2s;\
}\
.gdl-sound-btn:hover{background:rgba(255,255,255,0.3)}\
\
.gdl-sound-settings{\
  padding:14px 16px;border-bottom:1px solid #E5E7EB;\
  background:linear-gradient(135deg,#FEF3C7,#FDE68A);\
  max-height:350px;overflow-y:auto;\
}\
.gdl-sound-title{\
  display:flex;align-items:center;justify-content:space-between;\
  font-size:14px;font-weight:700;color:#92400E;margin-bottom:10px;\
}\
.gdl-sound-close{\
  background:none;border:none;font-size:18px;cursor:pointer;\
  color:#92400E;opacity:0.6;padding:2px 6px;border-radius:4px;\
}\
.gdl-sound-close:hover{opacity:1;background:rgba(0,0,0,0.08)}\
\
.gdl-volume-row{\
  display:flex;align-items:center;gap:8px;margin-bottom:12px;\
}\
.gdl-volume-row label{\
  font-size:12px;font-weight:600;color:#78350F;white-space:nowrap;\
}\
.gdl-volume-slider{\
  flex:1;height:6px;-webkit-appearance:none;appearance:none;\
  background:#D97706;border-radius:3px;outline:none;cursor:pointer;\
}\
.gdl-volume-slider::-webkit-slider-thumb{\
  -webkit-appearance:none;width:18px;height:18px;border-radius:50%;\
  background:#fff;border:2px solid #D97706;cursor:pointer;\
  box-shadow:0 1px 4px rgba(0,0,0,0.2);\
}\
.gdl-volume-label{\
  font-size:12px;font-weight:700;color:#78350F;min-width:36px;text-align:right;\
}\
\
.gdl-sound-grid{\
  display:grid;grid-template-columns:repeat(2,1fr);gap:6px;\
}\
.gdl-sound-card{\
  position:relative;display:flex;align-items:center;gap:8px;\
  padding:8px 10px;border-radius:10px;border:2px solid transparent;\
  background:#fff;cursor:pointer;transition:all .2s;\
  box-shadow:0 1px 3px rgba(0,0,0,0.06);\
}\
.gdl-sound-card:hover{border-color:#F59E0B;transform:translateY(-1px)}\
.gdl-sound-card.active{\
  border-color:#D97706;background:#FFFBEB;\
  box-shadow:0 2px 8px rgba(217,119,6,0.25);\
}\
.gdl-sound-icon{font-size:20px;flex-shrink:0}\
.gdl-sound-label{font-size:11px;font-weight:600;color:#374151;flex:1;line-height:1.2}\
.gdl-sound-card.active .gdl-sound-label{color:#92400E}\
.gdl-sound-check{\
  position:absolute;top:3px;right:3px;font-size:10px;font-weight:700;\
  color:#fff;background:#D97706;width:16px;height:16px;border-radius:50%;\
  display:flex;align-items:center;justify-content:center;\
}\
.gdl-sound-preview{\
  position:absolute;bottom:3px;right:3px;\
  background:none;border:none;cursor:pointer;\
  font-size:11px;color:#9CA3AF;padding:2px 4px;border-radius:4px;\
  transition:all .15s;\
}\
.gdl-sound-preview:hover{color:#D97706;background:rgba(217,119,6,0.1)}\
\
.gdl-filters{\
  padding:10px 16px;display:flex;gap:6px;flex-wrap:wrap;\
  border-bottom:1px solid #E5E7EB;background:#F9FAFB;\
}\
.gdl-chip{\
  padding:4px 12px;border-radius:20px;border:1px solid #D1D5DB;\
  background:#fff;color:#374151;font-size:12px;font-weight:500;\
  cursor:pointer;transition:all .2s;\
}\
.gdl-chip:hover{border-color:#9CA3AF}\
.gdl-chip.active{\
  background:var(--chip-color,#3B82F6);color:#fff;\
  border-color:var(--chip-color,#3B82F6);\
}\
\
.gdl-body{\
  flex:1;overflow-y:auto;padding:12px 16px;\
}\
\
.gdl-item{\
  display:flex;align-items:flex-start;gap:8px;\
  padding:12px;margin-bottom:8px;\
  border-radius:10px;background:#F9FAFB;\
  border:1px solid #E5E7EB;\
  transition:border-color .2s;\
}\
.gdl-item:hover{border-color:#D1D5DB}\
\
.gdl-item-left{\
  flex:1;padding-left:10px;\
  border-left:3px solid #3B82F6;\
}\
\
.gdl-item-header{\
  display:flex;align-items:center;gap:8px;margin-bottom:6px;\
}\
.gdl-module-tag{\
  padding:2px 8px;border-radius:6px;color:#fff;\
  font-size:10px;font-weight:700;text-transform:uppercase;\
  letter-spacing:0.5px;\
}\
.gdl-model{\
  font-size:14px;font-weight:700;color:#1F2937;\
}\
\
.gdl-item-details{\
  display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;\
}\
.gdl-item-details span{\
  font-size:11px;color:#6B7280;\
}\
\
.gdl-item-edit{\
  display:flex;gap:8px;flex-wrap:wrap;\
}\
.gdl-item-edit label{\
  font-size:10px;color:#9CA3AF;display:flex;flex-direction:column;gap:2px;\
}\
.gdl-item-edit input{\
  padding:4px 8px;border:1px solid #D1D5DB;border-radius:6px;\
  font-size:12px;color:#1F2937;background:#fff;\
  transition:border-color .2s;\
}\
.gdl-item-edit input:focus{outline:none;border-color:#3B82F6}\
.gdl-item-edit input[type="text"]{width:120px}\
\
.gdl-extra-row{\
  margin-top:4px;padding:3px 8px;border-radius:4px;\
  background:#EEF2FF;font-size:11px;color:#4338CA;\
}\
.gdl-extra-tag{\
  font-weight:700;color:#6366F1;\
}\
\
.gdl-delete-btn{\
  background:none;border:none;color:#D1D5DB;\
  font-size:20px;cursor:pointer;padding:4px;\
  border-radius:6px;transition:all .2s;\
  flex-shrink:0;width:28px;height:28px;\
  display:flex;align-items:center;justify-content:center;\
}\
.gdl-delete-btn:hover{color:#EF4444;background:#FEE2E2}\
\
.gdl-drag-handle{\
  cursor:grab;color:#D1D5DB;font-size:16px;padding:4px 2px;\
  display:flex;align-items:center;flex-shrink:0;\
  transition:color .2s;user-select:none;\
}\
.gdl-drag-handle:hover{color:#6B7280}\
.gdl-drag-handle:active{cursor:grabbing}\
.gdl-item.gdl-dragging{opacity:0.4;border:2px dashed #8B5CF6}\
.gdl-item.gdl-drop-above{border-top:3px solid #8B5CF6}\
.gdl-item.gdl-drop-below{border-bottom:3px solid #8B5CF6}\
\
.gdl-footer{\
  padding:12px 16px;\
  border-top:1px solid #E5E7EB;\
  display:flex;align-items:center;gap:12px;\
  background:#F9FAFB;\
}\
\
.gdl-btn{\
  padding:8px 16px;border:none;border-radius:8px;\
  font-size:13px;font-weight:600;cursor:pointer;\
  transition:all .2s;\
}\
.gdl-btn-success{background:#10B981;color:#fff}\
.gdl-btn-success:hover{background:#059669}\
.gdl-btn-danger{background:#EF4444;color:#fff}\
.gdl-btn-danger:hover{background:#DC2626}\
\
[data-theme="ozel"] #gdlPanelInner{background:#1a2035;color:#d0d8e8}\
[data-theme="ozel"] .gdl-body{background:#1a2035}\
[data-theme="ozel"] .gdl-item{background:#1a2538;border-color:#2a3550}\
[data-theme="ozel"] .gdl-item:hover{border-color:#3a4d65}\
[data-theme="ozel"] .gdl-model{color:#d0d8e8}\
[data-theme="ozel"] .gdl-item-edit input{background:#0d1425;color:#d0d8e8;border-color:#2a3550}\
[data-theme="ozel"] .gdl-filters{background:#1a2538;border-color:#2a3550}\
[data-theme="ozel"] .gdl-chip{background:#1a2035;color:#8892a8;border-color:#2a3550}\
[data-theme="ozel"] .gdl-footer{background:#1a2538;border-color:#2a3550}\
[data-theme="ozel"] .gdl-extra-row{background:#1e2540;color:#7eb8da}\
[data-theme="ozel"] .gdl-sound-settings{background:linear-gradient(135deg,#1a2035,#1e2840);border-color:#2a3550}\
[data-theme="ozel"] .gdl-sound-title{color:#7eb8da}\
[data-theme="ozel"] .gdl-sound-close{color:#7eb8da}\
[data-theme="ozel"] .gdl-volume-row label{color:#7eb8da}\
[data-theme="ozel"] .gdl-volume-label{color:#7eb8da}\
[data-theme="ozel"] .gdl-volume-slider{background:#4a6fa5}\
[data-theme="ozel"] .gdl-volume-slider::-webkit-slider-thumb{border-color:#5a8abf}\
[data-theme="ozel"] .gdl-sound-card{background:#1a2538;border-color:transparent}\
[data-theme="ozel"] .gdl-sound-card:hover{border-color:#5a8abf}\
[data-theme="ozel"] .gdl-sound-card.active{background:#1e2540;border-color:#5a8abf}\
[data-theme="ozel"] .gdl-sound-label{color:#7eb8da}\
[data-theme="ozel"] .gdl-sound-card.active .gdl-sound-label{color:#b8d4f0}\
[data-theme="ozel"] .gdl-sound-check{background:#5a8abf}\
\
[data-theme="doga"] #gdlPanelInner{background:#1B2E1B;color:#C8E6C9}\
[data-theme="doga"] .gdl-body{background:#1B2E1B}\
[data-theme="doga"] .gdl-item{background:#0F1F0F;border-color:rgba(76,175,80,.3)}\
[data-theme="doga"] .gdl-item:hover{border-color:rgba(139,195,74,.5)}\
[data-theme="doga"] .gdl-model{color:#C8E6C9}\
[data-theme="doga"] .gdl-item-edit input{background:#0A1A0A;color:#C8E6C9;border-color:#2A5A2A}\
[data-theme="doga"] .gdl-filters{background:#0F1F0F;border-color:rgba(76,175,80,.3)}\
[data-theme="doga"] .gdl-chip{background:#1B2E1B;color:#81C784;border-color:rgba(76,175,80,.3)}\
[data-theme="doga"] .gdl-footer{background:#0F1F0F;border-color:rgba(76,175,80,.3)}\
[data-theme="doga"] .gdl-extra-row{background:#1A3A1A;color:#8BC34A}\
[data-theme="doga"] .gdl-sound-settings{background:linear-gradient(135deg,#1B2E1B,#0F1F0F);border-color:rgba(76,175,80,.3)}\
[data-theme="doga"] .gdl-sound-title{color:#81C784}\
[data-theme="doga"] .gdl-sound-close{color:#81C784}\
[data-theme="doga"] .gdl-volume-row label{color:#81C784}\
[data-theme="doga"] .gdl-volume-label{color:#81C784}\
[data-theme="doga"] .gdl-volume-slider{background:#2E7D32}\
[data-theme="doga"] .gdl-volume-slider::-webkit-slider-thumb{border-color:#4CAF50}\
[data-theme="doga"] .gdl-sound-card{background:#0F1F0F;border-color:transparent}\
[data-theme="doga"] .gdl-sound-card:hover{border-color:#4CAF50}\
[data-theme="doga"] .gdl-sound-card.active{background:#1A3A1A;border-color:#4CAF50}\
[data-theme="doga"] .gdl-sound-label{color:#A5D6A7}\
[data-theme="doga"] .gdl-sound-card.active .gdl-sound-label{color:#C8E6C9}\
[data-theme="doga"] .gdl-sound-check{background:#4CAF50}\
';
    document.head.appendChild(style);
  }

  // ==================== KEYBOARD SHORTCUT ====================
  document.addEventListener('keydown', function(e){
    // Ctrl+G: Toggle panel
    if((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'g' || e.key === 'G' || e.code === 'KeyG')){
      e.preventDefault();
      togglePanel();
    }
  });

  // ==================== PUBLIC API ====================
  window.GlobalDIAList = {
    add: addItem,
    remove: removeItem,
    update: updateItem,
    clear: clearList,
    getAll: getList,
    copyDIA: copyDIAToClipboard,
    toggle: togglePanel,
    updateBadge: updateBadge,
    setFilter: setFilter,
    confirmClear: confirmClear,
    toggleSoundSettings: toggleSoundSettings,
    _selectSound: _selectSound,
    _previewSound: _previewSound,
    _onVolumeChange: _onVolumeChange,
    _onDragStart: _onDragStart,
    _onDragOver: _onDragOver,
    _onDrop: _onDrop,
    _onDragEnd: _onDragEnd
  };

  // ==================== INIT ====================
  document.addEventListener('DOMContentLoaded', function(){
    injectStyles();
    renderFAB();
    renderPanel();
    updateBadge();
  });

})();
