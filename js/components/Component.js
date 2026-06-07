export class Component {
  constructor(props = {}) {
    this.props = props;
    this.element = null;
  }

  createElement(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();

    return template.content.firstElementChild;
  }

  render() {
    throw new Error("Метод render() должен быть реализован.");
  }

  afterRender() {}

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}