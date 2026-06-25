export class ContextMenu {
  static currentMenu = null;

  static show({ x, y, items }) {
    ContextMenu.close();

    const menu = document.createElement("div");
    menu.className = "context-menu";

    menu.innerHTML = items
      .map((item, index) => {
        return `
          <button 
            class="context-menu-item ${item.danger ? "danger" : ""}" 
            data-index="${index}"
          >
            <span>${item.icon || ""}</span>
            ${item.label}
          </button>
        `;
      })
      .join("");

    document.body.appendChild(menu);

    const rect = menu.getBoundingClientRect();

    let finalX = x;
    let finalY = y;

    if (x + rect.width > window.innerWidth) {
      finalX = window.innerWidth - rect.width - 12;
    }

    if (y + rect.height > window.innerHeight) {
      finalY = window.innerHeight - rect.height - 12;
    }

    menu.style.left = `${finalX}px`;
    menu.style.top = `${finalY}px`;

    menu.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items[Number(button.dataset.index)];

        ContextMenu.close();

        if (item.onClick) {
          item.onClick();
        }
      });
    });

    ContextMenu.currentMenu = menu;

    setTimeout(() => {
      document.addEventListener("click", ContextMenu.close);
      document.addEventListener("scroll", ContextMenu.close, true);
    }, 0);
  }

  static close = () => {
    if (ContextMenu.currentMenu) {
      ContextMenu.currentMenu.remove();
      ContextMenu.currentMenu = null;
    }

    document.removeEventListener("click", ContextMenu.close);
    document.removeEventListener("scroll", ContextMenu.close, true);
  };
}