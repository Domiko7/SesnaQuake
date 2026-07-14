import { startWolfxEewSource } from "./wolfxEew";
import { startFanEewSource } from "./fanEew";
import { startExptechEewSource } from "./exptechEew";
import { startShakealertEewSource } from "./shakealertEew";
import { startCencEqSource } from "./cencEq";
import { startJmaAtomEqSource } from "./jmaAtomEq";
import { startEmscEqSource } from "./emscEq";
import { startUsgsEqSource } from "./usgsEq";
import { startGeonetEqSource } from "./geonetEq";
import { startBreqEqSource } from "./breqEq";
import { startKmoniStnSource } from "./kmoniStn";
import { startExptechStnSource } from "./exptechStn";
import { startPalertStnSource } from "./palertStn";
// import { startKmaStnSource } from "./kmaStn"; // temporarily disabled
import { getSettings } from "../settings";

let started = false;

export const startSources = (): void => {
  if (started) return;
  started = true;

  const settings = getSettings();

  const wolfxEnabled = settings.sourceWolfxJma || settings.sourceWolfxSc || settings.sourceWolfxCenc
    || settings.sourceWolfxFj || settings.sourceWolfxCq;
  if (wolfxEnabled) startWolfxEewSource();

  const exptechEwEnabled = settings.sourceExptechCwa || settings.sourceExptechNied;
  if (exptechEwEnabled) startExptechEewSource();

  const fanOwnSourcesEnabled = settings.sourceKmaEew || settings.sourceCwaReport || settings.sourceKmaReport
    || settings.sourceBcsf || settings.sourceHko || settings.sourceGfz || settings.sourceUsp || settings.sourceFssn
    || settings.sourceNingxia || settings.sourceGuangxi || settings.sourceShanxi || settings.sourceBeijing || settings.sourceYunnan;
  const fanNeededAsFallback = settings.sourceWolfxJma || settings.sourceWolfxCenc || settings.sourceExptechCwa
    || settings.sourceShakealert || settings.sourceEmsc || settings.sourceUsgs || settings.sourceCenc;
  if (fanOwnSourcesEnabled || fanNeededAsFallback) {
    startFanEewSource();
    // startKmaStnSource(); // temporarily disabled
  }

  if (settings.sourceShakealert) startShakealertEewSource();

  if (settings.sourceCenc) startCencEqSource();
  if (settings.sourceJma) startJmaAtomEqSource();
  if (settings.sourceEmsc) startEmscEqSource();
  if (settings.sourceUsgs) startUsgsEqSource();
  if (settings.sourceGeonet) startGeonetEqSource();
  if (settings.sourceBreq) startBreqEqSource();

  if (settings.sourceKmoni) startKmoniStnSource();
  if (settings.sourceExptechStn) startExptechStnSource();
  if (settings.sourcePalert) startPalertStnSource();
};
