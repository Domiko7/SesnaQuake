import i18n from "../i18n.ts";
import { convertTimeToHoursMinutes } from "./time.ts";

export const initNotificationButton = () => {
  const bellButton = document.createElement("button");
  bellButton.id = "notification-button";
  bellButton.innerHTML = '<img src="bell-line-icon.svg" alt="bell" id="bell">';
  document.body.appendChild(bellButton);
};

export const notify = (intensity: string, type: string, mag: number, depth: number, time: string, location: string) => {
  const img = `../../shindo_${intensity}.png`;
  const text = i18n.t("notification", { intensity: intensity, mag: mag, depth: depth, time: convertTimeToHoursMinutes(time) });
  const notification = new Notification(`${type} - ${location}`, { body: text, icon: img })
  console.log(text);
};
