const FileInsertionHandler = (function () {
    const styles = `
        .file-insertion-modal {
            position: absolute;
            z-index: 10000;
            max-width: 800px;
        }
        .file-insertion-list {
            list-style-type: none;
            padding: 0;
            background-color: black;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            margin: 0;
            max-height: 301px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #3b3b3b black;
            position: relative;
        }
        .file-insertion-item {
            font-size: 14px;
            padding: 8px 12px;
            cursor: pointer;
            color: #e0e0e0;
            transition: background-color 0.1s ease, color 0.1s ease;
        }
        .file-insertion-item:hover {
            background-color: #2c5282;
            color: #ffffff;
        }
        .file-insertion-item.selected {
            background-color: #3b82f6;
            color: #ffffff;
        }
        .file-insertion-list::-webkit-scrollbar {
            width: 6px;
        }
        .file-insertion-list::-webkit-scrollbar-track {
            background: black;
        }
        .file-insertion-list::-webkit-scrollbar-thumb {
            background-color: #3b3b3b;
            border-radius: 4px;
        }
        .file-insertion-list::-webkit-scrollbar-thumb:hover {
            background-color: #ffffff;
        }
        .file-insertion-arrow {
            position: absolute;
            width: 0;
            height: 0;
            left: 13px;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 11px solid black;
        }
        .highlighted-input {
            outline: 2px solid #0f62fe !important;
            outline-offset: 2px;
        }
        .file-insertion-placeholder {
            font-style: italic;
            color: #888;
            cursor: default;
        }

        .file-insertion-placeholder:hover {
            background-color: inherit;
            color: #888;
        }            
    `;

    let currentModal = null;
    let currentFocusedInput = null;
    let currentSelectedIndex = -1;
    let allFiles = [];
    let filteredFiles = [];

    function initFileInsertionHandler() {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    async function showModal(rootDirectoryHandle, gitIgnoreHandler) {
        closeModal(); // Close any existing modal before opening a new one

        const focusedInput = getCurrentFocusedTextInput();
        if (!focusedInput) {
            return; // Do nothing if there's no focused input
        }

        try {
            allFiles = await gitIgnoreHandler.getFilesAndFolders(rootDirectoryHandle, rootDirectoryHandle);
            
            if (!Array.isArray(allFiles) || allFiles.length === 0) {
                console.error('No files found or invalid file list returned');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'file-insertion-modal';
            
            const arrow = document.createElement('div');
            arrow.className = 'file-insertion-arrow';
            
            const list = document.createElement('ul');
            list.className = 'file-insertion-list';

            modal.appendChild(list);
            modal.appendChild(arrow);

            document.body.appendChild(modal);
            currentModal = modal;
            currentFocusedInput = focusedInput;
            
            document.addEventListener('click', handleClick);
            document.addEventListener('keydown', handleKeyDown);
            focusedInput.addEventListener('input', handleInputChange);
            focusedInput.addEventListener('keydown', handleInputKeyDown, true);

            ensureEmptyLine(focusedInput);
            updateFilteredFiles();
            positionModal(modal, focusedInput);
            highlightInput(focusedInput);
        } catch (error) {
            console.error('Error showing file insertion modal:', error);
        }
    }

    function handleInputKeyDown(e) {
        if (e.key === 'Enter' && currentModal) {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event from bubbling up
            
            const selectedItem = currentModal.querySelector('.file-insertion-item.selected');
            if (selectedItem) {
                selectedItem.click();
            }
        }
    }    

    function updateFilteredFiles() {
        const currentLineText = getCurrentLineText(currentFocusedInput);
        filteredFiles = filterFiles(allFiles, currentLineText);
        renderFileList();
    }
    
    function getCurrentLineText(input) {
        const cursorPosition = input.selectionStart;
        const inputValue = input.value;
        const lineStart = inputValue.lastIndexOf('\n', cursorPosition - 1) + 1;
        const lineEnd = inputValue.indexOf('\n', cursorPosition);
        const currentLine = lineEnd !== -1 ? inputValue.substring(lineStart, lineEnd) : inputValue.substring(lineStart);
        return currentLine.trim();
    }


    function ensureEmptyLine(input) {
        const currentValue = input.value;
        const currentPosition = input.selectionStart;
        const lineStart = currentValue.lastIndexOf('\n', currentPosition - 1) + 1;
        const lineEnd = currentValue.indexOf('\n', currentPosition);
        const currentLine = lineEnd !== -1 ? currentValue.substring(lineStart, lineEnd) : currentValue.substring(lineStart);

        if (currentLine.trim() !== '') {
            // Current line is not empty, create a new empty line
            let newPosition;
            if (lineEnd !== -1) {
                // We're not at the last line
                newPosition = lineEnd;
                input.value = currentValue.substring(0, newPosition) + '\n' + currentValue.substring(newPosition);
            } else {
                // We're at the last line
                newPosition = currentValue.length;
                input.value = currentValue + '\n';
            }
            newPosition++; // Move to the start of the newly inserted line
            input.setSelectionRange(newPosition, newPosition);
            
            // Scroll to the new position
            scrollToPosition(input, newPosition);
        }
        // If current line is already empty, do nothing
    }

    function scrollToPosition(input, position) {
        // Set selection to the desired position
        input.setSelectionRange(position, position);

        // Use setTimeout to defer the scrolling to the next event loop
        setTimeout(() => {
            // Get the bounds of the input
            const inputRect = input.getBoundingClientRect();

            // Get the line height
            const lineHeight = parseInt(window.getComputedStyle(input).lineHeight);

            // Calculate the position of the cursor relative to the input
            const cursorY = input.scrollTop + (position / input.value.length) * input.scrollHeight;

            // If the cursor is below the visible area, scroll down
            if (cursorY > input.scrollTop + inputRect.height - lineHeight) {
                input.scrollTop = cursorY - inputRect.height + lineHeight;
            }
            // If the cursor is above the visible area, scroll up
            else if (cursorY < input.scrollTop) {
                input.scrollTop = cursorY;
            }
        }, 0);
    }

    function filterFiles(files, filterText) {
        const filtered = [];
        const filterRegex = new RegExp(filterText.split('').join('.*'), 'i');

        function filterRecursive(items) {
            items.forEach(item => {
                if (item.kind === 'file' && filterRegex.test(item.path)) {
                    filtered.push(item);
                } else if (item.kind === 'directory' && item.children) {
                    filterRecursive(item.children);
                }
            });
        }

        filterRecursive(files);
        return filtered;
    }

    function renderFileList() {
        const list = currentModal.querySelector('.file-insertion-list');
        list.innerHTML = '';
        
        if (filteredFiles.length === 0) {
            list.appendChild(createPlaceholderItem("No matching files"));
        } else {
            addFilesToList(filteredFiles, list, currentFocusedInput);
        }
        
        currentSelectedIndex = -1;
        updateSelection(list.querySelectorAll('.file-insertion-item'));
    }

    function createPlaceholderItem(text) {
        const item = document.createElement('li');
        item.className = 'file-insertion-item file-insertion-placeholder';
        item.textContent = text;
        return item;
    }    

    function handleInputChange() {
        updateFilteredFiles();
        if (currentModal && currentFocusedInput) {
            positionModal(currentModal, currentFocusedInput);    
        }
    }    

    function handleClick(e) {
        if (!currentModal || !currentFocusedInput) return;
        if (!currentModal.contains(e.target) && e.target !== currentFocusedInput) {
            closeModal();
        }
    }

    function closeModal() {
        if (currentModal && currentFocusedInput) {
            unhighlightInput(currentFocusedInput);
            document.body.removeChild(currentModal);
            currentFocusedInput.removeEventListener('input', handleInputChange);
            currentFocusedInput.removeEventListener('keydown', handleInputKeyDown);
            currentFocusedInput = null;
            currentModal = null;
            currentSelectedIndex = -1;
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClick);
        }
    }

    function addFilesToList(files, list, focusedInput) {
        files.forEach((file, index) => {
            if (file.kind === 'file') {
                const item = createFileItem(file, index);
                item.addEventListener('click', () => insertFile(file, focusedInput));
                list.appendChild(item);
            } else if (file.kind === 'directory' && file.children) {
                addFilesToList(file.children, list, focusedInput);
            }
        });
    }

    function createFileItem(file, index) {
        const item = document.createElement('li');
        item.className = 'file-insertion-item';
        item.textContent = file.path;
        item.dataset.index = index;
        return item;
    }    

    function handleKeyDown(e) {
        if (!currentModal) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                if (currentSelectedIndex !== -1) {
                    unselectCurrentItem();
                } else {
                    closeModal();
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                const items = currentModal.querySelectorAll('.file-insertion-item');
                const itemCount = items.length;

                if (e.key === 'ArrowUp') {
                    currentSelectedIndex = (currentSelectedIndex - 1 + itemCount) % itemCount;
                } else if (e.key === 'ArrowDown') {
                    currentSelectedIndex = (currentSelectedIndex + 1) % itemCount;
                }

                updateSelection(items);
                break;
        }
    }

    function unselectCurrentItem() {
        if (!currentModal) return;

        currentSelectedIndex = -1;
        updateSelection(currentModal.querySelectorAll('.file-insertion-item'));
    }

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === currentSelectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }


    function getCurrentFocusedTextInput() {
        const activeElement = document.activeElement;
        if ((activeElement.tagName === 'INPUT' && activeElement.type === 'text') || activeElement.tagName === 'TEXTAREA') {
            return activeElement;
        }
        return null;
    }

     async function insertFile(file, input) {
        try {
            const fileContent = await readFileContent(file);
            const currentValue = input.value;
            const currentPosition = input.selectionStart;

            // Find the start and end of the current line
            const lineStart = currentValue.lastIndexOf('\n', currentPosition - 1) + 1;
            const lineEnd = currentValue.indexOf('\n', currentPosition);
            const endPosition = lineEnd !== -1 ? lineEnd : currentValue.length;

            // Replace the current line with the new content
            const newValue = currentValue.substring(0, lineStart) + fileContent + currentValue.substring(endPosition);
            input.value = newValue;

            // Set cursor position to the end of the inserted content
            const newPosition = lineStart + fileContent.length;
            input.setSelectionRange(newPosition, newPosition);

            // Scroll to the cursor position
            scrollToPosition(input, newPosition);
            
            // Trigger input event
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            input.dispatchEvent(inputEvent);

            input.focus();
            closeModal();
        } catch (error) {
            console.error('Error inserting file:', error);
        }
    }

    function scrollToPosition(input, position) {
        // Save the original scroll position
        const originalScrollTop = input.scrollTop;

        // Temporarily move the cursor to the end to force scrolling
        input.setSelectionRange(position, position);

        // Use setTimeout to defer the execution to the next event loop
        setTimeout(() => {
            // Check if scrolling actually occurred
            if (input.scrollTop !== originalScrollTop) {
                // If it did, we're done
                return;
            }

            // If no scrolling occurred, it means the position is not fully visible
            // Calculate the line height
            const lineHeight = parseInt(window.getComputedStyle(input).lineHeight);

            // Estimate the number of visible lines
            const visibleLines = Math.floor(input.clientHeight / lineHeight);

            // Calculate the target scroll position
            const lines = input.value.substr(0, position).split('\n');
            const targetLine = lines.length;
            const targetScrollTop = Math.max(0, (targetLine - visibleLines + 1) * lineHeight);

            // Set the new scroll position
            input.scrollTop = targetScrollTop;
        }, 0);
    }

    async function readFileContent(file) {
        const fileHandle = file.handle;
        const content = await (await fileHandle.getFile()).text();
        const currentURL = window.location.href;
        
        if (currentURL.includes('eastagile.skydeck.ai')) {
            const configs = await Shared.getConfigs();
            if (configs.hideFileContents) {
               // Save the file content to the CompactUI module
                CompactUI.rememberFileContent(
                    key=file.path,
                    value=content
                );
                return `<file path="${file.path}" />`;
            }
        }

        return `<file path="${file.path}">\n${content}\n</file>\n`;
    }

    function positionModal(modal, input) {
        const rect = input.getBoundingClientRect();
        const modalHeight = modal.offsetHeight;
        let top = rect.top + window.scrollY - modalHeight - 15;
        let left = rect.left + window.scrollX;
        
        // Ensure the modal doesn't go above the viewport
        if (top < window.scrollY) {
            top = rect.bottom + window.scrollY;
        }
        
        modal.style.top = `${top}px`;
        modal.style.left = `${left}px`;

        // Always show the arrow, even when there are no results
        const arrow = modal.querySelector('.file-insertion-arrow');
        if (arrow) {
            arrow.style.display = 'block';
        }        
    }

    function highlightInput(input) {
        input.classList.add('highlighted-input');
    }

    function unhighlightInput(input) {
        input.classList.remove('highlighted-input');
    }

    return {
        init: initFileInsertionHandler,
        showModal: showModal
    };
})();
