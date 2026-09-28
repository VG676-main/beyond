/**
 * Reminders that a normal iOS PWA can actually deliver.
 * While Sola is open, a timer fires the notification.
 * If you return within two hours, a missed reminder is still delivered.
 * Lock-screen delivery after the app is suspended needs a push server; that is not faked here.
 */

import { reminderInstant } from "./model.js";

const FIRED_KEY = "sola-fired";
const LOOKBACK_MS = 2 * 60 * 60 * 1000;
const SOON_MS = 20 * 1000;

function loadFired() {
  try {
    const raw = JSON.parse(localStorage.getItem(FIRED_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function saveFired(fired) {
  const list = [...fired];
  const trimmed = list.length > 300 ? list.slice(list.length - 300) : list;
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(trimmed));
  } catch {
    /* Ignore quota problems; a reminder may repeat once. */
  }
}

export function permissionState() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission || "default";
}

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export async function requestPermission() {
  if (typeof Notification === "undefined" || !Notification.requestPermission) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

async function display({ title, body, tag, date }) {
  const payload = {
    body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: tag || title,
    data: { date: date || "" },
  };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(title, payload);
      return true;
    }
  } catch {
    /* Fall through to the page Notification constructor. */
  }
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const notification = new Notification(title, payload);
    notification.onclick = () => {
      window.focus();
      if (date) location.hash = `#/day/${date}`;
    };
    return true;
  }
  return false;
}

export function showTestNotification(copy) {
  return display({ title: "Sola", body: copy.body, tag: "sola-test", date: "" });
}

export function showPlanNotification(plan, copy) {
  const when = plan.time || copy.when || "";
  const body = when ? `${copy.reminder} · ${when}` : copy.reminder;
  return display({
    title: plan.title,
    body,
    tag: copy.tag,
    date: plan.date,
  });
}

export function startReminders({ getPlans, isEnabled, langCopy, onFire }) {
  let timer = 0;
  let running = false;
  let queued = false;

  async function checkOnce() {
    if (!isEnabled()) return [];
    if (permissionState() !== "granted") return [];
    const now = Date.now();
    const fired = loadFired();
    const due = [];
    for (const plan of getPlans()) {
      if (!plan || plan.done || !plan.remind) continue;
      const at = reminderInstant(plan);
      if (at == null) continue;
      const key = `${plan.id}@${at}`;
      if (fired.has(key)) continue;
      if (at <= now + SOON_MS && at >= now - LOOKBACK_MS) due.push({ plan, at, key });
    }
    due.sort((a, b) => b.at - a.at);
    const shown = due.slice(0, 3);
    const silent = due.slice(3);
    for (const item of silent) fired.add(item.key);
    for (const item of shown) {
      fired.add(item.key);
      const copy = langCopy(item.plan);
      await showPlanNotification(item.plan, { ...copy, tag: item.key });
    }
    if (shown.length || silent.length) saveFired(fired);
    if (shown.length) onFire(shown.map((item) => item.plan));
    return shown.map((item) => item.plan);
  }

  function arm() {
    clearTimeout(timer);
    const now = Date.now();
    let delay = 15000;
    if (isEnabled() && permissionState() === "granted") {
      let next = null;
      for (const plan of getPlans()) {
        if (!plan || plan.done || !plan.remind) continue;
        const at = reminderInstant(plan);
        if (at == null || at <= now) continue;
        if (next == null || at < next) next = at;
      }
      if (next != null) delay = Math.min(Math.max(next - now + 250, 400), 15000);
    }
    timer = setTimeout(tick, delay);
  }

  async function tick() {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await checkOnce();
    } finally {
      running = false;
      if (queued) {
        queued = false;
        tick();
      } else {
        arm();
      }
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
  tick();
  return { check: tick };
}
