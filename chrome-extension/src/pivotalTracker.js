const PivotalTracker = (function () {
    let configs = null;
    const timeout_duration = 200;

    async function initPivotalTracker() {
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

        let rootDirectoryHandle;
        let lastTitle = "";
        let lastDescription = "";
        let lastFileContents = "";

        const addAiDDButton = () => {
            if (document.getElementById("aiddButton")) return;

            const controlsElement = document.querySelector(".selectedStoriesControls__actions");
            if (!controlsElement) return;

            const button = document.createElement("a");
            button.id = "aiddButton";
            button.className = "selectedStoriesControls__button selectedStoriesControls__button--aidd";
            button.title = "Generate AiDD Prompt";
            button.style.display = "inline-flex";
            button.style.alignItems = "center";
            button.style.padding = "0 8px";

            const iconImg = document.createElement("img");
            iconImg.src = chrome.runtime.getURL("images/skydeck_icon.png");
            iconImg.alt = "Skydeck AI Logo";
            iconImg.style.height = "16px";
            iconImg.style.width = "auto";
            iconImg.style.marginRight = "4px";

            const textSpan = document.createElement("span");
            textSpan.textContent = "AiDD Prompt";

            button.appendChild(iconImg);
            button.appendChild(textSpan);

            button.addEventListener("click", handleAiDDButtonClick);

            controlsElement.appendChild(button);
        };

        const handleAiDDButtonClick = async (e) => {
            e.preventDefault();

            const selectedStories = document.querySelectorAll(".StoryPreviewItem__clickToExpand[data-selected=\"true\"]");
            const uniqueTitles = new Set();
            selectedStories.forEach(story => {
                const titleElement = story.querySelector("[data-aid=\"StoryPreviewItem__title\"]");
                if (titleElement) {
                    uniqueTitles.add(titleElement.textContent.trim());
                }
            });

            if (uniqueTitles.size !== 1) {
                alert("Error: Please select exactly one unique story.");
                return;
            }

            const selectedStory = selectedStories[0];

            const previewHeader = selectedStory.querySelector("header[data-aid=\"StoryPreviewItem__preview\"]");
            if (previewHeader) {
                previewHeader.click();
            }

            setTimeout(() => processStory(selectedStory), timeout_duration);
        };

        const processStory = async (storyElement) => {
            const titleElement = storyElement.querySelector("[data-aid=\"StoryPreviewItem__title\"]");
            const title = titleElement ? titleElement.textContent.trim() : "Title not found";

            const storyDetailsEdits = document.querySelectorAll("[data-aid=\"StoryDetailsEdit\"]");
            let correctStoryDetailsEdit = null;

            for (const detailsEdit of storyDetailsEdits) {
                const detailsTitleElement = detailsEdit.querySelector("textarea[data-aid=\"name\"]");
                if (detailsTitleElement && detailsTitleElement.value.trim() === title) {
                    correctStoryDetailsEdit = detailsEdit;
                    break;
                }
            }

            if (correctStoryDetailsEdit) {
                const renderedDescription = correctStoryDetailsEdit.querySelector("[data-aid=\"renderedDescription\"]");

                if (renderedDescription) {
                    const trackerMarkup = renderedDescription.querySelector("span.tracker_markup");
                    if (trackerMarkup) {
                        trackerMarkup.click();
                    }
                }

                setTimeout(async () => {
                    const descriptionTextarea = correctStoryDetailsEdit.querySelector("textarea[data-aid=\"textarea\"]");
                    const description = descriptionTextarea ? descriptionTextarea.value : "Description not found";

                    if (configs.enableFileSelection) {
                        try {
                            rootDirectoryHandle = await window.showDirectoryPicker();
                            if (rootDirectoryHandle) {
                                lastTitle = title;
                                lastDescription = description;
                                showFileSelectionModal();
                            }
                        } catch (error) {
                            if (error.name !== 'AbortError') {
                                console.error("An unexpected error occurred:", error);
                            }
                        }
                    } else {
                        const promptContent = Shared.generateContent(title, description, "...", configs.templates.find(t => t.isCurrent).content);
                        Shared.copyToClipboard(promptContent);
                        Shared.showTooltip(document.getElementById("aiddButton"), "Prompt copied to clipboard!");
                    }

                    const collapseButton = correctStoryDetailsEdit.querySelector("button[title=\"Save & collapse\"]");
                    if (collapseButton) {
                        collapseButton.click();
                    }
                }, timeout_duration);
            }
        };

        async function showFileSelectionModal() {
            await FileSelection.showModal(
                rootDirectoryHandle = rootDirectoryHandle,
                onContinueBtnClick = (fileContents) => {
                    lastFileContents = fileContents;
                    showPromptGenerationModal();
                }
            );
        }

        function showPromptGenerationModal() {
            PromptGeneration.showModal(
                title=lastTitle,
                description=lastDescription,
                selectedFilesContent=lastFileContents,
                templates = configs.templates,
                onPreviousBtnClick = async () => { await showFileSelectionModal() }
            );
        }

        const observeDOM = () => {
            const targetNode = document.body;
            const config = { childList: true, subtree: true };
            const callback = (mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === "childList") {
                        const controlsElement = document.querySelector(".selectedStoriesControls__actions");
                        if (controlsElement && !document.getElementById("aiddButton")) {
                            addAiDDButton();
                            break;
                        }
                    }
                }
            };
            const observer = new MutationObserver(callback);
            observer.observe(targetNode, config);
        };

        observeDOM();
    }

    return { init: initPivotalTracker };
})();
