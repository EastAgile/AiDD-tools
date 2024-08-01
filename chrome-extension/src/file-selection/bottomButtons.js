const BottomButtons = (function () {

    const styles = `
        .file-tree-buttons {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .left-buttons-container {
            display: flex;
            align-items: center;
        }

        .selected-files-counter {
            color: #888;
            font-size: 12px;
            margin-left: 45px;
        }

        .right-buttons-container {
            display: flex;
            margin-top: 16px;
        }

        .file-tree-button {
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
        .file-tree-button:first-child {
            margin-left: 0;
        }
        .file-tree-button:last-child {
            margin-right: 0;
        }
        .file-tree-button:hover {
            background-color: #5a5a5a;
        }
        .file-tree-button:disabled {
            background-color: #3a3a3a;
            cursor: not-allowed;
            opacity: 0.7;
        }
        .file-tree-button.processing {
            background-color: #3a3a3a;
            color: #ffffff;
            opacity: 0.8;
            cursor: wait;
        }

        .loading-spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-left: 8px;
        }

        .modal-close-button {
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

        .modal-close-button:hover {
            color: #ffffff;
            background-color: rgba(255, 255, 255, 0.1);
        }
    `;

    function initBottomButtons(onEnablePreviewButtonToggled, onContinueButtonClick, onCloseButtonClick) {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "file-tree-buttons";

        const leftButtonsContainer = document.createElement("div");
        leftButtonsContainer.className = ".left-buttons-container";

        const selectedFilesCounter = document.createElement("div");
        selectedFilesCounter.className = "selected-files-counter";
        selectedFilesCounter.textContent = "0 files selected";

        leftButtonsContainer.appendChild(selectedFilesCounter);

        const rightButtonsContainer = document.createElement("div");
        rightButtonsContainer.className = "right-buttons-container"

        const toggleButton = document.createElement("button");
        toggleButton.className = "file-tree-button";
        const toggleState = localStorage.getItem('previewEnabled') !== 'false';
        toggleButton.textContent = toggleState ? "Disable Preview" : "Enable Preview";

        toggleButton.addEventListener("click", async () => {
            const newState = toggleButton.textContent === "Enable Preview";
            toggleButton.textContent = newState ? "Disable Preview" : "Enable Preview";
            await onEnablePreviewButtonToggled(newState);
        });

        const continueButton = document.createElement("button");
        continueButton.className = "file-tree-button";

        const buttonTextSpan = document.createElement("span");
        buttonTextSpan.textContent = "Continue";
        continueButton.appendChild(buttonTextSpan);

        const loadingSpinner = document.createElement("div");
        loadingSpinner.className = "loading-spinner";
        loadingSpinner.style.display = "none";
        continueButton.appendChild(loadingSpinner);

        continueButton.onclick = async () => {
            continueButton.classList.add("processing");
            continueButton.disabled = true;
            buttonTextSpan.textContent = "Processing...";
            loadingSpinner.style.display = "inline-block";
            await onContinueButtonClick(continueButton);
            continueButton.classList.remove("processing");
            continueButton.disabled = false;
            buttonTextSpan.textContent = "Continue";
            loadingSpinner.style.display = "none";
        };

        const closeButton = document.createElement("button");
        closeButton.innerHTML = "&times;";
        closeButton.className = "modal-close-button";
        closeButton.onclick = () => { onCloseButtonClick() };

        rightButtonsContainer.appendChild(toggleButton);
        rightButtonsContainer.appendChild(continueButton);
        rightButtonsContainer.appendChild(closeButton);

        buttonsContainer.appendChild(leftButtonsContainer);
        buttonsContainer.appendChild(rightButtonsContainer);

        return {
            html: buttonsContainer,
            updateSelectedFilesCounter: (count) => {
                selectedFilesCounter.textContent = `${count} file${count !== 1 ? 's' : ''} selected`;
            },
            enable: () => {
                continueButton.disabled = false;
            },
            disable: () => {
                continueButton.disabled = true;
            }
        };
    }

    return { init: initBottomButtons }
})();
