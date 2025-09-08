

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

export const startFpsCounter = () => {
    let lastTime = performance.now();
    let frames = 0;
    let fps = 0;

    const infoFpsText = document.querySelector<HTMLElement>(".info__fps-text");
    if (!infoFpsText) return;
    infoFpsText.style.color = "#077fe9ff";

    const updateFPS = () => {
        const now = performance.now();
        frames++;

        if (now - lastTime >= 1000) {
            fps = frames;
            frames = 0;
            lastTime = now;
            infoFpsText.textContent = fps.toString();
        }

        requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
};

export const setInfo = () => {
    setVersion();
};
