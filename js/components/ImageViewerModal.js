export class ImageViewerModal {
  constructor({ attachment }) {
    this.attachment = attachment;
    this.element = null;
    this.handleEscClose = this.handleEscClose.bind(this);
  }

  open() {
    this.element = document.createElement("div");
    this.element.className = "image-viewer-backdrop";

    this.element.innerHTML = `
      <div class="image-viewer-panel">
        <div class="image-viewer-frame">
          <img
            class="image-viewer-full-image"
            src="${this.attachment.dataUrl}"
            alt="Изображение"
          />
        </div>
      </div>
    `;

    document.body.appendChild(this.element);

    this.element.addEventListener("click", (event) => {
      if (event.target === this.element) {
        this.close();
      }
    });

    document.addEventListener("keydown", this.handleEscClose);
  }

  handleEscClose(event) {
    if (event.key === "Escape") {
      this.close();
    }
  }

  close() {
    document.removeEventListener("keydown", this.handleEscClose);

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}