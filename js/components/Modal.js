import { Component } from "./Component.js";

export class Modal extends Component {
  constructor({ title, content, confirmText = "Сохранить", onConfirm, onCancel }) {
    super();

    this.title = title;
    this.content = content;
    this.confirmText = confirmText;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  render() {
    this.element = this.createElement(`
      <div class="modal-backdrop">
        <div class="modal">
          <header class="modal-header">
            <h2>${this.title}</h2>
            <button id="modalCloseButton">×</button>
          </header>

          <div class="modal-content">
            ${this.content}
          </div>

          <footer class="modal-footer">
            <button class="modal-cancel" id="modalCancelButton">
              Отмена
            </button>

            <button class="modal-confirm" id="modalConfirmButton">
              ${this.confirmText}
            </button>
          </footer>
        </div>
      </div>
    `);

    return this.element;
  }

  afterRender() {
    this.element
      .querySelector("#modalCloseButton")
      .addEventListener("click", () => this.close());

    this.element
      .querySelector("#modalCancelButton")
      .addEventListener("click", () => this.close());

    this.element
      .querySelector("#modalConfirmButton")
      .addEventListener("click", () => {
        if (this.onConfirm) {
          this.onConfirm(this.element);
        }
      });

    this.element.addEventListener("click", (event) => {
      if (event.target === this.element) {
        this.close();
      }
    });
  }

  open() {
    document.body.appendChild(this.render());
    this.afterRender();
  }

  close() {
    this.destroy();

    if (this.onCancel) {
      this.onCancel();
    }
  }
}