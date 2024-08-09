GitDiffHandler = (function () {
    const CODE_BLOCK_SELECTOR = 'div.code-block';

    const ICONS = {
        applyChanges: `
            <svg focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M21 2L29 10 10 29 3 29 3 22 21 2zM21 5.41L5.41 21 7 22.59 22.59 7 21 5.41zM5 27L9 27 9 23 5 23 5 27z"></path>
            </svg>
        `
    };

    const styles = `
        .aidd-button-container {
            display: flex;
            align-items: center;
        }
        .aidd-apply-changes-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
            margin-right: 4px;
        }
        .aidd-apply-changes-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .aidd-apply-changes-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        .aidd-apply-changes-button svg {
            width: 16px;
            height: 16px;
        }
        .aidd-tooltip {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            background-color: #f4f4f4;
            color: #161616;
            padding: 1px 15px;
            border-radius: 2px;
            font-size: 14px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s, visibility 0.2s;
            pointer-events: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .aidd-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 4px;
            border-style: solid;
            border-color: #f4f4f4 transparent transparent transparent;
        }
        .aidd-apply-changes-wrapper:hover .aidd-tooltip {
            opacity: 1;
            visibility: visible;
        }
        .aidd-progress-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .aidd-progress-title {
            margin-top: 0;
            font-size: 19px;
            font-weight: bold;
        }
        .aidd-progress-content {
            position: relative;
            background-color: #1e1e1e;
            color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            width: 680px;
            word-wrap: break-word;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        #aidd-progress-text {
            font-size: 14px;
            margin-top: 4px;
            color: rgb(152, 195, 121);
        }
        .aidd-close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: transparent;
            border: none;
            color: #b0b0b0;
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            border-radius: 4px;
        }
        .aidd-close-button:hover {
            color: #ffffff;
            background-color: rgba(255, 255, 255, 0.1);
        }
        .aidd-progress-bar {
            width: 100%;
            height: 20px;
            background-color: #333333;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 15px;
        }
        .aidd-progress-bar-inner {
            width: 0%;
            height: 100%;
            background-color: #0f62fe;
            transition: width 0.3s ease-in-out;
        }
        .aidd-progress-message {
            font-size: 14px;
            margin-top: 25px;
            text-align: center;
        }
        .aidd-progress-error {
            color: rgb(224, 108, 117);
        }
        .aidd-progress-error strong {
            margin-left: 3px;
        }
        .aidd-apply-changes-button {
            position: relative;
        }
        .aidd-apply-changes-button.loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .aidd-apply-changes-button.loading::before {
            content: '';
            width: 16px;
            height: 16px;
            border: 2px solid #ccc;
            border-top: 2px solid #333;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
        }
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .aidd-progress-error details {
            background-color: rgba(255, 77, 77, 0.1);
            border: 1px solid #1e1e1e;
            border-radius: 4px;
            padding: 10px;
        }

        .aidd-progress-error summary {
            font-weight: normal;
            display: inline-block;
            margin-left: 5px;
        }

        .aidd-progress-error summary::marker {
            content: '';
        }

        .aidd-progress-error summary::before {
            content: '▶';
            display: inline-block;
            margin-right: 5px;
            transition: transform 0s;
        }

        .aidd-progress-error details[open] summary::before {
            transform: rotate(90deg);
        }

        .aidd-progress-error pre {
            background-color: rgba(0, 0, 0, 0.1);
            padding: 10px;
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
            overflow-x: auto;
            font-weight: normal;
            color: #ffffff;
        }

        .aidd-progress-error pre::-webkit-scrollbar {
            height: 8px;
            background-color: #1e1e1e;
        }

        .aidd-progress-error pre::-webkit-scrollbar-thumb {
            background-color: #3e3e3e;
            border-radius: 4px;
        }

        .aidd-progress-error pre::-webkit-scrollbar-thumb:hover {
            background-color: #4e4e4e;
        }

        .aidd-progress-error pre {
            scrollbar-width: thin;
            scrollbar-color: #3e3e3e #1e1e1e;
        }

        .aidd-code-block {
            display: flex;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.5;
            margin-bottom: 10px;
            background-color: #1e1e1e;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
        }

        .aidd-line-numbers {
            padding-right: 10px;
            text-align: right;
            user-select: none;
            color: #666;
        }

        .aidd-code-content {
            flex-grow: 1;
            white-space: pre;
            overflow-x: auto;
        }

        .aidd-fix-git-diff-container {
            margin: 15px 0 5px 3px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.4;
        }

        .aidd-fix-git-diff-text {
            color: rgb(224, 108, 117);
        }

        .aidd-fix-git-diff-link {
            color: rgb(152, 195, 121);
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .aidd-fix-git-diff-link:hover,
        .aidd-fix-git-diff-link:active {
            color: rgb(172, 215, 141);
            text-decoration: underline;
        }

        .aidd-error-details {
            max-height: 450px;
            overflow-y: auto;
            margin: 10px 0;
            padding: 0 10px;
        }

        .aidd-error-details::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        .aidd-error-details::-webkit-scrollbar-thumb {
            background-color: #3e3e3e;
            border-radius: 4px;
        }

        .aidd-error-details::-webkit-scrollbar-thumb:hover {
            background-color: #4e4e4e;
        }

        .aidd-error-details {
            scrollbar-width: thin;
            scrollbar-color: #3e3e3e transparent;
        }

        .aidd-error-content {
            min-width: 100%;
            width: max-content;
        }
    `;

    let progressOverlay;
    let progressBar;
    let progressText;
    let progressMessage;

    let rootHandle = null;
    let configs = null;

    const GitDiffStore = (function () {
        let parsedGitDiff = [];
        let currentFileIndex = 0;
        let processedFiles = new Set();
        let currentFileContent = '';
        let currentFileMismatches = [];

        return {
            setGitDiff: function (diff) {
                parsedGitDiff = parseGitDiff(diff);
                currentFileIndex = 0;
                processedFiles.clear();
            },
            updateCurrentFileDiff: function (correctedDiff) {
                parsedGitDiff[currentFileIndex] = correctedDiff;
            },
            getCurrentFileIndex: function () {
                return currentFileIndex;
            },
            getCurrentFileDiff: function () {
                return parsedGitDiff[currentFileIndex];
            },
            moveToNextFile: function () {
                currentFileIndex++;
                return currentFileIndex < parsedGitDiff.length;
            },
            setCurrentFileContent: function (content) {
                currentFileContent = content;
            },
            getCurrentFileContent: function () {
                return currentFileContent;
            },
            setCurrentFileMismatches: function (mismatches) {
                currentFileMismatches = mismatches;
            },
            getCurrentFileMismatches: function () {
                return currentFileMismatches;
            },
            markFileAsProcessed: function (fileIndex) {
                processedFiles.add(fileIndex);
            },
            isFileProcessed: function (fileIndex) {
                return processedFiles.has(fileIndex);
            },
            getProgress: function () {
                const total = parsedGitDiff.length;
                const fileProgress = total > 0 ? (currentFileIndex / total) : 0;
                return {
                    current: currentFileIndex + 1,
                    total: total,
                    fileProgress: fileProgress,
                    overallPercentage: fileProgress * 100
                };
            },
            reset: function () {
                currentFileIndex = 0;
                processedFiles.clear();
            }
        };
    })();

    async function initGitDiffHandler(initialConfigs) {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        configs = initialConfigs;

        if (configs.enableApplyChanges) {
            observeCodeBlocks();
        }
    }

    function updateConfigs(newConfigs) {
        configs = newConfigs;
    }

    function observeCodeBlocks() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const observer = new MutationObserver((mutationsList) => {
            processMutations(mutationsList);
        });

        observer.observe(targetNode, config);
    }

    function processMutations(mutationsList) {
        const addedNodes = [];
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                addedNodes.push(...mutation.addedNodes);
            }
        }

        const codeBlocks = addedNodes
            .filter(node => node.nodeType === Node.ELEMENT_NODE)
            .flatMap(node => {
                if (node.matches(CODE_BLOCK_SELECTOR)) return [node];
                return Array.from(node.querySelectorAll(CODE_BLOCK_SELECTOR));
            })
            .filter(isGitDiffBlock);

        codeBlocks.forEach(addApplyChangesButton);
    }

    function isGitDiffBlock(codeBlock) {
        const content = codeBlock.querySelector('pre > code').textContent.trim();

        const gitDiffPatterns = new Set([
            /^diff --git/m,
            /^index [0-9a-f]{7}\.\.[0-9a-f]{7}/m,
            /^similarity index \d+%/m,
            /^--- a\//m,
            /^--- \/dev\/null/m,
            /^\+\+\+ b\//m,
            /^\+\+\+ \/dev\/null/m,
            /@@ -\d+,\d+ \+\d+,\d+ @@/m,
            /^deleted file mode \d+/m,
            /^new file mode \d+/m,
            /^rename from /m,
            /^rename to /m,
        ]);

        const matchCount = Array.from(gitDiffPatterns).filter(pattern => pattern.test(content)).length;
        if (matchCount < 3) return false;

        const codeElement = codeBlock.querySelector('pre > code');
        if (!codeElement) return false;

        const hasGitDiffClass = codeElement.classList.contains('language-diff') ||
            codeElement.classList.contains('hljs-diff') ||
            codeElement.getAttribute('data-language') === 'diff';

        return hasGitDiffClass || matchCount >= 4;
    }

    function addApplyChangesButton(codeBlock) {
        const blockHeader = codeBlock.querySelector('.block-header');
        if (!blockHeader) return;

        const buttonContainer = blockHeader.querySelector('div');
        if (!buttonContainer || buttonContainer.querySelector('.aidd-apply-changes-wrapper')) return;

        buttonContainer.classList.add('aidd-button-container');

        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'aidd-apply-changes-wrapper';

        const applyButton = document.createElement('button');
        applyButton.className = 'aidd-apply-changes-button';
        applyButton.innerHTML = ICONS.applyChanges;
        applyButton.addEventListener('click', async (event) => {
            event.target.classList.add('loading');
            try {
                const gitDiffContent = extractGitDiffContent(codeBlock);
                if (gitDiffContent) {
                    await applyChanges(gitDiffContent);
                } else {
                    throw new Error('No git diff content found.');
                }
            } catch (error) {
                handleApplyChangesError(error);
            } finally {
                event.target.classList.remove('loading');
            }
        });

        const tooltip = document.createElement('span');
        tooltip.className = 'aidd-tooltip';
        tooltip.textContent = 'Apply changes';

        buttonWrapper.appendChild(applyButton);
        buttonWrapper.appendChild(tooltip);
        buttonContainer.insertBefore(buttonWrapper, buttonContainer.firstChild);
    }

    function extractGitDiffContent(codeBlock) {
        const codeElement = codeBlock.querySelector('pre > code');
        return codeElement ? codeElement.textContent.trim() : null;
    }

    async function applyChanges(gitDiffContent) {
        try {
            await selectRootDirectory();

            showProgressOverlay();
            GitDiffStore.setGitDiff(gitDiffContent);
            GitDiffStore.reset();

            const success = await processAllChanges();

            if (success) {
                updateProgress(100, 'All changes were applied successfully!');
            }
        } catch (error) {
            handleApplyChangesError(error);
        }
    }

    async function processAllChanges() {
        let allSuccessful = true;
        while (true) {
            const currentFileDiff = GitDiffStore.getCurrentFileDiff();
            if (!currentFileDiff) break;

            const progress = GitDiffStore.getProgress();
            updateProgress(
                progress.overallPercentage,
                `${currentFileDiff.newPath || currentFileDiff.oldPath} (${progress.current}/${progress.total})`
            );

            if (!GitDiffStore.isFileProcessed(progress.current - 1)) {
                try {
                    const success = await processChange(currentFileDiff);
                    if (success) {
                        GitDiffStore.markFileAsProcessed(progress.current - 1);
                    } else {
                        allSuccessful = false;
                        break;
                    }
                } catch (error) {
                    allSuccessful = false;
                    throw error; // This will be caught in applyChanges
                }
            }

            if (!GitDiffStore.moveToNextFile()) break;
        }
        return allSuccessful;
    }

    async function selectRootDirectory() {
        try {
            rootHandle = await window.showDirectoryPicker();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Directory selection was cancelled');
            }
            throw error;
        }
    }

    async function processChange(change) {
        switch (change.type) {
            case 'add':
            case 'modify':
                return await handleModifyOrAddChange(change);
            case 'delete':
                return await handleDeleteChange(change);
            case 'rename':
                return await handleRenameChange(change);
            default:
                handleApplyChangesError({ 'message': `Unknown change type: ${change.type}` });
                return false;
        }
    }

    function removeRootDirectoryFromPath(path) {
        const rootName = rootHandle.name;
        if (path.startsWith(rootName + '/')) {
            return path.slice(rootName.length + 1);
        }
        return path;
    }

    function showHunkMismatchError(fullPath, mismatches) {
        let errorTitle = `The file "${fullPath.split('/').pop()}" doesn't match with Git Diff`;
        let errorDetails = "The current content of the file doesn't match with Git Diff.\n- Either Git Diff (provided by AI) was incorrect\n- Or the file has been modified since the Git Diff was generated.\n";

        mismatches.forEach((mismatch, index) => {
            errorDetails += `\n========================== Mismatch ${index + 1} at line ${mismatch.hunkStart} ============================\n\n`;
            errorDetails += `Git Diff expects the file to contain this hunk:`;
            errorDetails += createCodeBlockWithLineNumbers(mismatch.expected, mismatch.hunkStart);
            errorDetails += `However the file shows:`;
            errorDetails += createCodeBlockWithLineNumbers(mismatch.actual, mismatch.hunkStart);
        });

        throw new Error(`${errorTitle}\n\n${errorDetails}`);
    }

    function createCodeBlockWithLineNumbers(content, startLine = 1) {
        const lines = content.split('\n');
        let result = '<div class="aidd-code-block">';
        result += '<div class="aidd-line-numbers">';
        for (let i = 0; i < lines.length; i++) {
            result += `${startLine + i}<br>`;
        }
        result += '</div>';
        result += '<div class="aidd-code-content">';
        result += lines.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        result += '</div></div>';
        return result;
    }

    async function handleModifyOrAddChange(change) {
        const relativePath = removeRootDirectoryFromPath(change.newPath);
        const fullPath = '/' + relativePath;

        await ensureDirectoryExists(relativePath);

        if (change.type === 'add') {
            // For new files, just write the content
            const content = change.hunks.flatMap(hunk =>
                hunk.lines.filter(line => line[0] === '+' || (line[0] !== '+' && line[0] !== '-'))
                    .map(line => line.substr(1))
            ).join('\n');
            await writeNewContent(relativePath, content);
        } else {
            // Handle modify case
            try {
                const actualContent = await readActualFileContent(relativePath);
                GitDiffStore.setCurrentFileContent(actualContent);
                const result = await verifyAndApplyHunks(actualContent, change.hunks, fullPath);
                if (!result.success) {
                    GitDiffStore.setCurrentFileMismatches(result.mismatches);
                    showHunkMismatchError(fullPath, result.mismatches);
                    return false;
                }
                await writeNewContent(relativePath, result.content);
            } catch (error) {
                if (error.name === 'NotFoundError') {
                    throw Error(`The file was not found in the selected directory`);
                } else {
                    throw error;
                }
            }
        }
        return true;
    }

    async function verifyAndApplyHunks(actualContent, hunks, fullPath) {
        const lines = actualContent.split('\n');
        let mismatches = [];

        // Verify all hunks first
        for (const hunk of hunks) {
            const actualHunkLines = lines.slice(hunk.oldStart - 1, hunk.oldStart - 1 + hunk.oldLines);
            const expectedHunkLines = hunk.lines.filter(line => line[0] === '-' || (line[0] !== '+' && line[0] !== '-')).map(line => line.substr(1));

            if (!arraysEqual(actualHunkLines, expectedHunkLines)) {
                mismatches.push({
                    hunkStart: hunk.oldStart,
                    expected: expectedHunkLines.join('\n'),
                    actual: actualHunkLines.join('\n'),
                });
            }
        }

        // If there are mismatches, return without applying changes
        if (mismatches.length > 0) {
            return { success: false, mismatches };
        }

        // If verification succeeded, apply all hunks
        let updatedLines = [...lines];

        for (const hunk of hunks) {
            const expectedHunkLines = hunk.lines.filter(line => line[0] === '-' || (line[0] !== '+' && line[0] !== '-')).map(line => line.substr(1));
            const newStart = findCorrectStartLine(updatedLines, expectedHunkLines);

            if (newStart === -1) {
                throw new Error(`Unable to find the correct start line for hunk in file ${fullPath}`);
            }

            const newHunkLines = hunk.lines.filter(line => line[0] === '+' || (line[0] !== '+' && line[0] !== '-')).map(line => line.substr(1));
            updatedLines.splice(newStart - 1, hunk.oldLines, ...newHunkLines);
        }

        return { success: true, content: updatedLines.join('\n') };
    }

    function findCorrectStartLine(fileLines, expectedLines) {
        for (let i = 0; i <= fileLines.length - expectedLines.length; i++) {
            if (arraysEqual(fileLines.slice(i, i + expectedLines.length), expectedLines)) {
                return i + 1; // +1 because diff lines are 1-indexed
            }
        }
        return -1; // If no match found
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].trimStart().trimEnd() !== b[i].trimStart().trimEnd()) return false;
        }
        return true;
    }

    async function handleDeleteChange(change) {
        const relativePath = removeRootDirectoryFromPath(change.oldPath);
        const fullPath = '/' + relativePath;

        try {
            await deleteFile(relativePath);
            return true;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log(`[INFO] File ${relativePath} already deleted. Skipping delete operation.`);
                return true;
            } else {
                throw new Error(`Failed to delete file ${relativePath}.</br>${error}`);
            }
        }
    }

    async function handleRenameChange(change) {
        if (!change.oldPath || !change.newPath) {
            throw new Error('Invalid rename operation: missing old or new path');
        }

        const oldRelativePath = removeRootDirectoryFromPath(change.oldPath);
        const newRelativePath = removeRootDirectoryFromPath(change.newPath);

        try {
            // Get the directory handles for both old and new paths
            const oldDirPath = oldRelativePath.split('/').slice(0, -1).join('/');
            const newDirPath = newRelativePath.split('/').slice(0, -1).join('/');
            const oldFileName = oldRelativePath.split('/').pop();
            const newFileName = newRelativePath.split('/').pop();

            let oldDirHandle = rootHandle;
            for (const part of oldDirPath.split('/')) {
                if (part) {
                    oldDirHandle = await oldDirHandle.getDirectoryHandle(part, { create: false });
                }
            }

            let newDirHandle = rootHandle;
            for (const part of newDirPath.split('/')) {
                if (part) {
                    newDirHandle = await newDirHandle.getDirectoryHandle(part, { create: true });
                }
            }

            // Get the file handle for the old file
            const oldFileHandle = await oldDirHandle.getFileHandle(oldFileName);

            // Read the content of the old file
            const file = await oldFileHandle.getFile();
            const content = await file.text();

            // Create a new file with the new name and write the content
            const newFileHandle = await newDirHandle.getFileHandle(newFileName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            // Remove the old file
            await oldDirHandle.removeEntry(oldFileName);

            return true;
        } catch (error) {
            throw new Error(`Failed to rename file from ${oldRelativePath} to ${newRelativePath}.</br>${error}`);
        }
    }

    async function ensureDirectoryExists(filePath) {
        const dirPath = filePath.split('/').slice(0, -1).join('/');
        if (dirPath) {
            let currentHandle = rootHandle;
            for (const part of dirPath.split('/')) {
                currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
            }
        }
    }

    async function readActualFileContent(relativePath) {
        try {
            const fileHandle = await getFileHandle(relativePath);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            console.log(`[Error] Reading file ${relativePath}:`, error);
            throw error;
        }
    }

    async function getFileHandle(relativePath) {
        const pathParts = relativePath.split('/');
        let currentHandle = rootHandle;

        for (let i = 0; i < pathParts.length - 1; i++) {
            currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
        }

        return await currentHandle.getFileHandle(pathParts[pathParts.length - 1]);
    }

    async function writeNewContent(relativePath, content) {
        try {
            let currentHandle = rootHandle;
            const parts = relativePath.split('/');
            for (let i = 0; i < parts.length - 1; i++) {
                currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create: true });
            }
            const fileHandle = await currentHandle.getFileHandle(parts[parts.length - 1], { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
        } catch (writeError) {
            console.log(`[Error] Writing file ${relativePath}:`, writeError);
            throw new Error(`Failed to write file ${relativePath}. ${writeError}`);
        }
    }

    async function deleteFile(relativePath) {
        try {
            const pathParts = relativePath.split('/');
            let currentHandle = rootHandle;

            // Navigate to the directory containing the file
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
            }

            // Delete the file
            await currentHandle.removeEntry(pathParts[pathParts.length - 1]);
        } catch (error) {
            throw error;
        }
    }

    function handleApplyChangesError(error) {
        if (error.message.includes("The current content of the file doesn't match with Git Diff")) {
            if (configs && configs.autoFixGitDiff) {
                handleFixGitDiff()
            } else {
                showErrorMessage(`Error: ${error.message}`)        
            }
        } else {
            showErrorMessage(`Error: ${error.message}`)
        }
    }

    function preprocessDiffContent(diffContent) {
        const lines = diffContent.split('\n');
        const processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            processedLines.push(lines[i]);
            
            if (lines[i].startsWith('similarity index ') &&
                lines[i + 1]?.startsWith('rename from ') &&
                lines[i + 2]?.startsWith('rename to ')) {
                
                const oldPath = lines[i + 1].substring('rename from '.length);
                const newPath = lines[i + 2].substring('rename to '.length);
                
                // Insert the '--- a/' and '+++ b/' lines right after the similarity index line
                processedLines.push(`--- a/${oldPath}`);
                processedLines.push(`+++ b/${newPath}`);
                
                // Add the 'rename from' and 'rename to' lines
                processedLines.push(lines[i + 1]);
                processedLines.push(lines[i + 2]);
                
                // Skip the 'rename from' and 'rename to' lines as we've already added them
                i += 2;
            }
        }
        
        return processedLines.join('\n');
    }

    function parseGitDiff(diffContent) {
        // Preprocess the diff content
        const processedDiffContent = preprocessDiffContent(diffContent);
        
        // Parse the processed diff content
        const patches = Diff.parsePatch(processedDiffContent);

        return patches.map((patch, patchIndex) => {
            let oldPath = '';
            let newPath = '';
            let type = 'modify';

            if (patch.oldFileName === '/dev/null') {
                type = 'add';
                newPath = patch.newFileName.replace(/^b\//, '');
            } else if (patch.newFileName === '/dev/null') {
                type = 'delete';
                oldPath = patch.oldFileName.replace(/^a\//, '');
            } else {
                oldPath = patch.oldFileName.replace(/^a\//, '');
                newPath = patch.newFileName.replace(/^b\//, '');

                if (oldPath !== newPath) {
                    type = 'rename';
                }
            }

            return {
                oldPath,
                newPath,
                type,
                hunks: patch.hunks.map(hunk => ({
                    oldStart: hunk.oldStart,
                    oldLines: hunk.oldLines,
                    newStart: hunk.newStart,
                    newLines: hunk.newLines,
                    lines: hunk.lines
                })),
                index: patchIndex
            };
        });
    }

    function showProgressOverlay() {
        progressOverlay = document.createElement('div');
        progressOverlay.className = 'aidd-progress-overlay';
        progressOverlay.innerHTML = `
            <div class="aidd-progress-content">
                <button class="aidd-close-button" aria-label="Close">&times;</button>
                <h3 class="aidd-progress-title">Applying Changes</h3>
                <p id="aidd-progress-text">Initializing...</p>
                <div class="aidd-progress-bar">
                    <div class="aidd-progress-bar-inner"></div>
                </div>
                <p id="aidd-progress-message" class="aidd-progress-message"></p>
            </div>
        `;
        document.body.appendChild(progressOverlay);
        progressBar = progressOverlay.querySelector('.aidd-progress-bar-inner');
        progressText = progressOverlay.querySelector('#aidd-progress-text');
        progressMessage = progressOverlay.querySelector('#aidd-progress-message');

        const closeButton = progressOverlay.querySelector('.aidd-close-button');
        closeButton.addEventListener('click', hideProgressOverlay);

        progressOverlay.addEventListener('click', (event) => {
            if (event.target === progressOverlay) {
                hideProgressOverlay();
            }
        });

        document.addEventListener('keydown', handleEscKey);
    }

    function updateProgress(percentage, text) {
        if (progressBar && progressText) {
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = text;
        }
    }

    function showErrorMessage(message) {
        if (progressMessage) {
            const [errorTitle, ...errorDetailsParts] = message.split('\n\n');
            const errorDetails = errorDetailsParts.join('\n\n');

            let errorHTML = `<strong>${errorTitle}</strong>`;
            let isReconciliationFailure = errorTitle.includes("Failed to fix Git Diff");

            if (errorDetails) {
                errorHTML += '<details style="margin-top: 10px; text-align: left;">';
                errorHTML += '<summary class="aidd-error-summary" style="cursor: pointer; color: gray; font-size: 13px;">Show details</summary>';
                errorHTML += '<div class="aidd-error-details">';
                errorHTML += '<div class="aidd-error-content" style="white-space: pre-wrap; color:white; font-weight:normal;">';

                // Split the error details by the code block div
                const parts = errorDetails.split(/<div class="aidd-code-block"/);

                // Process each part
                parts.forEach((part, index) => {
                    if (index === 0) {
                        // First part is always text
                        errorHTML += part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    } else {
                        // Subsequent parts start with a code block
                        const [codeBlock, text] = part.split('</div></div>');
                        errorHTML += '<div class="aidd-code-block"' + codeBlock + '</div></div>';
                        if (text) {
                            errorHTML += text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        }
                    }
                });

                errorHTML += '</div>';
                errorHTML += '</div>';
                errorHTML += '</details>';

                // Add the fix option outside of the details section, but only when the details section exists
                // and it's not a reconciliation failure
                if (!isReconciliationFailure) {
                    errorHTML += '<div style="text-align: left; margin-top: 10px;">';
                    errorHTML += '<div class="aidd-fix-git-diff-container">';
                    errorHTML += '<span class="aidd-fix-git-diff-text">If Git Diff was incorrect, we can </span>';
                    errorHTML += '<a href="#" class="aidd-fix-git-diff-link">try to fix it and re-apply the changes</a>';
                    errorHTML += '</div>';
                    errorHTML += '</div>';
                }
            }

            progressMessage.innerHTML = errorHTML;
            progressMessage.className = 'aidd-progress-message aidd-progress-error';

            const fixGitDiffLink = progressMessage.querySelector('.aidd-fix-git-diff-link');
            if (fixGitDiffLink) {
                fixGitDiffLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    handleFixGitDiff();
                });
            }
        }
    }

    function hideProgressOverlay() {
        if (progressOverlay) {
            progressOverlay.remove();
            progressOverlay = null;
            progressBar = null;
            progressText = null;
            progressMessage = null;
            document.removeEventListener('keydown', handleEscKey);
        }
    }

    function handleEscKey(event) {
        if (event.key === 'Escape' && progressOverlay) {
            hideProgressOverlay();
        }
    }

    async function handleFixGitDiff() {
        // Clear the error message
        if (progressMessage) {
            progressMessage.innerHTML = '';
            progressMessage.className = 'aidd-progress-message';
        }

        const currentFileDiff = GitDiffStore.getCurrentFileDiff();
        const fileContent = GitDiffStore.getCurrentFileContent();
        const mismatches = GitDiffStore.getCurrentFileMismatches();

        try {
            updateProgress(GitDiffStore.getProgress().overallPercentage, `Attempting to fix Git Diff for "${currentFileDiff.oldPath}"...`);
            const correctedGitDiffRaw = await GitDiffReconciler.reconcileGitDiff(currentFileDiff, fileContent, mismatches);

            if (correctedGitDiffRaw) {
                // Parse the corrected Git diff
                const correctedGitDiff = parseGitDiff(correctedGitDiffRaw)[0]; // We expect only one file diff here

                // Update only the current file in GitDiffStore with the corrected diff
                GitDiffStore.updateCurrentFileDiff(correctedGitDiff);

                updateProgress(GitDiffStore.getProgress().overallPercentage, 'Git Diff fixed. Re-applying changes...');

                // Re-start the process from the current file
                const currentFileIndex = GitDiffStore.getCurrentFileIndex();
                const success = await processRemainingChanges(currentFileIndex);

                if (success) {
                    updateProgress(100, 'All changes were applied successfully!');
                }
            } else {
                showErrorMessage("An unknown error occurred while fixing the Git Diff.");
            }
        } catch (error) {
            let errorMessage = error.message || "An unknown error occurred while fixing the Git Diff.";

            if (error.details) {
                errorMessage += "\n\n";
                error.details.forEach((detail, index) => {
                    errorMessage += `========================== Mismatch ${index + 1} at line ${detail.startLine} ============================\n\n`;
                    errorMessage += `Git Diff expects the file to contain this hunk:${createCodeBlockWithLineNumbers(detail.expectedContent, detail.startLine)}`;
                    errorMessage += `However the file shows:${createCodeBlockWithLineNumbers(detail.actualContent, detail.startLine)}`;
                    errorMessage += `Attempt to fix Git Diff failed because: ${detail.message}\n\n`;
                });
            }

            showErrorMessage(errorMessage);
        }
    }

    async function processRemainingChanges(startIndex) {
        let allSuccessful = true;
        for (let i = startIndex; i < GitDiffStore.getProgress().total; i++) {
            const currentFileDiff = GitDiffStore.getCurrentFileDiff();
            if (!currentFileDiff) break;

            const progress = GitDiffStore.getProgress();
            updateProgress(
                progress.overallPercentage,
                `${currentFileDiff.newPath || currentFileDiff.oldPath} (${progress.current}/${progress.total})`
            );

            if (!GitDiffStore.isFileProcessed(i)) {
                try {
                    const success = await processChange(currentFileDiff);
                    if (success) {
                        GitDiffStore.markFileAsProcessed(i);
                    } else {
                        allSuccessful = false;
                        break;
                    }
                } catch (error) {
                    allSuccessful = false;
                    handleApplyChangesError(error);
                    break;
                }
            }

            if (!GitDiffStore.moveToNextFile()) break;
        }
        return allSuccessful;
    }

    return {
        init: initGitDiffHandler,
        updateConfigs: updateConfigs
    };
})();
