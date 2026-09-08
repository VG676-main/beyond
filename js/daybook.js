/* Daybook: journal spread, meaningful streak flame, stickers, profile showcase */
window.Daybook = (function(){
  "use strict";

  let deps = null;

  const MOODS = [
    { id:"great",  emoji:"🔥", label:"Огонь" },
    { id:"good",   emoji:"😊", label:"Хорошо" },
    { id:"ok",     emoji:"😐", label:"Норм" },
    { id:"low",    emoji:"😔", label:"Тяжело" },
    { id:"tired",  emoji:"😴", label:"Устал" },
  ];

  const STREAK_MILESTONES = [
    { n:3,  sparks:8,  xp:15, sticker:"ember",   title:"Хранитель огня",  msg:"3 дня подряд — огонёк живой" },
    { n:7,  sparks:20, xp:40, sticker:"medal",   title:"Железная неделя", msg:"Неделя дисциплины" },
    { n:14, sparks:35, xp:70, sticker:"comet",   title:"Две недели силы", msg:"14 дней — это характер" },
    { n:30, sparks:80, xp:150, sticker:"crown",  title:"Месяц огня",      msg:"Месяц без срыва" },
    { n:100,sparks:200,xp:400, sticker:"legend", title:"Легенда серии",   msg:"100 дней. Ты уже легенда" },
  ];

  const STICKERS = [
    { id:"spark",   emoji:"✨", name:"Искра",          blurb:"Первый закрытый день" },
    { id:"ember",   emoji:"🔥", name:"Угольки",         blurb:"Серия 3 дня" },
    { id:"medal",   emoji:"🏅", name:"Медаль недели",   blurb:"Серия 7 дней" },
    { id:"comet",   emoji:"☄️", name:"Комета",          blurb:"Серия 14 дней" },
    { id:"crown",   emoji:"👑", name:"Корона месяца",   blurb:"Серия 30 дней" },
    { id:"legend",  emoji:"🌌", name:"Созвездие",       blurb:"Серия 100 дней" },
    { id:"freeze",  emoji:"❄️", name:"Заморозка",       blurb:"Спасённая серия" },
    { id:"book",    emoji:"📖", name:"Книжный знак",    blurb:"Первая книга" },
    { id:"barbell", emoji:"🏋️", name:"Штанга",          blurb:"Первая тренировка" },
    { id:"target",  emoji:"🎯", name:"Цель",            blurb:"Первая цель" },
    { id:"trophy",  emoji:"🏆", name:"Кубок",           blurb:"Цель на 100%" },
    { id:"bolt",    emoji:"⚡", name:"Рекорд",          blurb:"Личный рекорд" },
    { id:"star",    emoji:"⭐", name:"Звезда",          blurb:"5 уровень" },
    { id:"nova",    emoji:"🌟", name:"Нова",            blurb:"10 уровень" },
  ];

  const ACHIEVEMENT_STICKERS = {
    first_book: "book",
    first_workout: "barbell",
    first_goal: "target",
    goal_done: "trophy",
    first_record: "bolt",
    level5: "star",
    level10: "nova",
  };

  const PROFILE_TITLES = [
    { id:"novice",   name:"Новичок пути",       minStreak:0,  minLevel:1 },
    { id:"ember",    name:"Хранитель огня",     minStreak:3,  minLevel:1 },
    { id:"week",     name:"Железная неделя",    minStreak:7,  minLevel:1 },
    { id:"fortnight",name:"Две недели силы",    minStreak:14, minLevel:1 },
    { id:"month",    name:"Месяц огня",         minStreak:30, minLevel:1 },
    { id:"legend",   name:"Легенда серии",      minStreak:100,minLevel:1 },
    { id:"seeker",   name:"Искатель",           minStreak:0,  minLevel:2 },
    { id:"hero",     name:"Герой",              minStreak:0,  minLevel:7 },
    { id:"champ",    name:"Чемпион",            minStreak:0,  minLevel:10 },
    { id:"master",   name:"Мастер",             minStreak:0,  minLevel:15 },
    { id:"myth",     name:"Легенда",            minStreak:0,  minLevel:20 },
    { id:"witness",  name:"Свидетель улыбки",   minStreak:0,  minLevel:1, secret:"redjohn" },
    { id:"surfer",   name:"Серфер рассвета",    minStreak:0,  minLevel:1, secret:"surf" },
    { id:"acidking", name:"Король гламура",     minStreak:0,  minLevel:1, secret:"acid" },
    { id:"bubbler",  name:"Охотник за пузырями",minStreak:0,  minLevel:1, secret:"badge_bubble" },
    { id:"coder",    name:"Хранитель кода",     minStreak:0,  minLevel:1, secret:"promo_aikraam" },
  ];

  function S(){ return deps.getState(); }
  function e(s){ return deps.esc(s); }

  function install(d){ deps = d; }

  function emptyJournalDay(){
    return { mood:null, note:"", closed:false, closedAt:null };
  }

  function weekKey(d){
    const date = d ? new Date(d) : new Date();
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return tmp.getUTCFullYear() + "-W" + weekNo;
  }

  function migrate(state){
    state.journal = state.journal || {};
    state.stickers = state.stickers || { owned:[], pinned:[], unlockedAt:{} };
    state.stickers.owned = state.stickers.owned || [];
    state.stickers.pinned = state.stickers.pinned || [];
    state.stickers.unlockedAt = state.stickers.unlockedAt || {};
    state.profileTitle = state.profileTitle || "novice";
    state.streakFreeze = state.streakFreeze || { week: weekKey(), used:0 };
    if(state.streakFreeze.week !== weekKey()){
      state.streakFreeze = { week: weekKey(), used:0 };
    }
    state.lastClosedDay = state.lastClosedDay ?? null;

    // Preserve old activity streak as closed-day streak once.
    if(state.lastClosedDay == null && state.streak > 0 && state.lastActiveDay){
      state.lastClosedDay = state.lastActiveDay;
      const today = deps.todayKey();
      if(state.lastActiveDay === today){
        const j = ensureDay(state, today);
        j.closed = true;
        j.closedAt = j.closedAt || Date.now();
        if(!j.mood) j.mood = "good";
      }
    }
    grantSticker(state, "spark", false);
    syncAchievementStickers(state, false);
    unlockStreakRewards(state, false);
    if(!titleUnlocked(state, state.profileTitle)){
      state.profileTitle = bestTitleId(state);
    }
  }

  function ensureDay(state, key){
    if(!state.journal[key]) state.journal[key] = emptyJournalDay();
    return state.journal[key];
  }

  function todayEntry(state){
    return ensureDay(state || S(), deps.todayKey());
  }

  function getSticker(id){
    return STICKERS.find(function(s){ return s.id===id; }) || null;
  }

  function ownsSticker(state, id){
    return (state.stickers.owned || []).indexOf(id) !== -1;
  }

  function grantSticker(state, id, notify){
    if(!id || ownsSticker(state, id)) return false;
    if(!getSticker(id)) return false;
    state.stickers.owned.push(id);
    state.stickers.unlockedAt[id] = Date.now();
    if(state.stickers.pinned.length < 6) state.stickers.pinned.push(id);
    if(notify !== false){
      const st = getSticker(id);
      deps.toast("Стикер: " + st.emoji + " " + st.name, "achievement");
    }
    return true;
  }

  function syncAchievementStickers(state, notify){
    (state.unlockedAchievements || []).forEach(function(aid){
      const sid = ACHIEVEMENT_STICKERS[aid];
      if(sid) grantSticker(state, sid, notify);
    });
  }

  function titleUnlocked(state, id){
    const t = PROFILE_TITLES.find(function(x){ return x.id===id; });
    if(!t) return false;
    if(t.secret){
      return !!(deps && deps.isSecretUnlocked && deps.isSecretUnlocked(t.secret));
    }
    return (state.streak||0) >= t.minStreak && (state.level||1) >= t.minLevel;
  }

  function unlockedTitles(state){
    return PROFILE_TITLES.filter(function(t){ return titleUnlocked(state, t.id); });
  }

  function bestTitleId(state){
    const list = unlockedTitles(state).filter(function(t){ return !t.secret; });
    return list.length ? list[list.length-1].id : "novice";
  }

  function titleName(state){
    const t = PROFILE_TITLES.find(function(x){ return x.id===state.profileTitle; });
    return t ? t.name : "Новичок пути";
  }

  function flameTier(streak){
    if(streak >= 100) return { tier:"legend", label:"легенда", emoji:"🌌" };
    if(streak >= 30) return { tier:"month", label:"месяц", emoji:"👑" };
    if(streak >= 14) return { tier:"hot", label:"жаркий", emoji:"☄️" };
    if(streak >= 7) return { tier:"week", label:"неделя", emoji:"🏅" };
    if(streak >= 3) return { tier:"ember", label:"угольки", emoji:"🔥" };
    if(streak >= 1) return { tier:"lit", label:"живой", emoji:"✨" };
    return { tier:"cold", label:"потух", emoji:"🕯️" };
  }

  function nextMilestone(streak){
    for(let i=0;i<STREAK_MILESTONES.length;i++){
      if(streak < STREAK_MILESTONES[i].n) return STREAK_MILESTONES[i];
    }
    return null;
  }

  function unlockStreakRewards(state, notify){
    const streak = state.streak || 0;
    STREAK_MILESTONES.forEach(function(m){
      if(streak >= m.n){
        grantSticker(state, m.sticker, notify);
      }
    });
  }

  function freezeAvailable(state){
    if(state.streakFreeze.week !== weekKey()){
      state.streakFreeze = { week: weekKey(), used:0 };
    }
    return state.streakFreeze.used < 1;
  }

  function canUseFreeze(state){
    if(!freezeAvailable(state)) return false;
    if(!state.lastClosedDay) return false;
    if(state.lastClosedDay === deps.todayKey()) return false;
    const last = new Date(state.lastClosedDay);
    const now = new Date(deps.todayKey());
    const diff = Math.round((now - last) / 86400000);
    return diff === 2 && (state.streak||0) > 0;
  }

  function reconcileFlame(state){
    if(!state.lastClosedDay) return;
    const today = deps.todayKey();
    if(state.lastClosedDay === today) return;
    const last = new Date(state.lastClosedDay);
    const now = new Date(today);
    const diff = Math.round((now - last) / 86400000);
    if(diff <= 1) return;
    if(diff === 2 && freezeAvailable(state) && (state.streak||0) > 0){
      // keep streak visually at risk — don't zero until day ends without freeze/close
      return;
    }
    if(diff > 1){
      // If freeze was available for exactly one miss but unused and now >2, zero
      if(diff > 2 || !freezeAvailable(state)) state.streak = 0;
    }
  }

  function dayActivityScore(state){
    let score = 0;
    const bits = [];
    if(window.LifeFeatures){
      const prog = LifeFeatures.habitsProgressRhythm(state);
      if(prog.total > 0){
        bits.push({ ok: prog.done > 0, label: "привычки " + prog.done + "/" + prog.total });
        if(prog.done > 0) score++;
      }
      const wd = new Date().getDay();
      const plan = ((state.weekPlan||{})[wd]||{items:[]}).items.filter(function(i){ return i.icon!=="😴"; });
      if(plan.length){
        const doneMap = (state.weekDone||{})[deps.todayKey()]||{};
        const pd = plan.filter(function(i){ return doneMap[i.id]; }).length;
        bits.push({ ok: pd > 0, label: "план " + pd + "/" + plan.length });
        if(pd > 0) score++;
      }
    }
    const j = todayEntry(state);
    if(j.mood){ bits.push({ ok:true, label:"настроение" }); score++; }
    else bits.push({ ok:false, label:"настроение" });
    if((j.note||"").trim()){ bits.push({ ok:true, label:"заметка" }); score++; }
    else bits.push({ ok:false, label:"заметка" });
    return { score:score, bits:bits };
  }

  function canCloseDay(state){
    const j = todayEntry(state);
    if(j.closed) return { ok:false, reason:"already" };
    if(!j.mood) return { ok:false, reason:"mood" };
    return { ok:true };
  }

  function setMood(moodId){
    const state = S();
    const j = todayEntry(state);
    j.mood = moodId;
    deps.save(); deps.render();
  }

  function saveNote(note){
    const state = S();
    const j = todayEntry(state);
    j.note = String(note||"").slice(0, 800);
    deps.save();
  }

  function closeDay(){
    const state = S();
    const check = canCloseDay(state);
    if(!check.ok){
      if(check.reason === "already") deps.toast("День уже закрыт", "info");
      else if(check.reason === "mood") deps.toast("Сначала выбери настроение", "info");
      return;
    }
    const today = deps.todayKey();
    const j = todayEntry(state);
    const beforeStreak = state.streak || 0;

    if(state.lastClosedDay === null){
      state.streak = 1;
    } else {
      const last = new Date(state.lastClosedDay);
      const now = new Date(today);
      const diff = Math.round((now - last) / 86400000);
      if(diff === 1) state.streak = beforeStreak + 1;
      else if(diff === 0){ /* same day guarded above */ }
      else if(diff === 2 && freezeAvailable(state) && beforeStreak > 0){
        state.streakFreeze.used = 1;
        grantSticker(state, "freeze", true);
        state.streak = beforeStreak + 1;
        deps.toast("Пропуск закрыт заморозкой ❄️ — серия продолжается", "success");
      } else {
        state.streak = 1;
      }
    }
    state.lastClosedDay = today;
    state.lastActiveDay = today;
    j.closed = true;
    j.closedAt = Date.now();

    grantSticker(state, "spark", true);
    const hit = STREAK_MILESTONES.filter(function(m){ return beforeStreak < m.n && state.streak >= m.n; });
    let sparksGain = 10;
    let xpGain = 20;
    hit.forEach(function(m){
      sparksGain += m.sparks;
      xpGain += m.xp;
      grantSticker(state, m.sticker, true);
    });
    const sparks = deps.addSparks(sparksGain);
    const lvl = deps.addXp(xpGain);
    const before = state.stats.discipline;
    deps.addStat("discipline", hit.length ? 12 : 6);
    deps.logToday({
      icon:"🔥",
      label:"День закрыт",
      detail:"Серия " + state.streak + " · +" + xpGain + " XP · +" + sparks + " ✦"
    });
    deps.checkAchievements();
    syncAchievementStickers(state, true);
    unlockStreakRewards(state, false);
    if(!titleUnlocked(state, state.profileTitle)) state.profileTitle = bestTitleId(state);
    if(deps.onRedJohnDayClosed) deps.onRedJohnDayClosed();
    deps.save();
    deps.render();
    const flame = flameTier(state.streak);
    const milestoneMsg = hit.length ? hit[hit.length-1].msg : ("Серия " + state.streak + " · огонёк " + flame.label);
    deps.showRewardMoment({
      statKey:"discipline", statLabel:"Дисциплина", statColorVar:"--gold",
      fromValue:before, toValue:state.stats.discipline, statMax:deps.currentStatMax(),
      xp:xpGain,
      tier: lvl.leveledUp ? "levelup" : (hit.length ? "record" : "normal"),
      message: lvl.leveledUp ? ("Уровень " + lvl.newLevel + "!") : milestoneMsg
    });
  }

  function useFreeze(){
    const state = S();
    if(!canUseFreeze(state)){
      deps.toast("Заморозка сейчас недоступна", "info");
      return;
    }
    state.streakFreeze.used = 1;
    // Bridge the missed day: set lastClosedDay to yesterday so today can continue the chain
    const y = new Date();
    y.setDate(y.getDate() - 1);
    state.lastClosedDay = y.toDateString();
    grantSticker(state, "freeze", true);
    deps.logToday({ icon:"❄️", label:"Заморозка серии", detail:"Серия " + state.streak + " спасена" });
    deps.save(); deps.render();
    deps.toast("Серия спасена заморозкой ❄️", "success");
  }

  function setProfileTitle(id){
    const state = S();
    if(!titleUnlocked(state, id)) return;
    state.profileTitle = id;
    deps.save(); deps.render();
  }

  function togglePinSticker(id){
    const state = S();
    if(!ownsSticker(state, id)) return;
    const pinned = state.stickers.pinned;
    const idx = pinned.indexOf(id);
    if(idx >= 0) pinned.splice(idx, 1);
    else {
      if(pinned.length >= 6){ deps.toast("На витрине максимум 6 стикеров", "info"); return; }
      pinned.push(id);
    }
    deps.save(); deps.render();
  }

  function moodById(id){
    return MOODS.find(function(m){ return m.id===id; }) || null;
  }

  function formatDateLabel(key){
    try{
      const d = new Date(key);
      return d.toLocaleDateString("ru-RU", { weekday:"long", day:"numeric", month:"long" });
    }catch(err){
      return key;
    }
  }

  function renderFlameWidget(state){
    const streak = state.streak || 0;
    const flame = flameTier(streak);
    const j = todayEntry(state);
    const next = nextMilestone(streak);
    const closed = !!j.closed;
    let status;
    if(closed) status = "День закрыт — огонёк в безопасности";
    else if(canUseFreeze(state)) status = "Вчера пропуск — можно спасти серию заморозкой";
    else if(streak > 0) status = "Закрой день, чтобы продлить серию";
    else status = "Закрой день — зажги огонёк";

    const nextHtml = next
      ? '<div class="flame-next">до вехи <strong>' + next.n + '</strong>: ещё ' + (next.n - streak) + ' · награда ' + getSticker(next.sticker).emoji + '</div>'
      : '<div class="flame-next">ты на вершине вех</div>';

    return '' +
      '<div class="flame-widget flame-' + flame.tier + (closed?' is-safe':'') + '">' +
        '<div class="flame-core" aria-hidden="true"><span class="flame-emoji">' + flame.emoji + '</span></div>' +
        '<div class="flame-body">' +
          '<div class="flame-count">' + streak + '</div>' +
          '<div class="flame-label">серия · ' + flame.label + '</div>' +
          '<div class="flame-status">' + status + '</div>' +
          nextHtml +
        '</div>' +
      '</div>';
  }

  function renderDaySpread(){
    const state = S();
    const j = todayEntry(state);
    const closed = !!j.closed;
    const activity = dayActivityScore(state);
    const check = canCloseDay(state);

    const moods = MOODS.map(function(m){
      return '<button type="button" class="mood-chip ' + (j.mood===m.id?'active':'') + '" data-action="day-mood" data-mood="' + m.id + '" ' + (closed?'disabled':'') + ' title="' + e(m.label) + '">' +
        '<span class="mood-emoji">' + m.emoji + '</span><span class="mood-label">' + e(m.label) + '</span></button>';
    }).join('');

    const bits = activity.bits.map(function(b){
      return '<span class="day-bit ' + (b.ok?'on':'') + '">' + (b.ok?'✓':'·') + ' ' + e(b.label) + '</span>';
    }).join('');

    const freezeBtn = canUseFreeze(state)
      ? '<button type="button" class="btn btn-ghost btn-sm" data-action="use-freeze">❄️ Спасти серию</button>'
      : (freezeAvailable(state)
        ? '<span class="freeze-hint">❄️ заморозка на этой неделе ещё есть</span>'
        : '<span class="freeze-hint">❄️ заморозка уже использована</span>');

    const closeBtn = closed
      ? '<div class="day-closed-badge">День закрыт · серия ' + state.streak + '</div>'
      : '<button type="button" class="btn btn-primary day-close-btn" data-action="close-day" ' + (check.ok?'':'disabled') + '>🔥 Закрыть день</button>';

    return '' +
      '<div class="panel day-spread">' +
        '<div class="day-spread-head">' +
          '<div><div class="day-kicker">Дневной разворот</div>' +
          '<h2 class="day-date">' + e(formatDateLabel(deps.todayKey())) + '</h2>' +
          '<p class="screen-sub">Настроение + пара строк — и можно закрыть день. Как страница в тетради.</p></div>' +
          renderFlameWidget(state) +
        '</div>' +
        '<div class="mood-row" role="group" aria-label="Настроение">' + moods + '</div>' +
        '<label class="day-note-wrap"><span class="day-note-label">Свободная заметка</span>' +
          '<textarea class="day-note" data-action="day-note" maxlength="800" rows="4" placeholder="Что важно сегодня? Мысль, победа, хаос — как угодно…" ' + (closed?'readonly':'') + '>' + e(j.note||"") + '</textarea></label>' +
        '<div class="day-bits">' + bits + '</div>' +
        '<div class="day-actions">' + closeBtn + freezeBtn +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="nav" data-screen="profile">Витрина →</button>' +
        '</div>' +
      '</div>';
  }

  function renderStickerShelf(state, interactive){
    const owned = state.stickers.owned || [];
    if(!owned.length) return '<div class="empty-state">Стикеры появятся за серию и достижения.</div>';
    return '<div class="sticker-shelf">' + owned.map(function(id){
      const st = getSticker(id);
      if(!st) return "";
      const pinned = state.stickers.pinned.indexOf(id) !== -1;
      if(interactive){
        return '<button type="button" class="sticker-tile ' + (pinned?'is-pinned':'') + '" data-action="toggle-pin-sticker" data-id="' + id + '" title="' + e(st.name) + ' — ' + e(st.blurb) + '">' +
          '<span class="sticker-emoji">' + st.emoji + '</span><span class="sticker-name">' + e(st.name) + '</span>' +
          (pinned?'<span class="sticker-pin">на витрине</span>':'') +
        '</button>';
      }
      return '<span class="sticker-chip" title="' + e(st.name) + '">' + st.emoji + '</span>';
    }).join('') + '</div>';
  }

  function renderProfileShowcase(){
    const state = S();
    const j = todayEntry(state);
    const mood = moodById(j.mood);
    const flame = flameTier(state.streak||0);
    const titles = unlockedTitles(state);
    const titleChips = titles.map(function(t){
      return '<button type="button" class="title-chip ' + (state.profileTitle===t.id?'active':'') + '" data-action="set-profile-title" data-id="' + t.id + '">' + e(t.name) + '</button>';
    }).join('');

    const pinned = (state.stickers.pinned||[]).map(function(id){
      const st = getSticker(id);
      return st ? '<span class="vitrine-sticker" title="' + e(st.name) + '">' + st.emoji + '</span>' : '';
    }).join('');

    const ta = state.trackedAreas || {};
    const highlights = [];
    if(ta.workouts){
      const wc = window.LifeFeatures ? LifeFeatures.totalWorkoutCount(state) : (state.workouts||[]).length;
      highlights.push({ icon:"💪", label:"Тренировки", value: String(wc) });
    }
    if(ta.books){
      const done = (state.books||[]).filter(function(b){ return b.status==="done"; }).length;
      highlights.push({ icon:"📚", label:"Книги", value: String(done) });
    }
    if(ta.goals){
      highlights.push({ icon:"🎯", label:"Цели", value: String((state.goals||[]).length) });
    }
    if(ta.tasks){
      highlights.push({ icon:"✅", label:"Привычки", value: String((state.habits||[]).length) });
    }
    highlights.push({ icon: flame.emoji, label:"Серия", value: String(state.streak||0) });
    highlights.push({ icon:"✦", label:"Искры", value: String(state.sparks||0) });

    const hlHtml = highlights.map(function(h){
      return '<div class="vitrine-stat"><span class="vitrine-stat-ic">' + h.icon + '</span><div><div class="vitrine-stat-val">' + e(h.value) + '</div><div class="vitrine-stat-lbl">' + e(h.label) + '</div></div></div>';
    }).join('');

    const note = (j.note||"").trim();
    const noteBlock = note
      ? '<div class="vitrine-note"><div class="vitrine-note-label">Сегодня в развороте</div><p>' + e(note) + '</p></div>'
      : '<div class="vitrine-note muted">Заметка дня появится здесь — как стикер на полях.</div>';

    return '' +
      '<div class="screen-head"><h2>Витрина</h2><p class="screen-sub">Твоя страница — титул, огонёк и стикеры. То, чем можно гордиться.</p></div>' +
      '<div class="panel vitrine-hero">' +
        '<div class="vitrine-portrait">' + deps.characterPortrait({ size:112, name:state.character.name, glowColor:deps.dominantColor() }) + '</div>' +
        '<div class="vitrine-identity">' +
          '<div class="vitrine-name">' + e(state.character.name) + '</div>' +
          '<div class="vitrine-title">' + e(titleName(state)) + '</div>' +
          '<div class="vitrine-meta">Ур. ' + state.level + ' · ' + flame.emoji + ' ' + (state.streak||0) + (mood ? ' · ' + mood.emoji + ' ' + e(mood.label) : '') + '</div>' +
          '<div class="vitrine-pins">' + (pinned || '<span class="vitrine-pins-empty">Закрепи стикеры ниже</span>') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="vitrine-stats">' + hlHtml + '</div>' +
      noteBlock +
      '<div class="panel"><div class="panel-head"><h3>Титул на витрине</h3></div><div class="title-row">' + titleChips + '</div></div>' +
      '<div class="panel"><div class="panel-head"><h3>Стикеры</h3><span class="screen-sub">нажми — закрепить на витрине</span></div>' +
        renderStickerShelf(state, true) +
      '</div>';
  }

  function handleAction(action, el, id){
    if(action==="day-mood"){ setMood(el.dataset.mood); return true; }
    if(action==="close-day"){ closeDay(); return true; }
    if(action==="use-freeze"){ useFreeze(); return true; }
    if(action==="set-profile-title"){ setProfileTitle(id); return true; }
    if(action==="toggle-pin-sticker"){ togglePinSticker(id); return true; }
    return false;
  }

  function handleForm(){ return false; }

  function afterRender(){
    const ta = document.querySelector("textarea.day-note");
    if(!ta || ta.dataset.bound) return;
    ta.dataset.bound = "1";
    let timer = null;
    ta.addEventListener("input", function(){
      clearTimeout(timer);
      const val = ta.value;
      timer = setTimeout(function(){ saveNote(val); }, 280);
    });
  }

  function onAchievementsChanged(state){
    syncAchievementStickers(state, true);
  }

  return {
    install: install,
    migrate: migrate,
    reconcileFlame: reconcileFlame,
    renderDaySpread: renderDaySpread,
    renderProfileShowcase: renderProfileShowcase,
    renderFlameWidget: renderFlameWidget,
    handleAction: handleAction,
    handleForm: handleForm,
    afterRender: afterRender,
    onAchievementsChanged: onAchievementsChanged,
    titleName: titleName,
    flameTier: flameTier,
    getTopbarTitles: function(){ return { profile:"Витрина" }; },
  };
})();
