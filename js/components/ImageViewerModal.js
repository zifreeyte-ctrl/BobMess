import { ContextMenu } from "./ContextMenu.js";

export class ImageViewerModal {
  constructor({ attachment, messageId = null, onGoToMessage = null }) {
    this.attachment = attachment;
    this.messageId = messageId;
    this.onGoToMessage = onGoToMessage;

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

          <button
            class="image-viewer-options"
            type="button"
            title="Действия с изображением"
          >
            ⋯
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);

    const optionsButton = this.element.querySelector(".image-viewer-options");

    if (optionsButton) {
      optionsButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        this.openImageMenu(event.clientX, event.clientY);
      });
    }

    this.element.addEventListener("click", (event) => {
      if (event.target === this.element) {
        this.close();
      }
    });

    document.addEventListener("keydown", this.handleEscClose);
  }

  openImageMenu(x, y) {
    const items = [
      {
        label: "Скачать",
        icon: "⬇",
        onClick: () => this.downloadImage()
      },
      {
        label: "Открыть в браузере",
        icon: "↗",
        onClick: () => this.openInBrowser()
      },
      {
        label: "Поделиться",
        icon: "⤴",
        onClick: () => this.shareImage()
      }
    ];

    if (this.messageId && this.onGoToMessage) {
      items.push({
        label: "Перейти к сообщению",
        icon: "➜",
        onClick: () => {
          this.close();
          this.onGoToMessage(this.messageId);
        }
      });
    }

    ContextMenu.show({
      x,
      y,
      items
    });
  }

  downloadImage() {
    const link = document.createElement("a");

    link.href = this.attachment.dataUrl;
    link.download = this.attachment.name || `bobmess-image-${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  openInBrowser() {
    const tab = window.open();

    if (!tab) {
      return;
    }

    tab.document.write(`
      <title>BobMess Image</title>
      <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
        <img
          src="${this.attachment.dataUrl}"
          style="max-width:100vw;max-height:100vh;object-fit:contain;"
          alt="Изображение"
        />
      </body>
    `);

    tab.document.close();
  }

  async shareImage() {
    if (!navigator.share) {
      await navigator.clipboard.writeText(this.attachment.dataUrl);
      return;
    }

    try {
      await navigator.share({
        title: "Изображение из BobMess",
        text: "Изображение из BobMess",
        url: this.attachment.dataUrl
      });
    } catch (error) {
      // Пользователь мог просто закрыть окно шаринга.
    }
  }

  handleEscClose(event) {
    if (event.key === "Escape") {
      this.close();
    }
  }

  close() {
    document.removeEventListener("keydown", this.handleEscClose);
    ContextMenu.close();

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}