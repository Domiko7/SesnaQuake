import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "../runtime";

export const corsFetch: typeof globalThis.fetch = (input, init) =>
  isTauri() ? (tauriFetch as typeof globalThis.fetch)(input, init) : globalThis.fetch(input, init);
