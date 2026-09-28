import {
  addDays,
  buildMonth,
  editorMode,
  formatDayLabel,
  formatMonthTitle,
  formatPrettyDate,
  fromEditor,
  groupDayPlans,
  isISODate,
  sanitizePlan,
  sectionHasHeader,
  todayISO,
  uid,
  weekStartFor,
  weekdayLabels,
} from "./model.js";
import { deleteBody, periodLabel, plansCount, plansToday, sectionLabel, t } from "./i18n.js";
import { createRepository, loadSettings, saveSettings } from "./store.js";
import {
  isStandalone,
  permissionState,
  requestPermission,
  showTestNotification,
  startReminders,
} from "./notify.js";

const THEME_COLORS = {
  sol: "#F4EFE6",
  moon: "#0E141B",
  sage: "#EEF3EC",
  lavender: "#F3F0F7",
  ocean: "#EEF4F6",
  rose: "#F8F0EE",
};

const THEME_PREVIEWS = {
  sol: ["#F4EFE6", "#FFFCF8", "#C56A32", "#E7A15A"],
  moon: ["#0E141B", "#18222E", "#A9C2EE", "#6E8BB5"],
  sage: ["#EEF3EC", "#FBFDF9", "#2F6A45", "#8FB39A"],
  lavender: ["#F3F0F7", "#FCFAFE", "#5C4A8A", "#B7A8D6"],
  ocean: ["#EEF4F6", "#FBFEFE", "#1A657C", "#8FB8C6"],
  rose: ["#F8F0EE", "#FFFBF9", "#A84C58", "#E3B2A8"],
};

const OFFSETS = [
  [0, "atTime"],
  [5, "min5"],
  [10, "min10"],
  [30, "min30"],
  [60, "hour1"],
  [1440, "day1"],
];

const ICONS = {
  today: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.25" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3.5v1.8M12 18.7v1.8M3.5 12h1.8M18.7 12h1.8M6.1 6.1l1.3 1.3M16.6 16.6l1.3 1.3M17.9 6.1l-1.3 1.3M7.4 16.6l-1.3 1.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  month: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 3.6v3M16 3.6v3M4 10h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  plans: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5h9M9 12h9M9 16.5h9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4.8 7.6l1.05 1.05 1.7-2M4.8 12.1l1.05 1.05 1.7-2M4.8 16.6l1.05 1.05 1.7-2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h9M4 16h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="16.5" cy="8" r="2.1" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="13" cy="16" r="2.1" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5 9.4 16.4 18.5 7.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="11" r="4" fill="currentColor"/><path d="M7 17.5h10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
};

const view = document.querySelector("#view");
const dock = document.querySelector("#dock");
const tabs = document.querySelector("#tabs");
const banner = document.querySelector("#banner");
const modal = document.querySelector("#modal");
const live = document.querySelector("#live");

const repo = createRepository();
let settings = loadSettings();
let plans = [];
let route = parseRoute();
let draft = null;
let draftKey = "";
let saveTimer = 0;
let lastRouteKey = "";
let focusTitle = false;
const filters = { query: "", status: "all", date: "" };
let returnHash = "#/today";
let reminders = null;

function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = String(value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function icon(name) {
  const wrap = h("span", { class: "icon" });
  wrap.innerHTML = ICONS[name] || "";
  return wrap;
}

function lang() {
  return settings.lang;
}

function say(message) {
  if (live) live.textContent = message;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.sol);
  document.documentElement.lang = settings.lang === "ru" ? "ru" : "en";
}

function parseRoute() {
  const raw = (location.hash || "#/today").replace(/^#/, "");
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));
  const name = parts[0] || "today";
  if (name === "day" && isISODate(parts[1])) return { name: "day", date: parts[1] };
  if (name === "plan" && parts[1]) return { name: "plan", id: decodeURIComponent(parts[1]) };
  if (name === "new") return { name: "new", date: isISODate(params.date) ? params.date : todayISO() };
  if (name === "month") {
    const now = new Date();
    let year = Number(params.y);
    let month = Number(params.m);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }
    return { name: "month", year, month };
  }
  if (name === "plans" || name === "settings" || name === "notifications" || name === "today") {
    return { name };
  }
  return { name: "today" };
}

function routeKey(value = route) {
  return JSON.stringify(value);
}

function plansOn(date) {
  return plans.filter((plan) => plan.date === date);
}

function upsert(plan) {
  const index = plans.findIndex((item) => item.id === plan.id);
  if (index >= 0) plans[index] = plan;
  else plans.push(plan);
}

function relativeLabel(date) {
  const today = todayISO();
  if (date === today) return t(lang(), "today");
  if (date === addDays(today, 1)) return t(lang(), "tomorrow");
  if (date === addDays(today, -1)) return t(lang(), "yesterday");
  return "";
}

