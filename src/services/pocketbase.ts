import PocketBase, { BaseAuthStore, type AuthRecord } from 'pocketbase';

// Cookie-based auth store so auth survives page refreshes securely
// without exposing the token in localStorage (XSS accessible).
// The cookie is set as Secure + SameSite=Strict where possible.
class CookieAuthStore extends BaseAuthStore {
  private readonly cookieName = 'pb_auth';

  constructor() {
    super();
    this._loadFromCookie();
  }

  private _cookieOpts(): string {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    return `path=/; SameSite=Strict${secure}`;
  }

  private _loadFromCookie() {
    try {
      const raw = document.cookie
        .split('; ')
        .find(r => r.startsWith(`${this.cookieName}=`))
        ?.split('=')
        .slice(1)
        .join('=');
      if (!raw) return;
      const data = JSON.parse(decodeURIComponent(raw));
      this.save(data.token ?? '', data.model ?? undefined);
    } catch {
      // ignore invalid cookie
    }
  }

  override save(token: string, record?: AuthRecord) {
    super.save(token, record);
    try {
      const payload = encodeURIComponent(JSON.stringify({ token, model: record }));
      document.cookie = `${this.cookieName}=${payload}; ${this._cookieOpts()}`;
    } catch {
      // ignore serialisation errors
    }
  }

  override clear() {
    super.clear();
    // Expire the cookie immediately
    document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${this._cookieOpts()}`;
  }
}

// In production (Docker), use relative URL so nginx proxies to PocketBase.
// In dev, use the env variable.
const pbUrl = import.meta.env.VITE_POCKETBASE_URL ?? '';
export const pb = new PocketBase(pbUrl, new CookieAuthStore());
export default pb;
