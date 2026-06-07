export class Router {
  constructor(rootElement) {
    this.root = rootElement;
    this.currentView = null;
  }

  render(view) {
    if (this.currentView) {
      this.currentView.destroy();
    }

    this.currentView = view;
    this.root.innerHTML = "";
    this.root.appendChild(view.render());
    view.afterRender();
  }
}