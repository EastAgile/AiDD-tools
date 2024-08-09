const initExtension = async () => {
  const currentURL = window.location.href;
  const gitIgnoreHandler = GitIgnoreHandler.init();

  // Init file-selection module
  FileSelection.init(gitIgnoreHandler);

  // Init prompt-generation module
  PromptGeneration.init();

  // Init file-insertion module
  FileInsertionHandler.init();  

  if (currentURL.includes('pivotaltracker.com')) {
    // Init Pivotal Tracker
    try {
      await PivotalTracker.init();
    } catch (error) {
      console.error("Error initializing PivotalTracker:", error);
    }
  } else if (currentURL.includes('atlassian.net/jira/software/projects/KAN/boards') || currentURL.includes('atlassian.net/browse/')) {
    // Init Jira
    try {
      await Jira.init();
    } catch (error) {
      console.error("Error initializing Jira:", error);
    }
  } else if (currentURL.includes('app.clickup.com')) {
    // Init ClickUp
    try {
      await ClickUp.init();
    } catch (error) {
      console.error("Error initializing ClickUp:", error);
    }    
  } else if (currentURL.includes('eastagile.skydeck.ai')) {
    // Init SkyDeck AI
    try {
      await Skydeck.init();
    } catch (error) {
      console.error("Error initializing SkyDeck AI:", error);
    }
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openFileSelection") {
      showFileSelectionModal(true);
    } else if (request.action === "openFileSelectionWithoutAskingForRootDirectory") {
      showFileSelectionModal();
    } else if (request.action === "triggerFileInsertion") {
      showFileInsertionModal(gitIgnoreHandler);
    }
  });

  async function showFileSelectionModal(askUserForRootDirectory=false) {
    try {
      let rootDirectoryHandle = await Shared.getStoredDirectoryHandle();
      if (askUserForRootDirectory || !rootDirectoryHandle) {
        rootDirectoryHandle = await window.showDirectoryPicker();
        if (rootDirectoryHandle) {
          await Shared.storeDirectoryHandle(rootDirectoryHandle);
        } else {
          throw error("rootDirectoryHandle is null");
        }
      }
      FileSelection.showModal(rootDirectoryHandle, (fileContents) => { showPromptGenerationModal(fileContents) });
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("[AiDD] An unexpected error occurred:", error);
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
      onPreviousBtnClick = async () => { await showFileSelectionModal(); }
    );
  }

  async function showFileInsertionModal(gitIgnoreHandler) {
    try {
      let rootDirectoryHandle = await Shared.getStoredDirectoryHandle();
      if (!rootDirectoryHandle) {
        rootDirectoryHandle = await window.showDirectoryPicker();
        if (rootDirectoryHandle) {
          await Shared.storeDirectoryHandle(rootDirectoryHandle);
        } else {
          throw error("rootDirectoryHandle is null");
        }
      }
      await FileInsertionHandler.showModal(rootDirectoryHandle, gitIgnoreHandler);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("[AiDD] An unexpected error occurred:", error);
      }
    }
  }  
};

initExtension();
