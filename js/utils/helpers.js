export function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getCurrentDate() {
  return new Date().toISOString();
}

export function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
export function isImageAvatar(avatar) {
  return typeof avatar === "string" && avatar.startsWith("data:image/");
}

export function renderAvatar(avatar, fallback = "?") {
  if (isImageAvatar(avatar)) {
    return `<img src="${avatar}" alt="avatar" />`;
  }

  return escapeHTML(avatar || fallback);
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));

    reader.readAsDataURL(file);
  });
}
export function createImageAttachment(file, dataUrl) {
  return {
    id: generateId("attachment"),
    type: "image",
    name: file.name,
    size: file.size,
    mimeType: file.type,
    dataUrl
  };
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "0 KB";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}