function ensureDraft() {
  const key = route.name === "plan" ? `plan:${route.id}` : `new:${route.date}`;
  if (draft && draftKey === key) return draft;
  draftKey = key;
  if (route.name === "plan") {
    const plan = plans.find((item) => item.id === route.id);
    if (!plan) {
      draft = null;
      return null;
    }
    draft = { ...plan, time: plan.time || "", period: plan.period || "morning", mode: editorMode(plan), isNew: false };
    return draft;
  }
  draft = {
    id: uid(),
    title: "",
    date: route.date,
    time: "",
    period: "morning",
    notes: "",
    done: false,
    remind: false,
    remindOffset: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    mode: "none",
    isNew: true,
  };
  return draft;
}

function addTargetDate() {
  if (route.name === "day") return route.date;
  if (route.name === "plans" && isISODate(filters.date)) return filters.date;
  return todayISO();
}

function openNew() {
  returnHash = location.hash || "#/today";
  location.hash = `#/new?date=${addTargetDate()}`;
}

function tabName() {
  if (route.name === "month" || route.name === "day") return "month";
  if (route.name === "plans") return "plans";
  if (route.name === "settings" || route.name === "notifications") return "settings";
  if (route.name === "today") return "today";
  return "";
}

function renderTabs() {
  const editor = route.name === "new" || route.name === "plan";
  tabs.hidden = editor;
  const current = tabName();
  const items = [
    ["today", "#/today", "today"],
    ["month", "#/month", "month"],
    ["plans", "#/plans", "plans"],
    ["settings", "#/settings", "settings"],
  ];
  const inner = h("div", { class: "tabs-inner" });
  for (const [id, href, iconName] of items) {
    inner.append(h("button", {
      type: "button",
      class: `tab${current === id ? " is-active" : ""}`,
      "data-action": "go",
      "data-href": href,
      "aria-current": current === id ? "page" : false,
    }, [icon(iconName), h("span", { text: t(lang(), id) })]));
  }
  tabs.replaceChildren(inner);
}

function renderDock() {
  const show = route.name === "today" || route.name === "day" || route.name === "plans";
  dock.hidden = !show;
  if (!show) {
    dock.replaceChildren();
    return;
  }
  dock.replaceChildren(h("div", { class: "dock-inner" }, [
    h("button", { type: "button", class: "btn-primary", "data-action": "add" }, [
      icon("plus"),
      h("span", { text: t(lang(), "addPlan") }),
    ]),
  ]));
}

function planCard(plan, { showWhen }) {
  const whenText = plan.time || (showWhen ? periodLabel(lang(), plan.period) : "");
  const card = h("article", { class: `card${plan.done ? " is-done" : ""}` }, [
    h("button", {
      type: "button",
      class: "check",
      "data-action": "toggle",
      "data-id": plan.id,
      "aria-pressed": plan.done ? "true" : "false",
      "aria-label": plan.done ? t(lang(), "markNotDone") : t(lang(), "markDone"),
    }, [h("i", {}, [icon("check")])]),
    h("button", {
      type: "button",
      class: "card-main",
      "data-action": "open",
      "data-id": plan.id,
      "aria-label": `${t(lang(), "openPlan")}: ${plan.title}`,
    }, [
      whenText ? h("div", { class: `when${plan.time ? "" : " is-soft"}`, text: whenText }) : null,
      h("div", { class: "card-title", text: plan.title }),
      plan.notes ? h("div", { class: "card-notes", text: plan.notes }) : null,
    ]),
  ]);
  return card;
}

function dayBlocks(date, { showWhen }) {
  const groups = groupDayPlans(plansOn(date));
  if (!groups.length) {
    return h("div", { class: "empty" }, [
      h("div", { class: "empty-mark" }, [icon("sun")]),
      h("p", { class: "empty-title", text: t(lang(), "nothingPlanned") }),
      h("p", { class: "empty-copy", text: t(lang(), "dayOpen") }),
    ]);
  }
  const wrap = h("div", { class: "stack" });
  for (const group of groups) {
    const block = h("section", { class: "block" });
    if (sectionHasHeader(group.key)) {
      block.append(h("h2", { class: "section-label", text: sectionLabel(lang(), group.key) }));
    }
    for (const plan of group.plans) block.append(planCard(plan, { showWhen }));
    wrap.append(block);
  }
  return wrap;
}

function pageHead(title, kicker, meta) {
  return h("header", { class: "page-head" }, [
    h("h1", { class: "date-title", text: title }),
    kicker ? h("p", { class: "date-kicker", text: kicker }) : null,
    meta ? h("p", { class: "date-meta", text: meta }) : null,
  ]);
}

function renderToday() {
  const today = todayISO();
  const list = plansOn(today);
  const count = list.length;
  const meta = count ? plansToday(lang(), count) : "";
  return h("div", { class: "page" }, [
    pageHead(formatPrettyDate(today, lang()), t(lang(), "today"), meta),
    h("div", { class: "page-body" }, [dayBlocks(today, { showWhen: false })]),
  ]);
}

