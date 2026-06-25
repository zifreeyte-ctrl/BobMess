export class ApiClient {
  constructor({ baseUrl = "http://localhost:4000/api", getToken = null, onUnauthorized = null } = {}) {
    this.baseUrl = this.normalizeBaseUrl(baseUrl);
    this.getToken = getToken;
    this.onUnauthorized = onUnauthorized;
  }

  normalizeBaseUrl(baseUrl) {
    const cleanUrl = String(baseUrl || "").trim();

    if (!cleanUrl) {
      return "http://localhost:4000/api";
    }

    return cleanUrl.replace(/\/+$/, "");
  }

  setBaseUrl(baseUrl) {
    this.baseUrl = this.normalizeBaseUrl(baseUrl);
  }

  buildUrl(path) {
    const cleanPath = String(path || "").startsWith("/")
      ? String(path)
      : `/${path}`;

    return `${this.baseUrl}${cleanPath}`;
  }

  async request(path, options = {}) {
    const token = typeof this.getToken === "function" ? this.getToken() : null;
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;

    if (hasBody && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response;

    try {
      response = await fetch(this.buildUrl(path), {
        ...options,
        headers,
        body:
          hasBody && headers.get("Content-Type") === "application/json" && typeof options.body !== "string"
            ? JSON.stringify(options.body)
            : options.body
      });
    } catch (error) {
      const networkError = new Error(
        "Backend недоступен. Проверь, что API запущен на http://localhost:4000 и что CORS разрешает текущий адрес frontend."
      );

      networkError.originalError = error;
      throw networkError;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = isJson && data?.message
        ? data.message
        : `Ошибка backend: ${response.status}`;

      const error = new Error(message);
      error.status = response.status;
      error.data = data;

      if (response.status === 401 && typeof this.onUnauthorized === "function") {
        this.onUnauthorized(error);
      }

      throw error;
    }

    return data;
  }

  get(path, options = {}) {
    return this.request(path, {
      ...options,
      method: "GET"
    });
  }

  post(path, body, options = {}) {
    return this.request(path, {
      ...options,
      method: "POST",
      body
    });
  }

  patch(path, body, options = {}) {
    return this.request(path, {
      ...options,
      method: "PATCH",
      body
    });
  }

  delete(path, options = {}) {
    return this.request(path, {
      ...options,
      method: "DELETE"
    });
  }

  health() {
    return this.get("/health");
  }

  register({ username, password }) {
    return this.post("/auth/register", {
      username,
      password
    });
  }

  login({ username, password }) {
    return this.post("/auth/login", {
      username,
      password
    });
  }

  checkToken() {
    return this.get("/auth/check");
  }

  getMe() {
    return this.get("/users/me");
  }

  updateMe(profile) {
    return this.patch("/users/me", profile);
  }

    getServers() {
    return this.get("/servers");
  }

  getServer(serverId) {
    return this.get(`/servers/${serverId}`);
  }

  createServer(payload) {
    return this.post("/servers", payload);
  }

  updateServer(serverId, payload) {
    return this.patch(`/servers/${serverId}`, payload);
  }

  deleteServer(serverId) {
    return this.delete(`/servers/${serverId}`);
  }

  createChannel(serverId, payload) {
    return this.post(`/servers/${serverId}/channels`, payload);
  }

  updateChannel(serverId, channelId, payload) {
    return this.patch(`/servers/${serverId}/channels/${channelId}`, payload);
  }

  deleteChannel(serverId, channelId) {
    return this.delete(`/servers/${serverId}/channels/${channelId}`);
  }
}