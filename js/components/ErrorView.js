import { Component } from "./Component.js";

export class ErrorView extends Component {
  constructor({ error, onReload, onReset }) {
    super();

    this.error = error;
    this.onReload = onReload;
    this.onReset = onReset;
  }

  render() {
    const message = this.error?.message || "Неизвестная ошибка";

    this.element = this.createElement(`
      <main class="error-page">
        <section class="error-card">
          <div class="error-icon">⚠️</div>

          <h1>BobMess не смог загрузиться</h1>

          <p>
            Произошла ошибка при запуске приложения. Это может быть связано
            с повреждённой базой localStorage или неправильными данными после обновления проекта.
          </p>

          <div class="error-message">
            ${message}
          </div>

          <div class="error-actions">
            <button class="primary-button" id="reloadAppButton">
              Перезагрузить
            </button>

            <button class="danger-button" id="resetAppButton">
              Сбросить данные
            </button>
          </div>

          <span class="error-note">
            Сброс удалит аккаунты, серверы, сообщения и настройки только в этом браузере.
          </span>
        </section>
      </main>
    `);

    return this.element;
  }

  afterRender() {
    this.element.querySelector("#reloadAppButton").addEventListener("click", () => {
      this.onReload();
    });

    this.element.querySelector("#resetAppButton").addEventListener("click", () => {
      this.onReset();
    });
  }
}