function shiftMonth(year, month, delta) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function renderMonth() {
  const { year, month } = route;
  const weekStart = weekStartFor(lang());
  const cells = buildMonth(year, month - 1, weekStart);
  const labels = weekdayLabels(lang(), weekStart);
  const today = todayISO();
  const now = new Date();
  const viewingCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const counts = new Map();
  for (const plan of plans) counts.set(plan.date, (counts.get(plan.date) || 0) + 1);

  const grid = h("div", { class: "month-grid" });
  for (const cell of cells) {
    const count = counts.get(cell.iso) || 0;
    const classes = ["day-cell"];
    if (!cell.inMonth) classes.push("is-out");
    if (cell.iso === today) classes.push("is-today");
    grid.append(h("button", {
      type: "button",
      class: classes.join(" "),
      "data-action": "open-day",
      "data-date": cell.iso,
      "aria-current": cell.iso === today ? "date" : false,
      "aria-label": `${formatPrettyDate(cell.iso, lang())}, ${plansCount(lang(), count)}`,
    }, [
      h("span", { class: "day-num", text: String(cell.day) }),
      h("span", { class: "day-count", text: count ? String(count) : "" }),
    ]));
  }

  return h("div", { class: "page" }, [
    h("header", { class: "page-head" }, [
      h("div", { class: "month-bar" }, [
        h("button", {
          type: "button",
          class: "icon-btn",
          "data-action": "month-prev",
          "aria-label": t(lang(), "prevMonth"),
        }, [icon("chevronLeft")]),
        h("h1", { class: "month-title", text: formatMonthTitle(year, month - 1, lang()) }),
        h("button", {
          type: "button",
          class: "icon-btn",
          "data-action": "month-next",
          "aria-label": t(lang(), "nextMonth"),
        }, [icon("chevronRight")]),
      ]),
      viewingCurrent ? null : h("button", {
        type: "button",
        class: "jump",
        "data-action": "month-today",
        text: t(lang(), "jumpToday"),
      }),
    ]),
    h("div", { class: "page-body" }, [
      h("div", { class: "weekdays", "aria-hidden": "true" }, labels.map((label) => h("span", { text: label }))),
      grid,
    ]),
  ]);
}

function renderDay() {
  const list = plansOn(route.date);
  const kicker = relativeLabel(route.date);
  const meta = list.length ? plansCount(lang(), list.length) : "";
  return h("div", { class: "page" }, [
    h("header", { class: "page-head" }, [
      h("button", {
        type: "button",
        class: "back-btn",
        "data-action": "back-month",
        "data-date": route.date,
      }, [icon("chevronLeft"), h("span", { text: t(lang(), "month") })]),
      h("h1", { class: "date-title", text: formatPrettyDate(route.date, lang()) }),
      kicker ? h("p", { class: "date-kicker", text: kicker }) : null,
      meta ? h("p", { class: "date-meta", text: meta }) : null,
    ]),
    h("div", { class: "page-body" }, [dayBlocks(route.date, { showWhen: false })]),
  ]);
}

function buildPlanResults() {
  const today = todayISO();
  const matched = filteredPlans();
  const upcoming = new Map();
  const earlier = new Map();
  for (const plan of matched) {
    const bucket = plan.date >= today ? upcoming : earlier;
    if (!bucket.has(plan.date)) bucket.set(plan.date, []);
    bucket.get(plan.date).push(plan);
  }
  const body = h("div", { id: "plans-results", class: "page-body" });
  const dates = [
    ...[...upcoming.keys()].sort(),
    ...[...earlier.keys()].sort().reverse(),
  ];
  if (!dates.length) {
    body.append(h("div", { class: "empty" }, [
      h("p", { class: "empty-title", text: t(lang(), "noResults") }),
    ]));
  }
  let passedToday = false;
  let earlierLabeled = false;
  for (const date of dates) {
    if (!passedToday && date >= today && upcoming.size) {
      body.append(h("h2", { class: "section-label pad", text: t(lang(), "upcoming") }));
      passedToday = true;
    }
    if (date < today && !earlierLabeled) {
      body.append(h("h2", { class: "section-label pad", text: t(lang(), "earlier") }));
      earlierLabeled = true;
    }
    const label = formatDayLabel(date, lang());
    body.append(h("button", {
      type: "button",
      class: "day-link",
      "data-action": "open-day",
      "data-date": date,
    }, [
      h("span", { class: "day-link-main", text: label.main }),
      h("span", { class: "day-link-week", text: label.week }),
    ]));
    const stack = h("div", { class: "stack tight" });
    const ordered = groupDayPlans(upcoming.get(date) || earlier.get(date) || []).flatMap((group) => group.plans);
    for (const plan of ordered) stack.append(planCard(plan, { showWhen: true }));
    body.append(stack);
  }
  return body;
}

