const FileTreePanel = (function () {

    const styles = `
        .file-tree-panel {
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
            min-width: 300px;
        }

        .file-tree-guide {
            height: 20px;
            margin-bottom: 12px;
            font-size: 14px;
            color: #ffffff;
            font-weight: bold;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .file-selection-tree {
            display: flex;
            flex-direction: column;
            background-color: #1e1e1e;
            font-size: 13px;
            padding: 0 10px 10px 10px;
            padding-top: 0;
            overflow-y: auto;
            flex-grow: 1;
            height: calc(100% - 30px);
            scrollbar-color: #3e3e3e #1e1e1e;
            scrollbar-width: thin;
            transition: background-color 0.3s ease;
            border: none;
            border-radius: 0;
            border-bottom-right-radius: 4px;
            border-bottom-left-radius: 4px;
        }

        .file-selection-tree::-webkit-scrollbar{
            width: 10px;
        }
        .file-selection-tree::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        .file-selection-tree::-webkit-scrollbar-thumb {
            background: #3e3e3e;
            border-radius: 5px;
        }
        .file-selection-tree::-webkit-scrollbar-thumb:hover {
            background: #4e4e4e;
        }
        .file-selection-tree::-webkit-scrollbar-corner {
            background-color: #1e1e1e;
        }

        .file-search-input {
            box-sizing: border-box;
            width: 100%;
            padding: 15px;
            border: none;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            background-color: #2b2b2b;
            color: #e0e0e0;
            height: 22px;
            font-size: 12px;
        }

        .file-search-input:focus {
            outline: none;
            border-color: #6b7280;
        }

        .search-result-counter {
            position: absolute;
            top: 41px;
            right: 15px;
            font-size: 10px;
            color: #a0aec0;
            display: none;
        }

        .search-and-tree-container {
            overflow: hidden;
            border: 1px solid #4a4a4a;
            border-radius: 4px;
            height: 100%;
        }

        .root-item {
            margin-top: 4px;
        }

        .file-tree-item {
            margin: 3px 0;
            display: flex;
            align-items: center;
        }
        .file-tree-item-content {
            display: flex;
            align-items: center;
            width: 100%;
        }

        .file-tree-checkbox {
            margin-right: 4px;
        }

        .file-tree-label {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .file-tree-label.highlight {
            background-color: #4a5568;
            color: #e2e8f0;
        }

        .file-tree-icon {
            width: 16px;
            text-align: center;
            margin-right: 4px;
            flex-shrink: 0;
        }

        .file-tree-name {
            flex-grow: 1;
            padding: 2px 4px;
            border-radius: 3px;
            transition: background-color 0.3s ease;
        }
        .file-tree-name.highlight {
            background-color: #4a5568;
            color: #e2e8f0;
        }

        .file-tree-toggle {
            cursor: pointer;
            width: 16px;
            text-align: center;
            margin-right: 1px;
            color: #ffffff;
        }
    `;

    let _isUpdatingContent = false;
    let _onBeginCheckboxChange = null;
    let _onFinishCheckboxChange = null;

    function initFileTreePanel(rootFolderName, entries, onBeginCheckboxChange, onFinishCheckboxChange) {
        _isUpdatingContent = false;
        _onBeginCheckboxChange = onBeginCheckboxChange;
        _onFinishCheckboxChange = onFinishCheckboxChange;

        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        const fileTreePanel = document.createElement("div");
        fileTreePanel.className = "file-tree-panel";

        const guideText = document.createElement("div");
        guideText.className = "file-tree-guide";
        guideText.textContent = "Select files to include in the AiDD prompt";
        fileTreePanel.appendChild(guideText);

        // Create search container and input
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Search...";
        searchInput.className = "file-search-input";
        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.trim();
            const searchResults = searchTerm ? searchFiles(searchTerm, entries) : [];

            rootItem.innerHTML = '';
            createTreeUI([{ name: rootFolderName, path: "", kind: "directory", children: entries }], rootItem, 0, true, treeContainer, "", searchResults, searchTerm);

            // Update the search result counter
            searchResultCounter.textContent = `${searchResults.length}`;
            searchResultCounter.style.display = searchTerm ? 'inline' : 'none';

            let firstMatch = null;
            if (searchTerm) {
                searchResults.forEach(result => {
                    const pathParts = result.path.split('/');
                    let currentPath = '';
                    pathParts.forEach(part => {
                        currentPath += (currentPath ? '/' : '') + part;
                        const folderToggle = rootItem.querySelector(`[data-path="${currentPath}"] .file-tree-toggle`);
                        if (folderToggle && folderToggle.textContent === '▶') {
                            folderToggle.click();
                        }
                    });

                    if (!firstMatch) {
                        firstMatch = rootItem.querySelector(`[data-path="${result.path}"]`);
                    }
                });

                if (firstMatch) {
                    setTimeout(() => scrollToElement(firstMatch, treeContainer), 100);
                }
            }
        });

        const searchResultCounter = document.createElement("span");
        searchResultCounter.className = "search-result-counter";
        searchResultCounter.textContent = "0";

        // Tree container
        const treeContainer = document.createElement("div");
        treeContainer.className = "file-selection-tree";

        // Create the root folder item
        const rootItem = document.createElement("div");
        rootItem.className = "root-item";
        treeContainer.appendChild(rootItem);

        const searchAndTreeContainer = document.createElement("div");
        searchAndTreeContainer.className = "search-and-tree-container";

        searchAndTreeContainer.appendChild(searchInput);
        searchAndTreeContainer.appendChild(searchResultCounter);
        searchAndTreeContainer.appendChild(treeContainer);

        fileTreePanel.appendChild(searchAndTreeContainer);

        return {
            html: fileTreePanel,
            setFlexValue: (value) => { fileTreePanel.style.flex = value },
            renderTree: () => {
                createTreeUI([{ name: rootFolderName, path: "", kind: "directory", children: entries }], rootItem, 0, true, treeContainer, "", searchResults = [], searchTerm = '');
            },
            getNumOfSelectedFiles: () => { return getNumOfSelectedFiles(treeContainer) },
            selectAll: (onBegin, onFinish) => { toggleAllCheckboxes(true, onBegin, onFinish, treeContainer) },
            deselectAll: (onBegin, onFinish) => { toggleAllCheckboxes(false, onBegin, onFinish, treeContainer) },
            expandAll: () => { expandAllFolders(treeContainer) },
            collapseAll: () => { collapseAllFolders(treeContainer) },
            applySavedSelection: async () => { await applySavedSelection(treeContainer) },
        };
    }

    function getNumOfSelectedFiles(treeContainer) {
        const selectedCheckboxes = treeContainer.querySelectorAll('input[type="checkbox"]:checked:not([data-path="root"])');
        const selectedFiles = Array.from(selectedCheckboxes).filter(checkbox => {
            const icon = checkbox.closest('.file-tree-item').querySelector('.file-tree-icon');
            return icon && icon.textContent === '📄'; // Check if the icon is a file
        });
        return selectedFiles.length;
    }

    async function toggleAllCheckboxes(state, onBegin, onFinish, treeContainer) {
        if (_isUpdatingContent) return;
        _isUpdatingContent = true;

        onBegin();

        const checkboxes = treeContainer.querySelectorAll('input[type="checkbox"]');
        for (const checkbox of checkboxes) {
            checkbox.checked = state;
            checkbox.indeterminate = false;
        }

        const topLevelCheckboxes = treeContainer.querySelectorAll('input[type="checkbox"][data-parent=""]');
        for (const checkbox of topLevelCheckboxes) {
            await updateParentCheckboxes(checkbox, treeContainer);
        }

        updateRootFolderState(treeContainer);

        // Save selected files after toggling all checkboxes
        saveSelectedFiles(treeContainer);

        await onFinish(getNumOfSelectedFiles(treeContainer));
        _isUpdatingContent = false;
    };

    function expandAllFolders(treeContainer) {
        const toggles = treeContainer.querySelectorAll('.file-tree-toggle');
        toggles.forEach(toggle => {
            if (toggle.textContent === '▶') {
                toggleFolder(toggle, toggle.closest('.file-tree-item'));
            }
        });
    };

    function collapseAllFolders(treeContainer) {
        const toggles = treeContainer.querySelectorAll('.file-tree-toggle');
        toggles.forEach(toggle => {
            // Skip the root folder
            if (toggle.closest('.file-tree-item').dataset.path !== "root") {
                if (toggle.textContent === '▼') {
                    toggleFolder(toggle, toggle.closest('.file-tree-item'));
                }
            }
        });
    };

    function toggleFolder(toggle, item) {
        const childContainer = item.nextElementSibling;
        if (childContainer) {
            if (childContainer.style.display === "none") {
                childContainer.style.display = "block";
                toggle.textContent = "▼";
            } else {
                childContainer.style.display = "none";
                toggle.textContent = "▶";
            }
        }
    };

    async function handleCheckboxChange(checkbox, treeContainer) {
        if (_isUpdatingContent) return;
        _isUpdatingContent = true;

        _onBeginCheckboxChange();

        const isChecked = checkbox.checked;
        const path = checkbox.dataset.path;

        // If the root checkbox is changed, update all checkboxes
        if (path === "root") {
            const allCheckboxes = treeContainer.querySelectorAll('input[type="checkbox"]');
            allCheckboxes.forEach(cb => {
                cb.checked = isChecked;
                cb.indeterminate = false;
            });
        } else {
            // For non-root checkboxes, update children
            const childCheckboxes = treeContainer.querySelectorAll(`input[type="checkbox"][data-parent^="${path}"]`);
            childCheckboxes.forEach(cb => {
                cb.checked = isChecked;
                cb.indeterminate = false;
            });

            // Update parent checkboxes
            await updateParentCheckboxes(checkbox, treeContainer);
        }

        updateRootFolderState(treeContainer);

        // Save selected files after each interaction
        saveSelectedFiles(treeContainer);

        await _onFinishCheckboxChange(getNumOfSelectedFiles(treeContainer));
        _isUpdatingContent = false;
    };

    function shouldExpandForSearch(entry, searchResults) {
        if (entry.kind !== "directory") return false;
        return searchResults.some(result => result.path.startsWith(entry.path + '/'));
    };

    function shouldExpandFolder(entry, savedSelection) {
        if (entry.kind !== "directory") return false;

        const checkChildren = (children) => {
            for (const child of children) {
                if (child.kind === "file" && savedSelection.includes(child.path)) {
                    return true;
                }
                if (child.kind === "directory" && checkChildren(child.children)) {
                    return true;
                }
            }
            return false;
        };

        return checkChildren(entry.children);
    };

    function createTreeUI(entries, parentElement, level = 0, isRoot = true, treeContainer, parentPath = '', searchResults, searchTerm) {
        const savedSelection = JSON.parse(localStorage.getItem('lastSelectedFiles') || '[]');

        entries.forEach(entry => {
            const item = document.createElement("div");
            item.className = "file-tree-item";
            item.style.paddingLeft = `${level * 20}px`;
            item.dataset.path = entry.path || "root";

            const contentWrapper = document.createElement("div");
            contentWrapper.className = "file-tree-item-content";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "file-tree-checkbox";
            checkbox.id = entry.path || "root";
            checkbox.dataset.path = entry.path || "root";

            if (isRoot) {
                checkbox.dataset.parent = "";
            } else if (level === 1) {
                checkbox.dataset.parent = "root";
            } else {
                checkbox.dataset.parent = parentPath;
            }

            const label = document.createElement("label");
            label.className = "file-tree-label";
            label.htmlFor = entry.path || "root";

            const icon = document.createElement("span");
            icon.className = "file-tree-icon";
            icon.textContent = entry.kind === "directory" ? "📁" : "📄";

            const nameSpan = document.createElement("span");
            nameSpan.className = "file-tree-name";
            nameSpan.textContent = entry.name;

            const isSearchResult = searchTerm && searchResults.some(result => result.path === entry.path);
            const shouldExpand = isSearchResult || shouldExpandForSearch(entry, searchResults);

            if (isSearchResult) {
                nameSpan.classList.add('highlight');
            }

            if (entry.kind === "directory") {
                const toggle = document.createElement("span");
                toggle.textContent = isRoot || shouldExpandFolder(entry, savedSelection) || shouldExpand ? "▼" : "▶";
                toggle.className = "file-tree-toggle";
                toggle.onclick = (e) => {
                    e.preventDefault();
                    toggleFolder(toggle, item);
                };
                contentWrapper.appendChild(toggle);
            } else {
                const placeholder = document.createElement("span");
                placeholder.className = "file-tree-toggle";
                placeholder.style.visibility = "hidden";
                contentWrapper.appendChild(placeholder);
            }

            contentWrapper.appendChild(checkbox);
            label.appendChild(icon);
            label.appendChild(nameSpan);
            contentWrapper.appendChild(label);
            item.appendChild(contentWrapper);
            parentElement.appendChild(item);

            if (entry.kind === "directory" && entry.children) {
                const childContainer = document.createElement("div");
                childContainer.style.display = isRoot || shouldExpandFolder(entry, savedSelection) || shouldExpand ? "block" : "none";
                createTreeUI(entry.children, childContainer, level + 1, false, treeContainer, entry.path, searchResults, searchTerm);
                parentElement.appendChild(childContainer);
            }

            checkbox.addEventListener("change", () => handleCheckboxChange(checkbox, treeContainer));

            // If this entry is in the saved selection, check its checkbox
            if (savedSelection.includes(entry.path)) {
                checkbox.checked = true;
            }
        });
    };

    function saveSelectedFiles(treeContainer) {
        const selectedFiles = Array.from(treeContainer.querySelectorAll("input[type=\"checkbox\"]:checked"))
            .filter(cb => !cb.indeterminate && cb.dataset.path !== "root")
            .map(cb => cb.dataset.path);
        localStorage.setItem('lastSelectedFiles', JSON.stringify(selectedFiles));
    };

    async function applySavedSelection(treeContainer) {
        const savedSelection = JSON.parse(localStorage.getItem('lastSelectedFiles') || '[]');

        for (const path of savedSelection) {
            const checkbox = treeContainer.querySelector(`input[type="checkbox"][data-path="${path}"]`);
            if (checkbox) {
                checkbox.checked = true;
                await updateParentCheckboxes(checkbox, treeContainer);
            }
        }

        updateRootFolderState(treeContainer);
    };

    async function updateParentCheckboxes(checkbox, treeContainer) {
        let currentCheckbox = checkbox;
        while (currentCheckbox.dataset.parent) {
            const parentPath = currentCheckbox.dataset.parent;
            const parentCheckbox = treeContainer.querySelector(`input[type="checkbox"][data-path="${parentPath}"]`);
            if (parentCheckbox) {
                const childCheckboxes = treeContainer.querySelectorAll(`input[type="checkbox"][data-parent="${parentPath}"]`);
                const checkedCount = Array.from(childCheckboxes).filter(cb => cb.checked).length;
                const totalCount = childCheckboxes.length;

                parentCheckbox.checked = checkedCount === totalCount;
                parentCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;

                currentCheckbox = parentCheckbox;
            } else {
                break;
            }
        }
    };

    function updateRootFolderState(treeContainer) {
        const rootCheckbox = treeContainer.querySelector('input[type="checkbox"][data-path="root"]');
        if (!rootCheckbox) return;

        const allCheckboxes = treeContainer.querySelectorAll('input[type="checkbox"]:not([data-path="root"])');
        const checkedCheckboxes = treeContainer.querySelectorAll('input[type="checkbox"]:checked:not([data-path="root"])');

        if (checkedCheckboxes.length === 0) {
            rootCheckbox.checked = false;
            rootCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === allCheckboxes.length) {
            rootCheckbox.checked = true;
            rootCheckbox.indeterminate = false;
        } else {
            rootCheckbox.checked = false;
            rootCheckbox.indeterminate = true;
        }
    };

    function searchFiles(searchTerm, entries) {
        const results = [];
        const search = (items, path = '') => {
            for (const item of items) {
                const itemPath = path ? `${path}/${item.name}` : item.name;
                if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    results.push({ ...item, path: itemPath });
                }
                if (item.kind === "directory" && item.children) {
                    search(item.children, itemPath);
                }
            }
        };
        search(entries);
        return results;
    };

    const scrollToElement = (element, treeContainer) => {
        if (element && treeContainer) {
            const elementRect = element.getBoundingClientRect();
            const containerRect = treeContainer.getBoundingClientRect();
            const isVisible = (elementRect.top >= containerRect.top) && (elementRect.bottom <= containerRect.bottom);

            if (!isVisible) {
                const scrollOffset = elementRect.top - containerRect.top - (containerRect.height / 2);
                treeContainer.scrollTop += scrollOffset;
            }
        }
    };

    return { init: initFileTreePanel };
})();
