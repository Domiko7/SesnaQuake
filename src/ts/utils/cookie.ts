

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

let gtagReady = false;
const  gtagQueue: any[] = [];

function runGtag(...args: any[]) {
  if (gtagReady && window.gtag) {
    window.gtag(...args);
  } else {
    gtagQueue.push(args);
  }
}


export const cookies = () => {
  document.getElementById("cookie-banner-button")!.addEventListener("click", function() {
    document.getElementById("cookie-banner")!.style.display='none';

        
    let gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-7LTJ46JCWB";
    document.head.appendChild(gtagScript);

    gtagScript.onload = function() {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      window.gtag = gtag;
      gtag("js", new Date());
      gtag("config", "G-7LTJ46JCWB", { "anonymize_ip": true });

      gtagReady = true;
      gtagQueue.forEach(args => window.gtag!(...args));
        runGtag('event', 'page_view');
      };
  });
};