function filteredPlans() {
  const query = filters.query.trim().toLowerCase();
  return plans.filter((plan) => {
    if (filters.status === "open" && plan.done) return false;
    if (filters.status === "done" && !plan.done) return false;
    if (filters.date && plan.date !== filters.date) return false;
    if (!query) return true;
    return plan.title.toLowerCase().includes(query) || plan.notes.toLowerCase().includes(query);
  });
}

function renderPlans() {
  const statusChips = h("div", { class: "chip-row", role: "radiogroup" });
  for (const [id, key] of [["all", "all"], ["open", "open"], ["done", "completed"]]) {
    statusChips.append(h("button", {
      type: "button",
      class: `chip${filters.status === id ? " is-selected" : ""}`,
      "data-action": "filter-status",
      "data-status": id,
      "aria-pressed": filters.status === id ? "true" : "false",
      text: t(lang(), key),
    }));
  }

  return h("div", { class: "page" }, [
    pageHead(t(lang(), "plans"), null, plansCount(lang(), plans.length)),
    h("div", { class: "search-sticky" }, [
      h("input", {
        id: "plan-search",
        class: "search",
        type: "search",
        placeholder: t(lang(), "searchPlaceholder"),
        value: filters.query,
        "aria-label": t(lang(), "searchPlaceholder"),
        autocomplete: "off",
      }),
      statusChips,
      h("div", { class: "date-filter" }, [
        h("label", { for: "filter-date", text: t(lang(), "filterDate") }),
        h("input", {
          id: "filter-date",
          type: "date",
          value: filters.date,
          "aria-label": t(lang(), "filterDate"),
        }),
        filters.date ? h("button", {
          type: "button",
          class: "text-btn",
          "data-action": "clear-date",
          text: t(lang(), "clearDate"),
        }) : null,
      ]),
    ]),
    buildPlanResults(),
  ]);
}

function themeCard(name) {
  const colors = THEME_PREVIEWS[name];
  const selected = settings.theme === name;
  const card = h("button", {
    type: "button",
    class: `theme-card${selected ? " is-selected" : ""}`,
    "data-action": "theme",
    "data-theme": name,
    "aria-pressed": selected ? "true" : "false",
    style: `--preview:${colors[0]};--preview-ink:${name === "moon" ? "#E7EEF6" : "#1C1915"};--preview-line:${name === "moon" ? "rgba(255,255,255,.12)" : "rgba(40,30,20,.08)"}`,
  });
  card.style.background = colors[0];
  card.style.color = name === "moon" ? "#E7EEF6" : "#1C1915";
  const dots = h("span", { class: "dots" });
  for (const color of colors.slice(1)) {
    const dot = h("i");
    dot.style.background = color;
    dots.append(dot);
  }
  card.append(dots, h("span", { class: "theme-name", text: name.charAt(0).toUpperCase() + name.slice(1) }));
  if (selected) card.append(h("span", { class: "theme-check" }, [icon("check")]));
  return card;
}

function renderSettings() {
  const grid = h("div", { class: "theme-grid" });
  for (const name of Object.keys(THEME_PREVIEWS)) grid.append(themeCard(name));
  const langSeg = h("div", { class: "segment", role: "radiogroup" });
  for (const [id, key] of [["en", "english"], ["ru", "russian"]]) {
    langSeg.append(h("button", {
      type: "button",
      "data-action": "lang",
      "data-lang": id,
      "aria-pressed": settings.lang === id ? "true" : "false",
      text: t(lang(), key),
    }));
  }
  return h("div", { class: "page" }, [
    pageHead(t(lang(), "settings")),
    h("div", { class: "page-body" }, [
      h("h2", { class: "group-label", text: t(lang(), "appearance") }),
      grid,
      h("h2", { class: "group-label", text: t(lang(), "language") }),
      h("div", { class: "pad-inline" }, [langSeg]),
      h("h2", { class: "group-label", text: t(lang(), "notifications") }),
      h("div", { class: "group" }, [
        h("button", {
          type: "button",
          class: "row-btn",
          "data-action": "go",
          "data-href": "#/notifications",
        }, [
          h("span", { text: t(lang(), "notifications") }),
          h("span", { class: "row-aside" }, [
            h("span", { text: settings.notificationsEnabled ? t(lang(), "on") : t(lang(), "off") }),
            icon("chevronRight"),
          ]),
        ]),
      ]),
      h("h2", { class: "group-label", text: t(lang(), "onDevice") }),
      h("div", { class: "group prose" }, [h("p", { text: t(lang(), "storageNote") })]),
      h("h2", { class: "group-label", text: t(lang(), "homeTitle") }),
      h("div", { class: "group prose" }, [h("p", { text: t(lang(), "homeSteps") })]),
      h("footer", { class: "about" }, [
        h("span", { class: "about-mark" }, [icon("sun")]),
        h("strong", { text: "Sola" }),
        h("span", { text: t(lang(), "about") }),
        h("span", { class: "about-version", text: t(lang(), "version") }),
      ]),
    ]),
  ]);
}

