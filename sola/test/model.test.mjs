import assert from "node:assert/strict";
import test from "node:test";
import {
  comparePlans,
  formatWeekTitle,
  groupDayPlans,
  reminderInstant,
  sanitizePlan,
  sectionKey,
  sortPlans,
  startOfWeek,
  weekDates,
  weekStartFor,
} from "../js/model.js";

function plan(partial) {
  return {
    title: "",
    time: null,
    period: null,
    createdAt: 0,
    notes: "",
    done: false,
    remind: false,
    remindOffset: 0,
    date: "2026-09-28",
    id: partial.title || "id",
    ...partial,
  };
}

test("exact times sort before periods, then plans with no time", () => {
  const titles = sortPlans([
    plan({ title: "Buy milk" }),
    plan({ title: "Call parents", period: "evening" }),
    plan({ title: "Gym", time: "18:00" }),
    plan({ title: "Lunch", time: "13:00" }),
    plan({ title: "Work", time: "09:30" }),
    plan({ title: "Wake up", time: "08:00" }),
  ]).map((item) => item.title);
  assert.deepEqual(titles, ["Wake up", "Work", "Lunch", "Gym", "Call parents", "Buy milk"]);
});

test("a new 10:00 plan lands between 09:30 and 13:00", () => {
  const titles = sortPlans([
    plan({ title: "Work", time: "09:30" }),
    plan({ title: "Lunch", time: "13:00" }),
    plan({ title: "Standup", time: "10:00" }),
  ]).map((item) => item.title);
  assert.deepEqual(titles, ["Work", "Standup", "Lunch"]);
});

test("Morning sits after morning clock times and before daytime", () => {
  const titles = sortPlans([
    plan({ title: "Lunch", time: "13:00" }),
    plan({ title: "Stretch", period: "morning" }),
    plan({ title: "Work", time: "09:30" }),
    plan({ title: "Emails", period: "day" }),
    plan({ title: "Wake", time: "08:00" }),
    plan({ title: "Late mail", time: "11:45" }),
  ]).map((item) => item.title);
  assert.deepEqual(titles, ["Wake", "Work", "Late mail", "Stretch", "Lunch", "Emails"]);
});

test("clearing the time moves a plan below timed and period plans", () => {
  const titles = sortPlans([
    plan({ title: "Gym", time: "18:00" }),
    plan({ title: "Milk", time: null, period: null }),
    plan({ title: "Call", period: "evening" }),
  ]).map((item) => item.title);
  assert.deepEqual(titles, ["Gym", "Call", "Milk"]);
});

test("night hours at the start of the day stay before morning, late night stays after evening", () => {
  const titles = sortPlans([
    plan({ title: "Journal", period: "night" }),
    plan({ title: "Wind", time: "22:30" }),
    plan({ title: "Gym", time: "18:00" }),
    plan({ title: "Shift", time: "02:00" }),
    plan({ title: "Call", period: "evening" }),
    plan({ title: "Wake", time: "08:00" }),
  ]).map((item) => item.title);
  assert.deepEqual(titles, ["Shift", "Wake", "Gym", "Call", "Wind", "Journal"]);
});

test("same clock time is ordered by title", () => {
  const titles = sortPlans([
    plan({ title: "Beta", time: "08:00", createdAt: 1 }),
    plan({ title: "Alpha", time: "08:00", createdAt: 2 }),
  ]).map((item) => item.title);
  assert.deepEqual(titles, ["Alpha", "Beta"]);
});

test("section headers exist only for periods and no-time", () => {
  const groups = groupDayPlans([
    plan({ title: "Wake", time: "08:00" }),
    plan({ title: "Stretch", period: "morning" }),
    plan({ title: "Milk" }),
  ]);
  assert.deepEqual(groups.map((group) => group.key), ["morning-clock", "morning", "none"]);
  assert.equal(sectionKey(plan({ title: "Lunch", time: "13:00" })), "day-clock");
});

test("reminder offsets use the plan clock, anchors, or 09:00", () => {
  const tenBefore = new Date(reminderInstant({
    remind: true,
    date: "2026-09-28",
    time: "08:30",
    remindOffset: 10,
  }));
  assert.equal(tenBefore.getHours(), 8);
  assert.equal(tenBefore.getMinutes(), 20);

  const morning = new Date(reminderInstant({
    remind: true,
    date: "2026-09-28",
    time: null,
    period: "morning",
    remindOffset: 0,
  }));
  assert.equal(morning.getHours(), 8);
  assert.equal(morning.getMinutes(), 0);

  const anytime = new Date(reminderInstant({
    remind: true,
    date: "2026-09-28",
    remindOffset: 0,
  }));
  assert.equal(anytime.getHours(), 9);

  const previousDay = new Date(reminderInstant({
    remind: true,
    date: "2026-03-10",
    time: "08:30",
    remindOffset: 1440,
  }));
  assert.equal(previousDay.getFullYear(), 2026);
  assert.equal(previousDay.getMonth(), 2);
  assert.equal(previousDay.getDate(), 9);
  assert.equal(previousDay.getHours(), 8);
  assert.equal(previousDay.getMinutes(), 30);

  assert.equal(reminderInstant({ remind: false, date: "2026-09-28", time: "08:00" }), null);
});

test("sanitize keeps an exact time and drops a conflicting period", () => {
  const saved = sanitizePlan({
    id: "a",
    title: "  Gym  ",
    date: "2026-09-28",
    time: "08:30",
    period: "night",
    notes: " easy ",
    remind: true,
    remindOffset: 30,
  });
  assert.equal(saved.title, "Gym");
  assert.equal(saved.time, "08:30");
  assert.equal(saved.period, null);
  assert.equal(saved.notes, "easy");
  assert.equal(saved.remindOffset, 30);
  assert.throws(() => sanitizePlan({ id: "a", title: "   ", date: "2026-09-28" }));
});

test("a week is seven days from the locale start", () => {
  assert.equal(startOfWeek("2026-09-28", 1), "2026-09-28");
  assert.equal(startOfWeek("2026-09-28", 0), "2026-09-27");
  assert.deepEqual(weekDates("2026-09-30", 1), [
    "2026-09-28",
    "2026-09-29",
    "2026-09-30",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
  ]);
  assert.equal(formatWeekTitle("2026-09-07", "en"), "September 7–13");
  assert.match(formatWeekTitle("2026-09-07", "ru"), /^7–13 /);
  assert.equal(formatWeekTitle("2026-09-28", "en"), "Sep 28 – Oct 4");
});

test("week starts on Monday in Russian and Sunday in English", () => {
  assert.equal(weekStartFor("ru"), 1);
  assert.equal(weekStartFor("en"), 0);
});

test("comparePlans is a pure ordering", () => {
  assert.ok(comparePlans(plan({ title: "A", time: "09:00" }), plan({ title: "B", time: "10:00" })) < 0);
});
