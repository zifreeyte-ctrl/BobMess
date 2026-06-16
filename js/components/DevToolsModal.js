import { Modal } from "./Modal.js";
import { Toast } from "./Toast.js";

export class DevToolsModal {
  constructor({ storage, onReset }) {
    this.storage = storage;
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

  open() {
    const modal = new Modal({
      title: "Инструменты разработчика",
      confirmText: "Закрыть",
      content: `
        <div class="devtools-panel">
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
              Проект всё ещё работает без backend, но структура базы теперь описана как набор коллекций.
              Позже можно заменить только <code>Storage</code> на REST/Firebase/Supabase-адаптер,
              не переписывая весь интерфейс.
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