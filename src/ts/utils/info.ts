

const setVersion = () => {
    const infoVersionText = document.querySelector<HTMLElement>(".info__version-text");
    if (!infoVersionText) return;

    infoVersionText.textContent = __APP_VERSION__;
    infoVersionText.style.color = "#077fe9ff";
};

export const setConnection = (el: string, isConnected: boolean) => {
    const infoServerConnectionText = document.querySelector<HTMLElement>("." + el);
    if (!infoServerConnectionText) return;

    if (isConnected) {
        infoServerConnectionText.textContent = "Connected";
        infoServerConnectionText.style.color = "#51ff00";
    } else {
        infoServerConnectionText.textContent = "Disconnected";
        infoServerConnectionText.style.color = "#ff0303";
    }
    
};

export const setInfo = () => {
    setVersion();
};
