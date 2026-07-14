import { getVersion } from "@tauri-apps/api/app";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { corsFetch } from "./sources/http";
import { useAppStore } from "../store";
import i18n from "../i18n";

const parseVersion = (v: string): number[] => v.replace(/^v/i, "").trim().split(".").map((n) => Number(n) || 0);

const isNewer = (latest: number[], current: number[]): boolean => {
  for (let i = 0; i < Math.max(latest.length, current.length); i++) {
    const l = latest[i] ?? 0;
    const c = current[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export const checkForUpdate = async (): Promise<void> => {
  try {
    const currentVersion = await getVersion().catch(() => __APP_VERSION__);

    const response = await corsFetch("https://api.github.com/repos/Domiko7/SesnaQuake/releases/latest");
    if (!response.ok) throw new Error(`GitHub releases check returned ${response.status}`);
    const data = await response.json() as { tag_name?: string };
    const latestVersion = data.tag_name?.replace(/^v/i, "") ?? null;
    if (!latestVersion) return;

    const outdated = isNewer(parseVersion(latestVersion), parseVersion(currentVersion));
    useAppStore.getState().setUpdateStatus(outdated, latestVersion);

    if (outdated) {
      if (!(await isPermissionGranted())) await requestPermission();
      if (await isPermissionGranted()) {
        sendNotification({
          title: "SesnaQuake",
          body: i18n.t("updateAvailable", { version: latestVersion }),
        });
      }
    }
  } catch (err) {
    console.error("Update check failed:", err);
  }
};
