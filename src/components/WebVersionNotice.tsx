import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isTauri } from "../lib/runtime";
import { assetUrl } from "../lib/assetUrl";

const RELEASES_URL = "https://github.com/Domiko7/SesnaQuake/releases";

export const WebVersionNotice = () => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (isTauri() || dismissed) return null;

  return (
    <div id="web-version-notice-overlay">
      <div id="web-version-notice" role="alert">
        <img className="web-version-notice__icon" src={assetUrl("images/SesnaQuake.png")} alt="" />
        <p className="web-version-notice__title">{t("webVersionNoticeTitle")}</p>
        <p className="web-version-notice__body">{t("webVersionNoticeBody")}</p>
        <p className="web-version-notice__body web-version-notice__body--warning">{t("webVersionNoticeReliability")}</p>
        <div className="web-version-notice__actions">
          <a
            className="web-version-notice__cta"
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("webVersionNoticeGetDesktop")}
          </a>
          <button type="button" className="web-version-notice__dismiss" onClick={() => setDismissed(true)}>
            {t("webVersionNoticeDismiss")}
          </button>
        </div>
      </div>
    </div>
  );
};
