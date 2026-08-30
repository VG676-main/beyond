/**
 * BEYOND — features ported from life-rpg v25
 * Loaded before app.js; wired via LifeFeatures.install() from BeyondApp.init
 */
window.LifeFeatures = (function(){
  "use strict";

  let deps = null;
  let workoutTab = "strength";
  let openExerciseId = null, addExerciseOpen = false, cardioJustReached = false;
  let oneRmOpen = false, calc1rm = { weight:0, reps:0 };
  let openViceId = null, addViceOpen = false, planEditDay = null;
  let goalLinkDraft = { type:"manual", refId:null, metric:"minutes" };

  const CARDIO_MILESTONES = [
    { min:30, icon:"🚶", label:"Первые полчаса в движении" },
    { min:60, icon:"🏃", label:"Целый час активности" },
    { min:150, icon:"💚", label:"Недельная норма ВОЗ — 150 минут" },
    { min:300, icon:"🔥", label:"5 часов кардио" },
    { min:600, icon:"⛰️", label:"10 часов — серьёзная вершина" },
    { min:1200, icon:"🏔️", label:"20 часов выносливости" },
    { min:2400, icon:"🌊", label:"40 часов кардио" },
    { min:6000, icon:"🏛️", label:"100 часов — марафонец" },
  ];

  const SPINE_PALETTES = {
    classic: [["#b5413a","#8e2f29","#fdeceb"],["#2f6f8f","#214f66","#e9f4f9"],["#3f7a52","#2c5a3b","#eaf5ee"],["#a8651f","#7d4a13","#fcf0e2"],["#5a4a8f","#3f3268","#efeaf9"],["#9e3b6a","#76264c","#fbe9f1"],["#3a6e6a","#274d4a","#e6f3f1"],["#8a7320","#645212","#faf5e0"],["#7a3f2f","#572a1d","#f7e8e2"],["#46618f","#324669","#e9eef7"]],
    pastel: [["#e8a0a0","#d98787","#5a3a3a"],["#a8c8e0","#8bb0d0","#2a3f52"],["#a8d8b8","#8bc4a0","#2a4a38"],["#e8c8a0","#d9b187","#52402a"],["#c4b0e0","#aa92d0","#382a52"],["#e8b0cc","#d992b8","#52283f"],["#a0d8d4","#87c4bf","#2a4a47"],["#e0d4a0","#cbbf87","#4a4226"],["#e0b8a8","#cf9e8b","#523a2a"],["#aec0e0","#92a8d0","#2a3852"]],
    contrast: [["#ff3b30","#c01a12","#fff"],["#007aff","#0050b0","#fff"],["#34c759","#1a8c3a","#fff"],["#ff9500","#c06800","#fff"],["#af52de","#7a2ca8","#fff"],["#ff2d92","#c00060","#fff"],["#00c7be","#008a83","#fff"],["#ffcc00","#c09a00","#1a1a1a"],["#ff6b35","#c0421a","#fff"],["#5856d6","#3634a8","#fff"]],
    mono: [["#3a3a3f","#222226","#e8e8ec"],["#55555c","#3a3a40","#f0f0f4"],["#6e6e78","#4f4f58","#f4f4f8"],["#2a2a2e","#161619","#dcdce0"],["#48484f","#2e2e34","#ececf0"],["#62626c","#44444c","#f2f2f6"],["#33333a","#1e1e24","#e0e0e6"],["#5a5a64","#3e3e48","#eeeef2"],["#404048","#28282e","#e4e4ea"],["#74747e","#54545e","#f6f6fa"]],
    vintage: [["#8a6d3b","#63502b","#f5ecd8"],["#6b7a4f","#4e5a3a","#f0f2e2"],["#9c5a3c","#74422c","#f7e8dc"],["#5a6b6e","#414f51","#e8f0f1"],["#8a5a5a","#664242","#f5e6e6"],["#7a6a4a","#594e37","#f2ecdc"],["#4f6b5a","#3a4f43","#e6f0ea"],["#9c8044","#746031","#f7f0dc"],["#6b4f5a","#4f3a43","#f0e6ea"],["#5a5f7a","#42465a","#e8eaf2"]],
  };
  const SPINE_PALETTE_NAMES = [
    { key:"classic", label:"Классика" }, { key:"pastel", label:"Пастель" },
    { key:"contrast", label:"Контраст" }, { key:"mono", label:"Монохром" },
    { key:"vintage", label:"Винтаж" },
  ];

  const VICE_PRESETS = [
    { key:"smoking", name:"Курение", icon:"🚬", type:"count", unit:"сигарет", cost:0.5 },
    { key:"e_cigs", name:"Электронные сигареты", icon:"💨", type:"count", unit:"затяжек", cost:0.0 },
    { key:"scroll", name:"Скроллинг", icon:"📱", type:"time", unit:"мин", cost:0 },
    { key:"gaming", name:"Игры / видео", icon:"🎮", type:"time", unit:"мин", cost:0 },
  ];

  const MUSCLE_PRESETS = [
    { key:"chest", icon:"🫁", label:"Грудь" }, { key:"back", icon:"🔙", label:"Спина" },
    { key:"legs", icon:"🦵", label:"Ноги" }, { key:"shoulders", icon:"💪", label:"Плечи" },
    { key:"arms", icon:"💪", label:"Руки" }, { key:"core", icon:"🎯", label:"Пресс" },
    { key:"cardio", icon:"🏃", label:"Кардио" }, { key:"rest", icon:"😴", label:"Отдых" },
  ];

  const WEEKDAY_NAMES = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];

  function S(){ return deps.getState(); }
  function d(){ return deps; }

  function install(hooks){ deps = hooks; }

  function defaultHabits(){
    return [
      { id:deps.uid(), text:"Выпить 2 литра воды", rhythm:{type:"everyN",n:1}, anchor:deps.todayKey(), created:Date.now(), streak:0, lastDone:null, history:[] },
      { id:deps.uid(), text:"Прочитать 20 страниц", rhythm:{type:"everyN",n:1}, anchor:deps.todayKey(), created:Date.now(), streak:0, lastDone:null, history:[] },
    ];
  }

  function emptyWeekPlan(){
    const p = {};
    for(let i=0;i<7;i++) p[i] = { items:[] };
    return p;
  }

  function migrate(state){
    state.exercises = state.exercises || [];
    state.cardioMinutes = state.cardioMinutes ?? 0;
    state.habits = state.habits || [];
    state.vices = state.vices || [];
    // If user already created the vape vice before we switched naming/icon,
    // migrate it so UI stays consistent.
    (state.vices || []).forEach(function(v){
      if(!v) return;
      if(v.name === "Электронные сигареты"){
        v.icon = "💨";
        v.unit = v.unit || "затяжек";
      }
    });
    state.vicesIntroSeen = state.vicesIntroSeen ?? false;
    state.bookPalette = state.bookPalette || "classic";
    state.weekPlan = state.weekPlan || emptyWeekPlan();
    state.weekDone = state.weekDone || {};
    for(let wd=0;wd<7;wd++){
      if(!state.weekPlan[wd]) state.weekPlan[wd] = { items:[] };
      if(!Array.isArray(state.weekPlan[wd].items)) state.weekPlan[wd].items = [];
    }
    state.goals.forEach(function(g){ if(!g.link) g.link = { type:"manual" }; });
    normalizeLinkedGoalUnits(state);

    if(state.workouts && state.workouts.some(function(w){ return w.type==="strength"; })){
      state.workouts.filter(function(w){ return w.type==="strength"; }).forEach(function(w){
        const name = (w.name||"Упражнение").trim();
        const key = name.toLowerCase();
        let ex = state.exercises.find(function(e){ return e.name.toLowerCase()===key; });
        if(!ex){ ex = { id:deps.uid(), name:name, icon:"💪", sets:[] }; state.exercises.push(ex); }
        const weight = Number(w.weight)||0, reps = Number(w.reps)||0;
        ex.sets.push({ id:deps.uid(), weight:weight, reps:reps, e1rm:(weight>0&&reps>0)?Math.round(weight*(1+reps/30)):0, at: w.date ? new Date(w.date).getTime() : Date.now() });
      });
      state.workouts = state.workouts.filter(function(w){ return w.type!=="cardio"; });
    } else {
      state.workouts = (state.workouts||[]).filter(function(w){ return w.type==="cardio"; });
    }

    if(!state.habits.length && state.tasks && state.tasks.length){
      state.tasks.forEach(function(t){
        if(t.daily){
          state.habits.push({ id:t.id||deps.uid(), text:t.text, rhythm:{type:"everyN",n:1}, anchor:deps.todayKey(), created:Date.now(), streak:0, lastDone:null, history:[] });
        }
      });
      state.tasks = state.tasks.filter(function(t){ return !t.daily; }).map(function(t){
        return { id:t.id, text:t.text, due:t.due||"today", done:!!t.done, rewarded:!!t.rewarded, createdAt:t.createdAt||Date.now() };
      });
    }
    if(!state.habits.length) state.habits = defaultHabits();
    state.habits.forEach(function(h){
      if(!h.rhythm) h.rhythm = { type:"everyN", n:1 };
      if(!h.anchor) h.anchor = deps.todayKey();
      if(!Array.isArray(h.history)) h.history = [];
    });
    state.tasks = (state.tasks||[]).filter(function(t){ return t && (t.due==="today"||t.due==="tomorrow"||!t.daily); });
    recomputeCardio(state);
  }

  function totalWorkoutCount(s){
    let n = (s.workouts||[]).filter(function(w){ return w.type==="cardio"; }).length;
    (s.exercises||[]).forEach(function(e){ n += (e.sets||[]).length; });
    return n;
  }

  function spinePalette(state){ return SPINE_PALETTES[state.bookPalette||"classic"] || SPINE_PALETTES.classic; }

  function getSpineAccent(state, globalIdx){
    const pal = spinePalette(state);
    const c = pal[globalIdx % pal.length];
    return "--spine:" + c[0] + ";--book-spine-ink:" + c[2] + ";";
  }

  function recomputeCardio(state){
    let m = 0;
    (state.workouts||[]).forEach(function(w){ if(w.type==="cardio") m += Number(w.duration)||0; });
    state.cardioMinutes = m;
  }

  function exercisePR(ex){
    let best = null;
    (ex.sets||[]).forEach(function(s){
      if(s.reps>0){
        if(!best){ best = s; return; }
        if(s.weight>0 || best.weight>0){ if(s.e1rm > best.e1rm) best = s; }
        else if(s.reps > best.reps) best = s;
      }
    });
    return best;
  }

  function fmtDate(ts){
    const dt = new Date(ts);
    const days = ["вс","пн","вт","ср","чт","пт","сб"];
    const months = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
    return days[dt.getDay()] + ", " + dt.getDate() + " " + months[dt.getMonth()];
  }

  function fmtHours(mins){
    if(mins < 60) return mins + " мин";
    const h = mins/60;
    return Number.isInteger(h) ? h + " ч" : (Math.round(h*10)/10) + " ч";
  }

  /* ---- Habits rhythm ---- */
  function isHabitDay(h, date){
    const r = h.rhythm || { type:"everyN", n:1 };
    if(r.type === "weekdays") return (r.days||[]).indexOf(date.getDay()) !== -1;
    const n = Math.max(1, r.n||1);
    if(n === 1) return true;
    const anchor = h.anchor ? new Date(h.anchor) : new Date(h.created||Date.now());
    const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    const dd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = Math.round((dd - a) / 86400000);
    return (((diff % n) + n) % n) === 0;
  }

  function prevHabitDay(h, date){
    let cur = new Date(date.getTime() - 86400000);
    for(let i=0;i<400;i++){
      if(isHabitDay(h, cur)) return cur;
      cur = new Date(cur.getTime() - 86400000);
    }
    return null;
  }

  function streakByRhythm(h){
    const set = {}; (h.history||[]).forEach(function(x){ set[x]=true; });
    let streak = 0;
    const today = new Date();
    let cur = isHabitDay(h, today) ? today : prevHabitDay(h, today);
    if(!cur) return 0;
    if(isHabitDay(h, today) && !set[deps.todayKey()]){
      cur = prevHabitDay(h, today);
      if(!cur) return 0;
    }
    while(cur && set[cur.toDateString()]){ streak++; cur = prevHabitDay(h, cur); }
    return streak;
  }

  function rhythmLabel(h){
    const r = h.rhythm || { type:"everyN", n:1 };
    if(r.type === "weekdays"){
      const names = ["вс","пн","вт","ср","чт","пт","сб"];
      return (r.days||[]).slice().sort().map(function(x){ return names[x]; }).join("/") || "по дням";
    }
    const n = r.n||1;
    if(n===1) return "каждый день";
    if(n===2) return "через день";
    return "каждые " + n + " дн.";
  }

  function habitsScheduledToday(state){
    const today = new Date();
    return (state.habits||[]).filter(function(h){ return isHabitDay(h, today); });
  }

  function habitsProgressRhythm(state){
    const list = habitsScheduledToday(state);
    const tk = deps.todayKey();
    const done = list.filter(function(h){ return h.lastDone === tk; }).length;
    return { total:list.length, done:done, complete:list.length>0 && done===list.length };
  }

  function habitDoneToday(h){ return h.lastDone === deps.todayKey(); }

  function toggleHabit(id){
    const state = S();
    const h = state.habits.find(function(x){ return x.id===id; });
    if(!h) return;
    const today = deps.todayKey();
    if(h.lastDone === today){
      h.history = (h.history||[]).filter(function(x){ return x !== today; });
      h.lastDone = h.history.length ? h.history[h.history.length-1] : null;
      h.streak = streakByRhythm(h);
      deps.save(); deps.render(); return;
    }
    h.history = h.history || []; h.history.push(today); h.lastDone = today;
    h.streak = streakByRhythm(h);
    state.totalTasksCompleted++;
    const before = state.stats.discipline;
    deps.addStat("discipline", 5);
    deps.touchStreakForToday();
    const lvl = deps.addXp(10);
    const sparks = deps.addSparks(5);
    deps.logToday({ icon:"🔥", label:h.text, detail:"+5 Дисциплина · серия " + h.streak + " · +" + sparks + " ✦" });
    if(deps.maybeClaimHabitsBonus) deps.maybeClaimHabitsBonus();
    deps.checkAchievements(); deps.save(); deps.render();
    deps.showRewardMoment({
      statKey:"discipline", statLabel:"Дисциплина", statColorVar:"--gold",
      fromValue:before, toValue:state.stats.discipline, statMax:deps.currentStatMax(),
      xp:10, tier: lvl.leveledUp ? "levelup" : (h.streak>=2 ? "record" : "normal"),
      message: lvl.leveledUp ? ("Уровень " + lvl.newLevel + "! " + deps.levelTitle(lvl.newLevel))
        : (h.streak>=2 ? ("«" + h.text + "» — серия " + h.streak) : ("Привычка отмечена. +" + sparks + " ✦"))
    });
  }

  function addHabit(text, rhythm){
    S().habits.push({ id:deps.uid(), text:text, rhythm:rhythm||{type:"everyN",n:1}, anchor:deps.todayKey(), created:Date.now(), streak:0, lastDone:null, history:[] });
    deps.save(); deps.render();
  }

  function parseRhythm(val){
    if(val==="d1") return { type:"everyN", n:1 };
    if(val==="d2") return { type:"everyN", n:2 };
    if(val==="d3") return { type:"everyN", n:3 };
    if(val==="wd_135") return { type:"weekdays", days:[1,3,5] };
    if(val==="wd_246") return { type:"weekdays", days:[2,4,6] };
    if(val==="wd_67") return { type:"weekdays", days:[6,0] };
    if(val==="wd_12345") return { type:"weekdays", days:[1,2,3,4,5] };
    return { type:"everyN", n:1 };
  }

  /* ---- One-off tasks ---- */
  function toggleOneOffTask(id){
    const state = S();
    const t = state.tasks.find(function(x){ return x.id===id; });
    if(!t) return;
    t.done = !t.done;
    if(t.done && !t.rewarded){
      t.rewarded = true; state.totalTasksCompleted++;
      const before = state.stats.discipline;
      deps.addStat("discipline", 5); deps.touchStreakForToday();
      const lvl = deps.addXp(10); const sparks = deps.addSparks(5);
      deps.logToday({ icon:"✅", label:t.text, detail:"+5 Дисциплина · +" + sparks + " ✦" });
      deps.checkAchievements(); deps.save(); deps.render();
      deps.showRewardMoment({
        statKey:"discipline", statLabel:"Дисциплина", statColorVar:"--gold",
        fromValue:before, toValue:state.stats.discipline, statMax:deps.currentStatMax(),
        xp:10, tier: lvl.leveledUp ? "levelup" : "normal",
        message: lvl.leveledUp ? ("Уровень " + lvl.newLevel + "!") : ("Готово. +" + sparks + " ✦")
      });
    } else { deps.save(); deps.render(); }
  }

  function tomorrowWeekday(todayWd){
    return (todayWd + 1) % 7;
  }

  function oneOffTasksForWeekday(wd, todayWd){
    const tomorrowWd = tomorrowWeekday(todayWd);
    return (S().tasks || []).filter(function(t){
      if(!t || t.daily) return false;
      if(typeof t.dueWeekday === "number") return t.dueWeekday === wd;
      if((t.due || "today") === "today") return wd === todayWd;
      if(t.due === "tomorrow") return wd === tomorrowWd;
      return false;
    });
  }

  function addOneOffTask(text, due, weekday){
    const task = { id:deps.uid(), text:text, done:false, rewarded:false, createdAt:Date.now() };
    if(weekday !== undefined && weekday !== null && weekday !== ""){
      task.dueWeekday = Number(weekday);
    } else {
      task.due = due || "today";
    }
    S().tasks.push(task);
    deps.save(); deps.render();
  }

  /* ---- Exercises ---- */
  function addExercise(name){
    const state = S();
    name = (name||"").trim(); if(!name) return;
    const exists = state.exercises.find(function(e){ return e.name.toLowerCase()===name.toLowerCase(); });
    if(exists){ openExerciseId = exists.id; deps.toast("Упражнение уже есть", "info"); deps.save(); deps.render(); return; }
    const ex = { id:deps.uid(), name:name, icon:"💪", sets:[] };
    state.exercises.push(ex); openExerciseId = ex.id;
    deps.checkAchievements(); deps.save(); deps.render();
  }

  function deleteExercise(id){
    const state = S();
    state.exercises = state.exercises.filter(function(e){ return e.id!==id; });
    if(openExerciseId===id) openExerciseId = null;
    deps.save(); deps.render();
  }

  function addSet(exId, weight, reps){
    const state = S();
    const ex = state.exercises.find(function(e){ return e.id===exId; });
    if(!ex) return;
    weight = Number(weight)||0; reps = Number(reps)||0;
    if(reps<=0) return;
    const e1rm = weight>0 ? (reps<=1 ? weight : Math.round(weight*(1+reps/30))) : 0;
    const prevPR = exercisePR(ex);
    const set = { id:deps.uid(), weight:weight, reps:reps, e1rm:e1rm, at:Date.now() };
    ex.sets.push(set);
    let isRecord = false, isTrueRecord = false;
    if(!prevPR){ isRecord = true; }
    else if(weight>0){ isTrueRecord = e1rm > prevPR.e1rm; isRecord = isTrueRecord; }
    else { isTrueRecord = prevPR.weight===0 && reps > prevPR.reps; isRecord = isTrueRecord; }
    deps.touchStreakForToday();
    const gain = isRecord ? 16 : 8, xp = isRecord ? 60 : 30, sparksGain = isRecord ? 20 : 10;
    const before = state.stats.strength;
    deps.addStat("strength", gain);
    if(isTrueRecord) state.totalRecords++;
    const lvl = deps.addXp(xp);
    const sparks = deps.addSparks(sparksGain);
    const setLabel = weight>0 ? (weight + " кг × " + reps) : (reps + " повт.");
    const msg = isRecord ? (prevPR ? ("Новый рекорд: " + setLabel) : ("Первый замер: " + setLabel)) : ("Подход в зачёт. +" + sparks + " ✦");
    deps.logToday({ icon:isRecord?"⚡":"💪", label:ex.name + (isTrueRecord?" (рекорд)":""), detail:"+" + gain + " Сила · +" + sparks + " ✦" });
    syncLinkedGoals(); deps.checkAchievements(); deps.save(); deps.render();
    deps.showRewardMoment({
      statKey:"strength", statLabel:"Сила", statColorVar:"--crimson",
      fromValue:before, toValue:state.stats.strength, statMax:deps.currentStatMax(),
      xp:xp, tier: lvl.leveledUp ? "levelup" : (isRecord ? "record" : "normal"), message: msg
    });
  }

  function deleteSet(exId, setId){
    const ex = S().exercises.find(function(e){ return e.id===exId; });
    if(!ex) return;
    ex.sets = ex.sets.filter(function(s){ return s.id!==setId; });
    deps.save(); deps.render();
  }

  function addCardioWorkout(data){
    const state = S();
    const entry = { id:deps.uid(), type:"cardio", name:data.name||"Кардио", duration:data.duration||"", notes:data.notes||"", distance:data.distance||"", date:new Date().toISOString() };
    const mins = Number(data.duration)||0;
    const minsBefore = state.cardioMinutes||0;
    deps.touchStreakForToday();
    const before = state.stats.endurance;
    state.cardioMinutes = minsBefore + mins;
    const eGain = Math.max(5, Math.round(mins/3));
    const xpGain = Math.max(20, Math.round(mins*0.8));
    deps.addStat("endurance", eGain);
    const lvl = deps.addXp(xpGain);
    const sparks = deps.addSparks(Math.max(10, Math.round(mins/4)));
    state.workouts.unshift(entry);
    let crossed = null;
    CARDIO_MILESTONES.forEach(function(m){ if(minsBefore < m.min && state.cardioMinutes >= m.min) crossed = m; });
    if(crossed) cardioJustReached = true;
    deps.logToday({ icon:"🏃", label:entry.name, detail:"+" + eGain + " Выносливость · +" + sparks + " ✦" });
    syncLinkedGoals(); deps.checkAchievements(); deps.save(); deps.render();
    deps.showRewardMoment({
      statKey:"endurance", statLabel:"Выносливость", statColorVar:"--teal",
      fromValue:before, toValue:state.stats.endurance, statMax:deps.currentStatMax(),
      xp:xpGain, tier: lvl.leveledUp ? "levelup" : (crossed ? "record" : "normal"),
      message: crossed ? ("Веха: " + crossed.label) : (mins ? (mins + " мин в зачёт. +" + sparks + " ✦") : "Кардио в зачёт.")
    });
  }

  function deleteWorkout(id){
    S().workouts = S().workouts.filter(function(w){ return w.id!==id; });
    recomputeCardio(S()); deps.save(); deps.render();
  }

  /* ---- Goals ---- */
  function goalDefaultUnit(d){
    if(!d || d.type==="manual") return "";
    if(d.type==="books") return "книг";
    if(d.type==="cardio") return (d.metric||"minutes")==="km" ? "км" : "мин";
    if(d.type==="vice") return "дней";
    if(d.type==="exercise") return "кг";
    return "";
  }

  function goalDisplayUnit(g){
    const link = g.link || { type:"manual" };
    if(link.type !== "manual") return goalDefaultUnit(link) || g.unit || "";
    return g.unit || "";
  }

  function normalizeLinkedGoalUnits(state){
    (state.goals||[]).forEach(function(g){
      if(g.link && g.link.type !== "manual"){
        const unit = goalDefaultUnit(g.link);
        if(unit) g.unit = unit;
      }
    });
  }

  function linkedGoalValue(g){
    const state = S();
    const link = g.link || { type:"manual" };
    if(link.type === "exercise"){
      const ex = state.exercises.find(function(e){ return e.id===link.refId; });
      if(!ex) return null;
      const sets = ex.sets||[];
      if(!sets.length) return 0;
      if(sets.some(function(s){ return s.weight>0; })) return sets.reduce(function(m,s){ return Math.max(m, Number(s.weight)||0); }, 0);
      return sets.reduce(function(m,s){ return Math.max(m, Number(s.reps)||0); }, 0);
    }
    if(link.type === "books") return state.books.filter(function(b){ return b.status==="done"; }).length;
    if(link.type === "vice"){
      const v = state.vices.find(function(x){ return x.id===link.refId; });
      return v ? viceCleanStreak(v) : null;
    }
    if(link.type === "cardio"){
      if(link.metric === "km") return state.workouts.filter(function(w){ return w.type==="cardio"; }).reduce(function(s,w){ return s+(Number(w.distance)||0); }, 0);
      return state.cardioMinutes||0;
    }
    return null;
  }

  function viceCleanStreak(v){
    let streak = 0, cur = new Date();
    for(let i=0;i<400;i++){
      const key = cur.toDateString();
      const val = (v.log && v.log[key]!==undefined) ? v.log[key] : null;
      if(val === 0) streak++;
      else if(val === null && i===0) { /* today unlogged */ }
      else break;
      cur = new Date(cur.getTime() - 86400000);
    }
    return streak;
  }

  function syncLinkedGoals(){
    const state = S();
    (state.goals||[]).forEach(function(g){
      if(g.link && g.link.type !== "manual"){
        const val = linkedGoalValue(g);
        if(val !== null){
          const was = g.target>0 && g.current >= g.target;
          g.current = val;
          const now = g.target>0 && g.current >= g.target;
          if(!was && now){
            deps.addXp(40); const sparks = deps.addSparks(25);
            deps.logToday({ icon:"🏆", label:"Цель: " + g.title, detail:"+" + sparks + " ✦" });
            deps.toast("Цель достигнута: " + g.title + " · +" + sparks + " ✦", "success");
          }
        }
      }
    });
  }

  function addGoalWithLink(data){
    const g = { id:deps.uid(), title:data.title, description:data.description||"", current:Number(data.current)||0, target:Number(data.target)||1, unit:data.unit||"", link:data.link||{type:"manual"} };
    S().goals.unshift(g);
    syncLinkedGoals(); deps.checkAchievements(); deps.save(); deps.render();
  }

  function goalLinkLabel(g){
    const state = S();
    const link = g.link||{type:"manual"};
    if(link.type==="exercise"){
      const ex = state.exercises.find(function(e){ return e.id===link.refId; });
      return ex ? ("🔗 «" + deps.esc(ex.name) + "»") : "🔗 упражнение удалено";
    }
    if(link.type==="books") return "🔗 прочитано книг";
    if(link.type==="cardio") return link.metric==="km" ? "🔗 км бега" : "🔗 минут кардио";
    if(link.type==="vice"){
      const v = state.vices.find(function(x){ return x.id===link.refId; });
      return v ? ("🔗 дней без «" + deps.esc(v.name) + "»") : "🔗 привычка удалена";
    }
    return "";
  }

  /* ---- Vices ---- */
  function viceToday(v){ const t = deps.todayKey(); return (v.log && v.log[t]!==undefined) ? v.log[t] : null; }

  function viceAverage(v, lastN){
    const entries = Object.keys(v.log||{}).map(function(k){ return Number(v.log[k])||0; });
    if(!entries.length) return 0;
    const slice = lastN ? entries.slice(-lastN) : entries;
    return slice.reduce(function(a,b){ return a+b; }, 0) / slice.length;
  }

  function viceTotalSaved(v){
    if(!v.baseline || v.baseline<=0) return null;
    let saved = 0;
    Object.keys(v.log||{}).forEach(function(k){ saved += Math.max(0, v.baseline - (Number(v.log[k])||0)); });
    return saved;
  }

  function addVice(data){
    S().vices.push({ id:deps.uid(), name:data.name, icon:data.icon||"⚠️", type:data.type||"count", unit:data.unit||"раз", cost:Number(data.cost)||0, currency:"₽", baseline:Number(data.baseline)||0, log:{}, createdAt:Date.now() });
    deps.save(); deps.render();
  }

  function logVice(id, value){
    const state = S();
    const v = state.vices.find(function(x){ return x.id===id; });
    if(!v) return;
    value = Math.max(0, Number(value)||0);
    const today = deps.todayKey();
    v.log = v.log||{};
    const prev = v.log[today];
    v.log[today] = value;
    if(prev === undefined){
      deps.touchStreakForToday();
      const yKey = new Date(Date.now()-86400000).toDateString();
      const yVal = v.log[yKey];
      let improved = value===0 || (v.baseline>0 && value<v.baseline) || (yVal!==undefined && value<yVal);
      const gain = improved ? 8 : 3, xp = improved ? 25 : 10;
      const before = state.stats.discipline;
      deps.addStat("discipline", gain);
      const lvl = deps.addXp(xp);
      const sparks = deps.addSparks(improved ? 8 : 3);
      deps.logToday({ icon:v.icon, label:v.name + ": " + value + " " + v.unit, detail:"+" + gain + " Дисциплина · +" + sparks + " ✦" });
      syncLinkedGoals(); deps.checkAchievements(); deps.save(); deps.render();
      deps.showRewardMoment({
        statKey:"discipline", statLabel:"Дисциплина", statColorVar:"--gold",
        fromValue:before, toValue:state.stats.discipline, statMax:deps.currentStatMax(),
        xp:xp, tier: lvl.leveledUp ? "levelup" : (improved ? "record" : "normal"),
        message: improved ? "Меньше, чем раньше — дисциплина растёт!" : "Записано."
      });
    } else { syncLinkedGoals(); deps.save(); deps.render(); }
  }

  function deleteVice(id){
    S().vices = S().vices.filter(function(v){ return v.id!==id; });
    if(openViceId===id) openViceId = null;
    deps.save(); deps.render();
  }

  /* ---- Week plan ---- */
  function planProductivity(weekday, dateKey){
    const state = S();
    const todayWd = new Date().getDay();
    const items = (state.weekPlan[weekday]||{items:[]}).items.filter(function(i){ return i.icon!=="😴"; });
    const oneOffs = weekday === todayWd ? oneOffTasksForWeekday(weekday, todayWd) : [];
    if(!items.length && !oneOffs.length) return { done:0, total:0, pct:0 };
    const doneMap = state.weekDone[dateKey]||{};
    const planDone = items.filter(function(i){ return doneMap[i.id]; }).length;
    const onceDone = oneOffs.filter(function(t){ return t.done; }).length;
    const done = planDone + onceDone;
    const total = items.length + oneOffs.length;
    return { done:done, total:total, pct: Math.round((done/total)*100) };
  }

  function addPlanItem(weekday, label, icon){
    const state = S();
    state.weekPlan[weekday].items.push({ id:deps.uid(), label:label, icon:icon||"•" });
    planEditDay = null; deps.save(); deps.render();
  }

  function togglePlanDone(id){
    const state = S();
    const tk = deps.todayKey();
    state.weekDone[tk] = state.weekDone[tk]||{};
    state.weekDone[tk][id] = !state.weekDone[tk][id];
    deps.save(); deps.render();
  }

  function removePlanItem(weekday, id){
    S().weekPlan[weekday].items = S().weekPlan[weekday].items.filter(function(i){ return i.id!==id; });
    deps.save(); deps.render();
  }

  /* ---- Renders ---- */
  function e(s){ return deps.esc(s); }
  function bar(a,b,c,n){ return deps.segBar(a,b,c,n); }

  function renderDashboardHabitRow(h, large){
    const done = habitDoneToday(h);
    const cls = 'habit-row habit-row-dash ' + (large?'habit-row-lg ':'') + (done?'habit-done':'');
    return '<div class="' + cls + '"><button class="habit-check ' + (done?'on':'') + '" data-action="toggle-habit" data-id="' + h.id + '">' + (done?'✓':'') + '</button><div class="habit-main"><span class="habit-text">' + e(h.text) + '</span><span class="habit-rhythm">' + rhythmLabel(h) + '</span></div>' + (h.streak>0?'<span class="habit-streak' + (done?' lit':'') + '">🔥 ' + h.streak + '</span>':'') + '</div>';
  }

  function exerciseTile(ex){
    const pr = exercisePR(ex), count = (ex.sets||[]).length;
    const prBlock = pr ? '<div class="ex-tile-pr">' + (pr.weight>0 ? pr.weight + " кг × " + pr.reps : pr.reps + " повт.") + ' <small>рекорд</small></div>' : '<div class="ex-tile-empty">ещё нет подходов</div>';
    return '<button class="ex-tile" data-action="open-exercise" data-id="' + ex.id + '"><span class="ex-tile-del" data-action="delete-exercise" data-id="' + ex.id + '">✕</span><div class="ex-tile-top"><span class="ex-tile-ic">' + (ex.icon||"💪") + '</span><span class="ex-tile-name">' + e(ex.name) + '</span></div><span class="ex-tile-count">' + count + ' подход.</span>' + prBlock + '</button>';
  }

  function renderStrengthTab(){
    const state = S();
    const grid = state.exercises.map(exerciseTile).join('') + '<button class="ex-add-tile" data-action="add-exercise-prompt"><span class="plus">+</span>Добавить упражнение</button>';
    const intro = state.exercises.length ? '' : '<div class="empty-state" style="margin-bottom:16px;">Создай упражнения — жми на карточку, чтобы записать подходы и смотреть PR.</div>';
    return '<div class="ex-toolbar"><h3>Мои упражнения</h3><button class="btn btn-ghost btn-sm" data-action="open-1rm-calc">🧮 1ПМ калькулятор</button></div>' + intro + '<div class="ex-grid">' + grid + '</div>';
  }

  function renderCardioTab(){
    const state = S(), total = state.cardioMinutes||0;
    const hrs = Math.floor(total/60), mins = total%60;
    const timeStr = hrs>0 ? hrs + " ч " + mins + " мин" : mins + " мин";
    let reached = null, next = null;
    CARDIO_MILESTONES.forEach(function(m){ if(total>=m.min) reached=m; else if(!next) next=m; });
    if(!next) next = CARDIO_MILESTONES[CARDIO_MILESTONES.length-1];
    const lo = reached ? reached.min : 0, hi = next.min;
    const allDone = total >= CARDIO_MILESTONES[CARDIO_MILESTONES.length-1].min;
    const segPct = allDone ? 100 : (hi>lo ? Math.max(0, Math.min(100, ((total-lo)/(hi-lo))*100)) : 100);
    const justHit = cardioJustReached; cardioJustReached = false;
    const milestoneBlock = reached
      ? '<div class="milestone-card"><span class="milestone-ic">' + reached.icon + '</span><div><div class="milestone-txt"><strong>' + e(reached.label) + '</strong></div>' + (allDone ? '<div class="milestone-next">Все вехи взяты 🏆</div>' : '<div class="milestone-next">Дальше: ' + next.icon + " " + e(next.label) + " (" + fmtHours(next.min) + ")</div>") + '</div></div>'
      : '<div class="milestone-card"><span class="milestone-ic">' + next.icon + '</span><div><div class="milestone-txt">Первая веха: <strong>' + e(next.label) + '</strong></div><div class="milestone-next">Осталось ' + fmtHours(Math.max(0, next.min-total)) + '</div></div></div>';
    const list = state.workouts.filter(function(w){ return w.type==="cardio"; });
    const listHtml = list.length ? list.map(function(w){
      const meta = []; if(w.duration) meta.push(e(w.duration)+" мин"); if(w.distance) meta.push(e(w.distance)+" км");
      return '<div class="entry-card"><div class="entry-icon">🏃</div><div class="entry-body"><div class="entry-title">' + e(w.name) + '</div><div class="entry-meta">' + meta.join(" · ") + '</div></div><button class="btn-icon" data-action="delete-workout" data-id="' + w.id + '">✕</button></div>';
    }).join('') : '<div class="empty-state">Кардио пока нет.</div>';
    return '<div class="panel cardio-panel"><div class="cardio-bignum"><span class="num">' + timeStr + '</span><span class="unit">всего в движении</span></div><div class="cardio-sub">любое кардио идёт в общий зачёт</div><div class="cardio-track' + (justHit?" cardio-burst":"") + '"><div class="cardio-line"></div><div class="cardio-line-fill" data-target="' + segPct.toFixed(1) + '" style="width:0%"></div><div class="cardio-runner" data-target="' + segPct.toFixed(1) + '" style="left:0%">🏃</div><div class="cardio-milestone-flag" style="left:100%"><span class="flag-emoji">' + next.icon + '</span><span class="flag-label">' + fmtHours(next.min) + '</span></div><div class="cardio-start-label">' + (reached?fmtHours(reached.min):"0") + '</div></div>' + milestoneBlock + '</div>' +
      '<div class="panel form-panel"><form data-form="add-cardio" class="form-grid"><div class="field field-wide"><label>Вид кардио</label><input name="name" placeholder="Бег, плавание…" required maxlength="60"></div><div class="field"><label>Минуты</label><input name="duration" type="number" min="1" required placeholder="45"></div><div class="field"><label>Дистанция, км</label><input name="distance" type="number" min="0" step="0.1" placeholder="не обязательно"></div><div class="field field-wide"><label>Заметки</label><textarea name="notes" maxlength="240"></textarea></div><button class="btn btn-primary" type="submit">Записать кардио</button></form></div><div class="list-panel"><h3>История</h3>' + listHtml + '</div>';
  }

  function renderWorkouts(){
    const sub = workoutTab==="cardio" ? '<p class="screen-sub">Кардио в минутах — вехи выносливости и дорожка прогресса.</p>' : '<p class="screen-sub">Упражнения с подходами, PR и историей.</p>';
    return '<div class="screen-head"><h2>Тренировки</h2>' + sub + '</div><div class="subtab-row"><button class="subtab ' + (workoutTab==="strength"?"active":"") + '" data-action="workout-tab" data-tab="strength"><span class="subtab-ic">💪</span> Силовая</button><button class="subtab ' + (workoutTab==="cardio"?"active":"") + '" data-action="workout-tab" data-tab="cardio"><span class="subtab-ic">🏃</span> Кардио</button></div>' + (workoutTab==="cardio" ? renderCardioTab() : renderStrengthTab());
  }

  function renderExerciseModal(){
    const ex = S().exercises.find(function(x){ return x.id===openExerciseId; });
    if(!ex) return "";
    const pr = exercisePR(ex);
    const sets = (ex.sets||[]).slice().sort(function(a,b){ return b.at-a.at; });
    const prBanner = '<div class="ex-pr-banner"><div><div class="pr-label">личный рекорд</div><div class="pr-val">' + (pr ? (pr.weight>0?pr.weight+" кг × "+pr.reps:pr.reps+" повт.") : "—") + '</div></div></div>';
    const hist = sets.length ? sets.map(function(s){
      const isPr = pr && s.id===pr.id;
      return '<div class="ex-hist-row ' + (isPr?"is-pr":"") + '"><span class="ex-hist-date">' + fmtDate(s.at) + '</span><span class="ex-hist-val">' + (s.weight>0?s.weight+" кг × "+s.reps:s.reps+" повт.") + '</span>' + (isPr?'<span class="ex-hist-badge">PR</span>':"") + '<button class="ex-hist-del" data-action="delete-set" data-ex="' + ex.id + '" data-id="' + s.id + '">✕</button></div>';
    }).join('') : '<div class="empty-state">Нет записей.</div>';
    return '<div class="modal-overlay" data-action="close-exercise"><div class="modal" data-action="noop"><h3>' + (ex.icon||"💪") + " " + e(ex.name) + '</h3>' + prBanner + '<form data-form="add-set" data-ex="' + ex.id + '" class="ex-hist-add"><input name="weight" type="number" min="0" step="0.5" placeholder="кг" style="max-width:110px"><input name="reps" type="number" min="1" placeholder="повторы" required><button class="btn btn-primary" type="submit">Записать</button></form><div class="ex-hist-list">' + hist + '</div></div></div>';
  }

  function renderAddExerciseModal(){
    return '<div class="modal-overlay" data-action="close-add-exercise"><div class="modal" data-action="noop"><h3>Новое упражнение</h3><form data-form="add-exercise" class="form-grid"><div class="field field-wide"><label>Название</label><input name="name" placeholder="Жим лёжа, присед…" required maxlength="60"></div><button class="btn btn-primary" type="submit">Создать</button></form></div></div>';
  }

  function render1rmModal(){
    const w = calc1rm.weight, r = calc1rm.reps;
    let result = "";
    if(w>0 && r>0){
      const est = r<=1 ? w : Math.round(w*(1+r/30));
      result = '<div class="calc-result"><div class="calc-result-num">' + est + ' кг</div><div class="calc-result-lbl">расчётный максимум на 1 повтор</div></div>';
    }
    return '<div class="modal-overlay" data-action="close-1rm-calc"><div class="modal" data-action="noop"><h3>🧮 1ПМ калькулятор</h3><p class="calc-note">Формула Epley. Точнее для базовых упражнений со штангой до ~20–30 повторов.</p><form data-form="calc-1rm" class="form-inline"><input name="weight" type="number" min="0" step="1.25" placeholder="кг" value="' + (w||"") + '" required><input name="reps" type="number" min="1" placeholder="повторы" value="' + (r||"") + '" required><button class="btn btn-primary" type="submit">Посчитать</button></form>' + result + '</div></div>';
  }

  function renderTasks(){
    const state = S(), today = new Date();
    const habitRows = (state.habits||[]).length ? state.habits.map(function(h){
      const done = habitDoneToday(h), sched = isHabitDay(h, today), rest = !sched && !done;
      const flame = h.streak>0 ? '<span class="habit-streak' + (done?" lit":"") + '">🔥 ' + h.streak + '</span>' : '<span class="habit-streak zero">—</span>';
      return '<div class="habit-row ' + (done?"habit-done":"") + (rest?" habit-rest":"") + '"><button class="habit-check ' + (done?"on":"") + '" data-action="toggle-habit" data-id="' + h.id + '">' + (done?"✓":"") + '</button><div class="habit-main"><span class="habit-text">' + e(h.text) + '</span><span class="habit-rhythm">' + rhythmLabel(h) + (rest?" · выходной":"") + '</span></div>' + flame + '<button class="btn-icon" data-action="delete-habit" data-id="' + h.id + '">✕</button></div>';
    }).join('') : '<div class="empty-state">Добавь привычку с ритмом.</div>';
    const planLink = state.trackedAreas && (state.trackedAreas.tasks || state.trackedAreas.workouts)
      ? '<p class="screen-sub plan-hint">Разовые задачи и план по дням — во вкладке <button type="button" class="linkish" data-action="nav" data-screen="weekplan">План</button>.</p>'
      : '';
    return '<div class="screen-head"><h2>Привычки</h2><p class="screen-sub">Повторяющиеся дела по ритму — каждый день, через день, по дням недели.</p>' + planLink + '</div>' +
      '<div class="section-block"><div class="panel form-panel"><form data-form="add-habit" class="habit-add-form"><input name="text" placeholder="Новая привычка" required maxlength="80"><select name="rhythm" class="habit-rhythm-select"><option value="d1">Каждый день</option><option value="d2">Через день</option><option value="d3">Каждые 3 дня</option><option value="wd_135">Пн/Ср/Пт</option><option value="wd_246">Вт/Чт/Сб</option><option value="wd_67">Выходные</option><option value="wd_12345">Будни</option></select><button class="btn btn-primary" type="submit">Добавить</button></form></div><div class="list-panel">' + habitRows + '</div></div>';
  }

  function renderOneOffPlanItem(t, wd, todayWd){
    const isToday = wd === todayWd;
    const done = !!t.done;
    return '<div class="plan-item plan-item-once ' + (done?"done":"") + '">' +
      (isToday
        ? '<button type="button" class="plan-check plan-check-once ' + (done?"on":"") + '" data-action="toggle-oneoff-task" data-id="' + t.id + '">' + (done?"✓":"") + '</button>'
        : '<span class="plan-dot plan-dot-once" title="Разовая задача">⚡</span>') +
      '<span class="plan-item-label">' + e(t.text) + '</span>' +
      '<span class="plan-once-tag">разовая</span>' +
      '<button type="button" class="plan-item-del" data-action="delete-oneoff-task" data-id="' + t.id + '">✕</button></div>';
  }

  function goalCard(g){
    const pct = g.target>0 ? Math.max(0, Math.min(100, (g.current/g.target)*100)) : 0;
    const complete = g.target>0 && g.current >= g.target;
    const linked = g.link && g.link.type !== "manual";
    const linkBadge = linked ? '<div class="goal-link">' + goalLinkLabel(g) + '</div>' : "";
    const foot = linked ? '<span class="goal-auto">обновляется автоматически</span>' : '<form data-form="update-goal" data-id="' + g.id + '" class="goal-update"><input name="current" type="number" step="0.1" value="' + g.current + '"><button class="btn btn-ghost btn-sm" type="submit">Обновить</button></form>';
    return '<div class="panel goal-card"><div class="goal-head"><div><div class="goal-title">' + e(g.title) + (complete?' <span class="badge badge-done">Достигнуто</span>':"") + '</div>' + (g.description?'<div class="goal-desc">' + e(g.description) + '</div>':"") + linkBadge + '</div><button class="btn-icon" data-action="delete-goal" data-id="' + g.id + '">✕</button></div>' + bar(g.current, g.target||1, "--gold", 14) + '<div class="goal-foot"><span>' + g.current + " / " + g.target + " " + e(goalDisplayUnit(g)) + " · " + pct.toFixed(0) + '%</span>' + foot + '</div></div>';
  }

  function renderGoals(){
    const state = S(), d = goalLinkDraft;
    const list = state.goals.length ? state.goals.map(goalCard).join('') : '<div class="empty-state">Поставь первую цель.</div>';
    const types = [{t:"manual",ic:"✍️",l:"Вручную"},{t:"exercise",ic:"💪",l:"Упражнение"},{t:"cardio",ic:"🏃",l:"Кардио"},{t:"books",ic:"📖",l:"Книги"},{t:"vice",ic:"⚠️",l:"Вредная привычка"}];
    const chips = types.map(function(o){
      const dis = (o.t==="exercise" && !state.exercises.length) || (o.t==="vice" && !state.vices.length);
      return '<button type="button" class="goal-chip ' + (d.type===o.t?"active":"") + (dis?" disabled":"") + '" ' + (dis?"disabled":"") + ' data-action="goal-link-type" data-type="' + o.t + '"><span class="chip-ic">' + o.ic + '</span>' + o.l + '</button>';
    }).join('');
    let sub = "";
    if(d.type==="exercise" && state.exercises.length) sub = '<div class="goal-subrow"><span class="goal-subrow-lbl">упражнение:</span><div class="goal-chips">' + state.exercises.map(function(ex){ return '<button type="button" class="goal-chip small ' + (d.refId===ex.id?"active":"") + '" data-action="goal-link-ref" data-id="' + ex.id + '">💪 ' + e(ex.name) + '</button>'; }).join('') + '</div></div>';
    if(d.type==="cardio") sub = '<div class="goal-subrow"><div class="goal-chips"><button type="button" class="goal-chip small ' + ((d.metric||"minutes")==="minutes"?"active":"") + '" data-action="goal-cardio-metric" data-metric="minutes">⏱️ Минуты</button><button type="button" class="goal-chip small ' + (d.metric==="km"?"active":"") + '" data-action="goal-cardio-metric" data-metric="km">📏 Км</button></div></div>';
    if(d.type==="vice" && state.vices.length) sub = '<div class="goal-subrow"><div class="goal-chips">' + state.vices.map(function(v){ return '<button type="button" class="goal-chip small ' + (d.refId===v.id?"active":"") + '" data-action="goal-link-ref" data-id="' + v.id + '">' + v.icon + " " + e(v.name) + '</button>'; }).join('') + '</div></div>';
    const curField = d.type==="manual" ? '<div class="field"><label>Текущий</label><input name="current" type="number" step="0.1" value="0"></div>' : '<input type="hidden" name="current" value="0">';
    const unitField = d.type==="manual"
      ? '<div class="field"><label>Единица</label><input name="unit" maxlength="20" placeholder="кг, мин, книг…"></div>'
      : '<input type="hidden" name="unit" value="' + e(goalDefaultUnit(d)) + '">';
    return '<div class="screen-head"><h2>Цели</h2><p class="screen-sub">Привяжи к упражнению, книгам или кардио — обновится сама.</p></div><div class="panel form-panel"><form data-form="add-goal-linked" class="form-grid"><div class="field field-wide"><label>Название</label><input name="title" required maxlength="80" placeholder="Жим 100 кг"></div><div class="field field-wide"><label>Что отслеживаем?</label><div class="goal-chips">' + chips + '</div>' + sub + '</div><div class="field"><label>Цель</label><input name="target" type="number" step="0.1" required></div>' + unitField + curField + '<button class="btn btn-primary" type="submit">Создать</button></form></div><div class="list-panel goal-list">' + list + '</div>';
  }

  function viceCard(v){
    const today = viceToday(v), avg7 = viceAverage(v, 7);
    const todayStr = today===null ? "не отмечено" : today + " " + v.unit;
    const trend = today!==null && avg7>0 ? (today<avg7?'<span class="vice-trend down">↓ ниже среднего</span>':(today>avg7?'<span class="vice-trend up">↑ выше</span>':"")) : "";
    const isTime = v.type==="time";
    const quickBtns = isTime
      ? '<div class="vice-quick"><button class="vice-qbtn" data-action="quick-vice" data-id="' + v.id + '" data-amt="5">+5 мин</button><button class="vice-qbtn" data-action="quick-vice" data-id="' + v.id + '" data-amt="15">+15 мин</button><button class="vice-qbtn" data-action="quick-vice" data-id="' + v.id + '" data-amt="30">+30 мин</button></div>'
      : '<div class="vice-quick"><button class="vice-qbtn" data-action="quick-vice" data-id="' + v.id + '" data-amt="1">+1</button><button class="vice-qbtn" data-action="quick-vice" data-id="' + v.id + '" data-amt="5">+5</button><button class="vice-qbtn" data-action="quick-vice" data-id="' + v.id + '" data-amt="10">+10</button></div>';
    return '<div class="vice-card"><span class="vice-del" data-action="delete-vice" data-id="' + v.id + '">✕</span><div class="vice-card-top" data-action="open-vice" data-id="' + v.id + '"><span class="vice-ic">' + v.icon + '</span><span class="vice-name">' + e(v.name) + '</span></div><div class="vice-today" data-action="open-vice" data-id="' + v.id + '">сегодня: <strong>' + e(todayStr) + '</strong></div>' + trend + quickBtns + '</div>';
  }

  function renderVices(){
    const vices = S().vices;
    const cards = vices.length
      ? vices.map(viceCard).join('')
      : '<div class="empty-state vice-empty">Пока нет привычек. Добавь первую — курение, скролл, игры и своё.</div>';
    return '<div class="screen-head"><h2>Вредные привычки</h2><p class="screen-sub">Отмечай меньше — растёт дисциплина.</p></div><div class="vice-grid">' + cards + '<button class="vice-add-card" data-action="add-vice-prompt"><span class="plus">+</span>Добавить</button></div>';
  }

  function viceModalBars(v){
    const days = [];
    for(let i=13;i>=0;i--){
      const dt = new Date(Date.now()-i*86400000);
      const key = dt.toDateString();
      days.push({ date:dt, val:(v.log&&v.log[key]!==undefined)?v.log[key]:null });
    }
    const vals = days.filter(function(x){ return x.val!==null; }).map(function(x){ return x.val; });
    const maxVal = Math.max(v.baseline||0, vals.length?Math.max.apply(null,vals):0, 1);
    const wd = ["в","п","в","с","ч","п","с"];
    return '<div class="vbar-chart">' + days.map(function(d){
      if(d.val===null) return '<div class="vbar-col"><div class="vbar empty" style="height:3px"></div><span class="vbar-lbl">' + wd[d.date.getDay()] + '</span></div>';
      const h = Math.max(4, Math.round((d.val/maxVal)*72));
      const good = v.baseline>0 && d.val < v.baseline;
      return '<div class="vbar-col"><div class="vbar ' + (good?"good":"") + '" style="height:' + h + 'px"></div><span class="vbar-lbl">' + wd[d.date.getDay()] + '</span></div>';
    }).join('') + '</div>';
  }

  function renderViceModal(){
    const v = S().vices.find(function(x){ return x.id===openViceId; });
    if(!v) return "";
    const today = viceToday(v), saved = viceTotalSaved(v);
    let counters = '<div class="vcounter"><div class="vc-num">' + Object.keys(v.log||{}).length + '</div><div class="vc-lbl">дней учёта</div></div>';
    if(saved!==null && saved>0) counters += '<div class="vcounter"><div class="vc-num">' + Math.round(saved) + '</div><div class="vc-lbl">' + e(v.unit) + ' сэкономлено</div></div>';
    return '<div class="modal-overlay" data-action="close-vice"><div class="modal modal-wide" data-action="noop"><h3>' + v.icon + " " + e(v.name) + '</h3><div class="vcounter-row">' + counters + '</div>' + viceModalBars(v) + '<form data-form="log-vice" data-id="' + v.id + '" class="vice-log-form form-inline"><input name="value" type="number" min="0" step="1" placeholder="сколько (' + e(v.unit) + ')" value="' + (today===null?"":today) + '" required><button class="btn btn-primary" type="submit">' + (today===null?"Отметить":"Обновить") + '</button></form>' + (v.baseline>0?'<div class="vice-baseline-info">Норма: ' + v.baseline + " " + e(v.unit) + "/день</div>":"") + '</div></div>';
  }

  function renderAddViceModal(){
    const presets = VICE_PRESETS.map(function(p){
      return '<button type="button" class="vice-preset" data-action="pick-vice-preset" data-key="' + p.key + '">' + p.icon + ' ' + e(p.name) + '</button>';
    }).join('');
    return '<div class="modal-overlay" data-action="close-add-vice"><div class="modal" data-action="noop"><h3>Какую привычку сократить?</h3><div class="vice-preset-grid">' + presets + '</div><div class="vice-or">или создай свою</div><form data-form="add-vice-custom" class="form-grid"><div class="field field-wide"><label>Название</label><input name="name" required maxlength="40" placeholder="Например, фастфуд"></div><div class="field"><label>Что считаем</label><select name="type"><option value="count">Количество (раз)</option><option value="time">Время (мин)</option></select></div><div class="field"><label>Норма/день</label><input name="baseline" type="number" min="0" placeholder="не обязательно"></div><button class="btn btn-primary" type="submit">Добавить</button></form></div></div>';
  }

  function renderWeekPlan(){
    const state = S(), todayWd = new Date().getDay(), todayK = deps.todayKey(), order = [1,2,3,4,5,6,0];
    const dueOptions = '<option value="today">Сегодня</option><option value="tomorrow">Завтра</option>' +
      order.map(function(wd){
        return '<option value="wd:' + wd + '">' + WEEKDAY_NAMES[wd] + '</option>';
      }).join('');
    const cards = order.map(function(wd){
      const day = state.weekPlan[wd]||{items:[]}, isToday = wd===todayWd, prod = planProductivity(wd, todayK);
      const weeklyRows = day.items.map(function(it){
        const done = isToday && state.weekDone[todayK] && state.weekDone[todayK][it.id];
        return '<div class="plan-item plan-item-weekly ' + (done?"done":"") + '">' + (isToday?'<button type="button" class="plan-check ' + (done?"on":"") + '" data-action="toggle-plan-done" data-id="' + it.id + '">' + (done?"✓":"") + '</button>':'<span class="plan-dot">' + it.icon + '</span>') + '<span class="plan-item-label">' + e(it.label) + '</span><button type="button" class="plan-item-del" data-action="remove-plan-item" data-day="' + wd + '" data-id="' + it.id + '">✕</button></div>';
      }).join('');
      const onceRows = oneOffTasksForWeekday(wd, todayWd).map(function(t){
        return renderOneOffPlanItem(t, wd, todayWd);
      }).join('');
      const rows = weeklyRows + onceRows;
      const rowsHtml = rows || '<div class="plan-empty">Пусто</div>';
      const prodBar = isToday && prod.total>0 ? '<div class="plan-prod"><div class="plan-prod-bar"><div class="plan-prod-fill" style="width:' + prod.pct + '%"></div></div><span class="plan-prod-lbl">' + prod.done + "/" + prod.total + " · " + prod.pct + "%</span></div>" : "";
      const muscleGrid = state.trackedAreas && state.trackedAreas.workouts
        ? '<div class="plan-muscle-grid">' + MUSCLE_PRESETS.map(function(m){ return '<button type="button" class="plan-muscle" data-action="add-plan-muscle" data-day="' + wd + '" data-key="' + m.key + '">' + m.icon + " " + m.label + '</button>'; }).join('') + '</div>'
        : '';
      const addForm = planEditDay===wd
        ? '<div class="plan-add">' + muscleGrid +
          '<form data-form="add-plan-custom" data-day="' + wd + '" class="form-inline plan-custom-form"><input name="label" placeholder="еженедельный пункт" maxlength="40"><button class="btn btn-ghost btn-sm" type="submit">+ еженед.</button></form>' +
          '<form data-form="add-oneoff-on-day" data-day="' + wd + '" class="form-inline plan-custom-form plan-once-form-inline"><input name="text" placeholder="разовая задача" maxlength="80" required><button class="btn btn-ghost btn-sm plan-once-add-btn" type="submit">+ разовая</button></form>' +
          '<button class="btn btn-ghost btn-sm" data-action="plan-edit-day" data-day="">Готово</button></div>'
        : '<button class="plan-add-btn" data-action="plan-edit-day" data-day="' + wd + '">+ Добавить</button>';
      return '<div class="plan-day ' + (isToday?"is-today":"") + '"><div class="plan-day-head"><span class="plan-day-name">' + WEEKDAY_NAMES[wd] + (isToday?' <span class="plan-today-tag">сегодня</span>':"") + '</span></div><div class="plan-items">' + rowsHtml + '</div>' + prodBar + addForm + '</div>';
    }).join('');
    const oncePanel = state.trackedAreas && state.trackedAreas.tasks
      ? '<div class="panel form-panel plan-once-panel"><form data-form="add-oneoff-task" class="habit-add-form plan-once-top-form"><input name="text" placeholder="Разовая задача" required maxlength="80"><select name="due">' + dueOptions + '</select><button class="btn btn-primary" type="submit">Добавить разовую</button></form><div class="plan-legend"><span class="plan-legend-item"><span class="plan-dot">💪</span> еженедельно</span><span class="plan-legend-item plan-legend-once"><span class="plan-dot plan-dot-once">⚡</span> разовая</span></div></div>'
      : '';
    return '<div class="screen-head"><h2>План недели</h2><p class="screen-sub">Еженедельные пункты и разовые задачи — на одном календаре. Привычки с ритмом — отдельно во вкладке «Привычки».</p></div>' + oncePanel + '<div class="plan-grid">' + cards + '</div>';
  }

  function renderDashboardExtras(){
    const state = S(), todayWd = new Date().getDay(), todayK = deps.todayKey();
    let html = "";
    if(!state.vicesIntroSeen && !state.vices.length){
      html += '<div class="panel vice-intro"><div class="vice-intro-ic">⚠️</div><div class="vice-intro-body"><div class="vice-intro-title">Побороть вредную привычку?</div><div class="vice-intro-text">Курение, скролл, игры — отмечай каждый день. Раздел всегда в меню слева.</div></div><div class="vice-intro-actions"><button class="btn btn-primary btn-sm" data-action="add-vice-prompt">Начать</button><button class="btn btn-ghost btn-sm" data-action="dismiss-vice-intro">Не сейчас</button></div></div>';
    }
    const planToday = (state.weekPlan[todayWd]||{items:[]}).items.filter(function(i){ return i.icon!=="😴"; });
    const onceToday = oneOffTasksForWeekday(todayWd, todayWd);
    if(planToday.length || onceToday.length){
      const prod = planProductivity(todayWd, todayK);
      const labels = planToday.map(function(i){ return i.icon + " " + e(i.label); })
        .concat(onceToday.map(function(t){ return "⚡ " + e(t.text); }));
      html += '<div class="panel plan-reminder" data-action="nav" data-screen="weekplan"><div class="plan-rem-ic">📅</div><div class="plan-rem-body"><div class="plan-rem-title">Сегодня по плану: ' + labels.join(", ") + '</div><div class="plan-rem-sub">' + (prod.done>=prod.total && prod.total>0 ? "Всё выполнено 💪" : prod.done + " из " + prod.total) + '</div></div></div>';
    }
    return html;
  }

  function renderPaletteSettings(){
    const state = S();
    return '<div class="field field-wide" style="margin-bottom:18px"><label>Цвета корешков</label><div class="palette-row">' + SPINE_PALETTE_NAMES.map(function(p){
      const sw = SPINE_PALETTES[p.key].slice(0,4).map(function(c){ return '<i style="background:linear-gradient(' + c[0] + "," + c[1] + ')"></i>'; }).join('');
      return '<button type="button" class="palette-opt ' + ((state.bookPalette||"classic")===p.key?"active":"") + '" data-action="set-book-palette" data-key="' + p.key + '"><span class="palette-sw">' + sw + '</span>' + p.label + '</button>';
    }).join('') + '</div></div>';
  }

  function renderExtraModals(){
    let h = "";
    if(openExerciseId) h += renderExerciseModal();
    if(addExerciseOpen) h += renderAddExerciseModal();
    if(oneRmOpen) h += render1rmModal();
    if(openViceId) h += renderViceModal();
    if(addViceOpen) h += renderAddViceModal();
    return h;
  }

  function afterRender(){
    const fill = document.querySelector(".cardio-line-fill[data-target]");
    const runner = document.querySelector(".cardio-runner[data-target]");
    if(!fill) return;
    const target = parseFloat(fill.getAttribute("data-target"))||0;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduce){ fill.style.width = target+"%"; if(runner) runner.style.left = target+"%"; return; }
    requestAnimationFrame(function(){ setTimeout(function(){ fill.style.width = target+"%"; if(runner) runner.style.left = target+"%"; }, 80); });
  }

  function handleForm(kind, fd, form){
    if(kind==="add-cardio"){
      addCardioWorkout({ name:(fd.get("name")||"").toString().trim(), duration:fd.get("duration"), distance:fd.get("distance"), notes:(fd.get("notes")||"").toString().trim() });
      return true;
    }
    if(kind==="add-set"){ addSet(form.dataset.ex, fd.get("weight"), fd.get("reps")); return true; }
    if(kind==="add-exercise"){ addExerciseOpen=false; addExercise((fd.get("name")||"").toString().trim()); return true; }
    if(kind==="calc-1rm"){ calc1rm={ weight:Number(fd.get("weight"))||0, reps:Number(fd.get("reps"))||0 }; deps.render(); return true; }
    if(kind==="add-habit"){ addHabit((fd.get("text")||"").toString().trim(), parseRhythm((fd.get("rhythm")||"d1").toString())); return true; }
    if(kind==="add-oneoff-task"){
      const text = (fd.get("text")||"").toString().trim();
      const due = (fd.get("due")||"today").toString();
      if(due.indexOf("wd:")===0) addOneOffTask(text, null, due.slice(3));
      else addOneOffTask(text, due);
      return true;
    }
    if(kind==="add-oneoff-on-day"){
      addOneOffTask((fd.get("text")||"").toString().trim(), null, form.dataset.day);
      planEditDay = Number(form.dataset.day);
      return true;
    }
    if(kind==="add-goal-linked"){
      const title = (fd.get("title")||"").toString().trim(); if(!title) return true;
      let link = { type:"manual" };
      const dr = goalLinkDraft;
      if(dr.type==="exercise" && dr.refId) link = { type:"exercise", refId:dr.refId };
      else if(dr.type==="cardio") link = { type:"cardio", metric:dr.metric||"minutes" };
      else if(dr.type==="books") link = { type:"books" };
      else if(dr.type==="vice" && dr.refId) link = { type:"vice", refId:dr.refId };
      const unit = dr.type==="manual" ? (fd.get("unit")||"").toString().trim() : goalDefaultUnit(dr);
      addGoalWithLink({ title:title, current: link.type==="manual"?Number(fd.get("current"))||0:0, target:fd.get("target")||1, unit:unit, link:link });
      goalLinkDraft = { type:"manual", refId:null, metric:"minutes" };
      return true;
    }
    if(kind==="log-vice"){ logVice(form.dataset.id, fd.get("value")); return true; }
    if(kind==="add-vice-custom"){
      addViceOpen=false;
      const vType = (fd.get("type")||"count").toString();
      const vUnit = vType==="time" ? "мин" : "раз";
      addVice({ name:(fd.get("name")||"").toString().trim(), type:vType, unit:vUnit, baseline:fd.get("baseline") });
      const v = S().vices[S().vices.length-1]; openViceId=v.id; deps.setScreen("vices"); deps.render(); return true;
    }
    if(kind==="add-plan-custom"){ addPlanItem(Number(form.dataset.day), (fd.get("label")||"").toString().trim(), "•"); return true; }
    return false;
  }

  function handleAction(action, el, id){
    if(action==="workout-tab"){ workoutTab=el.dataset.tab; openExerciseId=null; deps.render(); return true; }
    if(action==="add-exercise-prompt"){ addExerciseOpen=true; deps.render(); return true; }
    if(action==="close-add-exercise"){ addExerciseOpen=false; deps.render(); return true; }
    if(action==="open-exercise"){ openExerciseId=id; deps.render(); return true; }
    if(action==="close-exercise"){ openExerciseId=null; deps.render(); return true; }
    if(action==="delete-exercise"){ deps.askConfirm("Удалить упражнение?", function(){ deleteExercise(id); }); return true; }
    if(action==="delete-set"){ deleteSet(el.dataset.ex, id); return true; }
    if(action==="open-1rm-calc"){ oneRmOpen=true; deps.render(); return true; }
    if(action==="close-1rm-calc"){ oneRmOpen=false; deps.render(); return true; }
    if(action==="toggle-habit"){ toggleHabit(id); return true; }
    if(action==="delete-habit"){ S().habits=S().habits.filter(function(h){ return h.id!==id; }); deps.save(); deps.render(); return true; }
    if(action==="toggle-oneoff-task"){ toggleOneOffTask(id); return true; }
    if(action==="delete-oneoff-task"){ S().tasks=S().tasks.filter(function(t){ return t.id!==id; }); deps.save(); deps.render(); return true; }
    if(action==="delete-workout"){ deps.askConfirm("Удалить?", function(){ deleteWorkout(id); }); return true; }
    if(action==="goal-link-type"){ goalLinkDraft={ type:el.dataset.type, refId:null, metric:"minutes" }; deps.render(); return true; }
    if(action==="goal-link-ref"){ goalLinkDraft.refId=id; deps.render(); return true; }
    if(action==="goal-cardio-metric"){ goalLinkDraft.metric=el.dataset.metric; deps.render(); return true; }
    if(action==="add-vice-prompt"){ addViceOpen=true; deps.render(); return true; }
    if(action==="close-add-vice"){ addViceOpen=false; deps.render(); return true; }
    if(action==="open-vice"){ openViceId=id; deps.render(); return true; }
    if(action==="close-vice"){ openViceId=null; deps.render(); return true; }
    if(action==="delete-vice"){ deps.askConfirm("Удалить?", function(){ deleteVice(id); }); return true; }
    if(action==="pick-vice-preset"){
      const p = VICE_PRESETS.find(function(x){ return x.key===el.dataset.key; });
      if(p){ addViceOpen=false; addVice({ name:p.name, icon:p.icon, type:p.type, unit:p.unit, cost:p.cost, baseline:0 }); openViceId=S().vices[S().vices.length-1].id; deps.setScreen("vices"); deps.render(); }
      return true;
    }
    if(action==="quick-vice"){
      const v = S().vices.find(function(x){ return x.id===id; });
      if(v){ const amt = Number(el.dataset.amt)||1; const key = new Date().toDateString(); if(!v.log) v.log={}; v.log[key] = (v.log[key]||0) + amt; deps.save(); deps.render(); }
      return true;
    }
    if(action==="dismiss-vice-intro"){ S().vicesIntroSeen=true; deps.save(); deps.render(); return true; }
    if(action==="plan-edit-day"){ planEditDay=el.dataset.day===""?null:Number(el.dataset.day); deps.render(); return true; }
    if(action==="toggle-plan-done"){ togglePlanDone(id); return true; }
    if(action==="remove-plan-item"){ removePlanItem(Number(el.dataset.day), id); return true; }
    if(action==="add-plan-muscle"){ const m=MUSCLE_PRESETS.find(function(x){ return x.key===el.dataset.key; }); if(m) addPlanItem(Number(el.dataset.day), m.label, m.icon); return true; }
    if(action==="set-book-palette"){ S().bookPalette=el.dataset.key; deps.save(); deps.render(); return true; }
    return false;
  }

  function getSidebarExtras(state){
    const ta = state.trackedAreas || {};
    return [
      { key:"weekplan", icon:"📅", label:"План", show: !!(ta.tasks || ta.workouts) },
      { key:"vices", icon:"⚠️", label:"Вредные привычки", show:true },
    ];
  }

  function getTopbarTitles(){
    return { weekplan:"План и задачи", vices:"Вредные привычки" };
  }

  return {
    install, migrate, defaultHabits, emptyWeekPlan, totalWorkoutCount, syncLinkedGoals,
    habitsProgressRhythm, habitsScheduledToday, getSpineAccent, spinePalette,
    renderWorkouts, renderTasks, renderGoals, renderVices, renderWeekPlan,
    renderDashboardExtras, renderDashboardHabitRow, renderExtraModals, renderPaletteSettings,
    handleAction, handleForm, afterRender, getSidebarExtras, getTopbarTitles,
    resetGoalLinkDraft: function(){ goalLinkDraft = { type:"manual", refId:null, metric:"minutes" }; },
  };
})();