function renderNotifications() {
  const permission = permissionState();
  const permText = {
    granted: t(lang(), "permGranted"),
    denied: t(lang(), "permDenied"),
    default: t(lang(), "permDefault"),
    unsupported: t(lang(), "permUnsupported"),
  }[permission];
  const actions = h("div", { class: "stack pad-top" });
  if (permission === "unsupported") {
    actions.append(h("p", { class: "hint", text: t(lang(), "permUnsupported") }));
  } else if (!settings.notificationsEnabled || permission !== "granted") {
    actions.append(h("button", {
      type: "button",
      class: "btn-primary",
      "data-action": "notif-enable",
      text: t(lang(), "enableNotif"),
    }));
  } else {
    actions.append(h("button", {
      type: "button",
      class: "btn-primary",
      "data-action": "notif-test",
      text: t(lang(), "sendTest"),
    }));
    actions.append(h("button", {
      type: "button",
      class: "btn-quiet",
      "data-action": "notif-disable",
      text: t(lang(), "disableNotif"),
    }));
  }
  return h("div", { class: "page" }, [
    h("header", { class: "page-head" }, [
      h("button", {
        type: "button",
        class: "back-btn",
        "data-action": "go",
        "data-href": "#/settings",
      }, [icon("chevronLeft"), h("span", { text: t(lang(), "settings") })]),
      h("h1", { class: "date-title", text: t(lang(), "notifications") }),
    ]),
    h("div", { class: "page-body" }, [
      h("div", { class: "group status-card" }, [
        statusRow(t(lang(), "permission"), permText),
        statusRow(t(lang(), "inApp"), settings.notificationsEnabled ? t(lang(), "on") : t(lang(), "off")),
        statusRow(t(lang(), "openedAs"), isStandalone() ? t(lang(), "homeScreen") : t(lang(), "browser")),
      ]),
      permission === "denied" ? h("p", { class: "hint", text: t(lang(), "deniedHelp") }) : null,
      actions,
      h("div", { class: "prose loose" }, [
        h("p", { text: t(lang(), "notifP1") }),
        h("p", { text: t(lang(), "notifP2") }),
        h("p", { text: t(lang(), "notifP3") }),
      ]),
    ]),
  ]);
}

function statusRow(label, value) {
  return h("div", { class: "row" }, [
    h("span", { text: label }),
    h("strong", { text: value }),
  ]);
}

function renderEditor() {
  const current = ensureDraft();
  if (!current) {
    return h("div", { class: "page" }, [
      pageHead(t(lang(), "missingPlan"), null, t(lang(), "missingBody")),
      h("div", { class: "page-body" }, [
        h("button", { type: "button", class: "btn-primary", "data-action": "go", "data-href": "#/today", text: t(lang(), "today") }),
      ]),
    ]);
  }
  const modeSeg = h("div", { class: "segment", role: "radiogroup", "aria-label": t(lang(), "time") });
  for (const [id, key] of [["time", "time"], ["period", "partOfDay"], ["none", "noTimeOption"]]) {
    modeSeg.append(h("button", {
      type: "button",
      "data-action": "mode",
      "data-mode": id,
      "aria-pressed": current.mode === id ? "true" : "false",
      text: t(lang(), key),
    }));
  }
  let extra = null;
  if (current.mode === "time") {
    extra = h("div", { class: "row" }, [
      h("label", { for: "field-time", text: t(lang(), "time") }),
      h("input", { id: "field-time", type: "time", step: "60", value: current.time || "", "data-field": "time" }),
    ]);
  } else if (current.mode === "period") {
    const chips = h("div", { class: "chip-row wrap" });
    for (const period of ["morning", "day", "evening", "night"]) {
      const key = period === "day" ? "periodDay" : period;
      chips.append(h("button", {
        type: "button",
        class: `chip${current.period === period ? " is-selected" : ""}`,
        "data-action": "period",
        "data-period": period,
        "aria-pressed": current.period === period ? "true" : "false",
        text: t(lang(), key),
      }));
    }
    extra = h("div", { class: "row column" }, [chips]);
  }
  const offsets = h("div", { class: "choice-list" });
  if (current.remind) {
    for (const [minutes, key] of OFFSETS) {
      offsets.append(h("button", {
        type: "button",
        class: `choice${Number(current.remindOffset) === minutes ? " is-selected" : ""}`,
        "data-action": "offset",
        "data-offset": String(minutes),
        "aria-pressed": Number(current.remindOffset) === minutes ? "true" : "false",
        text: t(lang(), key),
      }));
    }
  }
  return h("div", { class: "page editor" }, [
    h("div", { class: "editor-bar" }, [
      h("button", {
        type: "button",
        class: "link-btn",
        "data-action": "close-editor",
        text: current.isNew ? t(lang(), "cancel") : t(lang(), "close"),
      }),
      h("span", { id: "save-state", class: "save-state", text: current.isNew ? "" : t(lang(), "saved") }),
      current.isNew
        ? h("button", { type: "button", class: "link-btn strong", "data-action": "create", text: t(lang(), "add") })
        : h("span", { class: "link-spacer" }),
    ]),
    h("input", {
      id: "field-title",
      class: "title-input",
      type: "text",
      maxlength: "140",
      placeholder: t(lang(), "titlePlaceholder"),
      value: current.title,
      "data-field": "title",
      "aria-label": t(lang(), "title"),
      autocomplete: "off",
    }),
    h("div", { class: "page-body" }, [
      h("div", { class: "group" }, [
        h("div", { class: "row" }, [
          h("label", { for: "field-date", text: t(lang(), "date") }),
          h("input", { id: "field-date", type: "date", value: current.date, "data-field": "date" }),
        ]),
        h("div", { class: "row column" }, [modeSeg]),
        extra,
      ]),
      h("div", { class: "group" }, [
        h("label", { class: "notes-label", for: "field-notes", text: t(lang(), "notes") }),
        h("textarea", {
          id: "field-notes",
          class: "notes-input",
          rows: "4",
          maxlength: "2000",
          placeholder: t(lang(), "notesPlaceholder"),
          "data-field": "notes",
        }, [current.notes]),
      ]),
      h("div", { class: "group" }, [
        h("div", { class: "row" }, [
          h("span", { text: t(lang(), "remindMe") }),
          h("button", {
            type: "button",
            class: "switch",
            "data-action": "remind",
            "aria-pressed": current.remind ? "true" : "false",
            "aria-label": t(lang(), "remindMe"),
          }, [h("i")]),
        ]),
        offsets,
        current.remind && current.mode !== "time" ? h("p", { class: "hint inset", text: t(lang(), "remindAnchor") }) : null,
      ]),
      h("div", { class: "group" }, [
        h("div", { class: "row" }, [
          h("span", { text: t(lang(), "markDone") }),
          h("button", {
            type: "button",
            class: "switch",
            "data-action": "draft-done",
            "aria-pressed": current.done ? "true" : "false",
            "aria-label": t(lang(), "markDone"),
          }, [h("i")]),
        ]),
      ]),
      current.isNew ? null : h("button", {
        type: "button",
        class: "btn-danger",
        "data-action": "delete-ask",
        text: t(lang(), "deletePlan"),
      }),
    ]),
  ]);
}

