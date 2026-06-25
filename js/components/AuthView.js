import { Component } from "./Component.js";
import { DATA_MODES } from "../core/DataMode.js";

export class AuthView extends Component {
  constructor({ authService, dataMode, apiClient, eventBus }) {
    super();

    this.authService = authService;
    this.dataMode = dataMode;
    this.apiClient = apiClient;
    this.eventBus = eventBus;
    this.mode = "login";
    this.isSubmitting = false;
  }

  render() {
    const dataMode = this.dataMode?.getMode?.() || DATA_MODES.LOCAL;
    const apiBaseUrl = this.dataMode?.getApiBaseUrl?.() || "http://localhost:4000/api";

    this.element = this.createElement(`
      <main class="auth-page">
        <section class="auth-card">
          <div class="auth-brand">
            <div class="auth-logo">B</div>
            <h1>BOB</h1>
            <p>мессенджер нового поколения</p>
          </div>

          <form class="auth-form" id="authForm">
            <div class="auth-mode-panel">
              <span>Режим данных</span>

              <div class="auth-mode-buttons">
                <button
                  class="auth-mode-button ${dataMode === DATA_MODES.LOCAL ? "active" : ""}"
                  type="button"
                  data-auth-data-mode="${DATA_MODES.LOCAL}"
                  title="Вход и регистрация через локальную базу браузера"
                >
                  LocalStorage
                </button>

                <button
                  class="auth-mode-button ${dataMode === DATA_MODES.BACKEND ? "active" : ""}"
                  type="button"
                  data-auth-data-mode="${DATA_MODES.BACKEND}"
                  title="Вход и регистрация через backend API"
                >
                  Backend
                </button>
              </div>
            </div>

            <p class="auth-mode-hint" id="authModeHint">
              ${this.getModeHint(dataMode, apiBaseUrl)}
            </p>

            <h2 id="authTitle">Вход</h2>

            <div class="form-group">
              <label>Имя пользователя</label>
              <input id="usernameInput" type="text" autocomplete="username" />
            </div>

            <div class="form-group">
              <label>Пароль</label>
              <input id="passwordInput" type="password" autocomplete="current-password" />
            </div>

            <p class="auth-error" id="authError"></p>

            <button class="auth-submit" type="submit" id="authSubmit">
              Войти
            </button>

            <button class="auth-switch" type="button" id="authSwitch">
              Нет аккаунта? Зарегистрироваться
            </button>
          </form>
        </section>
      </main>
    `);

    return this.element;
  }

  afterRender() {
    this.form = this.element.querySelector("#authForm");
    this.title = this.element.querySelector("#authTitle");
    this.usernameInput = this.element.querySelector("#usernameInput");
    this.passwordInput = this.element.querySelector("#passwordInput");
    this.errorElement = this.element.querySelector("#authError");
    this.submitButton = this.element.querySelector("#authSubmit");
    this.switchButton = this.element.querySelector("#authSwitch");
    this.modeHint = this.element.querySelector("#authModeHint");

    this.form.addEventListener("submit", (event) => this.handleSubmit(event));
    this.switchButton.addEventListener("click", () => this.toggleMode());

    this.element.querySelectorAll("[data-auth-data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        this.setDataMode(button.dataset.authDataMode);
      });
    });
  }

  getModeHint(mode, apiBaseUrl) {
    if (mode === DATA_MODES.BACKEND) {
      return `Backend API: ${apiBaseUrl}`;
    }

    return "Локальный режим: данные хранятся только в этом браузере.";
  }

  setDataMode(mode) {
    if (!this.dataMode) {
      return;
    }

    try {
      this.dataMode.setMode(mode);

      this.element.querySelectorAll("[data-auth-data-mode]").forEach((button) => {
        button.classList.toggle("active", button.dataset.authDataMode === mode);
      });

      if (this.modeHint) {
        this.modeHint.textContent = this.getModeHint(mode, this.dataMode.getApiBaseUrl());
      }

      this.errorElement.textContent = "";
    } catch (error) {
      this.errorElement.textContent = error.message;
    }
  }

  toggleMode() {
    this.mode = this.mode === "login" ? "register" : "login";

    this.errorElement.textContent = "";

    if (this.mode === "login") {
      this.title.textContent = "Вход";
      this.submitButton.textContent = "Войти";
      this.switchButton.textContent = "Нет аккаунта? Зарегистрироваться";
      this.passwordInput.setAttribute("autocomplete", "current-password");
    } else {
      this.title.textContent = "Регистрация";
      this.submitButton.textContent = "Создать аккаунт";
      this.switchButton.textContent = "Уже есть аккаунт? Войти";
      this.passwordInput.setAttribute("autocomplete", "new-password");
    }
  }

  setSubmitting(isSubmitting) {
    this.isSubmitting = isSubmitting;
    this.submitButton.disabled = isSubmitting;
    this.switchButton.disabled = isSubmitting;

    this.element.querySelectorAll("[data-auth-data-mode]").forEach((button) => {
      button.disabled = isSubmitting;
    });

    if (isSubmitting) {
      this.submitButton.textContent = this.mode === "login" ? "Входим..." : "Создаём...";
      return;
    }

    this.submitButton.textContent = this.mode === "login" ? "Войти" : "Создать аккаунт";
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (this.isSubmitting) {
      return;
    }

    const username = this.usernameInput.value;
    const password = this.passwordInput.value;

    this.errorElement.textContent = "";
    this.setSubmitting(true);

    try {
      if (this.mode === "login") {
        await this.authService.login(username, password);
      } else {
        await this.authService.register(username, password);
      }

      this.eventBus.emit("auth:login");
    } catch (error) {
      this.errorElement.textContent = error.message;
    } finally {
      this.setSubmitting(false);
    }
  }
}