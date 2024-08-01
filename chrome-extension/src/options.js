let templates = [];
let activeTabIndex = 0;

// Saves changes to chrome.storage
function saveChanges() {
    const enableFileSelection = document.getElementById('enableFileSelection').checked;
    const autoSubmitPrompt = document.getElementById('autoSubmitPrompt').checked;
    const currentTemplateIndex = templates.findIndex(t => t.isCurrent);
    const enableApplyChanges = document.getElementById('enableApplyChanges').checked;
    const autoFixGitDiff = document.getElementById('autoFixGitDiff').checked;

    chrome.storage.sync.set(
        { 
            templates: templates,
            currentTemplateIndex: currentTemplateIndex,
            enableFileSelection: enableFileSelection,
            autoSubmitPrompt: autoSubmitPrompt,
            enableApplyChanges: enableApplyChanges,
            autoFixGitDiff: autoFixGitDiff
        },
        function() {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            status.style.opacity = '1';
            setTimeout(function() {
                status.textContent = '';
                status.style.opacity = '0';
            }, 1000);
        }
    );
}

// Restores the options from chrome.storage
async function restoreOptions() {
    try {
        const configs = await Shared.getConfigs();
        document.getElementById('enableFileSelection').checked = configs.enableFileSelection;
        document.getElementById('autoSubmitPrompt').checked = configs.autoSubmitPrompt;
        document.getElementById('enableApplyChanges').checked = configs.enableApplyChanges;
        document.getElementById('autoFixGitDiff').checked = configs.autoFixGitDiff;
        
        templates = configs.templates || [{ name: "Default Template", content: Shared.DEFAULT_PROMPT_TEMPLATE, isCurrent: true }];
        
        // Ensure there's always a current template
        const currentTemplate = templates.find(t => t.isCurrent);
        if (!currentTemplate) {
            templates[0].isCurrent = true;
        }
        
        activeTabIndex = configs.currentTemplateIndex || 0;
        if (activeTabIndex < 0 || activeTabIndex >= templates.length) {
            activeTabIndex = 0;
        }
        
        renderTabs();
        
        await displayCurrentShortcut();
    } catch (error) {
        console.error("Error restoring options:", error);
    }
}

// Render tabs and tab contents
function renderTabs() {
    const tabsContainer = document.querySelector('.tabs');
    const tabContents = document.querySelector('.tab-contents');
    tabsContainer.innerHTML = '';
    tabContents.innerHTML = '';

    templates.forEach((template, index) => {
        // Create tab
        const tab = document.createElement('div');
        tab.className = `tab ${index === activeTabIndex ? 'active' : ''} ${template.isCurrent ? 'current' : ''}`;
        tab.textContent = template.name;
        tab.onclick = (e) => {
            if (e.target !== tab.querySelector('.tab-close')) {
                switchTab(index);
            }
        };

        // Add close button
        const closeButton = document.createElement('span');
        closeButton.className = 'tab-close';
        closeButton.textContent = '×';
        closeButton.onclick = (e) => {
            e.stopPropagation();
            deleteTemplate(index);
        };
        tab.appendChild(closeButton);

        tabsContainer.appendChild(tab);

        // Create tab content
        const content = document.createElement('div');
        content.className = `tab-content ${index === activeTabIndex ? 'active' : ''}`;
        content.innerHTML = `
            <div class="template-header">
                <input type="text" class="template-name-input" value="${template.name}" placeholder="Template Name">
                ${template.isCurrent 
                    ? '<span class="current-template-status">Current Template</span>'
                    : '<button class="set-current-button">Use This Template</button>'
                }
            </div>
            <textarea class="prompt-template" placeholder="Enter your prompt template here...">${template.content}</textarea>
        `;
        tabContents.appendChild(content);

        // Add event listeners
        const nameInput = content.querySelector('.template-name-input');
        nameInput.addEventListener('input', () => {
            templates[index].name = nameInput.value;
            tab.textContent = nameInput.value;
            tab.appendChild(closeButton); // Re-append close button after changing text content
            saveChanges();
        });

        const textarea = content.querySelector('.prompt-template');
        textarea.addEventListener('input', () => {
            templates[index].content = textarea.value;
            saveChanges();
        });

        const setCurrentButton = content.querySelector('.set-current-button');
        if (setCurrentButton != null) {
            setCurrentButton.addEventListener('click', () => {
                if (!template.isCurrent) {
                    templates.forEach(t => t.isCurrent = false);
                    template.isCurrent = true;
                    renderTabs();
                    saveChanges();
                }
            });
        }
    });

    // Add new tab button
    const newTabButton = document.createElement('button');
    newTabButton.className = 'new-tab-button';
    newTabButton.textContent = '+';
    newTabButton.title = 'Add new template';
    newTabButton.onclick = addNewTemplate;
    tabsContainer.appendChild(newTabButton);
}

