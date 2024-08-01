const initExtension = async () => {
  const currentURL = window.location.href;
  const gitIgnoreHandler = GitIgnoreHandler.init();
  let rootDirectoryHandle = null;

  // Init file-selection module
  FileSelection.init(gitIgnoreHandler);

  // Init prompt-generation module
  PromptGeneration.init();

  if (currentURL.includes('pivotaltracker.com')) {
    try {
      await PivotalTracker.init();
    } catch (error) {
      console.error("Error initializing PivotalTracker:", error);
    }
  } else if (currentURL.includes('eastagile.skydeck.ai')) {
    try {
      await Skydeck.init();
    } catch (error) {
      console.error("Error initializing Skydeck:", error);
    }
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openFileSelection") {
      openFileSelectionModal();
    }
  });

  async function openFileSelectionModal(askUserToPickDirectory=true) {
    try {
      if (askUserToPickDirectory) {
        rootDirectoryHandle = await window.showDirectoryPicker();
      }
      if (rootDirectoryHandle) {
        FileSelection.showModal(rootDirectoryHandle, (fileContents) => { showPromptGenerationModal(fileContents) });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("An unexpected error occurred:", error);
      }
    }
  }

  async function showPromptGenerationModal(fileContents) {
    const configs = await Shared.getConfigs();
    PromptGeneration.showModal(
      title = "...",
      description = "...",
      selectedFilesContent = fileContents,
      templates = configs.templates,
      onPreviousBtnClick = async () => { await openFileSelectionModal(false); }
    );
  }
};

initExtension();
