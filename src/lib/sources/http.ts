import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export const corsFetch = tauriFetch as typeof globalThis.fetch;
