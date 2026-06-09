import { Modal } from "./Modal.js";
import { escapeHTML, formatFileSize } from "../utils/helpers.js";

export class ImageViewerModal {
  constructor({ attachment }) {
    this.attachment = attachment;
  }

  open() {
    const modal = new Modal({
      title: "Просмотр изображения",
      confirmText: "Закрыть",
      content: `
        <div class="image-viewer">
          <img 
            src="${this.attachment.dataUrl}" 
            alt="${escapeHTML(this.attachment.name)}" 
          />

          <div class="image-viewer-meta">
            <strong>${escapeHTML(this.attachment.name)}</strong>
            <span>${formatFileSize(this.attachment.size)}</span>
          </div>
        </div>
      `,
      onConfirm: () => {
        modal.close();
      }
    });

    modal.open();
  }
}