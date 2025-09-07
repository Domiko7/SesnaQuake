declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const cookies = () => {
  const cookieBannerButton = document.getElementById("cookie-banner-button");
  const cookieBanner = document.getElementById("cookie-banner");

  if (!cookieBannerButton || !cookieBanner) {
    return;
  }

  cookieBannerButton.addEventListener("click", function() {
    cookieBanner.style.display = 'none';

    if (document.querySelector('script[src*="googletagmanager"]')) {
      return;
    }
    
    const gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-7LTJ46JCWB";
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', 'G-7LTJ46JCWB', { 'anonymize_ip': true });
  });
};