import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import i18n from "../i18n";
import { convertTimeToHoursMinutes } from "./time";
import { getSettings } from "./settings";
import { getTextIntensity } from "./transform";

const notificationsEnabled = () => getSettings().notifications;

export const initNotifications = async (): Promise<void> => {
  if (!notificationsEnabled()) return;
  if (!(await isPermissionGranted())) {
    await requestPermission();
  }
};

export const notify = async (
  intensity: number,
  intensityType: string,
  type: string,
  mag: number,
  depth: number,
  time: number,
  location: string
): Promise<void> => {
  if (!notificationsEnabled()) return;
  if (!(await isPermissionGranted())) return;

  const textIntensity = getTextIntensity(intensity, intensityType);
  const body = i18n.t("notification", { intensity: textIntensity, mag, depth, time: convertTimeToHoursMinutes(time) });

  sendNotification({ title: `${type} - ${location}`, body });
};
