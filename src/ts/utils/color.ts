
export const getColorShindo = (intensity: string) => {
  switch(intensity) {
    case "1": 
      return "#A7A7A7";
    case "2": 
      return "#006FFF";
    case "3":
      return "#40CC00";
    case "4":
      return "#FFAE00";
    case "5-":
      return "#FF6200";
    case "5+":
      return "#FF3C00";
    case "6-":
      return "#FE3639";
    case "6+":
      return "#CF0003";
    case "7":
      return "#D51BC9";
  }
  return "a4a4a4";
};

export const getColorPga = (pga: number) => {
  if (pga <= 0.01) {
    return "#0008cc";
  } else if (pga <= 0.02) {
    return "#0024dd";
  } else if (pga <= 0.05) {
    return "#016fd7";
  } else if (pga <= 0.1) {
    return "#09bf8d";
  } else if (pga <= 0.2) {
    return "#1aeb5b";
  } else if (pga <= 0.5) {
    return "#5ff225";
  } else if (pga <= 1) {
    return "#acf70d";
  } else if (pga <= 2) {
    return "#f1f706";
  } else if (pga <= 5) {
    return "#f7f70b";
  } else if (pga <= 10) {
    return "#fcdb10";
  } else if (pga <= 20) {
    return "#f4ae00";
  } else if (pga <= 50) {
    return "#f07609";
  } else if (pga <= 100) {
    return "#d43300";
  } else if (pga <= 200) {
    return "#ce0b00";
  } else if (pga <= 500) {
    return "#b70000";
  } else {
    return "#880605";
  }
};


export const rgb2hsv = (r: number, g: number, b: number) => {
  
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const cmax = Math.max(r, Math.max(g, b));
  const cmin = Math.min(r, Math.min(g, b));
  const diff = cmax - cmin;

  let h = -1;
  let s = -1;

  if (cmax === cmin) {
    h = 0;
  } else if (cmax === r) {
    h = (60 * ((g - b) / diff) + 360) % 360;
  } else if (cmax === g) {
    h = (60 * ((b - r) / diff) + 120) % 360;
  } else if (cmax === b) {
    h = (60 * ((r - g) / diff) + 240) % 360;
  }

  if (cmax === 0) {
    s = 0;
  } else {
    s = (diff / cmax) * 100;
  }

  const v = cmax * 100;

  return [h, s, v];
  
};