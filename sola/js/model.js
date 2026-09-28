/**
 * Pure plan rules: sorting, dates, and when a reminder should fire.
 * No browser APIs except Intl and Date, so this can be tested in Node.
 *
 * Order inside one day:
 * 1. Exact times from 00:00–04:59 (night hours at the start of the day)
 * 2. Exact times from 05:00–11:59 (morning)
 * 3. Plans marked Morning, with no exact time
 * 4. Exact times from 12:00–16:59 (day)
 * 5. Plans marked Day
 * 6. Exact times from 17:00–20:59 (evening)
 * 7. Plans marked Evening
 * 8. Exact times from 21:00–23:59 (night)
 * 9. Plans marked Night
 * 10. Plans with no time at all
 *
 * A Morning plan therefore sits after morning clock times and before daytime ones.
 */

export const PERIODS = ["morning", "day", "evening", "night"];
export const REMIND_OFFSETS = [0, 5, 10, 30, 60, 1440];

const PERIOD_ANCHOR = {
  morning: "08:00",
  day: "13:00",
  evening: "18:00",
  night: "21:00",
};

const SECTION_BY_RANK = [
  "night-early",
  "morning-clock",
  "morning",
  "day-clock",
  "day",
  "evening-clock",
  "evening",
  "night-late",
  "night",
  "none",
];

const HEADER_SECTIONS = new Set(["morning", "day", "evening", "night", "none"]);

export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(now = new Date()) {
  return toISO(now);
}

export function isISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function isClock(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function addDays(iso, amount) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + amount);
  return toISO(date);
}

export function timeToMinutes(clock) {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

export function sortMeta(plan) {
  if (isClock(plan.time)) {
    const minutes = timeToMinutes(plan.time);
    const hour = Math.floor(minutes / 60);
    if (hour < 5) return { rank: 0, minutes };
    if (hour < 12) return { rank: 1, minutes };
    if (hour < 17) return { rank: 3, minutes };
    if (hour < 21) return { rank: 5, minutes };
    return { rank: 7, minutes };
  }
  if (plan.period === "morning") return { rank: 2, minutes: 0 };
  if (plan.period === "day") return { rank: 4, minutes: 0 };
  if (plan.period === "evening") return { rank: 6, minutes: 0 };
  if (plan.period === "night") return { rank: 8, minutes: 0 };
  return { rank: 9, minutes: 0 };
}

export function sectionKey(plan) {
  return SECTION_BY_RANK[sortMeta(plan).rank];
}

export function sectionHasHeader(key) {
  return HEADER_SECTIONS.has(key);
}

export function comparePlans(a, b) {
  const left = sortMeta(a);
  const right = sortMeta(b);
  if (left.rank !== right.rank) return left.rank - right.rank;
  if (left.minutes !== right.minutes) return left.minutes - right.minutes;
  const byTitle = String(a.title || "").localeCompare(String(b.title || ""), undefined, {
    sensitivity: "base",
  });
  if (byTitle) return byTitle;
  return (a.createdAt || 0) - (b.createdAt || 0);
}

export function sortPlans(plans) {
  return [...plans].sort(comparePlans);
}

export function groupDayPlans(plans) {
  const groups = [];
  for (const plan of sortPlans(plans)) {
    const key = sectionKey(plan);
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) groups.push({ key, plans: [plan] });
    else last.plans.push(plan);
  }
  return groups;
}

export function clockForPlan(plan) {
  if (isClock(plan.time)) return plan.time;
  if (plan.period && PERIOD_ANCHOR[plan.period]) return PERIOD_ANCHOR[plan.period];
  return "09:00";
}

export function reminderInstant(plan) {
  if (!plan || !plan.remind || !isISODate(plan.date)) return null;
  const clock = clockForPlan(plan);
  const [y, m, d] = plan.date.split("-").map(Number);
  const [hh, mm] = clock.split(":").map(Number);
  const when = new Date(y, m - 1, d, hh, mm, 0, 0);
  const offset = REMIND_OFFSETS.includes(Number(plan.remindOffset)) ? Number(plan.remindOffset) : 0;
  if (offset >= 1440 && offset % 1440 === 0) when.setDate(when.getDate() - offset / 1440);
  else if (offset) when.setMinutes(when.getMinutes() - offset);
  return when.getTime();
}

