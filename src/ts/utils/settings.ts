

declare global {
    interface Navigator {
        userAgentData?: {
            platform?: string;
            mobile?: boolean;
            brands?: Array<{ brand: string; version: string }>;
        };
    }
}

export const detectOS = () => {
    if (navigator.userAgentData?.platform) {
        return navigator.userAgentData.platform;
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    if (/windows phone/i.test(userAgent)) return "windows phone";
    if (/win/i.test(userAgent)) return "windows";
    if (/android/i.test(userAgent)) return "android";
    if (/iPad|iPhone|iPod/i.test(userAgent)) return "iOS";
    if (/mac/i.test(userAgent)) return "macOS";
    if (/linux/i.test(userAgent)) return "linux";
    
    return "unknown";
};