function render(options = {}) {
  const key = routeKey();
  const routeChanged = key !== lastRouteKey;
  lastRouteKey = key;
  const search = document.getElementById("plan-search");
  const searchFocused = document.activeElement === search;
  const selection = searchFocused ? search.selectionStart : null;
  const scroll = view.scrollTop;
  applyTheme(settings.theme);
  renderTabs();
  renderDock();
  let page;
  if (route.name === "month") page = renderMonth();
  else if (route.name === "day") page = renderDay();
  else if (route.name === "plans") page = renderPlans();
  else if (route.name === "settings") page = renderSettings();
  else if (route.name === "notifications") page = renderNotifications();
  else if (route.name === "new" || route.name === "plan") page = renderEditor();
  else page = renderToday();
  view.replaceChildren(page);
  const titles = {
    today: t(lang(), "today"),
    month: t(lang(), "month"),
    plans: t(lang(), "plans"),
    settings: t(lang(), "settings"),
    notifications: t(lang(), "notifications"),
    new: t(lang(), "newPlan"),
    plan: t(lang(), "editPlan"),
  };
  if (route.name === "day") titles.day = formatPrettyDate(route.date, lang());
  document.title = `Sola · ${titles[route.name] || "Sola"}`;
  if (searchFocused) {
    const input = document.getElementById("plan-search");
    if (input) {
      input.focus();
      const pos = selection ?? input.value.length;
      input.setSelectionRange(pos, pos);
    }
  } else if (focusTitle) {
    document.getElementById("field-title")?.focus();
    focusTitle = false;
  }
  if (options.preserveScroll || (!routeChanged && !focusTitle)) view.scrollTop = scroll;
  else view.scrollTop = 0;
}

function showBanner(items) {
  if (!items?.length) return;
  const first = items[0].title;
  const extra = items.length > 1 ? ` + ${items.length - 1}` : "";
  banner.hidden = false;
  banner.replaceChildren(
    h("div", { class: "banner-copy" }, [
      h("strong", { text: t(lang(), "reminder") }),
      h("span", { text: `${first}${extra}` }),
    ]),
    h("button", { type: "button", class: "text-btn", "data-action": "dismiss-banner", text: t(lang(), "dismiss") }),
  );
}

function scheduleSave() {
  if (!draft || draft.isNew) return;
  clearTimeout(saveTimer);
  const label = document.getElementById("save-state");
  if (label) label.textContent = t(lang(), "saving");
  saveTimer = setTimeout(() => { persistExisting(); }, 280);
}

