import { Modal } from "./Modal.js";
import { Toast } from "./Toast.js";

export class DevToolsModal {
  constructor({ storage, onReset }) {
    this.storage = storage;
    this.onReset = onReset;
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

          <button class="settings-action" id="exportDatabaseButton">
            Экспортировать базу
          </button>

          <div class="form-group">
            <label>Импорт базы JSON</label>
            <textarea id="importDatabaseInput" class="devtools-textarea" placeholder="Вставь JSON базы сюда"></textarea>
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
          Toast.show("База скопирована в буфер обмена.");
        } catch (error) {
          console.log(json);
          Toast.show("База выведена в Console.");
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