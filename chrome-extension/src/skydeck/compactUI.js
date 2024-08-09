const CompactUI = (function () {

    let configs = null;
    let sendBtnElement = null;
    let textAreaElement = null;
    let sendChatMessageBtnElement = null;
    let fileContentsMapping = {};

    async function initCompactUI(initialConfigs) {
        configs = initialConfigs;
        observeDOMforSendButtonAndTextArea();
        observeDOMforSendChatMessageButton();
    }

    function updateConfigs(newConfigs) {
        configs = newConfigs;
    }

    const observeDOMforSendButtonAndTextArea = () => {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = (mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList") {
                    // Check for send button
                    if (!sendBtnElement) {
                        sendBtnElement = document.getElementById("send-btn");
                        if (sendBtnElement) {
                            // Add event listener in the capturing phase, before the default onClick is invoked
                            sendBtnElement.addEventListener("click", expandFileContents, true);
                        }
                    }

                    // Check for text area
                    if (!textAreaElement) {
                        textAreaElement = document.querySelector("textarea[placeholder='Send a message']");
                        if (textAreaElement) {
                            textAreaElement.addEventListener("keydown", handleTextAreaKeyDown);
                        }
                    }

                    // Disconnect observer if all elements are found
                    if (sendBtnElement && textAreaElement) {
                        observer.disconnect();
                        break;
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    };

    const observeDOMforSendChatMessageButton = () => {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = (mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === "childList") {
                    const currentButton = document.getElementById("send-non-ai-btn");
                    if (currentButton && currentButton != sendChatMessageBtnElement) {
                        sendChatMessageBtnElement = currentButton;
                        sendChatMessageBtnElement.addEventListener("click", expandFileContents, true);
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    };

    function handleTextAreaKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            expandFileContents();
        }
    }    

    function expandFileContents() {
        if (configs.hideFileContents && Object.keys(fileContentsMapping).length > 0) {
            // Get the current content in the textArea
            let textContent = textAreaElement.value;

            // Replace any existing of `<file path="${key}" />` or `<file path="${key}"/>` with `<file path="${key}">\n${value}\n</file>`
            for (const [key, value] of Object.entries(fileContentsMapping)) {
                const regexSelfClosing = new RegExp(`<file path="${key}"\\s*/?>`, 'g');
                const replacement = `<file path="${key}">\n${value}\n</file>`;
                textContent = textContent.replace(regexSelfClosing, replacement);
            }

            // Set the modified content back to the textArea
            textAreaElement.value = textContent;

            // Invalidate the textArea
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            textAreaElement.dispatchEvent(inputEvent);
        }

        // Clear the fileContentsMapping
        fileContentsMapping = {};
    }

    function rememberFileContent(key, value) {
        fileContentsMapping[key] = value;
    }

    return {
        init: initCompactUI,
        updateConfigs: updateConfigs,
        rememberFileContent: rememberFileContent,
    };
})();
