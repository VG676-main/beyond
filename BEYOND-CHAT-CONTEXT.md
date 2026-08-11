Контекст проекта BEYOND
Продолжаем работу над мобильным веб-приложением BEYOND — life RPG (жизнь как игра): привычки, тренировки, книги, цели прокачивают персонажа.

Путь к проекту
C:\Users\vg676\beyond

Работай в этой папке (workspace root). Исходный прототип был HTML из Downloads, сейчас нормальный проект.

Стек
Vanilla HTML/CSS/JS (без React)
Firebase Auth (email/password) + Firestore
localStorage + облачная синхронизация прогресса
Хостинг: Netlify — https://gobeyondyourself.netlify.app
Конфиг Firebase: js/firebase-config.js (проект beyond-vg676)
Структура
beyond/
  index.html
  README.md
  BEYOND-CHAT-CONTEXT.md
  css/app.css
  css/auth.css
  css/character.css
  css/books.css          — книжный шкаф
  js/firebase-config.js
  js/cloud.js          — auth + Firestore + hydrate/persist
  js/app.js            — вся игра (монолит)
  js/main.js           — boot, экран входа/регистрации
После правок нужно заново залить папку на Netlify (drag & drop в deploys) и Ctrl+F5.

Что уже сделано
Переименование LIFE RPG → BEYOND, слоган Go Beyond Yourself
Сохранение: localStorage + Firebase cloud sync
Аккаунты: регистрация/вход по почте (у каждого свой персонаж)
Темы: Обсидиан, Сакура, Изумруд, Неон, Глубина, Графит, Шторм, Ягода (berry #C33764→#1D2671)
У каждой темы с FX — тумблер «Анимация этой темы»
Убраны: Иней, Закат, Туман, Лава; Океан+Аврора → Глубина (пузырьки вверх)
Валюта ✦ Искры за задачи/тренировки/книги/цели
Комната персонажа: аватары, формы (hex/круг/квадрат/скругление/ромб/щит — все бесплатно), рамки, ауры, значки, магазин
Фото на аватар: вкладка «Фото», сжатие, хранение blob’ов отдельно в localStorage (beyond-photos-{uid}), в Firestore только метаданные (без dataUrl)
Ежедневные привычки со сбросом после полуночи + бонус «День закрыт»
Крупный блок «Сегодня» на дашборде с чеклистом привычек
Тосты с крестиком закрытия
Фикс: glow/ауры на всех формах — drop-shadow на .char-frame, не на clipped .hex-avatar
Фикс: аура «Пустота» — тёмное ядро + фиолетовый край + blurb
Фикс: в кардио скрыты вес/повторы (только силовая); у кардио длительность + дистанция
Фикс: кастомные чекбоксы .check-row (видны на Графите)
Книжный шкаф: завершённые книги на полках, 5 на полку / 25 в шкафу, цвета под тему (css/books.css)

Важные детали реализации
Состояние: STORAGE_KEY = 'beyond-state'
save() использует stateForPersist() — фото без dataUrl
Сброс привычек: resetDailyHabitsIfNeeded() по todayKey() / tasksResetDay
Портрет: characterPortrait() в app.js, формы через классы shape-* в character.css
Искры: task +5, strength +10/+20 record, cardio +12, book +15, goal +25, day complete +12 и +20 XP
Книги: reading = список; done = renderBookshelf(); BOOKS_PER_SHELF=5, SHELVES_PER_CASE=5

Что логично делать дальше (приоритет)
Допилить вид книжного шкафа по фидбеку (если ещё бесит)
Пользоваться 7 дней и смотреть, что бесит
PWA (manifest + иконка «на экран домой»)
Упростить/спрятать фейковых «Друзей»
Больше косметики / баланс искр по фидбеку
Напоминания (позже)

Пользователь
VG, 18 лет, fullstack junior.
