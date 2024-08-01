const PreviewPanel = (function () {

    const styles = `
        .preview-panel {
            display: flex;
            flex-direction: column;
            flex: 1 1 0;
            height: 100%;
            min-width: 400px;
        }

        .preview-panel-title-container {
            height: 20px;
            margin-bottom: 10px;
            font-size: 14px;
            color: #ffffff;
            font-weight: bold;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .preview-panel-loading-indicator {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-left: 10px;
            visibility: hidden;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .content-preview-container {
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            padding: 20px;
            overflow-y: auto;
            flex-grow: 1;
            height: calc(100% - 40px);
            min-height: 100px;
            scrollbar-color: #3e3e3e #1e1e1e;
            scrollbar-width: thin;
            transition: background-color 0.3s ease;
            display: flex;
            align-content: flex-start;
            align-items: stretch;
            gap: 18px;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: flex-start;
        }

        .content-preview-container:not(.preview-disabled) {
            background-color: #1e1e1e;
        }
        .content-preview-container::-webkit-scrollbar-corner {
            background-color: #1e1e1e;
        }
        .content-preview-container::-webkit-scrollbar {
            width: 10px;
        }
        .content-preview-container::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        .content-preview-container::-webkit-scrollbar-thumb {
            background: #3e3e3e;
            border-radius: 5px;
        }
        .content-preview-container::-webkit-scrollbar-thumb:hover {
            background: #4e4e4e;
        }

        .preview-disabled-message {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
            font-size: 14px;
            color: #888;
        }
        .file-content {
            background-color: #2d2d2d;
            border-radius: 4px;
            overflow: hidden;
            display: inline-flex;
            flex-direction: column;
            width: fit-content;
            max-width: 100%;
            transition: width 0.3s ease, margin 0.3s ease;
        }
        .file-content.expanded {
            width: 100%;
            display: block;
        }
        .file-content-header {
            background-color: #383838;
            padding: 10px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            white-space: nowrap;
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        .file-icon {
            margin-right: 8px;
            font-size: 14px;
        }
        .file-content-title {
            display: flex;
            align-items: center;
        }
        .file-content h4 {
            color: #4CAF50;
            margin: 0;
            font-size: 12px;
        }
        .file-content-toggle {
            color: #4CAF50;
            font-size: 9px;
            margin-left: 10px;
        }
        .file-content pre {
            white-space: pre-wrap;
            word-break: break-all;
            padding: 10px;
            margin: 0;
            display: none;
        }
        .file-content.expanded pre {
            display: block;
            line-height: 1.3;
        }
        .file-content:not(.expanded) {
            transition: background-color 0.3s ease, box-shadow 0.3s ease, width 0.3s ease, margin 0.3s ease;
        }
        .file-content:not(.expanded):hover {
            background-color: #3d3d3d;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .file-content:not(.expanded):hover .file-content-header,
        .file-content.expanded .file-content-header:hover {
            background-color: #484848;
        }
        .file-content.expanded .file-content-header {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
    `;

    const initPreviewPanel = () => {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        const previewPanel = document.createElement("div");
        previewPanel.className = "preview-panel";

        const previewTitleContainer = document.createElement("div");
        previewTitleContainer.className = "preview-panel-title-container";

        const previewTitleText = document.createElement("span");
        previewTitleText.textContent = "Preview";
        previewTitleContainer.appendChild(previewTitleText);

        const previewLoadingIndicator = document.createElement("div");
        previewLoadingIndicator.className = "preview-panel-loading-indicator";
        previewTitleContainer.appendChild(previewLoadingIndicator);

        previewPanel.appendChild(previewTitleContainer);

        const contentContainer = document.createElement("div");
        contentContainer.className = "content-preview-container";
        previewPanel.appendChild(contentContainer);

        return {
            html: previewPanel,
            enable: () => {
                contentContainer.classList.remove('preview-disabled');
            },
            disable: () => {
                contentContainer.classList.add('preview-disabled');
                const disabledMessage = document.createElement("div");
                disabledMessage.className = "preview-disabled-message";
                disabledMessage.textContent = "Preview disabled";
                contentContainer.innerHTML = '';
                contentContainer.appendChild(disabledMessage);
            },
            loadContent: async (selectedCheckboxes, rootDirectoryHandle) => {
                contentContainer.innerHTML = "";

                const previewEnabled = localStorage.getItem('previewEnabled') !== 'false';
                if (!previewEnabled) {
                    contentContainer.classList.add('preview-disabled');
                    const disabledMessage = document.createElement("div");
                    disabledMessage.className = "preview-disabled-message";
                    disabledMessage.textContent = "Preview disabled";
                    contentContainer.appendChild(disabledMessage);
                    return;
                } else {
                    contentContainer.classList.remove('preview-disabled');
                }

                if (selectedCheckboxes.length === 0) {
                    return;
                }

                previewLoadingIndicator.style.visibility = "visible";

                for (const checkbox of selectedCheckboxes) {
                    const filePath = checkbox.dataset.path;
                    if (!filePath) {
                        console.error("Checkbox is missing data-path attribute:", checkbox);
                        continue;
                    }

                    try {
                        const entry = await Shared.getFileOrDirectoryHandle(filePath, rootDirectoryHandle);

                        if (entry.kind === "file") {
                            const fileContent = document.createElement("div");
                            fileContent.className = "file-content";

                            const fileContentHeader = document.createElement("div");
                            fileContentHeader.className = "file-content-header";

                            const fileTitleContainer = document.createElement("div");
                            fileTitleContainer.className = "file-content-title";

                            const fileIcon = document.createElement("span");
                            fileIcon.className = "file-icon";
                            fileIcon.textContent = "📄";
                            fileTitleContainer.appendChild(fileIcon);

                            const fileTitleElem = document.createElement("h4");
                            fileTitleElem.textContent = `${filePath}`;
                            fileTitleContainer.appendChild(fileTitleElem);

                            fileContentHeader.appendChild(fileTitleContainer);

                            const toggleButton = document.createElement("span");
                            toggleButton.className = "file-content-toggle";
                            toggleButton.textContent = "▼";
                            fileContentHeader.appendChild(toggleButton);

                            fileContent.appendChild(fileContentHeader);

                            const file = await entry.getFile();
                            const content = await file.text();

                            const contentPre = document.createElement("pre");
                            contentPre.textContent = content;
                            fileContent.appendChild(contentPre);

                            fileContentHeader.addEventListener("click", () => {
                                fileContent.classList.toggle("expanded");
                                toggleButton.textContent = fileContent.classList.contains("expanded") ? "▲" : "▼";
                                if (fileContent.classList.contains("expanded")) {
                                    fileContent.style.width = '100%';
                                } else {
                                    fileContent.style.width = 'auto';
                                }
                            });

                            contentContainer.appendChild(fileContent);
                        }
                    } catch (error) {
                        console.error(`Error reading entry ${filePath}:`, error);
                    }
                }

                previewLoadingIndicator.style.visibility = "hidden";
            }
        }
    }

    return { init: initPreviewPanel }
})();
