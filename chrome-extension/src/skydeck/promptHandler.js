PromptHandler = (function () {

    const PROMPT_TIMEOUT = 30 * 1000; // 30 seconds in milliseconds
    const MODEL_SELECTION_TIMEOUT = 30 * 1000; // 30 seconds timeout for model selection UI
    const SUBMIT_DELAY = 1500; // 1.5 second delay before submitting

    let configs = null;
    let aiddPrompt = null;

    async function initPromptHandler(initialConfigs) {
        configs = initialConfigs;
        aiddPrompt = await checkAndClearOldPrompt();

        if (aiddPrompt == null) {
            return;
        }

        observeTextArea();
    }

    function updateConfigs(newConfigs) {
        configs = newConfigs;
    }

    async function checkAndClearOldPrompt() {
        try {
            const aiddPrompt = await Shared.getAiddPrompt();
            if (aiddPrompt && Date.now() - aiddPrompt.timestamp > PROMPT_TIMEOUT) {
                await Shared.clearAiddPrompt();
                return null;
            }

            return aiddPrompt;
        } catch (error) {
            console.error('Error checking and clearing old prompt:', error);
            return null;
        }
    }

    function observeTextArea() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = async function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const textarea = document.querySelector('textarea[placeholder="Send a message"]');
                    if (textarea) {
                        observer.disconnect();
                        await handleTextarea(textarea);
                        break;
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);

        // Set a timeout to stop observing after PROMPT_TIMEOUT
        setTimeout(() => {
            observer.disconnect();
        }, PROMPT_TIMEOUT);
    }

    async function handleTextarea(textarea) {
        try {
            if (Date.now() - aiddPrompt.timestamp <= PROMPT_TIMEOUT) {
                textarea.value = aiddPrompt.content;
                const inputEvent = new Event('input', { bubbles: true });
                textarea.dispatchEvent(inputEvent);

                if (configs.autoSubmitPrompt) {
                    observeModelSelection();
                }
            }
            await Shared.clearAiddPrompt();
        } catch (error) {
            console.error("Error handling textarea appearance:", error);
        }
    }

    function observeModelSelection() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                const modelSelector = document.querySelector('button.cds--list-box__field');
                if (modelSelector) {
                    const modelLabel = modelSelector.querySelector('.cds--list-box__label');
                    if (modelLabel && modelLabel.textContent.trim() !== '') {
                        observer.disconnect();
                        setTimeout(submitPrompt, SUBMIT_DELAY);
                        return;
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);

        // Set a timeout to stop observing if the model selection UI doesn't appear or populate
        setTimeout(() => {
            observer.disconnect();
            console.log('Timed out waiting for model selection UI');
        }, MODEL_SELECTION_TIMEOUT);
    }

    function submitPrompt() {
        const sendButton = document.querySelector('button#send-btn');
        if (sendButton) {
            sendButton.click();
        } else {
            console.error('Send button not found');
        }
    }

    return {
        init: initPromptHandler,
        updateConfigs: updateConfigs
    }
})();
