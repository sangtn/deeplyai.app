// Optional services. Each feature that needs them is hidden while its value is empty, so the static
// site works on its own. Set at build time, e.g. in the deploy workflow or a .env file:
//   PUBLIC_LICH_API=https://lich-api.<account>.workers.dev      (services/lich-worker)
//   PUBLIC_CLOUDKIT_TOKEN=<CloudKit web API token>              (iCloud read-only connector)
export const LICH_API = (import.meta.env.PUBLIC_LICH_API ?? '').replace(/\/$/, '');
export const CLOUDKIT_CONTAINER = 'iCloud.com.deeplyai.LichViet';
export const CLOUDKIT_TOKEN = import.meta.env.PUBLIC_CLOUDKIT_TOKEN ?? '';
export const CLOUDKIT_ENV = (import.meta.env.PUBLIC_CLOUDKIT_ENV ?? 'production') as 'production' | 'development';
