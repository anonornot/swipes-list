const {
    extensionSettings,
} = SillyTavern.getContext();

const extensionName = "swipes-list";

const defaultSettings = Object.freeze({
    showFirst: false,
    showLast: false,
    showEvery: false
});

function getSettings() {
    if (!extensionSettings[extensionName]) {
        extensionSettings[extensionName] = structuredClone(defaultSettings);
    }

    for (const key of Object.keys(defaultSettings)) {
        if (!Object.hasOwn(extensionSettings[extensionName], key)) {
            extensionSettings[extensionName][key] = defaultSettings[key];
        }
    }

    return extensionSettings[extensionName];
}

export const settings = getSettings();
