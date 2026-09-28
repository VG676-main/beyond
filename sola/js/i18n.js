const DICT = {
  en: {
    today: "Today",
    month: "Month",
    plans: "Plans",
    settings: "Settings",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    nothingPlanned: "Nothing planned",
    dayOpen: "The day is open.",
    morning: "Morning",
    periodDay: "Day",
    evening: "Evening",
    night: "Night",
    noTime: "No time",
    addPlan: "Add plan",
    title: "Title",
    titlePlaceholder: "Go to gym",
    date: "Date",
    time: "Time",
    partOfDay: "Part of day",
    noTimeOption: "No time",
    notes: "Notes",
    notesPlaceholder: "Optional details",
    remindMe: "Remind me",
    atTime: "At the time",
    min5: "5 minutes before",
    min10: "10 minutes before",
    min30: "30 minutes before",
    hour1: "1 hour before",
    day1: "1 day before",
    remindAnchor:
      "Without an exact time, Morning is 8:00, Day is 13:00, Evening is 18:00, Night is 21:00, and no time is 9:00.",
    cancel: "Cancel",
    close: "Close",
    add: "Add",
    delete: "Delete",
    deletePlan: "Delete plan",
    deleteTitle: "Delete this plan?",
    saved: "Saved",
    saving: "Saving",
    required: "Add a title",
    saveFailed: "Could not save on this device",
    searchPlaceholder: "Search plans",
    all: "All",
    open: "Open",
    completed: "Done",
    upcoming: "Upcoming",
    earlier: "Earlier",
    noResults: "No plans match",
    appearance: "Appearance",
    language: "Language",
    english: "English",
    russian: "Русский",
    notifications: "Notifications",
    onDevice: "On this device",
    storageNote:
      "Plans stay in this app on this device. Nothing is uploaded. The records are ready for an account later, if you ever want sync between devices.",
    homeTitle: "iPhone",
    homeSteps:
      "In Safari, tap Share, then Add to Home Screen. Sola opens with its own icon, like an app from the App Store.",
    version: "Version 1.0",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    jumpToday: "Today",
    back: "Back",
    permission: "Permission",
    permGranted: "Allowed",
    permDenied: "Blocked",
    permDefault: "Not requested",
    permUnsupported: "Not available in this browser",
    inApp: "In Sola",
    on: "On",
    off: "Off",
    openedAs: "Opened from",
    homeScreen: "Home Screen",
    browser: "Safari or browser",
    enableNotif: "Enable notifications",
    disableNotif: "Turn off notifications",
    sendTest: "Send a test",
    testSent: "Test sent",
    notifP1:
      "While Sola is open, reminders arrive on time. If you open the app within two hours after a reminder, Sola still delivers it.",
    notifP2:
      "On iPhone, notification permission works after you add Sola to the Home Screen and open it from that icon. This needs iOS 16.4 or later.",
    notifP3:
      "A lock-screen alert while Sola is fully closed needs Web Push and a small server. This version keeps plans on the phone and does not include that server, so it does not pretend those background alerts are set up.",
    deniedHelp:
      "Notifications are blocked. On iPhone, open Settings, then Notifications, then Sola, and allow notifications.",
    reminder: "Reminder",
    testBody: "Notifications are on.",
    missingPlan: "This plan is gone",
    missingBody: "It may have been deleted on this device.",
    clearDate: "Clear date",
    filterDate: "Date",
    markDone: "Mark as done",
    markNotDone: "Mark as not done",
    openPlan: "Edit plan",
    newPlan: "New plan",
    editPlan: "Edit plan",
    dismiss: "Dismiss",
    noscript: "Sola needs JavaScript to keep your plans on this device.",
    about: "A quiet place for the day.",
  },
  ru: {
    today: "Сегодня",
    month: "Месяц",
    plans: "Планы",
    settings: "Настройки",
    tomorrow: "Завтра",
    yesterday: "Вчера",
    nothingPlanned: "Ничего не запланировано",
    dayOpen: "День свободен.",
    morning: "Утро",
    periodDay: "День",
    evening: "Вечер",
    night: "Ночь",
    noTime: "Без времени",
    addPlan: "Добавить план",
    title: "Название",
    titlePlaceholder: "Сходить в зал",
    date: "Дата",
    time: "Время",
    partOfDay: "Часть дня",
    noTimeOption: "Без времени",
    notes: "Описание",
    notesPlaceholder: "Необязательно",
    remindMe: "Напомнить",
    atTime: "В момент события",
    min5: "За 5 минут",
    min10: "За 10 минут",
    min30: "За 30 минут",
    hour1: "За 1 час",
    day1: "За 1 день",
    remindAnchor:
      "Если точного времени нет: утро — 8:00, день — 13:00, вечер — 18:00, ночь — 21:00, без времени — 9:00.",
    cancel: "Отмена",
    close: "Закрыть",
    add: "Добавить",
    delete: "Удалить",
    deletePlan: "Удалить план",
    deleteTitle: "Удалить этот план?",
    saved: "Сохранено",
    saving: "Сохраняю",
    required: "Добавьте название",
    saveFailed: "Не удалось сохранить на этом устройстве",
    searchPlaceholder: "Поиск планов",
    all: "Все",
    open: "Открытые",
    completed: "Готовые",
    upcoming: "Дальше",
    earlier: "Раньше",
    noResults: "Ничего не нашлось",
    appearance: "Оформление",
    language: "Язык",
    english: "English",
    russian: "Русский",
    notifications: "Уведомления",
    onDevice: "На этом устройстве",
    storageNote:
      "Планы хранятся в этом приложении на устройстве. Никуда не отправляются. Записи устроены так, чтобы позже можно было добавить аккаунт и синхронизацию.",
    homeTitle: "iPhone",
    homeSteps:
      "В Safari нажмите «Поделиться», затем «На экран Домой». Sola откроется со своей иконкой, как приложение.",
    version: "Версия 1.0",
    prevMonth: "Предыдущий месяц",
    nextMonth: "Следующий месяц",
    jumpToday: "Сегодня",
    back: "Назад",
    permission: "Разрешение",
    permGranted: "Разрешено",
    permDenied: "Запрещено",
    permDefault: "Ещё не запрошено",
    permUnsupported: "Недоступно в этом браузере",
    inApp: "В Sola",
    on: "Включены",
    off: "Выключены",
    openedAs: "Открыто из",
    homeScreen: "экрана Домой",
    browser: "Safari или браузера",
    enableNotif: "Включить уведомления",
    disableNotif: "Выключить уведомления",
    sendTest: "Проверить уведомление",
    testSent: "Проверка отправлена",
    notifP1:
      "Пока Sola открыта, напоминание приходит вовремя. Если открыть приложение в течение двух часов после времени напоминания, оно всё равно придёт.",
    notifP2:
      "На iPhone разрешение на уведомления запрашивается после того, как Sola добавлена на экран Домой и открыта с иконки. Нужна iOS 16.4 или новее.",
    notifP3:
      "Сигнал на заблокированном экране, когда Sola полностью закрыта, — это Web Push, ему нужен небольшой сервер. В этой версии планы остаются на телефоне, сервера нет, и приложение не делает вид, что такие фоновые сигналы уже настроены.",
    deniedHelp:
      "Уведомления запрещены. На iPhone: Настройки → Уведомления → Sola → разрешить уведомления.",
    reminder: "Напоминание",
    testBody: "Уведомления включены.",
    missingPlan: "Этого плана нет",
    missingBody: "Возможно, он удалён на этом устройстве.",
    clearDate: "Сбросить дату",
    filterDate: "Дата",
    markDone: "Отметить выполненным",
    markNotDone: "Вернуть в планы",
    openPlan: "Изменить план",
    newPlan: "Новый план",
    editPlan: "План",
    dismiss: "Скрыть",
    noscript: "Sola нужен JavaScript, чтобы хранить планы на этом устройстве.",
    about: "Спокойное место для дня.",
  },
};

export function t(lang, key) {
  return DICT[lang]?.[key] || DICT.en[key] || key;
}

function ruPlural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function plansToday(lang, n) {
  if (lang === "ru") return `${n} ${ruPlural(n, "план", "плана", "планов")} сегодня`;
  return n === 1 ? "1 plan today" : `${n} plans today`;
}

export function plansCount(lang, n) {
  if (lang === "ru") return `${n} ${ruPlural(n, "план", "плана", "планов")}`;
  return n === 1 ? "1 plan" : `${n} plans`;
}

export function deleteBody(lang, title) {
  if (lang === "ru") return `«${title}» исчезнет из календаря.`;
  return `“${title}” will be removed from your calendar.`;
}

export function periodLabel(lang, period) {
  if (period === "day") return t(lang, "periodDay");
  if (period === "morning" || period === "evening" || period === "night") return t(lang, period);
  return t(lang, "noTime");
}

export function sectionLabel(lang, key) {
  if (key === "morning") return t(lang, "morning");
  if (key === "day") return t(lang, "periodDay");
  if (key === "evening") return t(lang, "evening");
  if (key === "night") return t(lang, "night");
  if (key === "none") return t(lang, "noTime");
  return "";
}
