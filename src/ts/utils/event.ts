import i18n from "../i18n.ts";
import { getColorShindo } from "./color.ts";

export const addEvent = (mag: number, intensity: string, depth: number, location: string, time: string, title: string, intensityType: string, id: string, reportNumber: number) => {
  const intensityColor = getColorShindo(intensity);
  const panel = document.getElementById("monitor-panel");

  const panelHTML = `
  <div class="panel-container" id="earthquake-warning-${id}" style="border-color: ${intensityColor};">
    <div class="earthquake-warning__top">
      <div class="earthquake-warning__top-top panel-container-top">
        <div class="earthquake-warning__title">
          <img src="images/AlertTriangle.svg" alt="" class="alert-triangle">
          <span class="earthquake-warning__title-text container-title">JMA - 警告</span>
          <img src="images/AlertTriangle.svg" alt="" class="alert-triangle">
        </div>

        <div class="earthquake-warning__report-num" style="background-color: ${intensityColor};">
          <span class="earthquake-warning__report-num-name">${i18n.t("reportNumber")}</span>
          <span class="earthquake-warning__report-num-text">#${reportNumber}</span>
        </div>

      </div>
      <div class="earthquake-warning__top-middle">
        <span class="earthquake-warning__location container-subtitle">${location}</span>
        <span class="earthquake-warning__earthquake-text">${i18n.t("earthquake")}</span>
      </div>
      <div class="earthquake-warning__top-bottom">
        <span class="earthquake-warning__time">${time}</span>
        <span class="earthquake-warning__time-text">${i18n.t("time")}</span>
      </div>
    </div>
    <div class="earthquake-warning__middle">
      <div class="earthquake-warning__seismic-intensity" style="background-color: ${intensityColor};">
        <div class="earthquake-warning__seismic-intensity-left">
          <div class="earthquake-warning__seismic-intensity-top">
            <span class="earthquake-warning__seismic-intensity-estimated-text">${i18n.t("estimated")}</span>
          </div>
          <div class="earthquake-warning__seismic-intensity-bottom">
            <span class="earthquake-warning__seismic-intensity-text">${i18n.t("intensity")}</span>
          </div>  
        </div>
        <div class="earthquake-warning__seismic-intensity-right">
          <span class="earthquake-warning__seismic-intensity-number">${intensity}</span>
        </div>
      </div>
    </div>
    <div class="earthquake-warning__bottom">
      <div class="earthquake-warning__bottom-top">
        <div class="earthquake-warning__magnitude-title">
          <span class="earthquake-warning__magnitude-title-text">${i18n.t("mag")}</span>
        </div>
        <div class="earthquake-warning__magnitude">
          <span class="earthquake-warning__magnitude-text">${mag}</span>
        </div>
      </div>
      <div class="earthquake-warning__bottom-middle">
        <div class="earthquake-warning__depth-title">
          <span class="earthquake-warning__depth-title-text">${i18n.t("depth")}</span>
        </div>
        <div class="earthquake-warning__depth">
          <span class="earthquake-warning__depth-text">${depth}km</span>
        </div>
      </div>
      <div class="earthquake-warning__bottom-bottom">
        <div class="earthquake-warning__note">
          <span class="earthquake-warning__note-text">JMA - ${title}</span>
        </div>
      </div>
    </div>
  </div>`;
  //${i18n.t("intensity")}
  if (panel) {
    panel.innerHTML = panelHTML + panel.innerHTML;
  }
};

export const changeEvent = (mag: number, intensity: string, depth: number, location: string, time: string, title: string, intensityType: string, id: string, reportNumber: number) => {
  const intensityColor = getColorShindo(intensity);
  const event = document.getElementById(`earthquake-warning-${id}`);
  const eventSeismicIntensity = event?.querySelector(".earthquake-warning__seismic-intensity") as HTMLElement | null;
  const eventReportNumber = event?.querySelector(".earthquake-warning__report-num") as HTMLElement | null;

  if (event) {
    event.style.borderColor = intensityColor;

    if (eventSeismicIntensity) {
      eventSeismicIntensity.style.backgroundColor = intensityColor;
    }
    
    if (eventReportNumber) {
      eventReportNumber.style.backgroundColor = intensityColor;
    }
    
    const reportNumEl = event.querySelector(".earthquake-warning__report-num-text");
    if (reportNumEl) reportNumEl.textContent = `#${reportNumber.toString()}`;

    const locationEl = event.querySelector(".earthquake-warning__location");
    if (locationEl) locationEl.textContent = location;

    const timeEl = event.querySelector(".earthquake-warning__time");
    if (timeEl) timeEl.textContent = time;

    const intensityEl = event.querySelector(".earthquake-warning__seismic-intensity-number");
    if (intensityEl) intensityEl.textContent = intensity;

    const magEl = event.querySelector(".earthquake-warning__magnitude-text");
    if (magEl) magEl.textContent = mag.toString();

    const depthEl = event.querySelector(".earthquake-warning__depth-text");
    if (depthEl) depthEl.textContent = `${depth.toString()}km`;

    const noteEl = event.querySelector(".earthquake-warning__note-text");
    if (noteEl) noteEl.textContent = `JMA - ${title}`;
  }

};

export const deleteEvent = (id: string) => {
  const event = document.getElementById(`earthquake-warning-${id}`);
  event?.remove();
};

export const changeVisibilityOfMonitorPanel = (visible: boolean) => {
  const panel = document.getElementById("monitor-panel");
  if (visible) {
    panel?.classList.remove("invisible");
  } else {
    panel?.classList.add("invisible");
  }
};
