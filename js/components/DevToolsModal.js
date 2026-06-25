import { Modal } from "./Modal.js";
import { Toast } from "./Toast.js";
import { DATA_MODES } from "../core/DataMode.js";

export class DevToolsModal {
  constructor({ storage, dataMode, apiClient, onReset }) {
    this.storage = storage;
    this.dataMode = dataMode;
    this.apiClient = apiClient;
    this.onReset = onReset;
  }

  renderBackendMap() {
    const backendMap = this.storage.getBackendMap();

    return Object.entries(backendMap)
      .map(([collectionName, config]) => {
        return `
          <div class="backend-map-row">
            <div>
              <strong>${collectionName}</strong>
              <span>${config.description}</span>
            </div>

            <code>${config.endpoint}</code>
          </div>
        `;
      })
      .join("");
  }

  renderDataModeSection() {
    if (!this.dataMode) {
      return "";
    }

    const state = this.dataMode.getPublicState();

    return `
      <div class="settings-row">
        <strong>Режим данных</strong>
        <p class="muted-text">
          Сейчас frontend по-прежнему работает через localStorage. Backend-режим подготовлен безопасно:
          его можно включить для тестов API, не ломая текущие сообщения, серверы и ЛС.
        </p>
      </div>

      <div class="settings-theme-grid">
        <button
          class="settings-theme-card ${state.mode === DATA_MODES.LOCAL ? "active" : ""}"
          type="button"
          data-data-mode="${DATA_MODES.LOCAL}"
        >
          <strong>LocalStorage</strong>
          <small>Текущий стабильный режим</small>
        </button>

        <button
          class="settings-theme-card ${state.mode === DATA_MODES.BACKEND ? "active" : ""}"
          type="button"
          data-data-mode="${DATA_MODES.BACKEND}"
        >
          <strong>Backend</strong>
          <small>Подготовка REST API</small>
        </button>
      </div>

      <div class="form-group">
        <label>Backend API URL</label>
        <input
          id="backendApiBaseUrlInput"
          type="text"
          value="${state.apiBaseUrl}"
          placeholder="http://localhost:4000/api"
        />
      </div>

      <div class="devtools-button-grid">
        <button class="settings-action" id="saveBackendApiUrlButton" type="button">
          Сохранить API URL
        </button>

        <button class="settings-action" id="testBackendConnectionButton" type="button">
          Проверить backend
        </button>

        <button class="settings-action" id="checkBackendTokenButton" type="button">
          Проверить JWT
        </button>

        <button class="settings-action danger" id="clearBackendTokenButton" type="button">
          Очистить JWT
        </button>
      </div>

      <div class="backend-ready-box">
        <strong>JWT</strong>
        <p>
          ${state.hasToken ? `Токен сохранён: <code>${state.tokenPreview}</code>` : "JWT пока не сохранён во frontend."}
        </p>
      </div>
    `;
  }

  open() {
    const modal = new Modal({
      title: "Инструменты разработчика",
      confirmText: "Закрыть",
      content: `
        <div class="devtools-panel">
          ${this.renderDataModeSection()}

          <div class="settings-row">
            <strong>LocalStorage database</strong>
            <p class="muted-text">
              Здесь можно экспортировать, импортировать или полностью сбросить локальную базу BobMess.
            </p>
          </div>

          <div class="devtools-button-grid">
            <button class="settings-action" id="exportDatabaseButton">
              Экспортировать backend snapshot
            </button>

            <button class="settings-action" id="copyBackendPlanButton">
              Скопировать backend-план
            </button>
          </div>

          <div class="backend-ready-box">
            <strong>Подготовка под backend</strong>
            <p>
              Backend MVP уже отделён от frontend. Следующий безопасный шаг — подключать авторизацию
              через <code>ApiClient</code>, оставляя fallback на localStorage, пока API не покроет все функции.
            </p>
          </div>

          <div class="backend-map">
            ${this.renderBackendMap()}
          </div>

          <div class="form-group">
            <label>Импорт базы JSON</label>
            <textarea
              id="importDatabaseInput"
              class="devtools-textarea"
              placeholder="Вставь JSON базы или backend snapshot сюда"
            ></textarea>
          </div>

          <button class="settings-action" id="importDatabaseButton">
            Импортировать базу
          </button>

          <button class="settings-action danger" id="resetDatabaseButton">
            Полностью сбросить проект
          </button>
        </div>
      `,
      onConfirm: () => {
        modal.close();
      }
    });

    modal.open();

    this.bindDataModeEvents(modal);
    this.bindDatabaseEvents(modal);
  }

