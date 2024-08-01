const Resizer = (function () {
    
    const styles = `
        .resizer {
            width: 15px;
            background: transparent;
            cursor: col-resize;
            margin-top: 40px;
            height: calc(100% - 40px);
            position: relative;
            transition: background 0.3s ease;
        }

        .resizer::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 40px;
            background: #666;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
   
        .resizer:hover::after {
            opacity: 1;
        }
    `;

    function initResizer(leftSide) {
        const styleElement = document.createElement("style");
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);

        const resizer = document.createElement("div");
        resizer.className = "resizer";

        addResizeListener(resizer, leftSide);

        return {
            html: resizer
        };
    }

    const addResizeListener = (resizer, leftSide) => {
        let x = 0;
        let leftWidth = 0;

        const mouseDownHandler = (e) => {
            x = e.clientX;
            leftWidth = leftSide.getBoundingClientRect().width;

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        };

        const mouseMoveHandler = (e) => {
            const dx = e.clientX - x;
            const newLeftWidth = ((leftWidth + dx) / resizer.parentNode.getBoundingClientRect().width) * 100;
            leftSide.style.flex = `0 0 ${newLeftWidth}%`;
        };

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);

            // Save the new ratio
            const newLeftWidth = parseFloat(leftSide.style.flex.split(' ')[2]);
            localStorage.setItem('fileTreeResizerRatio', newLeftWidth);
        };

        resizer.addEventListener('mousedown', mouseDownHandler);
    };    

    return { init: initResizer };
})();
