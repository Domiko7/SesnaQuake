import { getSettings } from "./settings";

const resolveTimeZone = (): string | undefined => {
  const tz = getSettings().timezone;
  return tz === "system" ? undefined : tz;
};

export const convertTimeToHoursMinutes = (time: string | number) => {
  const date = new Date(time);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: resolveTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
};

export const timestampToTime = (time: number) => {
  const date = new Date(time);
  return date.toLocaleString("ja-JP", { timeZone: resolveTimeZone() });
};

export const formatClock = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: resolveTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };
  return new Intl.DateTimeFormat("ja-JP", options).format(date);
};
