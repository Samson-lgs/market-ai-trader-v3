// Runtime configuration for the browser frontend.
// Keep provider API keys out of this file. Only public backend URLs belong here.
// Leave MARKET_API_BASE_URL empty to use same-origin Netlify functions.
// For a GitHub Pages frontend, set this to the deployed Netlify site's origin,
// for example: https://your-site.netlify.app/.netlify/functions
export const MARKET_API_BASE_URL = globalThis.MARKET_API_BASE_URL || '';
export const CALENDAR_API_BASE_URL = globalThis.CALENDAR_API_BASE_URL || MARKET_API_BASE_URL;
