const PromptGeneration = (function () {

    const styles = `
        .prompt-generation-modal-wrapper {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }

        .prompt-generation-modal {
            position: relative;
            background-color: #2b2b2b;
            color: #e0e0e0;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 1400px;
            height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            font-size: 12px;
        }

        .prompt-generation-modal pre::-webkit-scrollbar {
            width: 10px;
        }
        .prompt-generation-modal pre::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        .prompt-generation-modal pre::-webkit-scrollbar-thumb {
            background: #3e3e3e;
            border-radius: 5px;
        }
        .prompt-generation-modal pre::-webkit-scrollbar-thumb:hover {
            background: #4e4e4e;
        }  
            
        .prompt-generation-guide {
            height: 20px;
            margin-bottom: 12px;
            font-size: 14px;
            color: #ffffff;
            font-weight: bold;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .prompt-generation-content {
            background-color: #1e1e1e;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            padding: 20px;
            margin-top: 10px;
            overflow-y: auto;
            flex-grow: 1;
        }

        .prompt-generation-content pre {
            white-space: pre-wrap;
            word-break: break-all;
            font-size: 14px;
            color: #e0e0e0;
            background-color: #1e1e1e;
            line-height: 1.3;
            margin: 0;
        }

        .prompt-generation-content::-webkit-scrollbar {
            width: 10px;
        }

        .prompt-generation-content::-webkit-scrollbar-track {
            background: #1e1e1e;
        }

        .prompt-generation-content::-webkit-scrollbar-thumb {
            background: #3e3e3e;
            border-radius: 5px;
        }

        .prompt-generation-content::-webkit-scrollbar-thumb:hover {
            background: #4e4e4e;
        }
            
        .prompt-generation-buttons {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 16px;
            padding-left: 5px;
        }

        .template-selector-wrapper {
            position: relative;
        }

        .template-selector-wrapper select {
            position: relative;
            z-index: 1;
        }

        .template-selector-wrapper::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }

        .template-selector-wrapper select::-ms-expand {
            display: none;
        }

        .template-selector-wrapper select:focus {
            box-shadow: 0 -4px 8px rgba(0,0,0,0.1);
        }
            
        .template-selector {
            padding: 5px;
            background-color: #2b2b2b;
            color: #b0b0b0;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            font-size: 12px;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23B0B0B0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 0.7em top 50%;
            background-size: 0.65em auto;
            padding-right: 2em;
        }

        .template-selector:focus {
            outline: none;
            border-color: #3b82f6;
        }
            
        .prompt-generation-button {
            padding: 6px 10px;
            background-color: #4a4a4a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin: 0 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease;
        }

        .prompt-generation-button:first-child {
            margin-left: 0;
        }

        .prompt-generation-button:last-child {
            margin-right: 0;
        }

        .prompt-generation-button:hover {
            background-color: #5a5a5a;
        }

        .prompt-generation-button:disabled {
            background-color: #3a3a3a;
            cursor: not-allowed;
            opacity: 0.7;
        }

        .prompt-generation-button.skydeck-button {
            background-color: #3b82f6;
        }

        .prompt-generation-button.skydeck-button:hover {
            background-color: #2563eb;
        }

        .prompt-generation-close-button {
            position: absolute;
            top: 14px;
            right: 13px;
            width: 30px;
            height: 30px;
            background-color: transparent;
            border: none;
            font-size: 22px;
            color: #e0e0e0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            border-radius: 4px;
        }

        .prompt-generation-close-button:hover {
            color: #ffffff;
            background-color: rgba(255, 255, 255, 0.1);
        }        
    `;

    function initPromptGeneration() {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    function showModal(title, description, selectedFilesContent, templates, onPreviousBtnClick) {
        const content = Shared.generateContent(title, description, selectedFilesContent, templates.find(t => t.isCurrent).content);
        const modalWrapper = document.createElement("div");
        modalWrapper.className = "prompt-generation-modal-wrapper";

        const modal = document.createElement("div");
        modal.className = "prompt-generation-modal";

        const titleElement = document.createElement("div");
        titleElement.className = "prompt-generation-guide";
        titleElement.textContent = "Your AiDD Prompt";
        modal.appendChild(titleElement);

        const promptContent = document.createElement("div");
        promptContent.className = "prompt-generation-content";

        const preElement = document.createElement("pre");
        preElement.textContent = content;

        promptContent.appendChild(preElement);
        modal.appendChild(promptContent);

        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "prompt-generation-buttons";

        const leftButtonsContainer = document.createElement("div");
        leftButtonsContainer.style.display = "flex";
        leftButtonsContainer.style.alignItems = "center";

        // Add template selector
        const templateSelectorLabel = document.createElement("label");
        templateSelectorLabel.textContent = "Template: ";
        templateSelectorLabel.style.marginRight = "10px";
        leftButtonsContainer.appendChild(templateSelectorLabel);        

        const templateSelectorWrapper = document.createElement("div");
        templateSelectorWrapper.className = "template-selector-wrapper";        

        const templateSelector = document.createElement("select");
        templateSelector.className = "template-selector";
        templates.forEach((template, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = template.name;
            if (template.isCurrent) {
                option.selected = true;
            }
            templateSelector.appendChild(option);
        });
        
        // Add event listener for template selection
        templateSelector.addEventListener('change', async (event) => {
            const selectedTemplateIndex = parseInt(event.target.value);
            templates.forEach((template, index) => {
                template.isCurrent = index === selectedTemplateIndex;
            });
            const selectedTemplate = templates[selectedTemplateIndex];
            const newContent = Shared.generateContent(title, description, selectedFilesContent, selectedTemplate.content);
            preElement.textContent = newContent;
            
            // Persist the template selection
            chrome.storage.sync.set({ templates: templates }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error saving changes:', chrome.runtime.lastError);
                }
            });
        });        

        templateSelectorWrapper.appendChild(templateSelector);
        leftButtonsContainer.appendChild(templateSelectorWrapper);
        buttonsContainer.appendChild(leftButtonsContainer);        

        const rightButtonsContainer = document.createElement("div");
        rightButtonsContainer.style.display = "flex";
        rightButtonsContainer.style.alignItems = "center";

        const previousButton = document.createElement("button");
        previousButton.textContent = "Previous";
        previousButton.className = "prompt-generation-button";
        previousButton.onclick = async () => {
            if (document.body.contains(modalWrapper)) {
                document.body.removeChild(modalWrapper);
            }

            await onPreviousBtnClick();
        };

        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy to Clipboard";
        copyButton.className = "prompt-generation-button";
        copyButton.onclick = () => {
            Shared.copyToClipboard(preElement.textContent);
            Shared.showTooltip(copyButton, "Copied!");
        };

        const launchSkyDeckButton = document.createElement("button");
        launchSkyDeckButton.textContent = "Launch SkyDeck.ai";
        launchSkyDeckButton.className = "prompt-generation-button skydeck-button";
        launchSkyDeckButton.onclick = () => {
            launchSkydeck(preElement.textContent);
        };

        const closeButton = document.createElement("button");
        closeButton.innerHTML = "&times;";
        closeButton.className = "prompt-generation-close-button";
        closeButton.onclick = () => {
            if (document.body.contains(modalWrapper)) {
                document.body.removeChild(modalWrapper);
            }
        };

        rightButtonsContainer.appendChild(previousButton);
        rightButtonsContainer.appendChild(copyButton);
        rightButtonsContainer.appendChild(launchSkyDeckButton);
        rightButtonsContainer.appendChild(closeButton);        

        buttonsContainer.appendChild(rightButtonsContainer);
        modal.appendChild(buttonsContainer);
        modalWrapper.appendChild(modal);
        document.body.appendChild(modalWrapper);

        modalWrapper.addEventListener("click", (event) => {
            if (event.target === modalWrapper && document.body.contains(modalWrapper)) {
                document.body.removeChild(modalWrapper);
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && document.body.contains(modalWrapper)) {
                document.body.removeChild(modalWrapper);
            }
        }, { once: true });        
    }

    async function launchSkydeck(content) {
        const textArea = document.querySelector('textarea[placeholder="Send a message"]');
        if (textArea && window.location.href.includes('eastagile.skydeck.ai')) {
            // We're already on the SkyDeck page and found the input
            textArea.value = content;
            textArea.dispatchEvent(new Event('input', { bubbles: true }));

            // Close the prompt generation modal
            const modalWrapper = document.querySelector('.prompt-generation-modal-wrapper');
            if (modalWrapper) {
                document.body.removeChild(modalWrapper);
            }
        } else {
            // We're not on the SkyDeck page or couldn't find the input, so launch in a new tab
            try {
                await Shared.setAiddPrompt(content);
                const skydeckUrl = "https://eastagile.skydeck.ai/";
                window.open(skydeckUrl, '_blank');
            } catch (error) {
                console.error('Error storing prompt:', error);
            }
        }
    };

    return { 
        init: initPromptGeneration,
        showModal: showModal
    };
})();
