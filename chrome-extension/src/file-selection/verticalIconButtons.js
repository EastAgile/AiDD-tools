const VerticalIconButtons = (function () {

    const ICONS = {
        selectAll: `<svg viewBox="0 0 20 20" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="2" />
            <polyline points="7 10 10 13 17 6" />
        </svg>`,
        deselectAll: `<svg viewBox="0 0 20 20" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="2" />
            <line x1="6" y1="10" x2="14" y2="10" />
        </svg>`,
        expandAll: `<svg viewBox="0 0 20 20" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <polyline points="5 11 10 16 15 11" />
            <polyline points="5 4 10 9 15 4" />
        </svg>`,
        collapseAll: `<svg viewBox="0 0 20 20" width="24" height="24" stroke="currentColor" stroke-width="1.5" fill="none">
            <polyline points="5 9 10 4 15 9" />
            <polyline points="5 16 10 11 15 16" />
        </svg>`
    };

    const styles = `
        .vertical-buttons-container {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            width: 40px;
            background-color: #2b2b2b;
            padding-top: 75px;
        }
        .icon-button {
            width: 22px;
            height: 22px;
            margin-bottom: 13px;
            background-color: #4a4a4a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease;
            position: relative;
        }
        .icon-button::after {
            content: attr(data-tooltip);
            position: absolute;
            left: calc(100% + 11px);
            top: 90%;
            transform: translateY(-50%);
            background-color: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s, visibility 0.2s;
            pointer-events: none;
            z-index: 1000;
        }            
        .icon-button:hover {
            background-color: #5a5a5a;
        }
        .icon-button:hover::after {
            opacity: 1;
            visibility: visible;
        }                
        .icon-button:disabled {
            background-color: #3a3a3a;
            cursor: not-allowed;
            opacity: 0.7;
        }
    `;

    const initVerticalIconButtons = (onSelectAll, onDeselectAll, onExpandAll, onCollapseAll) => {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        const verticalButtonsContainer = document.createElement("div");
        verticalButtonsContainer.className = "vertical-buttons-container";

        const createIconButton = (iconText, title, onClick) => {
            const button = document.createElement("button");
            button.className = "icon-button";
            button.innerHTML = iconText;
            button.setAttribute('data-tooltip', title);
            button.onclick = onClick;
            return button;
        };
        
        const selectAllButton = createIconButton(ICONS.selectAll, "Select All", onSelectAll);
        const deselectAllButton = createIconButton(ICONS.deselectAll, "Deselect All", onDeselectAll);
        const expandAllButton = createIconButton(ICONS.expandAll, "Expand All", onExpandAll);
        const collapseAllButton = createIconButton(ICONS.collapseAll, "Collapse All", onCollapseAll);

        verticalButtonsContainer.appendChild(selectAllButton);
        verticalButtonsContainer.appendChild(deselectAllButton);
        verticalButtonsContainer.appendChild(expandAllButton);
        verticalButtonsContainer.appendChild(collapseAllButton);

        return {
            html: verticalButtonsContainer,
            disable: () => {
                selectAllButton.disabled = true;
                deselectAllButton.disabled = true;
                expandAllButton.disabled = true;
                collapseAllButton.disabled = true;
            },
            enable: () => {
                selectAllButton.disabled = false;
                deselectAllButton.disabled = false;
                expandAllButton.disabled = false;
                collapseAllButton.disabled = false;
            }
        };
    }

    return { init: initVerticalIconButtons };
})();
