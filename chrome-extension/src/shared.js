const Shared = (function () {
    const DEFAULT_PROMPT_TEMPLATE = `
I'm working on this Pivotal Tracker story:

<PT Story>
Title: {title}

Description:
{description}
</PT Story>

I will provide you my current source code. Please help me implement this story.

<Current Code>
{selectedFilesContent}
</Current Code>

**General Instructions:**
1. Let's implement the story step by step. I will need to adjust your solution along the way.
2. Ensure the output is production-ready quality code that is clean, optimized, and maintainable.
3. The code should follow best practices and adhere to the project's coding standards.
4. Please present each code change in two formats:
  - Normal text format, with surrounding context so that I know where to place the code.
  - Standard unified Git diff format so that I can apply the code change using Git commands.

**Guidelines for Git Diff Output:**
- Do not include any comments or explanatory text within the diff output.
- Comment lines such as "// ... (rest of the file remains the same)" or "// ... (existing code)" in the diff output are unacceptable.
- Ensure that context lines are 100% accurate, including spaces, empty lines, and brackets.
- Even minor discrepancies in context lines can prevent the diff from being applied successfully.
- Preserve exact indentation for all added, removed, and context lines as they appear in the file.
- Use "+" for added lines, "-" for removed lines, and a space for context lines.
- Please understand that: Incorrect context lines or misuse of symbols (e.g., using "+" for context lines) will prevent us from applying your Git diff output.
`.trim();

    const DEFAULT_ENABLE_FILE_SELECTION = true;
    const DEFAULT_AUTO_SUBMIT_PROMPT = false;
    const DEFAULT_ENABLE_APPLY_CHANGES = true;
    const DEFAULT_AUTO_FIX_GIT_DIFF = true;
    const DEFAULT_HIDE_FILE_CONTENTS = true;

    function getConfigs() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(
                {
                    templates: [{ name: "Default Template", content: DEFAULT_PROMPT_TEMPLATE, isCurrent: true }],
                    currentTemplateIndex: 0,
                    enableFileSelection: DEFAULT_ENABLE_FILE_SELECTION,
                    autoSubmitPrompt: DEFAULT_AUTO_SUBMIT_PROMPT,
                    enableApplyChanges: DEFAULT_ENABLE_APPLY_CHANGES,
                    autoFixGitDiff: DEFAULT_AUTO_FIX_GIT_DIFF,
                    hideFileContents: DEFAULT_HIDE_FILE_CONTENTS
                },
                function (items) {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        // Ensure there's always at least one template
                        if (!items.templates || items.templates.length === 0) {
                            items.templates = [{ name: "Default Template", content: DEFAULT_PROMPT_TEMPLATE, isCurrent: true }];
                            items.currentTemplateIndex = 0;
                        }

                        // Ensure currentTemplateIndex is valid
                        if (items.currentTemplateIndex < 0 || items.currentTemplateIndex >= items.templates.length) {
                            items.currentTemplateIndex = 0;
                        }

                        // Ensure the promptTemplate is always set
                        items.promptTemplate = items.templates[items.currentTemplateIndex].content;

                        // Ensure there's always a current template
                        const currentTemplate = items.templates.find(t => t.isCurrent);
                        if (!currentTemplate) {
                            items.templates[0].isCurrent = true;
                        }

                        resolve(items);
                    }
                }
            );
        });
    }

    function setAiddPrompt(content) {
        return new Promise((resolve, reject) => {
            const promptData = {
                content: content,
                timestamp: Date.now()
            };
            chrome.storage.local.set({ 'aiddPrompt': promptData }, function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    function getAiddPrompt() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['aiddPrompt'], function (result) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result.aiddPrompt);
                }
            });
        });
    }

    function clearAiddPrompt() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove('aiddPrompt', function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    async function getFileOrDirectoryHandle(path, rootDirectoryHandle) {
        if (!path) {
            throw new Error("Path is undefined");
        }

        if (!rootDirectoryHandle) {
            throw new Error("Root directory not selected");
        }

        if (path === "root") {
            return rootDirectoryHandle;
        }

        const pathParts = path.split("/");
        let currentHandle = rootDirectoryHandle;

        for (const part of pathParts) {
            if (part === "") continue;
            try {
                currentHandle = await currentHandle.getDirectoryHandle(part);
            } catch {
                try {
                    currentHandle = await currentHandle.getFileHandle(part);
                } catch {
                    throw new Error(`Unable to find file or directory: ${path}`);
                }
            }
        }
        return currentHandle;
    };

    function showTooltip(element, message) {
        const tooltip = document.createElement("div");
        tooltip.textContent = message;
        tooltip.style.position = "absolute";
        tooltip.style.backgroundColor = "rgba(0,0,0,0.7)";
        tooltip.style.color = "white";
        tooltip.style.padding = "5px 10px";
        tooltip.style.borderRadius = "3px";
        tooltip.style.fontSize = "10px";
        tooltip.style.whiteSpace = "nowrap";
        tooltip.style.top = "100%";
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)";
        tooltip.style.zIndex = "10001";

        element.style.position = "relative";
        element.appendChild(tooltip);

        setTimeout(() => {
            element.removeChild(tooltip);
        }, 2000);
    };

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Do nothing
        }).catch(err => {
            console.error("Failed to copy: ", err);
        });
    };
    
    function generateContent(title, description, selectedFilesContent, template) {
        return template
            .replace("{title}", title)
            .replace("{description}", description)
            .replace("{selectedFilesContent}", selectedFilesContent);
    };

    async function storeDirectoryHandle(handle) {
        await IDBKeyval.set('rootDirectoryHandle', handle);
    }

    async function getStoredDirectoryHandle() {
        const handle = await IDBKeyval.get('rootDirectoryHandle');
        if (handle && await verifyDirectoryHandle(handle)) {
            return handle;
        }
        return null;
    }

    async function verifyDirectoryHandle(handle) {
        try {
            // Attempt to query the directory to ensure it is still usable and has read permissions
            for await (const _ of handle.values()) {
                return true;
            }
        } catch (error) {
            console.log("[AiDD] Directory handle is no longer valid or lacks read permissions:", error);
            return false;
        }
        return false;
    }

    return {
        getConfigs: getConfigs,
        setAiddPrompt: setAiddPrompt,
        getAiddPrompt: getAiddPrompt,
        clearAiddPrompt: clearAiddPrompt,
        getFileOrDirectoryHandle: getFileOrDirectoryHandle,
        showTooltip: showTooltip,
        copyToClipboard: copyToClipboard,
        generateContent: generateContent,
        storeDirectoryHandle: storeDirectoryHandle,
        getStoredDirectoryHandle: getStoredDirectoryHandle,        
        DEFAULT_PROMPT_TEMPLATE: DEFAULT_PROMPT_TEMPLATE,
        DEFAULT_ENABLE_FILE_SELECTION: DEFAULT_ENABLE_FILE_SELECTION,
        DEFAULT_AUTO_SUBMIT_PROMPT: DEFAULT_AUTO_SUBMIT_PROMPT,
        DEFAULT_ENABLE_APPLY_CHANGES: DEFAULT_ENABLE_APPLY_CHANGES,
        DEFAULT_AUTO_FIX_GIT_DIFF: DEFAULT_AUTO_FIX_GIT_DIFF,
        DEFAULT_HIDE_FILE_CONTENTS: DEFAULT_HIDE_FILE_CONTENTS,
    };
})();
