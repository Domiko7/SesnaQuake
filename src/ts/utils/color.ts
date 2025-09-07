
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
