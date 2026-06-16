export class Router {
  constructor(root) {
    this.root = root;
    this.currentView = null;
  }

  render(view) {
    try {
      this.currentView = view;

      this.root.innerHTML = "";
      this.root.append(view.render());

      if (typeof view.afterRender === "function") {
        view.afterRender();
      }
    } catch (error) {
      console.error("Render error:", error);

      this.root.innerHTML = `
        <main class="error-page">
          <section class="error-card">
            <div class="error-icon">⚠️</div>

            <h1>Ошибка интерфейса</h1>

            <p>
              Один из компонентов BobMess не смог отрисоваться.
              Попробуй перезагрузить страницу.
            </p>

            <div class="error-message">
              ${error.message || "Неизвестная ошибка"}
            </div>

            <div class="error-actions">
              <button class="primary-button" id="routerReloadButton">
                Перезагрузить
              </button>

              <button class="danger-button" id="routerResetButton">
                Сбросить localStorage
              </button>
            </div>
          </section>
        </main>
      `;

      this.root.querySelector("#routerReloadButton").addEventListener("click", () => {
        window.location.reload();
      });

      this.root.querySelector("#routerResetButton").addEventListener("click", () => {
        const confirmed = confirm(
          "Точно удалить локальные данные BobMess?"
        );

        if (!confirmed) {
          return;
        }

        localStorage.removeItem("bob_database");
        window.location.reload();
      });
    }
  }
}