import { map } from "./ts/utils/map";
import { speak } from "./ts/utils/speaker.ts";
import { detectOS } from "./ts/utils/settings.ts";
import { wolfxWebSocket } from "./ts/data/wolfx/ws.ts";
import { realtimeStations } from "./ts/stn.ts";
import i18n from "./ts/i18n.ts";
import { translatePage } from "./ts/i18n.ts";
import { cookies } from "./ts/utils/cookie.ts";

let earthquakeWarningDebug = document.getElementById("earthquake-warning-debug");
earthquakeWarningDebug?.remove();

realtimeStations();

document.addEventListener("DOMContentLoaded", translatePage);
cookies();