// Switch active tab
function switchTab(index) {
    activeTabIndex = index;
    renderTabs();
}

// Delete template
function deleteTemplate(index) {
    if (templates.length > 1) {
        const wasCurrentTemplate = templates[index].isCurrent;
        templates.splice(index, 1);
        
        // If the deleted template was the current one, set the first template as current
        if (wasCurrentTemplate) {
            templates[0].isCurrent = true;
            activeTabIndex = 0;
        } else {
            activeTabIndex = Math.min(activeTabIndex, templates.length - 1);
        }
        
        renderTabs();
        saveChanges();
    } else {
        alert("You must have at least one template.");
    }
}

// Add new template
function addNewTemplate() {
    templates.push({ name: `Template ${templates.length + 1}`, content: '', isCurrent: false });
    activeTabIndex = templates.length - 1;
    renderTabs();
    saveChanges();
}

// Resets the options to default
function resetToDefault() {
    templates = [{ name: "Default Template", content: Shared.DEFAULT_PROMPT_TEMPLATE, isCurrent: true }];
    activeTabIndex = 0;
    document.getElementById('enableFileSelection').checked = Shared.DEFAULT_ENABLE_FILE_SELECTION;
    document.getElementById('autoSubmitPrompt').checked = Shared.DEFAULT_AUTO_SUBMIT_PROMPT;
    document.getElementById('enableApplyChanges').checked = Shared.DEFAULT_ENABLE_APPLY_CHANGES;
    document.getElementById('autoFixGitDiff').checked = Shared.DEFAULT_AUTO_FIX_GIT_DIFF;
    renderTabs();
    saveChanges();
}

async function displayCurrentShortcut() {
    try {
        const commands = await chrome.commands.getAll();
        const fileSelectionCommand = commands.find(command => command.name === "open_file_selection");
        
        updateShortcutDisplay(fileSelectionCommand);
    } catch (error) {
        console.error("Error fetching shortcut:", error);
        document.getElementById('fileSelectionShortcut').textContent = 'Error fetching shortcut';
    }
}

function convertShortcutToFullWords(shortcut) {
    if (!shortcut) return 'Not set';
    
    const keyMap = {
        '⌘': 'Command',
        '⇧': 'Shift',
        '⌥': 'Option',
        '⌃': 'Control',
        'Ctrl': 'Control',
        'Alt': 'Alt'
    };

    let parts = shortcut.split('')
        .map(key => keyMap[key] || key.toUpperCase());

    // Check if both Command and Shift are present
    if (parts.includes('Command') && parts.includes('Shift')) {
        // Remove Command and Shift from the array
        parts = parts.filter(part => part !== 'Command' && part !== 'Shift');
        // Add Command and Shift back in the desired order
        parts.unshift('Shift');
        parts.unshift('Command');
    }

    return parts.join(' + ');
}

function updateShortcutDisplay(command) {
    const shortcutElement = document.getElementById('fileSelectionShortcut');
    if (command && command.shortcut) {
        const fullWordShortcut = convertShortcutToFullWords(command.shortcut);
        shortcutElement.textContent = fullWordShortcut;
        shortcutElement.classList.remove('not-set');
    } else if (command) {
        shortcutElement.textContent = 'Not set';
        shortcutElement.classList.add('not-set');
    } else {
        shortcutElement.textContent = 'Command not found';
        shortcutElement.classList.add('not-set');
    }
}

function openShortcutsPage() {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

// Event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('reset').addEventListener('click', resetToDefault);

// Add event listener for the shortcuts link
document.getElementById('shortcutEdit').addEventListener('click', openShortcutsPage);

// Add event listeners for toggle switches
document.getElementById('enableFileSelection').addEventListener('change', saveChanges);
document.getElementById('autoSubmitPrompt').addEventListener('change', saveChanges);
document.getElementById('enableApplyChanges').addEventListener('change', saveChanges);
document.getElementById('autoFixGitDiff').addEventListener('change', saveChanges);
document.getElementById('autoFixGitDiff').addEventListener('change', saveChanges);

// Update shortcut when the options page gains focus
window.addEventListener('focus', () => {
    displayCurrentShortcut();
});
