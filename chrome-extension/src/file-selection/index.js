const FileSelection = (function () {

    const styles = `
        .file-selection-modal-wrapper {
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
        .file-selection-modal {
            position: relative;
            background-color: #2b2b2b;
            color: #e0e0e0;
            padding: 20px 20px 20px 0;
            border-radius: 8px;
            width: 90%;
            max-width: 1400px;
            height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            font-size: 12px;
        }

        .file-selection-modal pre::-webkit-scrollbar {
            width: 10px;
        }
        .file-selection-modal pre::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        .file-selection-modal pre::-webkit-scrollbar-thumb {
            background: #3e3e3e;
            border-radius: 5px;
        }
        .file-selection-modal pre::-webkit-scrollbar-thumb:hover {
            background: #4e4e4e;
        }

        .split-view {
            display: flex;
            justify-content: space-between;
            flex-grow: 1;
            overflow: hidden;
            height: calc(100% - 80px);
        }
    `;

    let _gitIgnorehandler = null;

    function initFileSelection(gitIgnorehandler) {
        _gitIgnorehandler = gitIgnorehandler;

        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    async function showModal(rootDirectoryHandle, onContinueBtnClick) {
        const entries = await _gitIgnorehandler.getFilesAndFolders(rootDirectoryHandle, rootDirectoryHandle);

        const modalWrapper = document.createElement("div");
        modalWrapper.className = "file-selection-modal-wrapper";
        modalWrapper.addEventListener("click", (event) => {
            if (event.target === modalWrapper) {
                document.body.removeChild(modalWrapper);
            }
        });

        const modal = document.createElement("div");
        modal.className = "file-selection-modal";

        const splitViewContainer = document.createElement("div");
        splitViewContainer.className = "split-view";

        const fileTreePanel = FileTreePanel.init(
            rootDirectoryHandle.name, entries,
            onBeginCheckboxChange = () => {
                disableAllInteractiveElements(modal);
            },
            onFinishCheckboxChange = async (numOfSelectedFiles) => {
                bottomButtons.updateSelectedFilesCounter(numOfSelectedFiles);
                await previewPanel.loadContent(getSelectedCheckboxes(modal), rootDirectoryHandle);
                enableAllInteractiveElements(modal);
            }
        );
        fileTreePanel.renderTree();

        const resizer = Resizer.init(fileTreePanel.html);

        const verticalIconButtons = VerticalIconButtons.init(
            onSelectAllBtnClick = () => {
                fileTreePanel.selectAll(
                    onBegin = () => { disableAllInteractiveElements(modal) },
                    onFinish = async (numOfSelectedFiles) => {
                        bottomButtons.updateSelectedFilesCounter(numOfSelectedFiles);
                        await previewPanel.loadContent(getSelectedCheckboxes(modal), rootDirectoryHandle);
                        enableAllInteractiveElements(modal);
                    }
                )
            },
            onDeselectAllBtnClick = () => {
                fileTreePanel.deselectAll(
                    onBegin = () => { disableAllInteractiveElements(modal) },
                    onFinish = async (numOfSelectedFiles) => {
                        bottomButtons.updateSelectedFilesCounter(numOfSelectedFiles);
                        await previewPanel.loadContent(getSelectedCheckboxes(modal), rootDirectoryHandle);
                        enableAllInteractiveElements(modal);
                    }
                )
            },
            onExpandAllBtnClick = () => { fileTreePanel.expandAll() },
            onCollapseAllBtnClick = () => { fileTreePanel.collapseAll() }
        );

        const previewPanel = PreviewPanel.init();

        splitViewContainer.appendChild(verticalIconButtons.html);
        splitViewContainer.appendChild(fileTreePanel.html);
        splitViewContainer.appendChild(resizer.html);
        splitViewContainer.appendChild(previewPanel.html);

        // Apply the saved ratio or use the default
        const savedRatio = localStorage.getItem('fileTreeResizerRatio');
        if (savedRatio) {
            fileTreePanel.setFlexValue(`0 0 ${savedRatio}%`);
        } else {
            fileTreePanel.setFlexValue("0 0 41%");
        }

        modal.appendChild(splitViewContainer);

        const bottomButtons = BottomButtons.init(
            onEnablePreviewButtonToggled = async (newState) => {
                localStorage.setItem('previewEnabled', newState);
                if (newState) {
                    previewPanel.enable();
                    disableAllInteractiveElements(modal);
                    await previewPanel.loadContent(getSelectedCheckboxes(modal), rootDirectoryHandle);
                    enableAllInteractiveElements(modal);
                } else {
                    previewPanel.disable();
                }
            },
            onContinueButtonClick = async (continueButton) => {
                try {
                    const selectedFiles = getSelectedFiles(modal);
                    localStorage.setItem('lastSelectedFiles', JSON.stringify(selectedFiles));
                    fileContents = await readSelectedFiles(selectedFiles, rootDirectoryHandle);

                    if (document.body.contains(modalWrapper)) {
                        document.body.removeChild(modalWrapper);
                    }
                    
                    await onContinueBtnClick(fileContents);
                } catch (error) {
                    console.error("Error processing files:", error);
                    Shared.showTooltip(continueButton, "Error processing files. Please try again.");
                }
            },
            onCloseButtonClick = () => { 
                if (document.body.contains(modalWrapper)) {
                    document.body.removeChild(modalWrapper);
                }
            }
        );
        modal.appendChild(bottomButtons.html);

        modalWrapper.appendChild(modal);
        document.body.appendChild(modalWrapper);

        const restoreSelectionsAndUpdateUI = async () => {
            disableAllInteractiveElements(modal);

            await fileTreePanel.applySavedSelection();

            if (localStorage.getItem('previewEnabled') !== 'false') {
                previewPanel.enable();
                await previewPanel.loadContent(getSelectedCheckboxes(modal), rootDirectoryHandle);
            } else {
                previewPanel.disable();
            }

            bottomButtons.updateSelectedFilesCounter(fileTreePanel.getNumOfSelectedFiles());

            enableAllInteractiveElements(modal);
        }

        restoreSelectionsAndUpdateUI();

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && document.body.contains(modalWrapper)) {
                document.body.removeChild(modalWrapper);             
            }
        }, { once: true });

        return entries;
    }

    function enableAllInteractiveElements(modal) {
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        const buttons = modal.querySelectorAll('button');

        checkboxes.forEach(checkbox => checkbox.disabled = false);
        buttons.forEach(button => button.disabled = false);
    }

    function disableAllInteractiveElements(modal) {
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        const buttons = modal.querySelectorAll('button');

        checkboxes.forEach(checkbox => checkbox.disabled = true);
        buttons.forEach(button => button.disabled = true);
    }

    function getSelectedCheckboxes(modal) {
        return Array.from(modal.querySelectorAll("input[type=\"checkbox\"]:checked"))
            .filter(cb => !cb.indeterminate && cb.dataset.path !== "root");
    }

    function getSelectedFiles(modal) {
        return Array.from(modal.querySelectorAll("input[type=\"checkbox\"]:checked"))
            .filter(cb => !cb.indeterminate && cb.dataset.path !== "root")
            .map(cb => cb.dataset.path);
    }

    async function readSelectedFiles(selectedFiles, rootDirectoryHandle) {
        const fileContents = [];

        for (const filePath of selectedFiles) {
            const entry = await Shared.getFileOrDirectoryHandle(filePath, rootDirectoryHandle);
            if (entry.kind === "file") {
                const file = await entry.getFile();
                const content = await file.text();
                fileContents.push(`==> ${rootDirectoryHandle.name}/${filePath} <==\n${content}\n`);
            }
        }

        return fileContents.join("\n");
    };

    return {
        init: initFileSelection,
        showModal: showModal
    };
})();
