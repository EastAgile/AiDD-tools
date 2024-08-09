const Jira = (function () {
    let configs = null;
    let rootDirectoryHandle;
    let lastTitle = "";
    let lastDescription = "";
    let lastFileContents = "";

    const styles = `
        #aiddButton {
            position: relative;
        }
        #aidd-button-tooltip {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgb(23, 43, 77);
            color: #ffffff;
            border: 1px solid rgb(23, 43, 77);
            border-radius: 3px;
            padding: 2px 4px;
            font-size: 12px;
            white-space: nowrap;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
            pointer-events: none;
            z-index: 10000;
        }
        #aiddButton:hover #aidd-button-tooltip {
            opacity: 1;
            visibility: visible;
        }
        #aiddButton img {
            width: 24px;
            height: 24px;
        }
    `;

    function appendStyles() {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    async function initJira() {
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

            const controlsElement = document.querySelector("._otyr1b66._19pk1b66._1yt4swc3._1e0c116y");
            if (!controlsElement) return;

            const button = document.createElement("span");
            button.id = "aiddButton";
            button.className = "_2hwxu2gc";

            const innerButton = document.createElement("button");
            innerButton.className = "css-1l34k60";
            innerButton.setAttribute("aria-label", "Generate AiDD Prompt");
            innerButton.setAttribute("tabindex", "0");
            innerButton.setAttribute("type", "button");

            const spanOuter = document.createElement("span");
            spanOuter.className = "css-1uc6u2g";

            const spanInner = document.createElement("span");
            spanInner.className = "_ca0qidpf _u5f3idpf _n3tdidpf _19bvidpf _18u0r5cr _2hwx1i6y";

            const iconSpan = document.createElement("span");
            iconSpan.setAttribute("aria-hidden", "true");
            iconSpan.className = "css-1afrefi";
            iconSpan.style.setProperty("--icon-primary-color", "currentColor");
            iconSpan.style.setProperty("--icon-secondary-color", "var(--ds-surface, #FFFFFF)");

            const img = document.createElement("img");
            img.src = chrome.runtime.getURL("images/skydeck_icon.png");
            img.alt = "AiDD Logo";

            const textSpan = document.createElement("span");
            textSpan.className = "css-178ag6o";
            textSpan.textContent = "AiDD Prompt";

            const tooltip = document.createElement("div");
            tooltip.id = "aidd-button-tooltip";
            tooltip.textContent = "Generate AiDD Prompt";

            iconSpan.appendChild(img);
            spanInner.appendChild(iconSpan);
            spanOuter.appendChild(spanInner);
            innerButton.appendChild(spanOuter);
            innerButton.appendChild(textSpan);
            button.appendChild(innerButton);
            button.appendChild(tooltip);

            innerButton.addEventListener("click", handleAiDDButtonClick);

            controlsElement.insertBefore(button, controlsElement.firstChild);
        };

        const handleAiDDButtonClick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const titleElement = document.querySelector("h1[data-testid='issue.views.issue-base.foundation.summary.heading']");
            let descriptionElement = document.querySelector(".ak-renderer-document");
            
            if (titleElement && descriptionElement) {
                lastTitle = titleElement.textContent.trim();
                
                // Extract description content while preserving newlines
                lastDescription = Array.from(descriptionElement.children)
                    .map(child => child.textContent.trim())
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
            
            // Find the story element that contains the clicked menu item
            const storyElement = findParentStoryElement(e.target);
            
            // Close the context menu by simulating a click outside
            document.body.click();

            if (storyElement) {
                // Expand the story
                storyElement.click();
                
                // Wait for the story details to load and the AiDD button to appear
                await waitForElement('h1[data-testid="issue.views.issue-base.foundation.summary.heading"]');
                await waitForElement('.ak-renderer-document');
                await waitForElement('#aiddButton');

                // Click the AiDD button
                const aiddButton = document.querySelector('#aiddButton button');
                if (aiddButton) {
                    aiddButton.click();
                } else {
                    console.error('[AiDD] AiDD button not found after expanding story');
                }
            } else {
                console.error('[AiDD] Story element not found');
            }
        };

        const findParentStoryElement = (element) => {
            while (element != null) {
                if (element.getAttribute('data-testid') === 'platform-board-kit.ui.card.card') {
                    return element;
                }
                element = element.parentElement;
            }
            return null;
        };

        const waitForElement = (selector) => {
            return new Promise(resolve => {
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
            const li = document.createElement('li');
            li.className = 'css-1genzww';

            const button = document.createElement('button');
            button.className = '_1bsb1osq _19itglyw _19pkidpf _2hwxidpf _otyridpf _18u0idpf _y3gn1e5h _1yt413su _1e0c1txw _1bah1h6o _4cvr1h6o _4t3izwfg _zulp1b66 _7ehiglyw _1bg41i6y _bfhk1kw7 _syaz1fxt _irr31nz6';
            button.setAttribute('data-testid', 'software-context-menu.ui.context-menu-inner.context-menu-node.context-menu-item.context-menu-item');

            const span = document.createElement('span');
            span.className = '_11c81oud _16jlkb7n _1o9zkb7n _i0dlf1ug _o5721q9c _1reo15vq _18m915vq _1bto1l2s';
            span.textContent = 'Generate AiDD Prompt';

            button.appendChild(span);
            li.appendChild(button);

            button.addEventListener('click', handleContextMenuAiDDClick);

            return li;
        }

        function addAiDDMenuItem(contextMenu) {
            const aiDDMenuItem = createAiDDMenuItem();
            aiDDMenuItem.classList.add('aidd-menu-item');

            // Insert the AiDD menu item after the "Copy issue key" item
            const copyIssueKeyItem = Array.from(contextMenu.children).find(li => 
                li.textContent.trim() === 'Copy issue key'
            );

            if (copyIssueKeyItem) {
                copyIssueKeyItem.insertAdjacentElement('afterend', aiDDMenuItem);
            } else {
                // If "Copy issue key" is not found, append to the end of the menu
                contextMenu.appendChild(aiDDMenuItem);
            }
        }

        const observeDOM = () => {
            const targetNode = document.body;
            const config = { childList: true, subtree: true };
            const callback = (mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === "childList") {
                        const controlsElement = document.querySelector("._otyr1b66._19pk1b66._1yt4swc3._1e0c116y");
                        if (controlsElement && !document.getElementById("aiddButton")) {
                            addAiDDButton();
                        }

                        const contextMenu = document.querySelector('ul.css-38wpj8');
                        if (contextMenu && !contextMenu.querySelector('.aidd-menu-item')) {
                            addAiDDMenuItem(contextMenu);
                        }
                    }
                }
            };
            const observer = new MutationObserver(callback);
            observer.observe(targetNode, config);
        };

        observeDOM();
        addAiDDButton();
    }

    return { init: initJira };
})();
