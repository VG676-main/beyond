window.BeyondApp = (function(){
  "use strict";

  /* ============== Constants ============== */
  const STORAGE_KEY = 'beyond-state';
  let persistAvailable = true;

  const ACHIEVEMENTS = [
    { id:'first_workout',  area:'workouts', title:'Первая тренировка',     desc:'Добавь свою первую тренировку',         icon:'🏋️', check:s=> (window.LifeFeatures ? LifeFeatures.totalWorkoutCount(s) : s.workouts.length) >= 1 },
    { id:'first_book',     area:'books',    title:'Первая книга',           desc:'Заверши свою первую книгу',             icon:'📖', check:s=>s.books.filter(b=>b.status==='done').length>=1 },
    { id:'streak7',        area:null,       title:'Неделя дисциплины',      desc:'Держи серию 7 дней подряд',             icon:'🔥', check:s=>s.streak>=7 },
    { id:'workouts10',     area:'workouts', title:'10 тренировок',          desc:'Проведи 10 тренировок',                 icon:'💪', check:s=> (window.LifeFeatures ? LifeFeatures.totalWorkoutCount(s) : s.workouts.length) >= 10 },
    { id:'tasks100',       area:'tasks',    title:'100 задач',               desc:'Выполни 100 задач',                     icon:'✅', check:s=>s.totalTasksCompleted>=100 },
    { id:'books10',        area:'books',    title:'10 книг',                 desc:'Заверши 10 книг',                       icon:'📚', check:s=>s.books.filter(b=>b.status==='done').length>=10 },
    { id:'level5',         area:null,       title:'5 уровень',               desc:'Достигни 5 уровня',                     icon:'⭐', check:s=>s.level>=5 },
    { id:'level10',        area:null,       title:'10 уровень',              desc:'Достигни 10 уровня',                    icon:'🌟', check:s=>s.level>=10 },
    { id:'first_goal',     area:'goals',    title:'Первая цель',             desc:'Поставь свою первую цель',              icon:'🧭', check:s=>s.goals.length>=1 },
    { id:'goal_done',      area:'goals',    title:'Цель достигнута',         desc:'Доведи цель до 100%',                   icon:'🏆', check:s=>s.goals.some(g=>g.target>0 && g.current>=g.target) },
    { id:'first_record',   area:'workouts', title:'Первый рекорд',           desc:'Побей личный рекорд в упражнении',       icon:'⚡', check:s=>s.totalRecords>=1 },
  ];

  function activeAchievements(s){
    const ta = (s && s.trackedAreas) || {};
    return ACHIEVEMENTS.filter(function(a){
      return !a.area || !!ta[a.area];
    });
  }

  const STAT_DEFS = [
    { key:'strength',     icon:'💪', label:'Сила',          color:'--crimson' },
    { key:'endurance',    icon:'🏃', label:'Выносливость',  color:'--teal' },
    { key:'intelligence', icon:'🧠', label:'Интеллект',     color:'--violet' },
    { key:'discipline',   icon:'🎯', label:'Дисциплина',    color:'--gold' },
  ];

  const THEMES = [
    { id:'obsidian', name:'Обсидиан', icon:'🌑', swatchA:'#9d8df1', swatchB:'#e8b84c' },
    { id:'sakura',   name:'Сакура',   icon:'🌸', swatchA:'#f3a8bf', swatchB:'#fdf2f5' },
    { id:'emerald',  name:'Изумруд',  icon:'🌲', swatchA:'#2dd4a0', swatchB:'#0b3d2e' },
    { id:'cyber',    name:'Неон',     icon:'⚡', swatchA:'#ff4d8d', swatchB:'#3df0e0' },
    { id:'depth',    name:'Глубина',  icon:'🌊', swatchA:'#2ec4b6', swatchB:'#1D2671' },
    { id:'graphite', name:'Графит',   icon:'◆',  swatchA:'#f0f0f2', swatchB:'#1a1a1c' },
    { id:'storm',    name:'Шторм',    icon:'⛈️', swatchA:'#6b8cae', swatchB:'#1a2330' },
    { id:'berry',    name:'Ягода',    icon:'🫐', swatchA:'#C33764', swatchB:'#1D2671' },
  ];

  const THEME_FX = {
    sakura:   { kind:'emoji', glyph:'🌸', count:14 },
    graphite: { kind:'ash', count:18 },
    depth:    { kind:'bubble', count:22 },
    storm:    { kind:'rain', count:42 },
    berry:    { kind:'ash', count:12 },
  };

  const AVATARS = [
    { id:'atlas',   name:'Атлас',   skin:'atlas',   glyph:null,  blurb:'Классика — твои инициалы' },
    { id:'nova',    name:'Нова',    skin:'nova',    glyph:'✦',   blurb:'Яркий импульс' },
    { id:'wolf',    name:'Волк',    skin:'wolf',    glyph:'☾',   blurb:'Холодный фокус' },
    { id:'phoenix', name:'Феникс',  skin:'phoenix', glyph:'✶',   blurb:'Жар прогресса' },
    { id:'sage',    name:'Мудрец',  skin:'sage',    glyph:'❖',   blurb:'Спокойная сила' },
    { id:'shadow',  name:'Тень',    skin:'shadow',  glyph:'◈',   blurb:'Минимализм' },
  ];

  const COSMETICS = [
    { id:'shape_hex',      slot:'shape', name:'Грань',       price:0, style:'hex',      free:true, blurb:'Классический шестиугольник' },
    { id:'shape_circle',   slot:'shape', name:'Круг',        price:0, style:'circle',   free:true, blurb:'Мягкий круглый портрет' },
    { id:'shape_square',   slot:'shape', name:'Квадрат',     price:0, style:'square',   free:true, blurb:'Чёткие углы' },
    { id:'shape_rounded',  slot:'shape', name:'Скругление',  price:0, style:'rounded',  free:true, blurb:'Мягкий квадрат' },
    { id:'shape_diamond',  slot:'shape', name:'Ромб',        price:0, style:'diamond',  free:true, blurb:'Острый силуэт' },
    { id:'shape_shield',   slot:'shape', name:'Щит',         price:0, style:'shield',   free:true, blurb:'Геральдическая форма' },

    { id:'frame_none',     slot:'frame', name:'Без рамки',       price:0,  style:'none',     free:true },
    { id:'frame_gold',     slot:'frame', name:'Золотая грань',   price:45, style:'gold' },
    { id:'frame_ice',      slot:'frame', name:'Ледяной контур',  price:45, style:'ice' },
    { id:'frame_obsidian', slot:'frame', name:'Обсидиановый',    price:60, style:'obsidian' },
    { id:'frame_bloom',    slot:'frame', name:'Цветение',        price:55, style:'bloom' },

    { id:'aura_none',  slot:'aura', name:'Без ауры',     price:0,  style:'none',  free:true },
    { id:'aura_soft',  slot:'aura', name:'Мягкое сияние', price:35, style:'soft',  blurb:'Лёгкое свечение по контуру' },
    { id:'aura_ember', slot:'aura', name:'Угли',         price:70, style:'ember', blurb:'Тёплое огненное марево' },
    { id:'aura_tide',  slot:'aura', name:'Прилив',       price:70, style:'tide',  blurb:'Холодный бирюзовый ореол' },
    { id:'aura_void',  slot:'aura', name:'Пустота',      price:65, style:'void',  blurb:'Тёмное ядро и фиолетовый край' },
    { id:'aura_berry', slot:'aura', name:'Ягодный свет', price:80, style:'berry', blurb:'Розово-фиолетовый ореол' },

    { id:'badge_none',   slot:'badge', name:'Без значка',  price:0,  icon:'',  free:true },
    { id:'badge_star',   slot:'badge', name:'Звезда',      price:30, icon:'⭐' },
    { id:'badge_flame',  slot:'badge', name:'Пламя',       price:40, icon:'🔥' },
    { id:'badge_leaf',   slot:'badge', name:'Лист',        price:35, icon:'🍃' },
    { id:'badge_bolt',   slot:'badge', name:'Разряд',      price:45, icon:'⚡' },
    { id:'badge_crown',  slot:'badge', name:'Корона',      price:90, icon:'👑' },
  ];

  function defaultOwnedCosmetics(){
    return AVATARS.map(function(a){ return a.id; }).concat(
      COSMETICS.filter(function(c){ return c.free; }).map(function(c){ return c.id; })
    );
  }

  function defaultEquipped(){
    return { avatar:'atlas', shape:'shape_hex', frame:'frame_none', aura:'aura_none', badge:'badge_none', photoId:null };
  }

  const PHOTO_MAX = 8;
  const PHOTO_SIZE = 256;

  /* ============== Runtime state ============== */
  let state = null;
  let currentScreen = 'dashboard';
  let settingsOpen = false;
  let pendingConfirm = null;
  let toasts = [];
  let lastAppliedTheme = null;
  let lastFxSignature = null;
  let charRoomTab = 'avatars';
  let shelfBookFocus = null;
  let cloudSaveTimer = null;
  let shelfPackWidthOverride = null;
  let shelfPackWidthUsed = null;
  let bookshelfReflowLock = false;
  const SHELVES_PER_CASE = 5;

  /* ============== Helpers ============== */
  function uid(){ return 'id' + Math.random().toString(36).slice(2,10); }

  function esc(str){
    if(str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function pluralRu(n, one, few, many){
    const abs = Math.abs(Number(n) || 0) % 100;
    const n1 = abs % 10;
    if(abs > 10 && abs < 20) return many;
    if(n1 === 1) return one;
    if(n1 >= 2 && n1 <= 4) return few;
    return many;
  }

  function initials(name){
    const parts = (name||'?').trim().split(/\s+/).filter(Boolean);
    if(!parts.length) return '?';
    return parts.slice(0,2).map(p=>p[0]).join('').toUpperCase();
  }

  function todayKey(){ return new Date().toDateString(); }

  function xpThreshold(level){
    if(level <= 1) return 0;
    return (level-1) * (100 + 25*(level-2));
  }

  function levelFromXp(xp){
    let lvl = 1;
    while(xpThreshold(lvl+1) <= xp){ lvl++; if(lvl>999) break; }
    return lvl;
  }

  function levelTitle(level){
    if(level>=20) return 'Легенда';
    if(level>=15) return 'Мастер';
    if(level>=10) return 'Чемпион';
    if(level>=7)  return 'Герой';
    if(level>=4)  return 'Авантюрист';
    if(level>=2)  return 'Искатель';
    return 'Новичок';
  }

  function statColorHex(varName){
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
    return (v || '#e8b84c').trim();
  }

  function dominantColor(){
    if(!state) return 'var(--gold)';
    const s = state.stats;
    const entries = [['--crimson',s.strength],['--teal',s.endurance],['--violet',s.intelligence],['--gold',s.discipline]];
    entries.sort((a,b)=>b[1]-a[1]);
    return 'var(' + entries[0][0] + ')';
  }

  function isThemeAnimOn(themeId){
    if(!THEME_FX[themeId]) return false;
    if(!state || !state.themeAnim) return true;
    return state.themeAnim[themeId] !== false;
  }

  function buildThemeFx(theme){
    const fx = THEME_FX[theme];
    if(!fx) return '';
    let html = '';
    const n = fx.count || 12;
    for(let i=0;i<n;i++){
      const left = (Math.random()*100).toFixed(1);
      const delay = (Math.random() * (fx.kind==='rain' ? 3 : 14)).toFixed(1);
      const drift = (Math.random()*100 - 50).toFixed(0);
      if(fx.kind === 'emoji'){
        const duration = (8 + Math.random()*10).toFixed(1);
        const size = (12 + Math.random()*12).toFixed(0);
        const opacity = (0.35 + Math.random()*0.45).toFixed(2);
        html += '<span class="fx-particle fx-petal" style="left:' + left + '%; animation-duration:' + duration + 's; animation-delay:-' + delay + 's; --drift:' + drift + 'px; font-size:' + size + 'px; opacity:' + opacity + ';">' + fx.glyph + '</span>';
      } else if(fx.kind === 'ash'){
        const duration = (9 + Math.random()*10).toFixed(1);
        const size = (2 + Math.random()*3.5).toFixed(1);
        const opacity = (0.12 + Math.random()*0.28).toFixed(2);
        html += '<span class="fx-particle fx-ash" style="left:' + left + '%; width:' + size + 'px; height:' + size + 'px; animation-duration:' + duration + 's; animation-delay:-' + delay + 's; --drift:' + drift + 'px; opacity:' + opacity + ';"></span>';
      } else if(fx.kind === 'rain'){
        const duration = (0.7 + Math.random()*0.9).toFixed(1);
        const h = (12 + Math.random()*18).toFixed(0);
        const opacity = (0.2 + Math.random()*0.35).toFixed(2);
        html += '<span class="fx-particle fx-rain" style="left:' + left + '%; height:' + h + 'px; animation-duration:' + duration + 's; animation-delay:-' + delay + 's; opacity:' + opacity + ';"></span>';
      } else if(fx.kind === 'bubble'){
        const duration = (10 + Math.random()*12).toFixed(1);
        const size = (6 + Math.random()*16).toFixed(0);
        const opacity = (0.18 + Math.random()*0.35).toFixed(2);
        html += '<span class="fx-particle fx-bubble" style="left:' + left + '%; width:' + size + 'px; height:' + size + 'px; animation-duration:' + duration + 's; animation-delay:-' + delay + 's; --drift:' + drift + 'px; opacity:' + opacity + ';"></span>';
      }
    }
    return html;
  }

  function applyTheme(force){
    const theme = state ? (state.theme || 'obsidian') : 'obsidian';
    const animOn = isThemeAnimOn(theme);
    const fxSig = theme + ':' + (animOn ? 'on' : 'off');
    if(!force && theme === lastAppliedTheme && fxSig === lastFxSignature) return;
    lastAppliedTheme = theme;
    lastFxSignature = fxSig;
    document.documentElement.setAttribute('data-theme', theme);
    const layer = document.getElementById('petal-layer');
    if(!layer) return;
    layer.innerHTML = '';
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(animOn && !reduceMotion && THEME_FX[theme]){
      layer.innerHTML = buildThemeFx(theme);
    }
  }

  function getAvatarDef(id){
    return AVATARS.find(function(a){ return a.id===id; }) || AVATARS[0];
  }
  function getCosmetic(id){
    return COSMETICS.find(function(c){ return c.id===id; }) || null;
  }
  function ownsCosmetic(id){
    return !!(state && state.cosmetics && state.cosmetics.owned && state.cosmetics.owned.indexOf(id) !== -1);
  }
  function equippedOf(slot){
    if(!state || !state.cosmetics || !state.cosmetics.equipped) return null;
    return state.cosmetics.equipped[slot];
  }

  function characterPortrait(opts){
    opts = opts || {};
    const size = opts.size || 56;
    const name = opts.name || (state && state.character ? state.character.name : '?');
    const glowColor = opts.glowColor || 'var(--gold)';

    if(opts.plain || !state || !state.cosmetics){
      return '<div class="char-portrait shape-hex" style="--size:' + size + 'px;"><div class="char-frame"><div class="hex-avatar avatar-skin-atlas" style="--size:' + size + 'px; --glow-color:' + glowColor + ';"><span>' + esc(initials(name)) + '</span></div></div></div>';
    }

    const eq = state.cosmetics.equipped || defaultEquipped();
    const avatar = getAvatarDef(eq.avatar);
    const shape = getCosmetic(eq.shape) || getCosmetic('shape_hex');
    const frame = getCosmetic(eq.frame) || getCosmetic('frame_none');
    const aura = getCosmetic(eq.aura) || getCosmetic('aura_none');
    const badge = getCosmetic(eq.badge) || getCosmetic('badge_none');
    const shapeStyle = (shape && shape.style) || 'hex';
    const photo = getPhoto(eq.photoId);
    const glyph = avatar.glyph ? avatar.glyph : esc(initials(name));
    const framed = frame && frame.style !== 'none';
    const auraOn = aura && aura.style !== 'none';
    const badgeOn = badge && badge.icon;

    return '' +
      '<div class="char-portrait shape-' + shapeStyle + '" style="--size:' + size + 'px; --glow-color:' + glowColor + ';">' +
        '<div class="char-aura char-aura-' + (aura ? aura.style : 'none') + (auraOn ? ' is-on' : '') + '"></div>' +
        '<div class="char-frame char-frame-' + (frame ? frame.style : 'none') + (framed ? ' is-framed' : '') + '">' +
          '<div class="char-frame-ring"></div>' +
          '<div class="hex-avatar avatar-skin-' + avatar.skin + (photo ? ' avatar-has-photo' : '') + '" style="--size:' + size + 'px; --glow-color:' + glowColor + ';">' +
            (photo
              ? '<img class="avatar-photo" src="' + String(photo.dataUrl).replace(/"/g, '') + '" alt="">'
              : (avatar.glyph
                ? '<span class="avatar-glyph">' + glyph + '</span>'
                : '<span>' + glyph + '</span>')) +
          '</div>' +
        '</div>' +
        '<div class="char-badge-slot' + (badgeOn ? ' is-on' : '') + '">' + (badgeOn ? badge.icon : '') + '</div>' +
      '</div>';
  }

  function hexAvatar(name, size, glowColor){
    return characterPortrait({ name:name, size:size, glowColor:glowColor });
  }

  function addSparks(amount){
    if(!state) return 0;
    state.sparks = (state.sparks || 0) + amount;
    if(state.sparks < 0) state.sparks = 0;
    return amount;
  }

  function buyCosmetic(id){
    const item = getCosmetic(id);
    if(!item || item.free) return;
    if(ownsCosmetic(id)){ toast('Уже куплено', 'info'); return; }
    if((state.sparks || 0) < item.price){
      toast('Не хватает искр · нужно ' + item.price, 'info');
      return;
    }
    state.sparks -= item.price;
    state.cosmetics.owned.push(id);
    state.cosmetics.equipped[item.slot] = id;
    save(); render();
    toast('Куплено: ' + item.name + ' · −' + item.price + ' ✦', 'success');
  }

  function equipCosmetic(id){
    if(AVATARS.some(function(a){ return a.id===id; })){
      if(!ownsCosmetic(id)) return;
      state.cosmetics.equipped.avatar = id;
      state.cosmetics.equipped.photoId = null;
      save(); render();
      toast('Аватар: ' + getAvatarDef(id).name, 'success');
      return;
    }
    const item = getCosmetic(id);
    if(!item) return;
    if(!ownsCosmetic(id)){ buyCosmetic(id); return; }
    state.cosmetics.equipped[item.slot] = id;
    save(); render();
    toast('Надето: ' + item.name, 'success');
  }

  function photoStoreKey(){
    const uid = (window.BeyondCloud && BeyondCloud.getCurrentUser && BeyondCloud.getCurrentUser())
      ? BeyondCloud.getCurrentUser().uid
      : 'local';
    return 'beyond-photos-' + uid;
  }

  function readPhotoBlobs(){
    try{
      return JSON.parse(localStorage.getItem(photoStoreKey()) || '{}') || {};
    }catch(e){
      return {};
    }
  }

  function writePhotoBlobs(map){
    try{
      localStorage.setItem(photoStoreKey(), JSON.stringify(map));
      return true;
    }catch(e){
      console.error('photo store failed', e);
      return false;
    }
  }

  function getPhoto(id){
    if(!id || !state || !state.cosmetics || !state.cosmetics.photos) return null;
    const meta = state.cosmetics.photos.find(function(p){ return p.id===id; });
    if(!meta) return null;
    const blobs = readPhotoBlobs();
    const dataUrl = meta.dataUrl || blobs[id];
    if(!dataUrl) return null;
    return { id:meta.id, createdAt:meta.createdAt, dataUrl:dataUrl };
  }

  function migratePhotosToBlobStore(){
    if(!state || !state.cosmetics || !state.cosmetics.photos) return;
    const blobs = readPhotoBlobs();
    let changed = false;
    state.cosmetics.photos = state.cosmetics.photos.map(function(p){
      if(p && p.dataUrl){
        blobs[p.id] = p.dataUrl;
        changed = true;
        return { id:p.id, createdAt:p.createdAt || Date.now() };
      }
      return { id:p.id, createdAt:p.createdAt || Date.now() };
    }).filter(function(p){ return p && p.id; });
    if(changed) writePhotoBlobs(blobs);
  }

  function compressImageFile(file){
    return new Promise(function(resolve, reject){
      if(!file || !file.type || file.type.indexOf('image/') !== 0){
        reject(new Error('Нужен файл изображения'));
        return;
      }
      if(file.size > 12 * 1024 * 1024){
        reject(new Error('Файл слишком большой (макс. 12 МБ)'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function(){ reject(new Error('Не удалось прочитать файл')); };
      reader.onload = function(){
        const img = new Image();
        img.onerror = function(){ reject(new Error('Повреждённое изображение')); };
        img.onload = function(){
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, PHOTO_SIZE / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          let quality = 0.7;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while(dataUrl.length > 120000 && quality > 0.35){
            quality -= 0.08;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(file){
    try{
      if(!state.cosmetics.photos) state.cosmetics.photos = [];
      if(state.cosmetics.photos.length >= PHOTO_MAX){
        toast('Максимум ' + PHOTO_MAX + ' фото. Удали лишнее.', 'info');
        return;
      }
      toast('Сжимаю фото…', 'info');
      const dataUrl = await compressImageFile(file);
      const id = uid();
      const blobs = readPhotoBlobs();
      blobs[id] = dataUrl;
      if(!writePhotoBlobs(blobs)){
        toast('Не хватило места в браузере для фото', 'info');
        return;
      }
      state.cosmetics.photos.push({ id:id, createdAt:Date.now() });
      state.cosmetics.equipped.photoId = id;
      save(); render();
      toast('Фото добавлено на аватар', 'success');
    }catch(err){
      toast(err.message || 'Ошибка загрузки', 'info');
    }
  }

  function equipPhoto(id){
    if(!getPhoto(id)){
      toast('Фото не найдено на этом устройстве', 'info');
      return;
    }
    state.cosmetics.equipped.photoId = id;
    save(); render();
    toast('Фото надето', 'success');
  }

  function clearPhoto(){
    state.cosmetics.equipped.photoId = null;
    save(); render();
    toast('Снова стиль-аватар', 'info');
  }

  function deletePhoto(id){
    askConfirm('Удалить это фото?', function(){
      state.cosmetics.photos = (state.cosmetics.photos || []).filter(function(p){ return p.id!==id; });
      const blobs = readPhotoBlobs();
      delete blobs[id];
      writePhotoBlobs(blobs);
      if(state.cosmetics.equipped.photoId === id) state.cosmetics.equipped.photoId = null;
      save(); render();
    });
  }

  function ensureCosmeticsState(){
    if(!state) return;
    state.sparks = state.sparks ?? 30;
    state.cosmetics = state.cosmetics || { owned: defaultOwnedCosmetics(), equipped: defaultEquipped(), photos: [] };
    state.cosmetics.owned = state.cosmetics.owned || defaultOwnedCosmetics();
    state.cosmetics.equipped = state.cosmetics.equipped || defaultEquipped();
    state.cosmetics.photos = state.cosmetics.photos || [];
    if(state.cosmetics.equipped.photoId === undefined) state.cosmetics.equipped.photoId = null;
    defaultOwnedCosmetics().forEach(function(id){
      if(state.cosmetics.owned.indexOf(id) === -1) state.cosmetics.owned.push(id);
    });
    ['avatar','shape','frame','aura','badge'].forEach(function(slot){
      if(!state.cosmetics.equipped[slot]) state.cosmetics.equipped[slot] = defaultEquipped()[slot];
    });
    if(!ownsCosmetic(state.cosmetics.equipped.avatar)) state.cosmetics.equipped.avatar = 'atlas';
    if(!ownsCosmetic(state.cosmetics.equipped.shape)) state.cosmetics.equipped.shape = 'shape_hex';
    migratePhotosToBlobStore();
    if(state.cosmetics.equipped.photoId && !getPhoto(state.cosmetics.equipped.photoId)){
      state.cosmetics.equipped.photoId = null;
    }
  }

  function stateForPersist(){
    const copy = JSON.parse(JSON.stringify(state));
    if(copy.cosmetics && Array.isArray(copy.cosmetics.photos)){
      copy.cosmetics.photos = copy.cosmetics.photos.map(function(p){
        return { id:p.id, createdAt:p.createdAt || Date.now() };
      });
    }
    return copy;
  }

  function segBar(value, max, colorVar, segments){
    segments = segments || 12;
    const safeMax = max > 0 ? max : 1;
    const pct = Math.max(0, Math.min(100, (value/safeMax)*100));
    let ticks = '';
    for(let i=1;i<segments;i++){
      ticks += '<span class="tick" style="left:' + (i*100/segments) + '%"></span>';
    }
    return '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%; background:var(' + colorVar + '); box-shadow:0 0 8px var(' + colorVar + ');"></div>' + ticks + '</div>';
  }

  function defaultTasks(){
    return [];
  }

  function installLifeFeatures(){
    if(window.LifeFeatures){
      LifeFeatures.install({
        getState: function(){ return state; },
        save: save,
        render: render,
        setScreen: function(screen){ currentScreen = screen; },
        uid: uid,
        todayKey: todayKey,
        esc: esc,
        segBar: segBar,
        addStat: addStat,
        addXp: addXp,
        addSparks: addSparks,
        logToday: logToday,
        checkAchievements: checkAchievements,
        showRewardMoment: showRewardMoment,
        currentStatMax: currentStatMax,
        levelTitle: levelTitle,
        touchStreakForToday: touchStreakForToday,
        toast: toast,
        askConfirm: askConfirm,
        maybeClaimHabitsBonus: maybeClaimHabitsBonus,
      });
    }
    if(window.Daybook){
      Daybook.install({
        getState: function(){ return state; },
        save: save,
        render: render,
        setScreen: function(screen){ currentScreen = screen; },
        todayKey: todayKey,
        esc: esc,
        addStat: addStat,
        addXp: addXp,
        addSparks: addSparks,
        logToday: logToday,
        checkAchievements: checkAchievements,
        showRewardMoment: showRewardMoment,
        currentStatMax: currentStatMax,
        toast: toast,
        characterPortrait: characterPortrait,
        dominantColor: dominantColor,
      });
    }
  }

  function newCharacterState(opts){
    return {
      character:{ name: opts.name || 'Герой', age: opts.age ? Number(opts.age) : null, gender: opts.gender || '', createdAt: Date.now() },
      trackedAreas: opts.tracked || { workouts:true, books:true, goals:true, tasks:true },
      theme:'obsidian',
      themeAnim:{},
      level:1, xp:0,
      sparks:30,
      cosmetics:{ owned: defaultOwnedCosmetics(), equipped: defaultEquipped(), photos: [] },
      stats:{ strength:0, endurance:0, intelligence:0, discipline:0 },
      todayLog:[],
      workouts:[], exercises:[], cardioMinutes:0, habits:[], vices:[], weekPlan:null, weekDone:{},
      bookPalette:'classic', vicesIntroSeen:false,
      books:[], tasks:[], goals:[], friends:[],
      records:{},
      unlockedAchievements:[], totalTasksCompleted:0, totalRecords:0,
      streak:0, lastActiveDay:null, lastClosedDay:null,
      journal:{}, stickers:{ owned:[], pinned:[], unlockedAt:{} },
      profileTitle:'novice',
      streakFreeze:{ week:null, used:0 },
      tasksResetDay: todayKey(),
      habitsBonusDay:null,
    };
  }

  function migrateState(){
    if(!state) return;
    state.unlockedAchievements = state.unlockedAchievements || [];
    state.totalTasksCompleted = state.totalTasksCompleted ?? 0;
    state.totalRecords = state.totalRecords ?? 0;
    state.streak = state.streak ?? 0;
    state.lastActiveDay = state.lastActiveDay ?? state.lastEndDay ?? null;
    state.lastClosedDay = state.lastClosedDay ?? null;
    state.journal = state.journal || {};
    state.stickers = state.stickers || { owned:[], pinned:[], unlockedAt:{} };
    state.profileTitle = state.profileTitle || 'novice';
    state.streakFreeze = state.streakFreeze || { week:null, used:0 };
    state.records = state.records || {};
    state.todayLog = state.todayLog || [];
    state.friends = state.friends || [];
    state.goals = state.goals || [];
    state.books = state.books || [];
    state.workouts = state.workouts || [];
    state.tasks = state.tasks || defaultTasks();
    state.tasks.forEach(function(t){
      if(t.daily === undefined) t.daily = true;
    });
    state.tasksResetDay = state.tasksResetDay ?? null;
    state.habitsBonusDay = state.habitsBonusDay ?? null;
    state.trackedAreas = state.trackedAreas || { workouts:true, books:true, goals:true, tasks:true };
    state.theme = state.theme || 'obsidian';
    if(state.theme === 'ocean' || state.theme === 'aurora') state.theme = 'depth';
    if(['frost','sunset','lava','mist'].indexOf(state.theme) !== -1) state.theme = 'obsidian';
    state.themeAnim = state.themeAnim || {};
    Object.keys(THEME_FX).forEach(function(id){
      if(state.themeAnim[id] === undefined) state.themeAnim[id] = true;
    });
    state.level = state.level || 1;
    state.xp = state.xp || 0;
    state.level = levelFromXp(state.xp);
    state.stats = state.stats || { strength:0, endurance:0, intelligence:0, discipline:0 };
    ensureCosmeticsState();
    if(window.LifeFeatures) LifeFeatures.migrate(state);
    if(window.Daybook){
      Daybook.migrate(state);
      Daybook.reconcileFlame(state);
    } else {
      reconcileStreak();
    }
  }

  function reconcileStreak(){
    // Legacy fallback when Daybook is absent: streak follows last activity.
    if(!state || !state.lastActiveDay) return;
    const today = todayKey();
    if(state.lastActiveDay === today) return;
    const last = new Date(state.lastActiveDay);
    const now = new Date(today);
    const diffDays = Math.round((now - last) / 86400000);
    if(diffDays > 1) state.streak = 0;
  }

  /* ============== Persistence ============== */
  function activeStorageKey(){
    const u = window.BeyondCloud && BeyondCloud.getCurrentUser && BeyondCloud.getCurrentUser();
    return u ? ('beyond-state-' + u.uid) : 'beyond-state-guest';
  }

  function save(){
    if(!state) return;
    persistAvailable = true;
    const payload = stateForPersist();
    try{
      if(window.BeyondCloud && BeyondCloud.saveLocal){
        if(!BeyondCloud.saveLocal(payload)) persistAvailable = false;
      } else {
        localStorage.setItem(activeStorageKey(), JSON.stringify(payload));
      }
    }catch(e){ console.error('local save failed', e); persistAvailable = false; }

    if(window.BeyondCloud && BeyondCloud.getCurrentUser && BeyondCloud.getCurrentUser()){
      clearTimeout(cloudSaveTimer);
      cloudSaveTimer = setTimeout(function(){
        BeyondCloud.persistState(payload).catch(function(e){
          console.error('cloud save failed', e);
          toast('Облако недоступно — прогресс только на этом устройстве', 'info');
        });
      }, 450);
    }
  }

  async function load(){
    try{
      if(window.BeyondCloud && BeyondCloud.hydrateState){
        state = await BeyondCloud.hydrateState();
      } else {
        var raw = localStorage.getItem(activeStorageKey()) || localStorage.getItem(STORAGE_KEY);
        state = raw ? JSON.parse(raw) : null;
        if(state && state.state && state.character === undefined) state = state.state;
      }
      if(state) migrateState();
      if(state && resetDailyHabitsIfNeeded()){
        save();
      }
      persistAvailable = true;
    }catch(e){
      console.error('load failed', e);
      state = null;
      persistAvailable = false;
    }
  }

  /* ============== Activity touch (streak grows only via Daybook.closeDay) ============== */
  function touchStreakForToday(){
    // Marks today as active for logs/UI, but the flame streak advances only when the day is closed.
    state.lastActiveDay = todayKey();
  }

  /* ============== Reward moment ============== */
  function showRewardMoment(opts){
    // opts: { statKey, statLabel, statColorVar, fromValue, toValue, statMax, xp, message, tier }
    const layer = document.getElementById('reward-layer');
    if(!layer) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tier = opts.tier || 'normal';
    const colorHex = statColorHex(opts.statColorVar);
    const fromPct = Math.max(0, Math.min(100, (opts.fromValue/opts.statMax)*100));
    const toPct = Math.max(0, Math.min(100, (opts.toValue/opts.statMax)*100));

    const tierLabel = tier==='record' ? 'НОВЫЙ РЕКОРД' : (tier==='levelup' ? 'НОВЫЙ УРОВЕНЬ' : '');
    const ring = tier==='levelup' || tier==='record';

    const card = document.createElement('div');
    card.className = 'reward-card reward-' + tier;
    card.innerHTML =
      (tierLabel ? '<div class="reward-tier">' + tierLabel + '</div>' : '') +
      '<div class="reward-avatar-wrap">' + characterPortrait({ size:74, glowColor:colorHex }) + '</div>' +
      '<div class="reward-stat-name" style="color:' + colorHex + '">' + esc(opts.statLabel) + '</div>' +
      '<div class="reward-bar-track"><div class="reward-bar-fill" style="width:' + fromPct + '%; background:' + colorHex + '"></div></div>' +
      '<div class="reward-numbers"><span class="reward-statval" style="color:' + colorHex + '">' + Math.round(opts.fromValue) + '</span>' +
        '<span class="reward-xp">+' + opts.xp + ' XP</span></div>' +
      '<div class="reward-message">' + esc(opts.message) + '</div>';

    layer.innerHTML = '';
    layer.appendChild(card);

    if(navigator.vibrate){
      if(tier==='normal') navigator.vibrate(25);
      else if(tier==='record') navigator.vibrate([35,30,45]);
      else navigator.vibrate([30,40,30,40,60]);
    }

    const fill = card.querySelector('.reward-bar-fill');
    const valEl = card.querySelector('.reward-statval');
    const av = card.querySelector('.char-portrait .hex-avatar') || card.querySelector('.hex-avatar');
    if(ring && av) av.classList.add('reward-avatar-ring');
    if(av) av.style.setProperty('--rc', colorHex);

    if(reduceMotion){
      fill.style.width = toPct + '%';
      valEl.textContent = Math.round(opts.toValue);
    } else {
      requestAnimationFrame(function(){
        setTimeout(function(){
          fill.style.width = toPct + '%';
          if(av) av.classList.add('reward-avatar-pulse');
          if(tier!=='normal'){ card.classList.add('reward-flash'); }
          const start = opts.fromValue, end = opts.toValue, dur = 900, t0 = performance.now();
          function tick(now){
            const p = Math.min(1, (now-t0)/dur);
            valEl.textContent = Math.round(start + (end-start)*p);
            if(p<1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }, 120);
      });
    }

    const life = tier==='normal' ? 2600 : 3400;
    setTimeout(function(){
      card.classList.add('reward-out');
      setTimeout(function(){ if(layer.contains(card)) layer.removeChild(card); }, 400);
    }, life);
  }

  /* ============== Mutations ============== */
  function addXp(amount){
    const before = state.level;
    state.xp += amount;
    const newLevel = levelFromXp(state.xp);
    if(newLevel > state.level){
      state.level = newLevel;
      return { leveledUp:true, newLevel:newLevel };
    }
    return { leveledUp:false };
  }

  function addStat(key, amount){ state.stats[key] = (state.stats[key]||0) + amount; }

  function currentStatMax(){
    const rawMax = Math.max(state.stats.strength, state.stats.endurance, state.stats.intelligence, state.stats.discipline, 50);
    return Math.ceil(rawMax/50)*50;
  }

  function logToday(entry){
    state.todayLog.unshift({ icon:entry.icon, label:entry.label, detail:entry.detail });
  }

  function checkAchievements(){
    let gained = false;
    activeAchievements(state).forEach(function(a){
      if(a.check(state) && state.unlockedAchievements.indexOf(a.id) === -1){
        state.unlockedAchievements.push(a.id);
        gained = true;
        toast('Достижение: ' + a.title + ' ' + a.icon, 'achievement');
      }
    });
    if(gained && window.Daybook) Daybook.onAchievementsChanged(state);
  }

  /* ============== Daily habits ============== */
  function dailyHabits(){
    return (state.tasks || []).filter(function(t){ return !!t.daily; });
  }

  function oneOffTasks(){
    return (state.tasks || []).filter(function(t){ return !t.daily; });
  }

  function resetDailyHabitsIfNeeded(){
    if(!state) return false;
    const today = todayKey();
    if(state.tasksResetDay === today) return false;
    state.tasks.forEach(function(t){
      if(t.due === 'tomorrow') t.due = 'today';
    });
    state.todayLog = [];
    state.tasksResetDay = today;
    return true;
  }

  function habitsProgress(){
    if(window.LifeFeatures) return LifeFeatures.habitsProgressRhythm(state);
    const list = dailyHabits();
    const done = list.filter(function(t){ return t.done; }).length;
    return { total:list.length, done:done, complete: list.length>0 && done===list.length };
  }

  function maybeClaimHabitsBonus(){
    const prog = habitsProgress();
    if(!prog.complete) return null;
    if(state.habitsBonusDay === todayKey()) return null;
    state.habitsBonusDay = todayKey();
    const xp = 20;
    const sparks = addSparks(12);
    addXp(xp);
    touchStreakForToday();
    logToday({ icon:'🌅', label:'Все привычки', detail:'Бонус дня · +' + xp + ' XP · +' + sparks + ' ✦' });
    toast('Все привычки на сегодня! +' + xp + ' XP · +' + sparks + ' ✦', 'success');
    return { xp:xp, sparks:sparks };
  }

  function toggleTask(id){
    const t = state.tasks.find(function(x){ return x.id===id; });
    if(!t) return;
    t.done = !t.done;
    if(t.done && !t.rewarded){
      t.rewarded = true;
      state.totalTasksCompleted++;
      const before = state.stats.discipline;
      addStat('discipline', 5);
      touchStreakForToday();
      const lvl = addXp(10);
      const sparks = addSparks(5);
      logToday({ icon: t.daily ? '🔁' : '✅', label:t.text, detail:'+5 Дисциплина · +10 XP · +' + sparks + ' ✦' });
      const bonus = maybeClaimHabitsBonus();
      const statMax = currentStatMax();
      showRewardMoment({
        statKey:'discipline', statLabel:'Дисциплина', statColorVar:'--gold',
        fromValue:before, toValue:state.stats.discipline, statMax:statMax,
        xp:10, tier: lvl.leveledUp ? 'levelup' : 'normal',
        message: lvl.leveledUp
          ? ('Уровень ' + lvl.newLevel + '! ' + levelTitle(lvl.newLevel))
          : (bonus ? ('Привычка + все привычки! +' + bonus.sparks + ' ✦ бонус') : ('Готово. +' + sparks + ' искр.'))
      });
    }
    checkAchievements();
    save(); render();
  }

  function addTask(text, daily){
    state.tasks.push({ id:uid(), text:text, done:false, rewarded:false, daily: !!daily });
    save(); render();
  }

  function addWorkout(data){
    const isStrength = data.type === 'strength';
    const weight = Number(data.weight) || 0;
    const reps = Number(data.reps) || 0;
    const entry = {
      id:uid(), type:data.type,
      name: data.name || (isStrength ? 'Силовая тренировка' : 'Кардио'),
      duration: data.duration || '', notes: data.notes || '', distance: data.distance || '',
      weight: weight || '', reps: reps || '',
      date: new Date().toISOString(),
    };

    touchStreakForToday();

    if(isStrength){
      // base reward for showing up
      let gain = 8, xp = 30, sparksGain = 10, tier = 'normal', isRecord = false;
      let message = 'Силовая в зачёт. Персонаж стал крепче.';

      // progress reward: 1-rep-max estimate via Epley
      if(weight > 0 && reps > 0){
        const e1rm = Math.round(weight * (1 + reps/30));
        entry.e1rm = e1rm;
        const recKey = (entry.name || 'упражнение').trim().toLowerCase();
        const prev = state.records[recKey] || 0;
        if(e1rm > prev){
          isRecord = true;
          state.records[recKey] = e1rm;
          state.totalRecords++;
          gain = 16; xp = 60; sparksGain = 20; tier = 'record';
          message = prev>0
            ? ('Новый рекорд: ' + e1rm + ' кг (1ПМ). Так далеко ты ещё не заходил.')
            : ('Первый замер: ' + e1rm + ' кг (1ПМ). Точка отсчёта поставлена.');
        }
      }

      const before = state.stats.strength;
      addStat('strength', gain);
      const lvl = addXp(xp);
      const sparks = addSparks(sparksGain);
      const finalTier = lvl.leveledUp ? 'levelup' : tier;
      logToday({ icon: isRecord?'⚡':'💪', label:entry.name + (isRecord?' (рекорд)':''), detail:'+' + gain + ' Сила · +' + xp + ' XP · +' + sparks + ' ✦' });
      state.workouts.unshift(entry);
      checkAchievements(); save(); render();
      showRewardMoment({
        statKey:'strength', statLabel:'Сила', statColorVar:'--crimson',
        fromValue:before, toValue:state.stats.strength, statMax:currentStatMax(),
        xp:xp, tier:finalTier,
        message: lvl.leveledUp ? ('Уровень ' + lvl.newLevel + '! ' + levelTitle(lvl.newLevel)) : (message + ' +' + sparks + ' ✦')
      });
    } else {
      const duration = Number(data.duration) || 0;
      const distance = Number(data.distance) || 0;
      let gain = 8, xp = 30, sparksGain = 10, tier = 'normal';
      let message = 'Кардио в зачёт.';
      if(duration >= 20 || distance >= 3){
        gain = 10; xp = 40; sparksGain = 12;
        message = 'Хорошая сессия кардио.';
      }
      if(duration >= 45 || distance >= 8){
        gain = 14; xp = 55; sparksGain = 16; tier = 'record';
        message = 'Длинная сессия — выносливость растёт сильнее.';
      }
      const before = state.stats.endurance;
      addStat('endurance', gain);
      const lvl = addXp(xp);
      const sparks = addSparks(sparksGain);
      const finalTier = lvl.leveledUp ? 'levelup' : tier;
      logToday({ icon:'🏃', label:entry.name, detail:'+' + gain + ' Выносливость · +' + xp + ' XP · +' + sparks + ' ✦' });
      state.workouts.unshift(entry);
      checkAchievements(); save(); render();
      showRewardMoment({
        statKey:'endurance', statLabel:'Выносливость', statColorVar:'--teal',
        fromValue:before, toValue:state.stats.endurance, statMax:currentStatMax(),
        xp:xp, tier:finalTier,
        message: lvl.leveledUp ? ('Уровень ' + lvl.newLevel + '! ' + levelTitle(lvl.newLevel)) : (message + ' +' + sparks + ' ✦')
      });
    }
  }

  function addBook(data){
    const book = { id:uid(), title:data.title, author:data.author || 'Неизвестен', pages:data.pages || '', status:data.status, rewarded:false };
    if(book.status === 'done'){
      book.rewarded = true;
      const before = state.stats.intelligence;
      addStat('intelligence', 20);
      touchStreakForToday();
      const lvl = addXp(30);
      const sparks = addSparks(15);
      logToday({ icon:'📖', label:book.title, detail:'+20 Интеллект · +30 XP · +' + sparks + ' ✦' });
      state.books.unshift(book);
      checkAchievements();
      if(window.LifeFeatures) LifeFeatures.syncLinkedGoals();
      save(); render();
      showRewardMoment({
        statKey:'intelligence', statLabel:'Интеллект', statColorVar:'--violet',
        fromValue:before, toValue:state.stats.intelligence, statMax:currentStatMax(),
        xp:30, tier: lvl.leveledUp ? 'levelup' : 'normal',
        message: lvl.leveledUp ? ('Уровень ' + lvl.newLevel + '! ' + levelTitle(lvl.newLevel)) : ('Книга прочитана. +' + sparks + ' искр.')
      });
      return;
    }
    state.books.unshift(book);
    checkAchievements(); save(); render();
  }

  function completeBook(id){
    const b = state.books.find(function(x){ return x.id===id; });
    if(!b || b.rewarded) return;
    b.status = 'done'; b.rewarded = true;
    const before = state.stats.intelligence;
    addStat('intelligence', 20);
    touchStreakForToday();
    const lvl = addXp(30);
    const sparks = addSparks(15);
    logToday({ icon:'📖', label:b.title, detail:'+20 Интеллект · +30 XP · +' + sparks + ' ✦' });
    checkAchievements();
    if(window.LifeFeatures) LifeFeatures.syncLinkedGoals();
    save(); render();
    showRewardMoment({
      statKey:'intelligence', statLabel:'Интеллект', statColorVar:'--violet',
      fromValue:before, toValue:state.stats.intelligence, statMax:currentStatMax(),
      xp:30, tier: lvl.leveledUp ? 'levelup' : 'normal',
      message: lvl.leveledUp ? ('Уровень ' + lvl.newLevel + '! ' + levelTitle(lvl.newLevel)) : ('Книга прочитана. +' + sparks + ' искр.')
    });
  }

  function addGoal(data){
    const current = Number(data.current)||0;
    const target = Number(data.target)||1;
    const goal = {
      id:uid(), title:data.title, description:data.description||'',
      current:current, target:target, unit:data.unit||'',
    };
    state.goals.unshift(goal);
    if(target > 0 && current >= target){
      addXp(40);
      const sparks = addSparks(25);
      logToday({ icon:'🏆', label:'Цель достигнута: ' + goal.title, detail:'+40 XP · +' + sparks + ' ✦' });
      toast('Цель достигнута: ' + goal.title + ' · +' + sparks + ' ✦', 'success');
    }
    checkAchievements(); save(); render();
  }

  function updateGoalProgress(id, newVal){
    const g = state.goals.find(function(x){ return x.id===id; });
    if(!g) return;
    const wasComplete = g.target>0 && g.current >= g.target;
    g.current = Number(newVal) || 0;
    const nowComplete = g.target>0 && g.current >= g.target;
    if(!wasComplete && nowComplete){
      addXp(40);
      const sparks = addSparks(25);
      logToday({ icon:'🏆', label:'Цель достигнута: ' + g.title, detail:'+40 XP · +' + sparks + ' ✦' });
      toast('Цель достигнута: ' + g.title + ' · +' + sparks + ' ✦', 'success');
    }
    checkAchievements(); save(); render();
  }

  function addFriend(data){
    state.friends.push({ id:uid(), name:data.name, level:Number(data.level)||1 });
    save(); render();
  }

  function resetCharacter(){
    try{ localStorage.removeItem(photoStoreKey()); }catch(e){}
    try{ localStorage.removeItem('beyond-photos-local'); }catch(e){}
    state = null;
    currentScreen = 'dashboard';
    settingsOpen = false;
    try{
      if(window.BeyondCloud && BeyondCloud.clearLocal) BeyondCloud.clearLocal();
      else localStorage.removeItem(activeStorageKey());
      localStorage.removeItem(STORAGE_KEY);
    }catch(e){}
    if(window.BeyondCloud && BeyondCloud.deleteCloudAndLocal){ BeyondCloud.deleteCloudAndLocal().catch(function(){}); }
    render();
  }

  function toast(msg, kind){
    const id = uid();
    toasts.push({ id:id, msg:msg, kind:kind||'info' });
    render();
    setTimeout(function(){
      toasts = toasts.filter(function(t){ return t.id!==id; });
      render();
    }, 4200);
  }

  function dismissToast(id){
    toasts = toasts.filter(function(t){ return t.id!==id; });
    render();
  }

  function askConfirm(message, onConfirm){
    pendingConfirm = { message:message, onConfirm:onConfirm };
    render();
  }

  /* ============== Render: pieces ============== */
  function renderOnboarding(){
    const prefill = (window.BeyondCloud && BeyondCloud.getCurrentUser && BeyondCloud.getCurrentUser())
      ? (BeyondCloud.getCurrentUser().displayName || '')
      : '';
    return '' +
    '<div class="onboarding-screen"><div class="onboarding-card">' +
      '<div class="onboarding-eyebrow">BEYOND · Создание персонажа</div>' +
      '<h1>Выйди за пределы обычного дня</h1>' +
      '<p class="onboarding-sub">Тренировки, книги, задачи и цели прокачивают твоего персонажа. Никаких штрафов — только прогресс.</p>' +
      '<form data-form="onboarding" class="form-grid">' +
        '<div class="field field-wide"><label>Имя персонажа</label><input name="name" value="' + esc(prefill) + '" placeholder="Например, Атлас" required maxlength="40"></div>' +
        '<div class="field"><label>Возраст</label><input name="age" type="number" min="1" max="120" placeholder="не обязательно"></div>' +
        '<div class="field"><label>Пол</label><select name="gender"><option value="">Не указан</option><option value="male">Мужской</option><option value="female">Женский</option></select></div>' +
        '<div class="field field-wide"><label>Какие сферы хочешь отслеживать? (минимум одна)</label>' +
          '<div class="onboarding-areas">' +
            '<label class="check-row"><input type="checkbox" name="area_workouts" checked> 💪 Тренировки</label>' +
            '<label class="check-row"><input type="checkbox" name="area_books" checked> 📖 Книги</label>' +
            '<label class="check-row"><input type="checkbox" name="area_goals" checked> 🎯 Цели</label>' +
            '<label class="check-row"><input type="checkbox" name="area_tasks" checked> ✅ Задачи и привычки</label>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-primary" type="submit">Создать персонажа</button>' +
      '</form>' +
    '</div></div>';
  }

  function renderSidebar(){
    const items = [
      { key:'dashboard',     icon:'🏠', label:'Дашборд',     show:true },
      { key:'profile',       icon:'🪞', label:'Витрина',     show:true },
      { key:'character',     icon:'🎭', label:'Персонаж',    show:true },
      { key:'workouts',      icon:'💪', label:'Тренировки',  show:state.trackedAreas.workouts },
      { key:'books',         icon:'📖', label:'Книги',        show:state.trackedAreas.books },
      { key:'tasks',         icon:'✅', label:'Привычки',     show:state.trackedAreas.tasks },
      { key:'goals',         icon:'🎯', label:'Цели',         show:state.trackedAreas.goals },
      { key:'achievements',  icon:'🏆', label:'Достижения',  show:true },
      { key:'friends',       icon:'👥', label:'Друзья',       show:false },
    ];
    if(window.LifeFeatures){
      LifeFeatures.getSidebarExtras(state).forEach(function(x){
        if(x.show) items.push({ key:x.key, icon:x.icon, label:x.label, show:true });
      });
    }
    const navHtml = items.filter(function(i){ return i.show; }).map(function(i){
      return '<button class="nav-item ' + (currentScreen===i.key?'active':'') + '" data-action="nav" data-screen="' + i.key + '" title="' + i.label + '" aria-label="' + i.label + '">' +
        '<span class="nav-icon">' + i.icon + '</span><span class="nav-label">' + i.label + '</span></button>';
    }).join('');
    return '<aside class="sidebar">' +
      '<div class="sidebar-top">' + hexAvatar(state.character.name, 50, dominantColor()) +
        '<div><div class="sidebar-name">' + esc(state.character.name) + '</div>' +
        '<div class="sidebar-level">Ур. ' + state.level + ' · ' + (window.Daybook ? Daybook.titleName(state) : levelTitle(state.level)) + '</div>' +
        '<div class="sidebar-level" style="margin-top:3px;color:var(--gold);">✦ ' + (state.sparks||0) + ' · 🔥 ' + (state.streak||0) + '</div></div></div>' +
      '<nav class="sidebar-nav">' + navHtml + '</nav>' +
    '</aside>';
  }

  function renderTopbar(){
    const titles = { dashboard:'Дашборд', profile:'Витрина', character:'Комната персонажа', workouts:'Тренировки', books:'Книги', tasks:'Привычки', goals:'Цели', achievements:'Достижения', friends:'Друзья' };
    if(window.LifeFeatures) Object.assign(titles, LifeFeatures.getTopbarTitles());
    if(window.Daybook) Object.assign(titles, Daybook.getTopbarTitles());
    return '<header class="topbar"><h1>' + (titles[currentScreen]||'') + '</h1>' +
      '<div class="topbar-right">' +
      '<span class="sparks-chip" title="Искры — валюта персонажа"><span class="sparks-ico">✦</span>' + (state.sparks||0) + '</span>' +
      '<span class="sparks-chip flame-chip" title="Серия закрытых дней">🔥 ' + (state.streak||0) + '</span>' +
      (!persistAvailable ? '<span class="badge badge-warn">Без сохранения</span>' : '') +
      '<button class="btn-icon btn-settings" data-action="open-settings" title="Настройки" aria-label="Настройки">⚙️</button>' +
      '</div></header>';
  }

  function renderHabitRow(t, large){
    return '<label class="task-row ' + (large?'task-row-lg ':'') + (t.done?'task-done':'') + '">' +
      '<input type="checkbox" data-action="toggle-task" data-id="' + t.id + '" ' + (t.done?'checked':'') + '>' +
      '<span class="task-check"></span>' +
      '<span class="task-text">' + esc(t.text) + '</span>' +
      (t.daily ? '<span class="badge habit-badge">каждый день</span>' : '') +
      '<button type="button" class="btn-icon" data-action="delete-task" data-id="' + t.id + '" title="Удалить">✕</button></label>';
  }

  function renderDashboard(){
    const c = state.character;
    const lvl = state.level;
    const curThresh = xpThreshold(lvl);
    const nextThresh = xpThreshold(lvl+1);
    const xpIntoLevel = state.xp - curThresh;
    const xpNeeded = nextThresh - curThresh;
    const statMax = currentStatMax();
    const habits = window.LifeFeatures ? LifeFeatures.habitsScheduledToday(state) : dailyHabits();
    const prog = habitsProgress();

    const statsHtml = STAT_DEFS.map(function(s){
      return '<div class="stat-card" style="--stat-color:var(' + s.color + ');">' +
        '<div class="stat-icon">' + s.icon + '</div>' +
        '<div class="stat-info"><span class="stat-label">' + s.label + '</span><span class="stat-value">' + state.stats[s.key] + '</span></div>' +
        segBar(state.stats[s.key], statMax, s.color, 10) +
      '</div>';
    }).join('');

    let todayFocus = '';
    if(state.trackedAreas.tasks){
      if(habits.length){
        const habitRows = habits.slice(0, 5).map(function(h){
          if(window.LifeFeatures) return LifeFeatures.renderDashboardHabitRow(h, true);
          return renderHabitRow(h, true);
        }).join('');
        todayFocus =
          '<div class="panel today-focus">' +
            '<div class="today-focus-head">' +
              '<div><h2>Сегодня</h2><p class="screen-sub">Привычки по ритму — закрой запланированные на сегодня</p></div>' +
              '<div class="today-focus-meta">' +
                '<span class="today-count">' + prog.done + ' / ' + prog.total + '</span>' +
                (prog.complete ? '<span class="badge badge-done">привычки ✓</span>' : '') +
              '</div>' +
            '</div>' +
            segBar(prog.done, prog.total || 1, '--gold', Math.max(prog.total, 4)) +
            '<div class="today-habits">' + habitRows + '</div>' +
            (habits.length > 5 ? '<button class="btn btn-ghost btn-sm" data-action="nav" data-screen="tasks" style="margin-top:10px;">Все привычки →</button>' : '') +
          '</div>';
      } else {
        todayFocus =
          '<div class="panel today-focus">' +
            '<div class="today-focus-head"><div><h2>Сегодня</h2><p class="screen-sub">Добавь привычки с ритмом — не только «каждый день»</p></div></div>' +
            '<button class="btn btn-primary" data-action="nav" data-screen="tasks">Настроить привычки</button>' +
          '</div>';
      }
    }

    const activityHtml = state.todayLog.length ?
      '<ul class="today-list">' + state.todayLog.slice(0, 8).map(function(l){
        return '<li class="today-item"><span class="today-icon">' + l.icon + '</span><div><div class="today-label">' + esc(l.label) + '</div><div class="today-detail">' + esc(l.detail) + '</div></div></li>';
      }).join('') + '</ul>' :
      '<div class="empty-state">Пока тихо. Отметь привычку или тренировку.</div>';

    const quickItems = [];
    if(state.trackedAreas.workouts) quickItems.push('<button class="btn btn-ghost btn-quick" data-action="nav" data-screen="workouts">💪 Тренировка</button>');
    if(state.trackedAreas.books) quickItems.push('<button class="btn btn-ghost btn-quick" data-action="nav" data-screen="books">📖 Книга</button>');
    if(state.trackedAreas.tasks) quickItems.push('<button class="btn btn-ghost btn-quick" data-action="nav" data-screen="tasks">✅ Привычки</button>');
    if(state.trackedAreas.tasks || state.trackedAreas.workouts) quickItems.push('<button class="btn btn-ghost btn-quick" data-action="nav" data-screen="weekplan">📅 План</button>');
    if(state.trackedAreas.goals) quickItems.push('<button class="btn btn-ghost btn-quick" data-action="nav" data-screen="goals">🎯 Цель</button>');
    quickItems.push('<button class="btn btn-ghost btn-quick" data-action="nav" data-screen="profile">🪞 Витрина</button>');
    quickItems.push('<button class="btn btn-ghost btn-quick" data-action="nav" data-screen="character">🎭 Персонаж</button>');

    const titleLine = window.Daybook ? Daybook.titleName(state) : levelTitle(lvl);
    const flame = window.Daybook ? Daybook.flameTier(state.streak||0) : { emoji:'🔥', label:'' };
    const dayClosed = !!(state.journal && state.journal[todayKey()] && state.journal[todayKey()].closed);

    return '' +
    '<div class="panel dash-hero">' +
      '<div class="dash-avatar-block">' + hexAvatar(c.name, 84, dominantColor()) +
        '<div><div class="dash-name">' + esc(c.name) + '</div><div class="dash-title">' + esc(titleLine) + ' · Уровень ' + lvl + '</div>' +
        '<div class="dash-title" style="margin-top:6px;">✦ ' + (state.sparks||0) + ' ' + pluralRu(state.sparks||0, 'искра', 'искры', 'искр') +
          ' · ' + flame.emoji + ' ' + (state.streak||0) + (dayClosed ? ' · день закрыт' : ' · закрой день') + '</div></div></div>' +
      '<div class="dash-xp"><div class="xp-row"><span>Опыт до следующего уровня</span><span>' + xpIntoLevel + ' / ' + xpNeeded + ' XP</span></div>' +
        segBar(xpIntoLevel, xpNeeded, '--gold', 18) +
        '<div class="xp-total">Всего опыта: ' + state.xp + '</div></div>' +
    '</div>' +
    (window.Daybook ? Daybook.renderDaySpread() : '') +
    (window.LifeFeatures ? LifeFeatures.renderDashboardExtras() : '') +
    todayFocus +
    '<div class="stat-grid">' + statsHtml + '</div>' +
    '<div class="dash-grid">' +
      '<div class="panel today-panel"><div class="panel-head"><h3>Активность</h3></div>' +
        activityHtml + '<div class="streak-row">' + flame.emoji + ' Серия закрытых дней: <strong>' + (state.streak||0) + '</strong>' +
          (dayClosed ? ' · сегодня закрыт' : ' · сегодня ещё открыт') + '</div></div>' +
      '<div class="panel quick-panel"><h3 style="margin-bottom:12px;">Быстрые действия</h3><div class="quick-actions">' + quickItems.join('') + '</div></div>' +
    '</div>';
  }

  function cosmeticActionButton(id, owned, equipped, price){
    if(equipped) return '<button class="btn btn-ghost btn-sm" disabled>Надето</button>';
    if(owned) return '<button class="btn btn-primary btn-sm" data-action="equip-cosmetic" data-id="' + id + '">Надеть</button>';
    return '<button class="btn btn-primary btn-sm" data-action="buy-cosmetic" data-id="' + id + '">Купить · ' + price + ' ✦</button>';
  }

  function renderAvatarCards(){
    const eq = equippedOf('avatar');
    return '<div class="cosmetic-grid">' + AVATARS.map(function(a){
      const owned = ownsCosmetic(a.id);
      const equipped = eq === a.id;
      const previewEq = {
        avatar:a.id,
        shape: equippedOf('shape') || 'shape_hex',
        frame: equippedOf('frame') || 'frame_none',
        aura: equippedOf('aura') || 'aura_none',
        badge: equippedOf('badge') || 'badge_none',
        photoId: null,
      };
      const prevOwned = state.cosmetics.equipped;
      state.cosmetics.equipped = previewEq;
      const preview = characterPortrait({ size:64, name:state.character.name, glowColor:dominantColor() });
      state.cosmetics.equipped = prevOwned;
      return '<div class="cosmetic-card ' + (equipped?'is-equipped':'') + (owned?'':' is-locked') + '">' +
        '<div class="cosmetic-preview">' + preview + '</div>' +
        '<div class="cosmetic-title">' + esc(a.name) + '</div>' +
        '<div class="cosmetic-sub">' + esc(a.blurb) + '</div>' +
        cosmeticActionButton(a.id, owned, equipped, 0) +
      '</div>';
    }).join('') + '</div>';
  }

  function renderSlotCards(slot){
    const items = COSMETICS.filter(function(c){ return c.slot===slot; });
    const eq = equippedOf(slot);
    return '<div class="cosmetic-grid">' + items.map(function(item){
      const owned = ownsCosmetic(item.id);
      const equipped = eq === item.id;
      const previewEq = Object.assign({}, state.cosmetics.equipped);
      previewEq[slot] = item.id;
      // keep current photo when previewing shape/frame/etc
      const prev = state.cosmetics.equipped;
      state.cosmetics.equipped = previewEq;
      const preview = characterPortrait({ size:64, name:state.character.name, glowColor:dominantColor() });
      state.cosmetics.equipped = prev;
      return '<div class="cosmetic-card ' + (equipped?'is-equipped':'') + (owned?'':' is-locked') + '">' +
        '<div class="cosmetic-preview">' + preview + '</div>' +
        '<div class="cosmetic-title">' + esc(item.name) + '</div>' +
        '<div class="cosmetic-sub">' + (item.blurb ? esc(item.blurb) : (item.free ? 'Бесплатно' : (item.price + ' ✦'))) + '</div>' +
        cosmeticActionButton(item.id, owned, equipped, item.price) +
      '</div>';
    }).join('') + '</div>';
  }

  function renderShopAll(){
    const buyable = COSMETICS.filter(function(c){ return !c.free && !ownsCosmetic(c.id); });
    if(!buyable.length){
      return '<div class="empty-state">Ты купил всё из текущего набора. Новые вещи появятся позже.</div>';
    }
    return '<p class="shop-hint">Искры зарабатываются за задачи, тренировки, книги и цели. Сейчас у тебя <strong>✦ ' + (state.sparks||0) + '</strong>.</p>' +
      '<div class="cosmetic-grid">' + buyable.map(function(item){
        const previewEq = Object.assign({}, state.cosmetics.equipped);
        previewEq[item.slot] = item.id;
        const prev = state.cosmetics.equipped;
        state.cosmetics.equipped = previewEq;
        const preview = characterPortrait({ size:64, name:state.character.name, glowColor:dominantColor() });
        state.cosmetics.equipped = prev;
        const canAfford = (state.sparks||0) >= item.price;
        return '<div class="cosmetic-card is-locked">' +
          '<div class="cosmetic-preview">' + preview + '</div>' +
          '<div class="cosmetic-title">' + esc(item.name) + '</div>' +
          '<div class="cosmetic-sub">' + ({shape:'Форма',frame:'Рамка',aura:'Аура',badge:'Значок'}[item.slot] || item.slot) + ' · ' + item.price + ' ✦</div>' +
          '<button class="btn ' + (canAfford?'btn-primary':'btn-ghost') + ' btn-sm" data-action="buy-cosmetic" data-id="' + item.id + '">' +
            (canAfford ? ('Купить · ' + item.price + ' ✦') : 'Мало искр') +
          '</button></div>';
      }).join('') + '</div>';
  }

  function renderPhotosPanel(){
    const photos = state.cosmetics.photos || [];
    const active = state.cosmetics.equipped.photoId;
    const cards = photos.map(function(p, idx){
      const full = getPhoto(p.id);
      const equipped = active === p.id;
      const previewHtml = full
        ? (function(){
            const previewEq = Object.assign({}, state.cosmetics.equipped, { photoId: p.id });
            const prev = state.cosmetics.equipped;
            state.cosmetics.equipped = previewEq;
            const preview = characterPortrait({ size:72, name:state.character.name, glowColor:dominantColor() });
            state.cosmetics.equipped = prev;
            return preview;
          })()
        : '<div class="photo-missing">нет файла</div>';
      return '<div class="cosmetic-card ' + (equipped?'is-equipped':'') + (!full?' is-locked':'') + '">' +
        '<div class="cosmetic-preview">' + previewHtml + '</div>' +
        '<div class="cosmetic-title">Фото ' + (idx+1) + '</div>' +
        '<div class="cosmetic-sub">' + (!full ? 'Нужно загрузить снова' : (equipped ? 'На аватаре' : 'В галерее')) + '</div>' +
        '<div class="photo-actions">' +
          (full
            ? (equipped
              ? '<button class="btn btn-ghost btn-sm" data-action="clear-photo">Убрать</button>'
              : '<button class="btn btn-primary btn-sm" data-action="equip-photo" data-id="' + p.id + '">Надеть</button>')
            : '') +
          '<button class="btn btn-ghost btn-sm" data-action="delete-photo" data-id="' + p.id + '">Удалить</button>' +
        '</div></div>';
    }).join('');

    return '' +
      '<p class="shop-hint">Загрузи своё лицо или любую картинку. Фото хранятся <strong>только на этом устройстве</strong> (до ' + PHOTO_MAX + ' шт.), в облако не уходят — на другом телефоне нужно загрузить снова.</p>' +
      '<div class="photo-upload-row">' +
        '<label class="btn btn-primary photo-upload-btn">' +
          '＋ Добавить фото' +
          '<input type="file" accept="image/*" data-action="upload-photo" hidden>' +
        '</label>' +
        (active ? '<button class="btn btn-ghost" data-action="clear-photo">Вернуть стиль-аватар</button>' : '') +
      '</div>' +
      (photos.length
        ? '<div class="cosmetic-grid" style="margin-top:14px;">' + cards + '</div>'
        : '<div class="empty-state" style="margin-top:14px;">Пока нет фото. Добавь первое — оно сразу сядет на аватар.</div>');
  }

  function renderCharacter(){
    const eq = state.cosmetics.equipped;
    const avatar = getAvatarDef(eq.avatar);
    const frame = getCosmetic(eq.frame);
    const aura = getCosmetic(eq.aura);
    const badge = getCosmetic(eq.badge);
    const photo = getPhoto(eq.photoId);
    const tabs = [
      { id:'avatars', label:'Аватары' },
      { id:'photos',  label:'Фото' },
      { id:'shapes',  label:'Форма' },
      { id:'frames',  label:'Рамки' },
      { id:'auras',   label:'Ауры' },
      { id:'badges',  label:'Значки' },
      { id:'shop',    label:'Магазин' },
    ];
    const tabsHtml = tabs.map(function(t){
      return '<button type="button" class="char-tab ' + (charRoomTab===t.id?'active':'') + '" data-action="char-tab" data-tab="' + t.id + '">' + t.label + '</button>';
    }).join('');

    let body = '';
    if(charRoomTab === 'avatars') body = renderAvatarCards();
    else if(charRoomTab === 'photos') body = renderPhotosPanel();
    else if(charRoomTab === 'shapes') body = renderSlotCards('shape');
    else if(charRoomTab === 'frames') body = renderSlotCards('frame');
    else if(charRoomTab === 'auras') body = renderSlotCards('aura');
    else if(charRoomTab === 'badges') body = renderSlotCards('badge');
    else body = renderShopAll();

    return '' +
    '<div class="char-room">' +
      '<div class="char-stage">' +
        characterPortrait({ size:120, name:state.character.name, glowColor:dominantColor() }) +
        '<div class="char-stage-name">' + esc(state.character.name) + '</div>' +
        '<div class="char-stage-meta">' + (window.Daybook ? Daybook.titleName(state) : levelTitle(state.level)) + ' · Ур. ' + state.level + ' · ✦ ' + (state.sparks||0) + '</div>' +
        '<div class="char-stage-loadout">' +
          '<span class="loadout-pill">' + (photo ? 'Фото' : esc(avatar.name)) + '</span>' +
          '<span class="loadout-pill">' + esc((getCosmetic(eq.shape)||{}).name || 'Грань') + '</span>' +
          '<span class="loadout-pill">' + esc(frame ? frame.name : '—') + '</span>' +
          '<span class="loadout-pill">' + esc(aura ? aura.name : '—') + '</span>' +
          '<span class="loadout-pill">' + esc(badge ? badge.name : '—') + '</span>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-action="nav" data-screen="profile" style="margin-top:12px;">Открыть витрину →</button>' +
      '</div>' +
      '<div class="char-tabs">' + tabsHtml + '</div>' +
      '<div class="panel">' + body + '</div>' +
    '</div>';
  }

  function renderWorkouts(){
    if(window.LifeFeatures) return LifeFeatures.renderWorkouts();
    const list = state.workouts.length ? state.workouts.map(function(w){
      const meta = [];
      if(w.weight && w.reps) meta.push(esc(w.weight) + ' кг × ' + esc(w.reps));
      if(w.e1rm) meta.push('1ПМ ~' + esc(w.e1rm) + ' кг');
      if(w.duration) meta.push(esc(w.duration) + ' мин');
      if(w.distance) meta.push(esc(w.distance) + ' км');
      meta.push(w.type==='strength' ? 'Сила' : 'Выносливость');
      return '<div class="entry-card"><div class="entry-icon">' + (w.type==='strength'?'💪':'🏃') + '</div>' +
        '<div class="entry-body"><div class="entry-title">' + esc(w.name) + '</div><div class="entry-meta">' + meta.join(' · ') + '</div>' +
        (w.notes ? '<div class="entry-notes">' + esc(w.notes) + '</div>' : '') + '</div>' +
        '<button class="btn-icon" data-action="delete-workout" data-id="' + w.id + '" title="Удалить">✕</button></div>';
    }).join('') : '<div class="empty-state">Пока нет тренировок. Добавь первую — и получишь достижение!</div>';

    return '' +
    '<div class="screen-head"><h2>Тренировки</h2><p class="screen-sub">Силовые качают Силу (вес × повторы — рекорд даёт бо́льшую награду). Кардио качает Выносливость — награда растёт с длительностью и дистанцией.</p></div>' +
    '<div class="panel form-panel"><form data-form="add-workout" class="form-grid is-strength">' +
      '<div class="toggle-group">' +
        '<input type="radio" name="type" id="type-strength" value="strength" checked><label for="type-strength">💪 Силовая</label>' +
        '<input type="radio" name="type" id="type-cardio" value="cardio"><label for="type-cardio">🏃 Кардио</label>' +
      '</div>' +
      '<div class="field"><label>Упражнение</label><input name="name" placeholder="Например, Жим лежа" required maxlength="60"></div>' +
      '<div class="field"><label>Длительность, мин</label><input name="duration" type="number" min="1" placeholder="45"></div>' +
      '<div class="field field-strength"><label>Вес, кг</label><input name="weight" type="number" min="0" step="0.5" placeholder="80"></div>' +
      '<div class="field field-strength"><label>Повторы</label><input name="reps" type="number" min="1" placeholder="5"></div>' +
      '<div class="field field-cardio"><label>Дистанция, км</label><input name="distance" type="number" min="0" step="0.1" placeholder="не обязательно"></div>' +
      '<div class="field field-wide"><label>Заметки</label><textarea name="notes" placeholder="Не обязательно" maxlength="240"></textarea></div>' +
      '<button class="btn btn-primary" type="submit">Записать тренировку</button>' +
    '</form></div>' +
    '<div class="list-panel"><h3>История</h3>' + list + '</div>';
  }

  function bookCard(b){
    const metaParts = [esc(b.author)];
    if(b.pages) metaParts.push(esc(b.pages) + ' стр.');
    return '<div class="entry-card"><div class="entry-icon">📖</div>' +
      '<div class="entry-body"><div class="entry-title">' + esc(b.title) + (b.status==='done' ? ' <span class="badge badge-done">Завершена</span>' : '') + '</div>' +
      '<div class="entry-meta">' + metaParts.join(' · ') + '</div></div>' +
      (b.status!=='done' ? '<button class="btn btn-ghost btn-sm" data-action="complete-book" data-id="' + b.id + '">Завершить</button>' : '') +
      '<button class="btn-icon" data-action="delete-book" data-id="' + b.id + '" title="Удалить">✕</button></div>';
  }

  function bookSpineVariant(book){
    let h = 0;
    const s = String(book.id || book.title || '');
    for(let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return (Math.abs(h) % 5) + 1;
  }

  let spineMeasureCtx = null;
  function measureSpineText(text, weight, fs){
    if(!text) return 0;
    if(spineMeasureCtx === null){
      try{
        spineMeasureCtx = document.createElement('canvas').getContext('2d');
      }catch(err){
        spineMeasureCtx = false;
      }
    }
    if(!spineMeasureCtx) return text.length * fs * 0.58;
    spineMeasureCtx.font = weight + ' ' + fs + 'px Manrope, system-ui, sans-serif';
    return spineMeasureCtx.measureText(text).width;
  }

  function truncateSpineText(text, maxPx, weight, fs){
    const raw = String(text || '').trim();
    if(!raw) return '';
    const ell = '…';
    if(measureSpineText(raw, weight, fs) <= maxPx) return raw;
    let lo = 0;
    let hi = raw.length;
    while(lo < hi){
      const mid = Math.ceil((lo + hi) / 2);
      const slice = raw.slice(0, mid).replace(/\s+$/,'') + ell;
      if(measureSpineText(slice, weight, fs) <= maxPx) lo = mid;
      else hi = mid - 1;
    }
    return raw.slice(0, lo).replace(/\s+$/,'') + ell;
  }

  function measureShelfRowWidth(){
    if(typeof document === 'undefined') return null;
    const row = document.querySelector('.bookcase .shelf-row');
    if(!row || !row.clientWidth) return null;
    const cs = getComputedStyle(row);
    const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    return Math.max(120, row.clientWidth - pad);
  }

  function shelfRowAvailWidthEstimate(){
    const narrow = typeof window !== 'undefined' && window.innerWidth <= 760;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if(narrow) return Math.max(120, vw - 36 - 16 - 12);
    return Math.max(520, vw - 240 - 64 - 28 - 20);
  }

  function shelfRowAvailWidth(){
    if(shelfPackWidthOverride != null) return shelfPackWidthOverride;
    const measured = measureShelfRowWidth();
    if(measured) return measured;
    return shelfRowAvailWidthEstimate();
  }

  function shelfGap(){
    return (typeof window !== 'undefined' && window.innerWidth <= 760) ? 1 : 2;
  }

  /** Pack books onto shelves — fill each row edge-to-edge via width nudge. */
  function packBooksOntoShelves(doneBooks){
    const avail = shelfRowAvailWidth();
    shelfPackWidthUsed = avail;
    const gap = shelfGap();
    const items = doneBooks.map(function(book){
      const v = bookSpineVariant(book);
      return { book: book, m: spineMetrics(book, v) };
    });
    const rows = [];
    let i = 0;
    while(i < items.length){
      const row = [];
      let used = 0;
      while(i < items.length){
        const w = items[i].m.width;
        const need = row.length === 0 ? w : (w + gap);
        if(row.length > 0 && used + need > avail + 0.5) break;
        if(row.length === 0 && w > avail){
          const narrow = typeof window !== 'undefined' && window.innerWidth <= 760;
          const cap = narrow ? 42 : 56;
          items[i].m = Object.assign({}, items[i].m, { width: Math.min(w, cap * 1.25) });
          row.push(items[i]);
          used = items[i].m.width;
          i++;
          break;
        }
        used += need;
        row.push(items[i]);
        i++;
      }
      const rowFull = i < items.length;
      const leftover = avail - used;
      // Only stretch spines when the row is packed full (more books waiting).
      // A lone book on the last shelf keeps its natural width.
      if(rowFull && row.length && leftover > 0.5){
        const add = leftover / row.length;
        row.forEach(function(item){
          item.m = Object.assign({}, item.m, { width: item.m.width + add });
        });
      }
      rows.push(row);
    }
    return rows;
  }

  function reflowBookshelfIfNeeded(){
    if(bookshelfReflowLock || !state || currentScreen !== 'books') return;
    const measured = measureShelfRowWidth();
    if(!measured) return;
    const packedWith = shelfPackWidthUsed != null ? shelfPackWidthUsed : shelfRowAvailWidthEstimate();
    if(Math.abs(measured - packedWith) < 8) return;
    bookshelfReflowLock = true;
    shelfPackWidthOverride = measured;
    render();
    shelfPackWidthOverride = null;
    bookshelfReflowLock = false;
  }

  function spineMetrics(book, variant){
    const narrow = typeof window !== 'undefined' && window.innerWidth <= 760;
    const title = (book.title || 'Книга').trim();
    const author = (book.author || '').trim();

    const rowH = narrow ? 150 : 176;
    const heightFactor = [0.86, 0.95, 0.8, 0.91, 0.88][variant - 1] || 0.88;
    let bookH = Math.round(rowH * heightFactor);

    // Soft max for one spine — packing fills the shelf; count is not fixed.
    const maxW = narrow ? 42 : 56;
    const minW = narrow ? 16 : 24;
    const edge = narrow ? 3 : 4;
    const faceSidePad = narrow ? 8 : 10;
    const minFs = narrow ? 6.5 : 7.5;
    const maxFs = narrow ? 11 : 13;

    function layoutAt(height, fs){
      const facePad = narrow ? 26 : 32;
      const avail = Math.max(40, height - facePad);
      let authorFs = 0;
      let authorRun = 0;
      let authorDisplay = '';
      if(author){
        authorFs = Math.min(fs - 0.5, narrow ? 8 : 9.5);
        if(authorFs < 6.5) authorFs = 6.5;
        const authorCap = Math.round(avail * 0.36);
        authorDisplay = truncateSpineText(author, authorCap / 1.12, 600, authorFs);
        authorRun = Math.min(authorCap, measureSpineText(authorDisplay, 600, authorFs) * 1.12 + (narrow ? 10 : 12));
      }
      const sepRun = author ? (narrow ? 14 : 16) : 0;
      const titleRun = Math.max(28, avail - authorRun - sepRun);
      const titleDisplay = truncateSpineText(title, titleRun / 1.12, 700, fs);
      const colW = fs * 1.3;
      const faceNeed = Math.ceil(colW + faceSidePad + edge);
      const longest = measureSpineText(titleDisplay, 700, fs) * 1.12;
      return {
        authorFs: authorFs,
        authorRun: authorRun,
        authorDisplay: authorDisplay,
        titleRun: titleRun,
        titleDisplay: titleDisplay,
        lines: 1,
        faceNeed: faceNeed,
        fitsWidth: faceNeed <= maxW + 0.5,
        fitsLength: longest <= titleRun + 0.5
      };
    }

    let fs = Math.min(maxFs, narrow ? 10 : 12);
    let best = layoutAt(bookH, fs);
    let guard = 0;
    while(guard++ < 100 && (!best.fitsWidth || !best.fitsLength)){
      if(!best.fitsLength && bookH < rowH){
        bookH = Math.min(rowH, bookH + 4);
        best = layoutAt(bookH, fs);
        continue;
      }
      if(fs > minFs){
        fs -= 0.5;
        best = layoutAt(bookH, fs);
        continue;
      }
      if(bookH < rowH){
        bookH = Math.min(rowH, bookH + 4);
        best = layoutAt(bookH, fs);
        continue;
      }
      break;
    }

    let width = Math.max(minW, Math.min(maxW, best.faceNeed));
    if(!best.fitsWidth){
      width = Math.min(Math.round(maxW * 1.25), Math.max(width, best.faceNeed));
    }

    return {
      title: title,
      titleHtml: esc(best.titleDisplay),
      author: author,
      authorHtml: best.authorDisplay ? esc(best.authorDisplay) : '',
      height: bookH,
      width: width,
      fs: Math.round(fs * 10) / 10,
      authorFs: Math.round(best.authorFs * 10) / 10,
      lines: 1,
      edge: edge
    };
  }

  function spineBookButton(book, metrics, globalIdx){
    const m = metrics || spineMetrics(book, bookSpineVariant(book));
    const v = bookSpineVariant(book);
    const focused = shelfBookFocus === book.id;
    const tip = m.title + (m.author ? (' — ' + m.author) : '');
    const paletteStyle = window.LifeFeatures ? LifeFeatures.getSpineAccent(state, globalIdx || 0) : '';
    const style =
      '--book-h:' + m.height + 'px;' +
      '--book-w:' + m.width + 'px;' +
      '--title-fs:' + m.fs + 'px;' +
      '--author-fs:' + m.authorFs + 'px;' +
      '--edge-w:' + m.edge + 'px;' +
      paletteStyle;
    return '<button type="button" class="spine-book spine-v' + v +
        (focused ? ' is-focused' : '') +
        '" data-action="focus-shelf-book" data-id="' + book.id +
        '" title="' + esc(tip) + '" style="' + style + '">' +
        '<span class="spine-edge" aria-hidden="true"></span>' +
        '<span class="spine-face">' +
          '<span class="spine-title">' + m.titleHtml + '</span>' +
          (m.author ? '<span class="spine-sep" aria-hidden="true"></span><span class="spine-author">' + m.authorHtml + '</span>' : '') +
        '</span>' +
      '</button>';
  }

  function renderBookshelf(doneBooks){
    const packedRows = packBooksOntoShelves(doneBooks);
    const caseCount = Math.max(1, Math.ceil(Math.max(packedRows.length, 1) / SHELVES_PER_CASE));
    const caseBlocks = [];
    let spineIdx = 0;

    for(let c = 0; c < caseCount; c++){
      const shelves = [];
      for(let s = 0; s < SHELVES_PER_CASE; s++){
        const rowIndex = c * SHELVES_PER_CASE + s;
        const row = packedRows[rowIndex] || [];
        let rowInner = row.map(function(item){
          const html = spineBookButton(item.book, item.m, spineIdx);
          spineIdx++;
          return html;
        }).join('');
        if(!doneBooks.length && c === 0 && s === 2){
          rowInner = '<div class="shelf-empty-hint">завершённые книги встанут сюда</div>';
        }
        shelves.push(
          '<div class="bookshelf">' +
            '<div class="shelf-row">' + rowInner + '</div>' +
            '<div class="shelf-plank"></div>' +
          '</div>'
        );
      }
      const caption = caseCount > 1
        ? ('<div class="bookcase-caption">Шкаф ' + (c + 1) + ' <span class="bookcase-caption-of">из ' + caseCount + '</span></div>')
        : '';
      caseBlocks.push(
        '<div class="bookcase-unit">' +
          caption +
          '<div class="bookcase">' +
          '<div class="bookcase-crown" aria-hidden="true"></div>' +
          '<div class="bookcase-body">' +
            '<div class="bookcase-rail is-left" aria-hidden="true"></div>' +
            '<div class="bookcase-shelves">' + shelves.join('') + '</div>' +
            '<div class="bookcase-rail is-right" aria-hidden="true"></div>' +
          '</div>' +
          '<div class="bookcase-base" aria-hidden="true"></div>' +
        '</div></div>'
      );
    }

    let detail = '';
    if(shelfBookFocus){
      const b = doneBooks.find(function(x){ return x.id === shelfBookFocus; });
      if(b){
        const meta = [esc(b.author)];
        if(b.pages) meta.push(esc(b.pages) + ' стр.');
        detail =
          '<div class="shelf-book-detail">' +
            '<div class="shelf-book-detail-title">' + esc(b.title) + '</div>' +
            '<div class="shelf-book-detail-meta">' + meta.join(' · ') + '</div>' +
            '<div class="shelf-book-detail-actions">' +
              '<button class="btn btn-ghost btn-sm" data-action="focus-shelf-book" data-id="">Скрыть</button>' +
              '<button class="btn btn-ghost btn-sm" data-action="delete-book" data-id="' + b.id + '">Удалить с полки</button>' +
            '</div>' +
          '</div>';
      }
    }

    const filled = doneBooks.length;
    const word = pluralRu(filled, 'книга', 'книги', 'книг');
    return '' +
      '<div class="library-wrap">' +
        '<div class="library-head">' +
          '<h3 class="library-title">Книжный шкаф</h3>' +
          '<p class="library-sub">Прочитанные книги · ' + filled + ' ' + word +
            (caseCount > 1 ? (' · шкафов: ' + caseCount) : '') +
          '</p>' +
        '</div>' +
        '<div class="bookcase-stack">' + caseBlocks.join('') + '</div>' +
        detail +
      '</div>';
  }

  function renderBooks(){
    const reading = state.books.filter(function(b){ return b.status!=='done'; });
    const done = state.books.filter(function(b){ return b.status==='done'; });
    if(shelfBookFocus && !done.some(function(b){ return b.id === shelfBookFocus; })){
      shelfBookFocus = null;
    }
    return '' +
    '<div class="screen-head"><h2>Книги</h2><p class="screen-sub">Читаешь — в списке. Завершил — книга встаёт на полку. Шкаф меняет цвет вместе с темой.</p></div>' +
    '<div class="panel form-panel"><form data-form="add-book" class="form-grid">' +
      '<div class="field field-wide"><label>Название книги</label><input name="title" placeholder="Атомные привычки" required maxlength="80"></div>' +
      '<div class="field"><label>Автор</label><input name="author" placeholder="Джеймс Клир" maxlength="60"></div>' +
      '<div class="field"><label>Страниц</label><input name="pages" type="number" min="1" placeholder="250"></div>' +
      '<div class="field"><label>Статус</label><select name="status"><option value="reading">Читаю</option><option value="done">Завершена</option></select></div>' +
      '<button class="btn btn-primary" type="submit">Добавить книгу</button>' +
    '</form></div>' +
    '<div class="list-panel">' +
      '<h3>Читаю (' + reading.length + ')</h3>' + (reading.length ? reading.map(bookCard).join('') : '<div class="empty-state">Список чтения пуст.</div>') +
    '</div>' +
    '<div class="library-section">' + renderBookshelf(done) + '</div>';
  }

  function renderTasks(){
    if(window.LifeFeatures) return LifeFeatures.renderTasks();
    const habits = dailyHabits();
    const ones = oneOffTasks();
    const prog = habitsProgress();

    const habitRows = habits.length
      ? habits.map(function(t){ return renderHabitRow(t, false); }).join('')
      : '<div class="empty-state">Нет ежедневных привычек. Добавь первую — она будет сбрасываться каждый день.</div>';
    const oneRows = ones.length
      ? ones.map(function(t){ return renderHabitRow(t, false); }).join('')
      : '<div class="empty-state">Разовых задач нет.</div>';

    return '' +
    '<div class="screen-head"><h2>Задачи и привычки</h2>' +
      '<p class="screen-sub">Ежедневные привычки сбрасываются после полуночи. Разовые — остаются выполненными. Сейчас: ' + prog.done + '/' + prog.total + ' привычек.</p></div>' +
    '<div class="panel form-panel"><form data-form="add-task" class="form-grid" style="grid-template-columns:1fr auto;">' +
      '<div class="field field-wide"><label>Что сделать</label><input name="text" placeholder="Например, Медитация 10 минут" required maxlength="80"></div>' +
      '<div class="field-checks" style="margin:0;">' +
        '<label class="check-row"><input type="checkbox" name="daily" checked> 🔁 Ежедневная привычка</label>' +
      '</div>' +
      '<button class="btn btn-primary" type="submit">Добавить</button>' +
    '</form></div>' +
    '<div class="list-panel">' +
      '<h3>Ежедневные (' + habits.length + ')</h3>' + habitRows +
      '<h3>Разовые (' + ones.length + ')</h3>' + oneRows +
    '</div>';
  }

  function goalCard(g){
    const pct = g.target>0 ? Math.max(0, Math.min(100, (g.current/g.target)*100)) : 0;
    const complete = g.target>0 && g.current >= g.target;
    return '<div class="panel goal-card">' +
      '<div class="goal-head"><div><div class="goal-title">' + esc(g.title) + (complete ? ' <span class="badge badge-done">Достигнуто</span>' : '') + '</div>' +
      (g.description ? '<div class="goal-desc">' + esc(g.description) + '</div>' : '') + '</div>' +
      '<button class="btn-icon" data-action="delete-goal" data-id="' + g.id + '" title="Удалить">✕</button></div>' +
      segBar(g.current, g.target||1, '--gold', 14) +
      '<div class="goal-foot"><span>' + g.current + ' / ' + g.target + ' ' + esc(g.unit) + ' · ' + pct.toFixed(0) + '%</span>' +
      '<form data-form="update-goal" data-id="' + g.id + '" class="goal-update">' +
        '<input name="current" type="number" step="0.1" value="' + g.current + '">' +
        '<button class="btn btn-ghost btn-sm" type="submit">Обновить</button>' +
      '</form></div></div>';
  }

  function renderGoals(){
    if(window.LifeFeatures) return LifeFeatures.renderGoals();
    const list = state.goals.length ? state.goals.map(goalCard).join('') : '<div class="empty-state">Пока нет целей. Поставь первую!</div>';
    return '' +
    '<div class="screen-head"><h2>Цели</h2><p class="screen-sub">Долгосрочные цели с отслеживанием прогресса.</p></div>' +
    '<div class="panel form-panel"><form data-form="add-goal" class="form-grid">' +
      '<div class="field field-wide"><label>Название цели</label><input name="title" placeholder="Жим лежа 100 кг" required maxlength="80"></div>' +
      '<div class="field field-wide"><label>Описание</label><input name="description" placeholder="Не обязательно" maxlength="160"></div>' +
      '<div class="field"><label>Текущий результат</label><input name="current" type="number" step="0.1" value="0"></div>' +
      '<div class="field"><label>Цель</label><input name="target" type="number" step="0.1" placeholder="100" required></div>' +
      '<div class="field"><label>Единица</label><input name="unit" placeholder="кг, км, книг…" maxlength="20"></div>' +
      '<button class="btn btn-primary" type="submit">Создать цель</button>' +
    '</form></div>' +
    '<div class="list-panel goal-list">' + list + '</div>';
  }

  function renderAchievements(){
    const list = activeAchievements(state);
    const unlocked = list.filter(function(a){ return state.unlockedAchievements.indexOf(a.id) !== -1; });
    const tiles = list.map(function(a){
      const isUnlocked = state.unlockedAchievements.indexOf(a.id) !== -1;
      return '<div class="achv-tile ' + (isUnlocked?'achv-unlocked':'achv-locked') + '">' +
        '<div class="achv-icon">' + (isUnlocked ? a.icon : '🔒') + '</div>' +
        '<div class="achv-title">' + esc(a.title) + '</div><div class="achv-desc">' + esc(a.desc) + '</div></div>';
    }).join('');
    return '<div class="screen-head"><h2>Достижения</h2><p class="screen-sub">' + unlocked.length + ' из ' + list.length + ' открыто</p></div>' +
      '<div class="achv-grid">' + tiles + '</div>';
  }

  function renderFriends(){
    return '<div class="screen-head"><h2>Друзья</h2><p class="screen-sub">Настоящая социалка ещё впереди.</p></div>' +
      '<div class="empty-state">Раздел временно скрыт. Скоро можно будет сравнивать прогресс с реальными друзьями — без ручных «фейковых» уровней.</div>';
  }

  function renderSettingsModal(){
    const ta = state.trackedAreas;
    const themeSwatches = THEMES.map(function(t){
      return '<button type="button" class="theme-swatch ' + (state.theme===t.id ? 'active' : '') + '" data-action="set-theme" data-theme="' + t.id + '" style="--sw-a:' + t.swatchA + '; --sw-b:' + t.swatchB + ';">' +
        '<span class="swatch-preview"></span><span class="swatch-name">' + t.icon + ' ' + esc(t.name) + (THEME_FX[t.id] ? ' ·✨' : '') + '</span></button>';
    }).join('');
    const hasFx = !!THEME_FX[state.theme];
    const animOn = isThemeAnimOn(state.theme);
    const animToggle = hasFx
      ? '<label class="check-row" style="margin:0 0 18px;"><input type="checkbox" data-action="toggle-theme-anim" ' + (animOn?'checked':'') + '> Анимация этой темы</label>'
      : '<p style="font-size:12.5px;color:var(--text-dim);margin:0 0 18px;">У этой темы нет фоновой анимации.</p>';
    return '<div class="modal-overlay" data-action="close-settings"><div class="modal" data-action="noop">' +
      '<h3>Настройки</h3>' +
      '<div class="field field-wide" style="margin-bottom:12px;"><label>Оформление</label><div class="theme-grid">' + themeSwatches + '</div></div>' +
      animToggle +
      (window.LifeFeatures ? LifeFeatures.renderPaletteSettings() : '') +
      '<form data-form="update-settings" class="form-grid">' +
        '<div class="field field-wide"><label>Имя персонажа</label><input name="name" value="' + esc(state.character.name) + '" maxlength="40"></div>' +
        '<div class="field"><label>Возраст</label><input name="age" type="number" min="1" max="120" value="' + (state.character.age != null ? esc(state.character.age) : '') + '" placeholder="не обязательно"></div>' +
        '<div class="field"><label>Пол</label><select name="gender">' +
          '<option value=""' + (!state.character.gender ? ' selected' : '') + '>Не указан</option>' +
          '<option value="male"' + (state.character.gender==='male' ? ' selected' : '') + '>Мужской</option>' +
          '<option value="female"' + (state.character.gender==='female' ? ' selected' : '') + '>Женский</option>' +
        '</select></div>' +
        '<div class="field-checks">' +
          '<label class="check-row"><input type="checkbox" name="area_workouts" ' + (ta.workouts?'checked':'') + '> 💪 Тренировки</label>' +
          '<label class="check-row"><input type="checkbox" name="area_books" ' + (ta.books?'checked':'') + '> 📖 Книги</label>' +
          '<label class="check-row"><input type="checkbox" name="area_goals" ' + (ta.goals?'checked':'') + '> 🎯 Цели</label>' +
          '<label class="check-row"><input type="checkbox" name="area_tasks" ' + (ta.tasks?'checked':'') + '> ✅ Задачи и привычки</label>' +
        '</div>' +
        '<button class="btn btn-primary" type="submit">Сохранить</button>' +
      '</form>' +
      '<hr>' +
      (window.BeyondCloud && BeyondCloud.getCurrentUser && BeyondCloud.getCurrentUser()
        ? '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Аккаунт: ' + esc(BeyondCloud.getCurrentUser().email || '') + '</p>' +
          '<button class="btn btn-ghost" data-action="logout" style="margin-bottom:10px;width:100%;">Выйти из аккаунта</button>'
        : '') +
      '<button class="btn btn-danger" data-action="reset-character">Сбросить персонажа</button>' +
    '</div></div>';
  }

  function renderConfirmModal(){
    if(!pendingConfirm) return '';
    return '<div class="modal-overlay" data-action="confirm-no"><div class="modal modal-confirm" data-action="noop">' +
      '<p>' + esc(pendingConfirm.message) + '</p>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-action="confirm-no">Отмена</button>' +
      '<button class="btn btn-danger" data-action="confirm-yes">Подтвердить</button></div>' +
    '</div></div>';
  }

  function renderToasts(){
    if(!toasts.length) return '';
    return '<div class="toast-stack">' + toasts.map(function(t){
      return '<div class="toast toast-' + t.kind + '">' +
        '<span class="toast-msg">' + esc(t.msg) + '</span>' +
        '<button type="button" class="toast-close" data-action="dismiss-toast" data-id="' + t.id + '" aria-label="Закрыть">✕</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* ============== Render: root ============== */
  function renderScreenContent(){
    switch(currentScreen){
      case 'profile': return window.Daybook ? Daybook.renderProfileShowcase() : renderCharacter();
      case 'character': return renderCharacter();
      case 'workouts': return renderWorkouts();
      case 'books': return renderBooks();
      case 'tasks': return renderTasks();
      case 'goals': return renderGoals();
      case 'weekplan': return window.LifeFeatures ? LifeFeatures.renderWeekPlan() : '';
      case 'vices': return window.LifeFeatures ? LifeFeatures.renderVices() : '';
      case 'achievements': return renderAchievements();
      case 'friends': return renderFriends();
      default: return renderDashboard();
    }
  }

  function render(){
    applyTheme();
    const root = document.getElementById('root');
    if(!state){
      root.innerHTML = renderOnboarding() + renderToasts();
      return;
    }
    if(resetDailyHabitsIfNeeded()) save();
    const conditional = ['workouts','books','tasks','goals','weekplan','vices'];
    if(conditional.indexOf(currentScreen) !== -1){
      if(currentScreen === 'weekplan' || currentScreen === 'vices'){
        if(currentScreen === 'weekplan' && !(state.trackedAreas.tasks || state.trackedAreas.workouts)) currentScreen = 'dashboard';
      } else if(!state.trackedAreas[currentScreen]){
        currentScreen = 'dashboard';
      }
    }
    root.innerHTML =
      '<div class="app-shell">' +
        renderSidebar() +
        '<div class="main">' + renderTopbar() + '<div class="screen">' + renderScreenContent() + '</div></div>' +
      '</div>' +
      renderToasts() +
      (settingsOpen ? renderSettingsModal() : '') +
      (window.LifeFeatures ? LifeFeatures.renderExtraModals() : '') +
      renderConfirmModal();
    if(window.LifeFeatures) LifeFeatures.afterRender();
    if(window.Daybook) Daybook.afterRender();
    reflowBookshelfIfNeeded();
  }

  /* ============== Form handling ============== */
  function handleFormSubmit(kind, fd, form){
    if(window.LifeFeatures && LifeFeatures.handleForm(kind, fd, form)) return;
    switch(kind){
      case 'onboarding': {
        const name = (fd.get('name')||'').toString().trim() || 'Герой';
        const tracked = {
          workouts: fd.get('area_workouts')==='on',
          books: fd.get('area_books')==='on',
          goals: fd.get('area_goals')==='on',
          tasks: fd.get('area_tasks')==='on',
        };
        if(!tracked.workouts && !tracked.books && !tracked.goals && !tracked.tasks){
          toast('Выбери хотя бы одну сферу', 'info');
          return;
        }
        state = newCharacterState({ name:name, age:fd.get('age'), gender:fd.get('gender'), tracked:tracked });
        migrateState();
        currentScreen = 'dashboard';
        save(); render();
        toast('Добро пожаловать, ' + name + '! Твой путь начинается.', 'success');
        break;
      }
      case 'add-workout': {
        const name = (fd.get('name')||'').toString().trim();
        if(!name) return;
        const type = fd.get('type')||'strength';
        const isStrength = type === 'strength';
        addWorkout({
          type: type,
          name: name,
          duration: fd.get('duration'),
          notes: (fd.get('notes')||'').toString().trim(),
          distance: isStrength ? '' : fd.get('distance'),
          weight: isStrength ? fd.get('weight') : '',
          reps: isStrength ? fd.get('reps') : '',
        });
        break;
      }
      case 'add-book': {
        const title = (fd.get('title')||'').toString().trim();
        if(!title) return;
        addBook({ title:title, author:(fd.get('author')||'').toString().trim(), pages: fd.get('pages'), status: fd.get('status')||'reading' });
        break;
      }
      case 'add-task': {
        const text = (fd.get('text')||'').toString().trim();
        if(!text) return;
        addTask(text, fd.get('daily')==='on');
        break;
      }
      case 'add-goal': {
        const title = (fd.get('title')||'').toString().trim();
        if(!title) return;
        addGoal({ title:title, description:(fd.get('description')||'').toString().trim(), current: fd.get('current')||0, target: fd.get('target')||1, unit:(fd.get('unit')||'').toString().trim() });
        break;
      }
      case 'update-goal': {
        updateGoalProgress(form.dataset.id, fd.get('current'));
        break;
      }
      case 'add-friend': {
        const name = (fd.get('name')||'').toString().trim();
        if(!name) return;
        addFriend({ name:name, level: fd.get('level')||1 });
        break;
      }
      case 'update-settings': {
        const nextAreas = {
          workouts: fd.get('area_workouts')==='on',
          books: fd.get('area_books')==='on',
          goals: fd.get('area_goals')==='on',
          tasks: fd.get('area_tasks')==='on',
        };
        if(!nextAreas.workouts && !nextAreas.books && !nextAreas.goals && !nextAreas.tasks){
          toast('Оставь хотя бы одну сферу', 'info');
          return;
        }
        state.trackedAreas = nextAreas;
        const newName = (fd.get('name')||'').toString().trim();
        if(newName) state.character.name = newName;
        const ageRaw = (fd.get('age')||'').toString().trim();
        state.character.age = ageRaw ? Number(ageRaw) : null;
        state.character.gender = (fd.get('gender')||'').toString();
        settingsOpen = false;
        save(); render();
        toast('Настройки сохранены', 'success');
        break;
      }
    }
  }

  /* ============== Event delegation ============== */
  function bindEvents(){
    const root = document.getElementById('root');

    root.addEventListener('click', function(e){
      const el = e.target.closest('[data-action]');
      if(!el) return;
      const action = el.dataset.action;
      const id = el.dataset.id;
      if(window.Daybook && Daybook.handleAction(action, el, id)) return;
      if(window.LifeFeatures && LifeFeatures.handleAction(action, el, id)) return;
      switch(action){
        case 'nav':
          currentScreen = el.dataset.screen; settingsOpen = false; render(); break;
        case 'char-tab':
          charRoomTab = el.dataset.tab || 'avatars'; render(); break;
        case 'equip-cosmetic':
          equipCosmetic(id); break;
        case 'buy-cosmetic':
          buyCosmetic(id); break;
        case 'equip-photo':
          equipPhoto(id); break;
        case 'clear-photo':
          clearPhoto(); break;
        case 'delete-photo':
          deletePhoto(id); break;
        case 'open-settings':
          settingsOpen = true; render(); break;
        case 'set-theme':
          state.theme = el.dataset.theme; save(); render();
          toast('Оформление: ' + (THEMES.find(function(t){ return t.id===state.theme; })||{}).name, 'success');
          break;
        case 'toggle-theme-anim': {
          if(!state.themeAnim) state.themeAnim = {};
          state.themeAnim[state.theme] = !isThemeAnimOn(state.theme);
          lastFxSignature = null;
          save(); render();
          toast(isThemeAnimOn(state.theme) ? 'Анимация включена' : 'Анимация выключена', 'info');
          break;
        }
        case 'dismiss-toast':
          dismissToast(id); break;
        case 'close-settings':
          settingsOpen = false; render(); break;
        case 'toggle-task':
          toggleTask(id); break;
        case 'delete-task':
          askConfirm('Удалить задачу?', function(){ state.tasks = state.tasks.filter(function(t){ return t.id!==id; }); save(); render(); }); break;
        case 'delete-workout':
          askConfirm('Удалить запись о тренировке?', function(){ state.workouts = state.workouts.filter(function(w){ return w.id!==id; }); save(); render(); }); break;
        case 'complete-book':
          completeBook(id); break;
        case 'focus-shelf-book':
          shelfBookFocus = (!id || shelfBookFocus === id) ? null : id;
          render();
          break;
        case 'delete-book':
          askConfirm('Удалить книгу из библиотеки?', function(){
            state.books = state.books.filter(function(b){ return b.id!==id; });
            if(shelfBookFocus === id) shelfBookFocus = null;
            save(); render();
          }); break;
        case 'delete-goal':
          askConfirm('Удалить цель?', function(){ state.goals = state.goals.filter(function(g){ return g.id!==id; }); save(); render(); }); break;
        case 'delete-friend':
          askConfirm('Удалить друга из списка?', function(){ state.friends = state.friends.filter(function(f){ return f.id!==id; }); save(); render(); }); break;
        case 'logout':
          settingsOpen = false;
          if(window.BeyondCloud && BeyondCloud.logout){
            BeyondCloud.logout().then(function(){ location.reload(); }).catch(function(){ location.reload(); });
          }
          break;
        case 'reset-character':
          askConfirm('Сбросить персонажа полностью? Это действие необратимо.', resetCharacter); break;
        case 'confirm-yes':
          if(pendingConfirm){ const fn = pendingConfirm.onConfirm; pendingConfirm = null; fn(); } else { render(); } break;
        case 'confirm-no':
          pendingConfirm = null; render(); break;
        case 'noop':
          break;
        default: break;
      }
    });

    root.addEventListener('change', function(e){
      const typeRadio = e.target.closest('form[data-form="add-workout"] input[name="type"]');
      if(typeRadio){
        const form = typeRadio.closest('form');
        if(form){
          form.classList.toggle('is-cardio', typeRadio.value === 'cardio');
          form.classList.toggle('is-strength', typeRadio.value === 'strength');
        }
        return;
      }
      const input = e.target.closest('input[data-action="upload-photo"]');
      if(!input || !input.files || !input.files[0]) return;
      handlePhotoUpload(input.files[0]);
      input.value = '';
    });

    root.addEventListener('submit', function(e){
      const form = e.target.closest('form[data-form]');
      if(!form) return;
      e.preventDefault();
      const kind = form.dataset.form;
      const fd = new FormData(form);
      handleFormSubmit(kind, fd, form);
    });

    // Spine sizes / shelf packing depend on width — reflow on resize.
    let lastShelfW = typeof window !== 'undefined' ? window.innerWidth : 0;
    let resizeTimer = null;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        const w = window.innerWidth;
        if(Math.abs(w - lastShelfW) < 24) return;
        lastShelfW = w;
        if(state) render();
      }, 180);
    });
  }

  /* ============== Init ============== */
  let bound = false;
  let fontsWatched = false;
  async function init(){
    if(!bound){ bindEvents(); bound = true; }
    installLifeFeatures();
    await load();
    render();
    // Spine text is measured with canvas, so re-measure once webfonts land.
    if(!fontsWatched && document.fonts && document.fonts.ready){
      fontsWatched = true;
      document.fonts.ready.then(function(){ if(state) render(); });
    }
  }

  return {
    init: init,
    render: render,
    getState: function(){ return state; },
    setState: function(s){ state = s; if(state) migrateState(); },
    reloadFromStorage: async function(){ await load(); render(); }
  };
})();
