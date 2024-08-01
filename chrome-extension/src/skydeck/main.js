const Skydeck = (function () {
    let configs = null;

    async function initSkydeck() {
        configs = await Shared.getConfigs();

        await PromptHandler.init(configs);
        await GitDiffHandler.init(configs);

        // Add message listener for configuration updates
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                for (let key in changes) {
                    if (configs.hasOwnProperty(key)) {
                        configs[key] = changes[key].newValue;
                    }
                }
                // Notify handlers of config changes
                PromptHandler.updateConfigs(configs);
                GitDiffHandler.updateConfigs(configs);
            }
        });
    }

    return { init: initSkydeck };
})();