async function persistExisting() {
  if (!draft || draft.isNew) return false;
  const title = draft.title.trim();
  const label = document.getElementById("save-state");
  const field = document.getElementById("field-title");
  if (!title) {
    if (label) label.textContent = t(lang(), "required");
    field?.classList.add("is-invalid");
    return false;
  }
  field?.classList.remove("is-invalid");
  try {
    const record = sanitizePlan({ ...fromEditor(draft), title, updatedAt: Date.now() });
    const saved = await repo.put(record);
    upsert(saved);
    draft.updatedAt = saved.updatedAt;
    if (label) label.textContent = t(lang(), "saved");
    reminders?.check();
    return true;
  } catch {
    if (label) label.textContent = t(lang(), "saveFailed");
    say(t(lang(), "saveFailed"));
    return false;
  }
}

async function createPlan() {
  if (!draft) return;
  const title = draft.title.trim();
  const label = document.getElementById("save-state");
  const field = document.getElementById("field-title");
  if (!title) {
    if (label) label.textContent = t(lang(), "required");
    field?.classList.add("is-invalid");
    field?.focus();
    return;
  }
  try {
    const record = sanitizePlan({
      ...fromEditor(draft),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const saved = await repo.put(record);
    upsert(saved);
    reminders?.check();
    location.hash = `#/day/${saved.date}`;
  } catch {
    if (label) label.textContent = t(lang(), "saveFailed");
    say(t(lang(), "saveFailed"));
  }
}

async function closeEditor() {
  clearTimeout(saveTimer);
  if (draft && !draft.isNew) await persistExisting();
  location.hash = returnHash || "#/today";
}

function openConfirm() {
  if (!draft || draft.isNew) return;
  modal.replaceChildren(h("div", { class: "dialog-backdrop", "data-action": "delete-cancel" }, [
    h("div", { class: "dialog", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "delete-title" }, [
      h("h2", { id: "delete-title", text: t(lang(), "deleteTitle") }),
      h("p", { text: deleteBody(lang(), draft.title.trim() || t(lang(), "editPlan")) }),
      h("button", { type: "button", class: "btn-danger", "data-action": "delete-confirm", text: t(lang(), "delete") }),
      h("button", { type: "button", class: "btn-quiet", "data-action": "delete-cancel", text: t(lang(), "cancel") }),
    ]),
  ]));
  modal.querySelector(".btn-danger")?.focus();
}

async function confirmDelete() {
  if (!draft) return;
  const id = draft.id;
  const date = draft.date;
  try {
    await repo.remove(id);
  } catch {
    say(t(lang(), "saveFailed"));
    return;
  }
  plans = plans.filter((plan) => plan.id !== id);
  draft = null;
  draftKey = "";
  modal.replaceChildren();
  location.hash = `#/day/${date}`;
}

async function toggleDone(id) {
  const plan = plans.find((item) => item.id === id);
  if (!plan) return;
  const next = { ...plan, done: !plan.done, updatedAt: Date.now() };
  upsert(next);
  render({ preserveScroll: true });
  try {
    upsert(await repo.put(next));
  } catch {
    upsert(plan);
    render({ preserveScroll: true });
    say(t(lang(), "saveFailed"));
  }
}

function readField(target) {
  if (!draft || !target?.dataset?.field) return;
  const field = target.dataset.field;
  if (field === "time") draft.time = (target.value || "").slice(0, 5);
  else draft[field] = target.value;
  if (!draft.isNew) scheduleSave();
}

async function onClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "delete-cancel" && event.target.classList.contains("dialog-backdrop") && event.target !== button) {
    return;
  }
  const action = button.dataset.action;
  if (action === "go") {
    location.hash = button.dataset.href;
    return;
  }
  if (action === "add") {
    openNew();
    return;
  }
  if (action === "toggle") {
    event.stopPropagation();
    toggleDone(button.dataset.id);
    return;
  }
  if (action === "open") {
    returnHash = location.hash || "#/today";
    location.hash = `#/plan/${encodeURIComponent(button.dataset.id)}`;
    return;
  }
  if (action === "open-day") {
    location.hash = `#/day/${button.dataset.date}`;
    return;
  }
  if (action === "month-prev" || action === "month-next") {
    const next = shiftMonth(route.year, route.month, action === "month-prev" ? -1 : 1);
    location.hash = `#/month?y=${next.year}&m=${next.month}`;
    return;
  }
  if (action === "month-today") {
    const now = new Date();
    location.hash = `#/month?y=${now.getFullYear()}&m=${now.getMonth() + 1}`;
    return;
  }
  if (action === "back-month") {
    const [y, m] = button.dataset.date.split("-");
    location.hash = `#/month?y=${Number(y)}&m=${Number(m)}`;
    return;
  }
  if (action === "theme") {
    settings = saveSettings({ ...settings, theme: button.dataset.theme });
    render({ preserveScroll: true });
    return;
  }
  if (action === "lang") {
    settings = saveSettings({ ...settings, lang: button.dataset.lang });
    render({ preserveScroll: true });
    return;
  }
  if (action === "filter-status") {
    filters.status = button.dataset.status;
    render({ preserveScroll: true });
    return;
  }
  if (action === "clear-date") {
    filters.date = "";
    render({ preserveScroll: true });
    return;
  }
  if (action === "dismiss-banner") {
    banner.hidden = true;
    banner.replaceChildren();
    return;
  }
  if (action === "mode" && draft) {
    draft.mode = button.dataset.mode;
    if (draft.mode === "period" && !draft.period) draft.period = "morning";
    if (!draft.isNew) scheduleSave();
    render({ preserveScroll: true });
    return;
  }
  if (action === "period" && draft) {
    draft.period = button.dataset.period;
    draft.mode = "period";
    if (!draft.isNew) scheduleSave();
    render({ preserveScroll: true });
    return;
  }
  if (action === "offset" && draft) {
    draft.remindOffset = Number(button.dataset.offset);
    if (!draft.isNew) scheduleSave();
    render({ preserveScroll: true });
    return;
  }
  if (action === "remind" && draft) {
    draft.remind = !draft.remind;
    if (!draft.isNew) scheduleSave();
    render({ preserveScroll: true });
    return;
  }
  if (action === "draft-done" && draft) {
    draft.done = !draft.done;
    if (!draft.isNew) scheduleSave();
    render({ preserveScroll: true });
    return;
  }
  if (action === "create") {
    createPlan();
    return;
  }
  if (action === "close-editor") {
    closeEditor();
    return;
  }
  if (action === "delete-ask") {
    openConfirm();
    return;
  }
  if (action === "delete-cancel") {
    modal.replaceChildren();
    return;
  }
  if (action === "delete-confirm") {
    confirmDelete();
    return;
  }
  if (action === "notif-enable") {
    const permission = await requestPermission();
    settings = saveSettings({
      ...settings,
      notificationsEnabled: permission === "granted",
    });
    render();
    if (permission === "granted") reminders?.check();
    return;
  }
  if (action === "notif-disable") {
    settings = saveSettings({ ...settings, notificationsEnabled: false });
    render();
    return;
  }
  if (action === "notif-test") {
    const ok = await showTestNotification({ body: t(lang(), "testBody") });
    say(ok ? t(lang(), "testSent") : t(lang(), "permUnsupported"));
    const label = document.querySelector('[data-action="notif-test"]');
    if (label && ok) label.textContent = t(lang(), "testSent");
  }
}

