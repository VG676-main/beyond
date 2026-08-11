# BEYOND

Приложение «жизнь как RPG»: тренировки, книги, задачи и цели прокачивают персонажа.

- Сохранение в браузере (`localStorage`)
- Аккаунт по почте (Firebase) — один прогресс на телефоне и ПК
- Можно скинуть ссылку подруге — у неё будет **свой** аккаунт и персонаж

## Что такое Firebase (простыми словами)

Firebase — бесплатный сервис Google. Он:

1. хранит логины (почта + пароль);
2. хранит прогресс персонажа в облаке.

Свой сервер писать не нужно. Пока ключи не вставлены, BEYOND может работать только локально на одном устройстве.

## Быстрый старт (локально)

1. Открой папку `beyond` в Cursor.
2. Открой `index.html` через Live Server / простой локальный сервер  
   (модули ES не любят `file://` — нужен http).

Пример:

```bash
npx --yes serve .
```

Потом открой адрес из терминала (обычно `http://localhost:3000`).

## Включить аккаунты (обязательно для ссылки девушке)

### 1. Создай проект Firebase

1. Зайди на [console.firebase.google.com](https://console.firebase.google.com/)
2. Войди Google-аккаунтом
3. **Add project** → имя например `beyond-app`
4. Google Analytics можно выключить

### 2. Добавь веб-приложение

1. На главной проекта нажми иконку **`</>`** (Web)
2. Nickname: `beyond`
3. Скопируй объект `firebaseConfig` (apiKey, authDomain, …)

### 3. Вставь ключи в код

Открой `js/firebase-config.js` и вставь значения:

```js
export const firebaseConfig = {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…",
};
```

### 4. Включи Email/Password

1. В меню Firebase: **Build → Authentication → Get started**
2. Вкладка **Sign-in method**
3. **Email/Password** → Enable → Save

### 5. Создай базу Firestore

1. **Build → Firestore Database → Create database**
2. На старте можно **Start in test mode** (для двоих людей ок на время)
3. Выбери регион поближе (например `europe-west`)

Правила на старте (test mode обычно уже разрешают запись). Позже лучше так:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Выложи сайт (GitHub Pages, бесплатно)

Автодеплой уже настроен: каждый `push` в `main` публикует сайт.

1. Создай репозиторий на GitHub (если ещё нет) и запушь `main`
2. В репо: **Settings → Pages → Source → GitHub Actions**
3. После первого успешного workflow ссылка будет вида  
   `https://<username>.github.io/beyond/`

Данные пользователей **не на хостинге**: они в Firebase Auth + Firestore.  
Смена Netlify → GitHub Pages не стирает прогресс — меняется только URL сайта.

Запасной вариант — Firebase Hosting (`firebase.json` уже лежит в проекте).

## Как пользоваться вдвоём

1. Ты открываешь ссылку → **Регистрация** своей почтой
2. Создаёшь персонажа
3. На телефоне открываешь **ту же ссылку** → **Вход** той же почтой → прогресс тот же
4. Девушка открывает ссылку → **регистрируется своей почтой** → у неё отдельный персонаж

## Структура

```
beyond/
  index.html
  css/app.css
  css/auth.css
  js/firebase-config.js   ← твои ключи
  js/cloud.js             ← вход + облако
  js/app.js               ← игра
  js/main.js              ← запуск
  README.md
```

## Важно

- Не выкладывай в публичный репозиторий ключи, если боишься злоупотреблений; для личного приложения на двоих обычно нормально (ключ и так виден в браузере, защиту дают правила Firestore).
- Без Firebase конфига приложение предложит «только локально» — прогресс не перенесётся на другой телефон.
