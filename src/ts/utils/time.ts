

export const convertTimeToHoursMinutes = (time: string) => {
  const timeString = time;
  const date = new Date(timeString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const hhmm = `${hours}:${minutes}`;
  return hhmm;
};

export const parseJMAtime = (time: string) => {
  const formattedTime = time.replace(/\//g, '-');

  const timeParsed = new Date(formattedTime);

  const timeMilli = timeParsed.getTime();
  return timeMilli;
};

export const calculateElapsedTimeOfTheWave = (originTime: string, announcedTime: string, type: string) => {
  if (type === "jma_eew") {
    const originTimeParsed = parseJMAtime(originTime);
    const announcedTimeParsed = parseJMAtime(announcedTime);

    return announcedTimeParsed - originTimeParsed;
  }
  return 965;
};

