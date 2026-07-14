import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import i18n from "./i18n";
import { loadSettings, getSettings } from "./lib/settings";
import "./index.css";

async function bootstrap(): Promise<void> {
  await loadSettings();
  await i18n.changeLanguage(getSettings().language);

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
