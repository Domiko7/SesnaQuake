import type { FeatureCollection } from "geojson";

const cache = new Map<string, Promise<FeatureCollection>>();

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 8000;

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const fetchOnce = async (url: string, attempt = 1): Promise<FeatureCollection> => {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    return await res.json() as FeatureCollection;
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      console.warn(`[geojsonCache] attempt ${attempt} failed for ${url}, retrying:`, err);
      return fetchOnce(url, attempt + 1);
    }
    throw err;
  }
};

export const fetchGeojson = (url: string): Promise<FeatureCollection> => {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetchOnce(url).catch((err) => {
      cache.delete(url);
      throw err;
    });
    cache.set(url, pending);
  }
  return pending;
};
