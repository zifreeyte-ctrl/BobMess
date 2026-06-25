export class InviteLinkService {
  getInviteCodeFromUrl() {
    const hash = window.location.hash;

    if (!hash.startsWith("#invite=")) {
      return null;
    }

    return decodeURIComponent(hash.replace("#invite=", "").trim());
  }

  createInviteLink(inviteCode) {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;

    return `${baseUrl}#invite=${encodeURIComponent(inviteCode)}`;
  }

  clearInviteFromUrl() {
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;

    window.history.replaceState({}, document.title, cleanUrl);
  }

  async copyToClipboard(text) {
    if (!navigator.clipboard) {
      throw new Error("Копирование не поддерживается этим браузером.");
    }

    await navigator.clipboard.writeText(text);
  }
}