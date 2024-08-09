chrome.commands.onCommand.addListener((command) => {
  if (command === "open_file_selection") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "openFileSelection"});
    });
  } else if (command === "open_file_selection_without_asking_for_root_directory") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "openFileSelectionWithoutAskingForRootDirectory"});
    });
  } else if (command === "trigger_file_insertion") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "triggerFileInsertion"});
    });
  }
});
