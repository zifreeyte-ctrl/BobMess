export const DATA_MODES = {
  LOCAL: "localStorage",
  BACKEND: "backend"
};

const DATA_MODE_KEY = "bob_data_mode";
const API_BASE_URL_KEY = "bob_api_base_url";
const API_TOKEN_KEY = "bob_api_token";
const DEFAULT_API_BASE_URL = "http://localhost:4000/api";

export class DataMode {
  constructor({ storage } = {}) {
    this.storage = storage || null;
  }

  getMode() {
    const mode = localStorage.getItem(DATA_MODE_KEY) || DATA_MODES.LOCAL;

    if (!Object.values(DATA_MODES).includes(mode)) {
      return DATA_MODES.LOCAL;
    }

    return mode;
  }

  setMode(mode) {
    if (!Object.values(DATA_MODES).includes(mode)) {
      throw new Error("Неизвестный режим данных BobMess.");
    }

    localStorage.setItem(DATA_MODE_KEY, mode);
    this.syncStorageMeta();

    return mode;
  }

  isBackendMode() {
    return this.getMode() === DATA_MODES.BACKEND;
  }

  getApiBaseUrl() {
    return localStorage.getItem(API_BASE_URL_KEY) || DEFAULT_API_BASE_URL;
  }

  setApiBaseUrl(baseUrl) {
    const cleanUrl = String(baseUrl || "").trim().replace(/\/+$/, "");

    if (!cleanUrl) {
      throw new Error("Укажи backend API URL.");
    }

    localStorage.setItem(API_BASE_URL_KEY, cleanUrl);
    this.syncStorageMeta();

    return cleanUrl;
  }

  getToken() {
    return localStorage.getItem(API_TOKEN_KEY) || "";
  }

  setToken(token) {
    const cleanToken = String(token || "").trim();

    if (!cleanToken) {
      this.clearToken();
      return "";
    }

    localStorage.setItem(API_TOKEN_KEY, cleanToken);
    return cleanToken;
  }

  clearToken() {
    localStorage.removeItem(API_TOKEN_KEY);
  }

  getPublicState() {
    const token = this.getToken();

    return {
      mode: this.getMode(),
      apiBaseUrl: this.getApiBaseUrl(),
      hasToken: Boolean(token),
      tokenPreview: token ? `${token.slice(0, 12)}...${token.slice(-8)}` : ""
    };
  }

  syncStorageMeta() {
    if (!this.storage || typeof this.storage.update !== "function") {
      return;
    }

    this.storage.update((database) => {
      if (!database.meta) {
        database.meta = {};
      }

      database.meta.storageMode = this.getMode();
      database.meta.apiBaseUrl = this.getApiBaseUrl();
      database.meta.backendReady = true;
      database.meta.updatedAt = new Date().toISOString();
    });
  }
}