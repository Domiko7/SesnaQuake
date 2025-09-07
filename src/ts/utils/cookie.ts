

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}


export const cookies = () => {
    document.getElementById("cookie-banner-button")!.addEventListener("click", function() {
        document.getElementById("cookie-banner")!.style.display='none';

        // "XXXXXXXXXX" is a place holder
        
        let gtagScript = document.createElement("script");
        gtagScript.async = true;
        gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
        document.head.appendChild(gtagScript);

        gtagScript.onload = function() {
            window.dataLayer = window.dataLayer || [];
            function gtag(...args: any[]) {
                window.dataLayer.push(args);
            }
            window.gtag = gtag;
            gtag("js", new Date());
            gtag("config", "G-XXXXXXXXXX", { "anonymize_ip": true });
        };
    });
};