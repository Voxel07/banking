import PocketBase from 'pocketbase';

// In production (Docker), use relative URL so nginx proxies to PocketBase.
// In dev, use the env variable.
const pbUrl = import.meta.env.VITE_POCKETBASE_URL ?? '';
export const pb = new PocketBase(pbUrl);
export default pb;
