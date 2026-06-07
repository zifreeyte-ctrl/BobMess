import { Component } from "./Component.js";

export class AuthView extends Component {
  constructor({ authService, eventBus }) {
    super();

    this.authService = authService;
    this.eventBus = eventBus;
    this.mode = "login";
  }

  render() {
    this.element = this.createElement(`
      <main class="auth-page">
        <section class="auth-card">
          <div class="auth-brand">
            <div class="auth-logo">B</div>
            <h1>BOB</h1>
            <p>Красный мессенджер нового поколения</p>
          </div>

          <form class="auth-form" id="authForm">
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

    this.form.addEventListener("submit", (event) => this.handleSubmit(event));
    this.switchButton.addEventListener("click", () => this.toggleMode());
  }

  toggleMode() {
    this.mode = this.mode === "login" ? "register" : "login";

    this.errorElement.textContent = "";

    if (this.mode === "login") {
      this.title.textContent = "Вход";
      this.submitButton.textContent = "Войти";
      this.switchButton.textContent = "Нет аккаунта? Зарегистрироваться";
    } else {
      this.title.textContent = "Регистрация";
      this.submitButton.textContent = "Создать аккаунт";
      this.switchButton.textContent = "Уже есть аккаунт? Войти";
    }
  }

  handleSubmit(event) {
    event.preventDefault();

    const username = this.usernameInput.value;
    const password = this.passwordInput.value;

    try {
      if (this.mode === "login") {
        this.authService.login(username, password);
      } else {
        this.authService.register(username, password);
      }

      this.eventBus.emit("auth:login");
    } catch (error) {
      this.errorElement.textContent = error.message;
    }
  }
}