export function localeFor(lang) {
  return lang === "ru" ? "ru-RU" : "en-US";
}

export function weekStartFor(lang) {
  try {
    const locale = new Intl.Locale(localeFor(lang));
    const info = locale.weekInfo || locale.getWeekInfo?.();
    if (info && info.firstDay) return info.firstDay % 7;
  } catch {
    /* Older engines: Russian weeks start Monday, US weeks start Sunday. */
  }
  return lang === "ru" ? 1 : 0;
}

export function weekdayLabels(lang, weekStart) {
  const fmt = new Intl.DateTimeFormat(localeFor(lang), { weekday: "short" });
  const labels = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(2024, 0, 7 + weekStart + i);
    labels.push(fmt.format(day).replace(".", ""));
  }
  return labels;
}

export function buildMonth(year, monthIndex, weekStart) {
  const first = new Date(year, monthIndex, 1);
  const lead = (first.getDay() - weekStart + 7) % 7;
  const start = new Date(year, monthIndex, 1 - lead);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    cells.push({
      iso: toISO(date),
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
    });
  }
  if (cells.slice(35).every((cell) => !cell.inMonth)) cells.splice(35, 7);
  return cells;
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPrettyDate(iso, lang, now = new Date()) {
  if (!isISODate(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const options = { weekday: "long", month: "long", day: "numeric" };
  if (y !== now.getFullYear()) options.year = "numeric";
  const text = new Intl.DateTimeFormat(localeFor(lang), options).format(new Date(y, m - 1, d));
  return capitalize(text);
}

export function formatMonthTitle(year, monthIndex, lang) {
  const text = new Intl.DateTimeFormat(localeFor(lang), {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));
  return capitalize(text);
}

export function formatDayLabel(iso, lang, now = new Date()) {
  if (!isISODate(iso)) return { main: "", week: "" };
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const locale = localeFor(lang);
  const mainOptions = { month: "long", day: "numeric" };
  if (y !== now.getFullYear()) mainOptions.year = "numeric";
  return {
    main: capitalize(new Intl.DateTimeFormat(locale, mainOptions).format(date)),
    week: capitalize(new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date)),
  };
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sanitizePlan(input) {
  const title = String(input?.title || "").trim().slice(0, 140);
  if (!title) {
    const error = new Error("title");
    error.code = "title";
    throw error;
  }
  const date = isISODate(input.date) ? input.date : todayISO();
  let time = null;
  let period = null;
  if (isClock(input.time)) time = input.time;
  else if (PERIODS.includes(input.period)) period = input.period;
  const remindOffset = REMIND_OFFSETS.includes(Number(input.remindOffset))
    ? Number(input.remindOffset)
    : 0;
  const id = String(input.id || "").trim();
  if (!id) {
    const error = new Error("id");
    error.code = "id";
    throw error;
  }
  return {
    id,
    title,
    date,
    time,
    period,
    notes: String(input.notes || "").trim().slice(0, 2000),
    done: Boolean(input.done),
    remind: Boolean(input.remind),
    remindOffset,
    createdAt: Number(input.createdAt) || Date.now(),
    updatedAt: Number(input.updatedAt) || Date.now(),
  };
}

export function fromEditor(draft) {
  const next = {
    id: draft.id,
    title: draft.title,
    date: draft.date,
    notes: draft.notes,
    done: draft.done,
    remind: draft.remind,
    remindOffset: draft.remindOffset,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    time: null,
    period: null,
  };
  if (draft.mode === "time" && isClock(draft.time)) next.time = draft.time;
  else if (draft.mode === "period" && PERIODS.includes(draft.period)) next.period = draft.period;
  return next;
}

export function editorMode(plan) {
  if (plan.time) return "time";
  if (plan.period) return "period";
  return "none";
}