function onInput(event) {
  const target = event.target;
  if (target.id === "plan-search") {
    filters.query = target.value;
    document.getElementById("plans-results")?.replaceWith(buildPlanResults());
    return;
  }
  if (target.id === "filter-date") {
    filters.date = target.value;
    render({ preserveScroll: true });
    return;
  }
  readField(target);
}

document.querySelector("#app").addEventListener("click", onClick);
document.querySelector("#app").addEventListener("input", onInput);
document.querySelector("#app").addEventListener("change", onInput);
modal.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.classList.contains("dialog-backdrop") && event.target !== button) return;
  if (button.dataset.action === "delete-cancel") modal.replaceChildren();
  if (button.dataset.action === "delete-confirm") confirmDelete();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && draft && !draft.isNew) persistExisting();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (modal.childElementCount) {
      modal.replaceChildren();
      return;
    }
    if (route.name === "new" || route.name === "plan") closeEditor();
    return;
  }
  if (event.key === "Enter" && event.target?.id === "field-title" && draft?.isNew) {
    event.preventDefault();
    createPlan();
  }
});

window.addEventListener("hashchange", () => {
  const next = parseRoute();
  const enteringNew = next.name === "new" && route.name !== "new";
  if (route.name === "new" || route.name === "plan") {
    clearTimeout(saveTimer);
    if (draft && !draft.isNew) persistExisting();
  }
  if (next.name !== "new" && next.name !== "plan") {
    draft = null;
    draftKey = "";
  }
  route = next;
  focusTitle = enteringNew;
  modal.replaceChildren();
  render();
});

if ("serviceWorker" in navigator) {
  const swUrl = new URL("sw.js", document.baseURI);
  navigator.serviceWorker.register(swUrl.href).catch(() => {});
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "navigate" && event.data.hash) location.hash = event.data.hash;
  });
}

async function boot() {
  if (!location.hash) history.replaceState(null, "", "#/today");
  route = parseRoute();
  applyTheme(settings.theme);
  try {
    plans = await repo.all();
  } catch {
    plans = [];
  }
  reminders = startReminders({
    getPlans: () => plans,
    isEnabled: () => settings.notificationsEnabled,
    langCopy: (plan) => ({
      reminder: t(lang(), "reminder"),
      when: plan.time || periodLabel(lang(), plan.period),
    }),
    onFire: showBanner,
  });
  focusTitle = route.name === "new";
  render();
}

boot();