  bindDataModeEvents(modal) {
    if (!this.dataMode) {
      return;
    }

    modal.element.querySelectorAll("[data-data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.dataMode;

        try {
          this.dataMode.setMode(mode);

          modal.element.querySelectorAll("[data-data-mode]").forEach((item) => {
            item.classList.toggle("active", item.dataset.dataMode === mode);
          });

          Toast.show(
            mode === DATA_MODES.BACKEND
              ? "Backend-режим выбран для тестов API. LocalStorage пока не отключён."
              : "LocalStorage-режим снова выбран."
          );
        } catch (error) {
          Toast.show(error.message, "error");
        }
      });
    });

    const apiBaseUrlInput = modal.element.querySelector("#backendApiBaseUrlInput");
    const saveApiUrlButton = modal.element.querySelector("#saveBackendApiUrlButton");
    const testBackendButton = modal.element.querySelector("#testBackendConnectionButton");
    const checkTokenButton = modal.element.querySelector("#checkBackendTokenButton");
    const clearTokenButton = modal.element.querySelector("#clearBackendTokenButton");

    if (saveApiUrlButton && apiBaseUrlInput) {
      saveApiUrlButton.addEventListener("click", () => {
        try {
          const apiBaseUrl = this.dataMode.setApiBaseUrl(apiBaseUrlInput.value);

          if (this.apiClient) {
            this.apiClient.setBaseUrl(apiBaseUrl);
          }

          Toast.show("Backend API URL сохранён.");
        } catch (error) {
          Toast.show(error.message, "error");
        }
      });
    }

    if (testBackendButton && this.apiClient) {
      testBackendButton.addEventListener("click", async () => {
        try {
          if (apiBaseUrlInput) {
            const apiBaseUrl = this.dataMode.setApiBaseUrl(apiBaseUrlInput.value);
            this.apiClient.setBaseUrl(apiBaseUrl);
          }

          await this.apiClient.health();
          Toast.show("Backend отвечает. PostgreSQL подключён.");
        } catch (error) {
          Toast.show(error.message || "Backend недоступен.", "error");
        }
      });
    }

    if (checkTokenButton && this.apiClient) {
      checkTokenButton.addEventListener("click", async () => {
        try {
          await this.apiClient.checkToken();
          Toast.show("JWT действителен.");
        } catch (error) {
          Toast.show(error.message || "JWT не прошёл проверку.", "error");
        }
      });
    }

    if (clearTokenButton) {
      clearTokenButton.addEventListener("click", () => {
        this.dataMode.clearToken();
        Toast.show("JWT очищен во frontend.");
      });
    }
  }

  bindDatabaseEvents(modal) {
    modal.element
      .querySelector("#exportDatabaseButton")
      .addEventListener("click", async () => {
        const json = this.storage.export();

        try {
          await navigator.clipboard.writeText(json);
          Toast.show("Backend snapshot скопирован в буфер обмена.");
        } catch (error) {
          console.log(json);
          Toast.show("Backend snapshot выведен в Console.");
        }
      });

    modal.element
      .querySelector("#copyBackendPlanButton")
      .addEventListener("click", async () => {
        const json = JSON.stringify(this.storage.getBackendPlan(), null, 2);

        try {
          await navigator.clipboard.writeText(json);
          Toast.show("Backend-план скопирован.");
        } catch (error) {
          console.log(json);
          Toast.show("Backend-план выведен в Console.");
        }
      });

    modal.element
      .querySelector("#importDatabaseButton")
      .addEventListener("click", () => {
        const textarea = modal.element.querySelector("#importDatabaseInput");
        const json = textarea.value.trim();

        if (!json) {
          Toast.show("Вставь JSON базы.", "error");
          return;
        }

        try {
          this.storage.import(json);
          Toast.show("База импортирована. Страница будет перезагружена.");

          setTimeout(() => {
            window.location.reload();
          }, 800);
        } catch (error) {
          Toast.show("Некорректный JSON.", "error");
        }
      });

    modal.element
      .querySelector("#resetDatabaseButton")
      .addEventListener("click", () => {
        const confirmed = confirm("Точно сбросить всю локальную базу BobMess?");

        if (!confirmed) {
          return;
        }

        this.storage.clear();

        Toast.show("База сброшена. Страница будет перезагружена.");

        setTimeout(() => {
          window.location.reload();
        }, 800);

        if (this.onReset) {
          this.onReset();
        }
      });
  }
}