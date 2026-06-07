export class ThemeService {
  constructor(storage) {
    this.storage = storage;
  }

  applySavedTheme() {
    const settings = this.storage.get("settings");

    document.body.dataset.theme = settings.theme;
  }

  toggleTheme() {
    const settings = this.storage.get("settings");

    const nextTheme = settings.theme === "dark" ? "light" : "dark";

    this.storage.update((database) => {
      database.settings.theme = nextTheme;
    });

    document.body.dataset.theme = nextTheme;

    return nextTheme;
  }

  getTheme() {
    return this.storage.get("settings").theme;
  }
}