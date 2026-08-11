import * as Cloud from "./cloud.js";
import { isFirebaseConfigured } from "./firebase-config.js";

window.BeyondCloud = Cloud;

const root = document.getElementById("root");
const boot = document.getElementById("boot");

function showBoot(html) {
  if (boot) boot.innerHTML = html;
}

function authScreen(mode, error) {
  const isLogin = mode !== "register";
  return `
    <div class="onboarding-screen">
      <div class="onboarding-card auth-card">
        <div class="onboarding-eyebrow">BEYOND</div>
        <h1>${isLogin ? "Вход" : "Регистрация"}</h1>
        <p class="onboarding-sub auth-slogan">
          Go Beyond Yourself
        </p>
        ${error ? `<div class="auth-error">${escapeHtml(error)}</div>` : ""}
        <form data-auth="${isLogin ? "login" : "register"}" class="form-grid">
          ${
            isLogin
              ? ""
              : `<div class="field field-wide"><label>Имя</label>
                 <input name="name" placeholder="Как к тебе обращаться" maxlength="40"></div>`
          }
          <div class="field field-wide"><label>Почта</label>
            <input name="email" type="email" required placeholder="you@email.com" autocomplete="email"></div>
          <div class="field field-wide"><label>Пароль</label>
            <input name="password" type="password" required minlength="6" placeholder="минимум 6 символов" autocomplete="${isLogin ? "current-password" : "new-password"}"></div>
          <button class="btn btn-primary" type="submit">${isLogin ? "Войти" : "Создать аккаунт"}</button>
        </form>
        <p class="auth-switch">
          ${
            isLogin
              ? `Нет аккаунта? <button type="button" class="linkish" data-auth-mode="register">Зарегистрироваться</button>`
              : `Уже есть аккаунт? <button type="button" class="linkish" data-auth-mode="login">Войти</button>`
          }
        </p>
        <p class="auth-switch" style="margin-top:14px;">
          <button type="button" class="linkish" id="local-only">Продолжить без аккаунта</button>
        </p>
      </div>
    </div>`;
}

function setupNeededScreen() {
  return `
    <div class="onboarding-screen">
      <div class="onboarding-card">
        <div class="onboarding-eyebrow">BEYOND · Настройка</div>
        <h1>Остался один шаг</h1>
        <p class="onboarding-sub">
          Чтобы скинуть ссылку и заходить с телефона и ПК под одним аккаунтом,
          нужно бесплатно создать проект в Firebase (сервис Google) и вставить ключи.
        </p>
        <ol class="setup-steps">
          <li>Открой <a href="https://console.firebase.google.com/" target="_blank" rel="noopener">console.firebase.google.com</a></li>
          <li>Создай проект, например <strong>beyond-app</strong></li>
          <li>Добавь веб-приложение (иконка <strong>&lt;/&gt;</strong>)</li>
          <li>Включи Authentication → Email/Password</li>
          <li>Создай Firestore Database (режим test на старте ок)</li>
          <li>Скопируй ключи в файл <code>js/firebase-config.js</code></li>
          <li>Залей папку на Netlify/Vercel и скинь ссылку</li>
        </ol>
        <p class="onboarding-sub">Подробно — в README.md. Пока можно играть только на этом устройстве:</p>
        <button class="btn btn-primary" id="local-only">Продолжить без аккаунта (локально)</button>
      </div>
    </div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function mapAuthError(err) {
  const code = err && err.code;
  const map = {
    "auth/email-already-in-use": "Эта почта уже зарегистрирована. Войди.",
    "auth/invalid-email": "Некорректная почта.",
    "auth/weak-password": "Пароль слишком короткий (минимум 6).",
    "auth/user-not-found": "Аккаунт не найден. Зарегистрируйся.",
    "auth/wrong-password": "Неверный пароль.",
    "auth/invalid-credential": "Неверная почта или пароль.",
    "auth/too-many-requests": "Слишком много попыток. Подожди немного.",
    "auth/network-request-failed": "Нет сети. Проверь интернет.",
  };
  return map[code] || (err && err.message) || "Ошибка входа";
}

let authMode = "login";

function bindAuthUi() {
  document.body.addEventListener("click", (e) => {
    const modeBtn = e.target.closest("[data-auth-mode]");
    if (modeBtn) {
      authMode = modeBtn.getAttribute("data-auth-mode");
      showBoot(authScreen(authMode));
      return;
    }
    if (e.target.id === "local-only") {
      startApp();
    }
  });

  document.body.addEventListener("submit", async (e) => {
    const form = e.target.closest("form[data-auth]");
    if (!form) return;
    e.preventDefault();
    const kind = form.getAttribute("data-auth");
    const fd = new FormData(form);
    const email = (fd.get("email") || "").toString();
    const password = (fd.get("password") || "").toString();
    const name = (fd.get("name") || "").toString();
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      if (kind === "register") await Cloud.register(email, password, name);
      else await Cloud.login(email, password);
      await startApp();
    } catch (err) {
      showBoot(authScreen(kind === "register" ? "register" : "login", mapAuthError(err)));
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

async function startApp() {
  showBoot("");
  if (boot) boot.style.display = "none";
  if (root) root.style.display = "";
  await window.BeyondApp.init();
}

async function main() {
  bindAuthUi();
  Cloud.initCloud();

  if (!isFirebaseConfigured()) {
    showBoot(setupNeededScreen());
    return;
  }

  showBoot(`
    <div class="loading-screen">
      <div class="loading-hex"></div>
      <p>BEYOND загружается…</p>
    </div>`);

  const user = await Cloud.whenAuthReady();
  if (!user) {
    showBoot(authScreen("login"));
    return;
  }
  await startApp();
}

main().catch((e) => {
  console.error(e);
  showBoot(`
    <div class="onboarding-screen">
      <div class="onboarding-card">
        <h1>Ошибка запуска</h1>
        <p class="onboarding-sub">${escapeHtml(e.message || String(e))}</p>
      </div>
    </div>`);
});
