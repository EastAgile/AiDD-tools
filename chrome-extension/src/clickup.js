const ClickUp = (function () {
    let configs = null;
    let rootDirectoryHandle;
    let lastTitle = "";
    let lastDescription = "";
    let lastFileContents = "";

    const styles = `
        #aiddButton {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #aiddButton img {
            width: 17px;
            height: 17px;
        }
        .aidd-tooltip {
            position: absolute;
            z-index: 9999;
            background-color: #2b2c2e;
            color: #ffffff;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .aidd-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #2b2c2e transparent transparent transparent;
        }
        
        .aidd-menu-button {
            width: 26px;
            height: 24px;
            border-radius: 4px;
        }
    `;

    function appendStyles() {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    async function initClickUp() {
        configs = await Shared.getConfigs();
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                for (let key in changes) {
                    if (configs.hasOwnProperty(key)) {
                        configs[key] = changes[key].newValue;
                    }
                }
            }
        });

        if (!configs.promptTemplate) {
            throw new Error('[AiDD] Prompt template is empty or undefined');
        }

        appendStyles();

        const addAiDDButton = () => {
            if (document.getElementById("aiddButton")) return;

            const actionsContainer = document.querySelector(".cu-task-hero-section__actions .container__0");
            if (!actionsContainer) return;

            const buttonContainer = document.createElement("div");
            buttonContainer.className = "btn-container cu-hidden-print ng-tns-c3732676501-16 ng-trigger ng-trigger-accordionHorizontal ng-star-inserted";
            buttonContainer.style.opacity = "1";

            const button = document.createElement("button");
            button.id = "aiddButton";
            button.className = "cu-task-hero-actions__icon-button";
            button.setAttribute("cu3iconbutton", "");
            button.setAttribute("cu3-type", "text");
            button.setAttribute("cu3-size", "medium");
            button.setAttribute("cu3-variant", "default");
            button.setAttribute("cu3-destructive", "false");
            button.setAttribute("cu3-loading", "false");
            button.innerHTML = `<img src="${chrome.runtime.getURL("images/skydeck_icon.png")}" alt="AiDD Logo">`;

            buttonContainer.appendChild(button);
            actionsContainer.insertBefore(buttonContainer, actionsContainer.lastElementChild);

            addTooltip(button, "Generate AiDD Prompt");
            button.addEventListener("click", handleAiDDButtonClick);
        };

        const handleAiDDButtonClick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const titleElement = document.querySelector(".cu-task-title__title");
            const descriptionElement = document.querySelector(".ql-editor");
            
            if (titleElement && descriptionElement) {
                lastTitle = titleElement.value.trim();
                
                // Extract description content while preserving newlines
                lastDescription = Array.from(descriptionElement.querySelectorAll('.ql-block'))
                    .map(block => block.textContent.trim())
                    .join('\n\n')
                    .trim();
                
                if (configs.enableFileSelection) {
                    try {
                        rootDirectoryHandle = await window.showDirectoryPicker();
                        if (rootDirectoryHandle) {
                            showFileSelectionModal();
                        }
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error("An unexpected error occurred:", error);
                        }
                    }
                } else {
                    const promptContent = Shared.generateContent(lastTitle, lastDescription, "...", configs.templates.find(t => t.isCurrent).content);
                    Shared.copyToClipboard(promptContent);
                    Shared.showTooltip(document.getElementById("aiddButton"), "Prompt copied to clipboard!");
                }
            } else {
                console.error('[AiDD] Title or description element not found');
            }
        };

        const handleContextMenuAiDDClick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the task element that contains the clicked menu item
            const taskElement = findParentTaskElement(e.target);
            
            // Close the context menu by simulating a click outside
            document.body.click();

            if (taskElement) {
                // Expand the task
                const openTaskButton = taskElement.querySelector('.open-task-clickable-area');
                if (openTaskButton) {
                    openTaskButton.click();
                }
                
                try {
                    // Wait for all required elements to appear
                    const [titleElement, descriptionElement, aiddButton] = await Promise.all([
                        waitForElement('.cu-task-title__title'),
                        waitForElement('.ql-editor .ql-block'),
                        waitForElement('#aiddButton')
                    ]);
                    
                    if (titleElement && descriptionElement && aiddButton) {
                        // Add a delay of 200ms
                        await new Promise(resolve => setTimeout(resolve, 200));
                        
                        // All elements are present and delay has passed, click the AiDD button
                        aiddButton.click();
                    } else {
                        console.error('[AiDD] One or more required elements not found after expanding task');
                    }
                } catch (error) {
                    console.error('[AiDD] Error while waiting for required elements:', error);
                }
            } else {
                console.error('[AiDD] Task element not found');
            }
        };

        const findParentTaskElement = (element) => {
            while (element != null) {
                if (element.classList.contains('board-task') ||
                    element.classList.contains('cu3-board-task') ||
                    element.classList.contains('board-group__task-list-item')) {
                    return element;
                }
                element = element.parentElement;
            }
            return null;
        };

        const waitForElement = (selector, timeout = 10000) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(selector)) {
                    return resolve(document.querySelector(selector));
                }

                const observer = new MutationObserver(mutations => {
                    if (document.querySelector(selector)) {
                        resolve(document.querySelector(selector));
                        observer.disconnect();
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for element: ${selector}`));
                }, timeout);
            });
        };

        async function showFileSelectionModal() {
            await FileSelection.showModal(
                rootDirectoryHandle,
                (fileContents) => {
                    lastFileContents = fileContents;
                    showPromptGenerationModal();
                }
            );
        }

        function showPromptGenerationModal() {
            PromptGeneration.showModal(
                lastTitle,
                lastDescription,
                lastFileContents,
                configs.templates,
                async () => { await showFileSelectionModal() }
            );
        }

        function createAiDDMenuItem() {
            const button = document.createElement('button');
            button.setAttribute('cu3iconbutton', '');
            button.setAttribute('cu3-type', 'text');
            button.setAttribute('cu3-size', 'small');
            button.setAttribute('cu3-variant', 'default');
            button.setAttribute('cu3-destructive', 'false');
            button.setAttribute('cu3-loading', 'false');
            button.className = 'ng-star-inserted aidd-menu-button';

            const icon = document.createElement('cu3-icon');
            icon.setAttribute('_nghost-ng-c4133689536', '');
            icon.setAttribute('aria-hidden', 'true');

            const img = document.createElement('img');
            img.src = chrome.runtime.getURL("images/skydeck_icon.png");
            img.alt = "AiDD Logo";
            img.style.width = '18px';
            img.style.height = '18px';

            icon.appendChild(img);

            const span = document.createElement('span');
            span.className = 'cdk-visually-hidden';
            span.textContent = 'Generate AiDD Prompt';

            button.appendChild(icon);
            button.appendChild(span);

            button.addEventListener('click', handleContextMenuAiDDClick);

            addTooltip(button, "Generate AiDD Prompt");

            return button;
        }

        function addAiDDMenuItem(actionsButtons) {
            if (!actionsButtons) return;

            const existingAiDDButton = actionsButtons.querySelector('button[cu3iconbutton] img[alt="AiDD Logo"]');
            if (existingAiDDButton) return;

            const aiddButton = createAiDDMenuItem();
            actionsButtons.insertBefore(aiddButton, actionsButtons.firstChild);
        }

        function addTooltip(element, text) {
            const tooltip = document.createElement('div');
            tooltip.className = 'aidd-tooltip';
            tooltip.textContent = text;
            document.body.appendChild(tooltip);

            element.addEventListener('mouseenter', () => {
                const rect = element.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
                tooltip.style.opacity = '1';
            });

            element.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        }

        const observeDOM = () => {
            const targetNode = document.body;
            const config = { childList: true, subtree: true };
            const callback = (mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // Check for the main AiDD button
                        const actionsContainer = document.querySelector(".cu-task-hero-section__actions .container__0");
                        if (actionsContainer && !document.getElementById("aiddButton")) {
                            addAiDDButton();
                        }

                        // Check for the AiDD menu item in all actions__buttons
                        const allActionsButtons = document.querySelectorAll('.actions__buttons');
                        allActionsButtons.forEach(actionsButtons => {
                            if (!actionsButtons.querySelector('button[cu3iconbutton] img[alt="AiDD Logo"]')) {
                                addAiDDMenuItem(actionsButtons);
                            }
                        });
                    }
                }
            };
            const observer = new MutationObserver(callback);
            observer.observe(targetNode, config);
        };

        observeDOM();
    }

    return { init: initClickUp };
})();
