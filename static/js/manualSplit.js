// 手动分割模式模块
const ManualSplitMode = (() => {
    let canvas;
    let splitLines = [];
    let currentMode = 'horizontal'; // 'horizontal' 或 'vertical'
    
    // 激活模式
    const activate = (mainCanvas) => {
        canvas = mainCanvas;
        setupEventListeners();
        addControlButtons();
        console.log('Manual split mode activated');
    };
    
    // 停用模式
    const deactivate = () => {
        removeEventListeners();
        clearSplitLines();
        removeControlButtons();
        console.log('Manual split mode deactivated');
    };

    // 添加控制按钮
    const addControlButtons = () => {
        const controls = document.querySelector('.controls');
        
        // 添加模式切换按钮
        const modeButton = document.createElement('button');
        modeButton.id = 'splitModeToggle';
        modeButton.textContent = '切换分割方向';
        modeButton.onclick = toggleSplitMode;
        
        // 添加清除按钮
        const clearButton = document.createElement('button');
        clearButton.id = 'clearSplitLines';
        clearButton.textContent = '清除所有分割线';
        clearButton.onclick = clearSplitLines;
        
        controls.appendChild(modeButton);
        controls.appendChild(clearButton);
    };
    
    // 移除控制按钮
    const removeControlButtons = () => {
        const modeButton = document.getElementById('splitModeToggle');
        const clearButton = document.getElementById('clearSplitLines');
        if (modeButton) modeButton.remove();
        if (clearButton) clearButton.remove();
    };
    
    // 切换分割模式
    const toggleSplitMode = () => {
        currentMode = currentMode === 'horizontal' ? 'vertical' : 'horizontal';
        const modeButton = document.getElementById('splitModeToggle');
        if (modeButton) {
            modeButton.textContent = `当前: ${currentMode === 'horizontal' ? '横向' : '纵向'}分割`;
        }
    };
    
    // 设置事件监听
    const setupEventListeners = () => {
        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);
        canvas.on('object:moving', onObjectMoving);
    };
    
    // 移除事件监听
    const removeEventListeners = () => {
        canvas.off('mouse:down', onMouseDown);
        canvas.off('mouse:move', onMouseMove);
        canvas.off('mouse:up', onMouseUp);
        canvas.off('object:moving', onObjectMoving);
    };
    
    // 鼠标按下事件
    const onMouseDown = (e) => {
        if (!e.pointer) return;
        addSplitLine(e.pointer.x, e.pointer.y);
    };
    
    // 鼠标移动事件
    const onMouseMove = (e) => {
        if (!e.pointer) return;
        
        const activeObject = canvas.getActiveObject();
        if (activeObject && splitLines.includes(activeObject)) {
            updateLinePosition(activeObject, e.pointer);
        }
    };
    
    // 鼠标释放事件
    const onMouseUp = () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject && splitLines.includes(activeObject)) {
            updatePercentageLabel(activeObject);
        }
        canvas.renderAll();
    };
    
    // 对象移动事件
    const onObjectMoving = (e) => {
        const line = e.target;
        if (!line || !splitLines.includes(line)) return;
        
        const image = CanvasUtils.getMainImage();
        if (!image) return;
        
        // 限制分割线在图片范围内
        const bounds = {
            left: image.left,
            top: image.top,
            right: image.left + image.width,
            bottom: image.top + image.height
        };
        
        if (isVerticalLine(line)) {
            const x = Math.max(bounds.left, Math.min(bounds.right, line.left));
            line.set({
                x1: x,
                x2: x,
                top: bounds.top,
                height: image.height
            });
        } else {
            const y = Math.max(bounds.top, Math.min(bounds.bottom, line.top));
            line.set({
                y1: y,
                y2: y,
                left: bounds.left,
                width: image.width
            });
        }
        
        updatePercentageLabel(line);
    };
    
    // 添加分割线
    const addSplitLine = (x, y) => {
        const image = CanvasUtils.getMainImage();
        if (!image) return;
        
        const isVertical = currentMode === 'vertical';
        const line = new fabric.Line(
            isVertical ? [x, image.top, x, image.top + image.height] : [image.left, y, image.left + image.width, y],
            {
                stroke: isVertical ? '#ff4444' : '#4444ff',
                strokeWidth: 2,
                selectable: true,
                hasControls: false,
                hasBorders: false,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                hoverCursor: isVertical ? 'ew-resize' : 'ns-resize'
            }
        );
        
        canvas.add(line);
        splitLines.push(line);
        updatePercentageLabel(line);
        canvas.renderAll();
    };
    
    // 更新分割线位置
    const updateLinePosition = (line, pointer) => {
        const image = CanvasUtils.getMainImage();
        if (!image) return;
        
        if (isVerticalLine(line)) {
            const x = Math.max(image.left, Math.min(image.left + image.width, pointer.x));
            line.set({
                x1: x,
                x2: x
            });
        } else {
            const y = Math.max(image.top, Math.min(image.top + image.height, pointer.y));
            line.set({
                y1: y,
                y2: y
            });
        }
        
        updatePercentageLabel(line);
        canvas.renderAll();
    };
    
    // 更新百分比标签
    const updatePercentageLabel = (line) => {
        const image = CanvasUtils.getMainImage();
        if (!image) return;
        
        // 移除旧标签
        if (line.label) {
            canvas.remove(line.label);
        }
        
        // 计算百分比
        const percentage = isVerticalLine(line)
            ? ((line.x1 - image.left) / image.width * 100).toFixed(1)
            : ((line.y1 - image.top) / image.height * 100).toFixed(1);
        
        // 创建新标签
        const label = new fabric.Text(`${percentage}%`, {
            left: isVerticalLine(line) ? line.x1 + 5 : line.x1,
            top: isVerticalLine(line) ? line.y1 : line.y1 + 5,
            fontSize: 14,
            fill: '#333333',
            selectable: false
        });
        
        line.label = label;
        canvas.add(label);
    };
    
    // 判断是否为垂直线
    const isVerticalLine = (line) => {
        return line.x1 === line.x2;
    };
    
    // 清除所有分割线
    const clearSplitLines = () => {
        splitLines.forEach(line => {
            if (line.label) {
                canvas.remove(line.label);
            }
            canvas.remove(line);
        });
        splitLines = [];
        canvas.renderAll();
    };
    
    return {
        activate,
        deactivate
    };
})();

class ManualSplitter {
    constructor() {
        this.canvas = null;
        this.splitLines = [];
        this.activeMode = null; // 'horizontal' or 'vertical'
        this.controls = null;
        this.isActive = false;
        this.gridSize = 10;
        this.image = null;
    }

    activate(canvas) {
        if (!canvas) {
            console.error('Canvas is required for manual splitter');
            return;
        }
        
        this.canvas = canvas;
        this.isActive = true;
        this.image = this.canvas.getObjects().find(obj => obj.type === 'image');
        
        if (!this.image) {
            console.error('No image found on canvas');
            return;
        }
        
        console.log('Manual splitter activated with image:', this.image);
        this.setupControls();
        this.setupEventListeners();
    }

    deactivate() {
        if (!this.isActive) return;
        
        // Remove event listeners before clearing canvas reference
        this.removeEventListeners();
        this.removeControls();
        this.clearAllLines();
        
        this.isActive = false;
        this.splitLines = [];
        this.image = null;
        // Keep canvas reference until all cleanup is done
        this.canvas = null;
    }

    setupControls() {
        // 创建控制面板
        this.controls = document.createElement('div');
        this.controls.className = 'manual-split-controls';
        this.controls.style.cssText = `
            position: fixed;
            top: 60px;
            left: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        // 添加横向分割线按钮
        const addHorizontalBtn = document.createElement('button');
        addHorizontalBtn.textContent = '添加横向分割线';
        addHorizontalBtn.onclick = () => this.addSplitLine('horizontal');

        // 添加纵向分割线按钮
        const addVerticalBtn = document.createElement('button');
        addVerticalBtn.textContent = '添加纵向分割线';
        addVerticalBtn.onclick = () => this.addSplitLine('vertical');

        // 清除所有分割线按钮
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '清除所有分割线';
        clearBtn.onclick = () => this.clearAllLines();

        // 百分比输入框
        const percentInput = document.createElement('input');
        percentInput.type = 'number';
        percentInput.min = '0';
        percentInput.max = '100';
        percentInput.value = '50';
        percentInput.style.width = '60px';
        percentInput.id = 'splitPercentInput';

        // 按百分比添加分割线按钮
        const addByPercentBtn = document.createElement('button');
        addByPercentBtn.textContent = '按百分比添加';
        addByPercentBtn.onclick = () => {
            const percent = parseFloat(percentInput.value);
            if (percent >= 0 && percent <= 100) {
                this.addSplitLineByPercent(this.activeMode || 'horizontal', percent);
            }
        };

        // 添加多条分割线控制
        const multiLineDiv = document.createElement('div');
        multiLineDiv.style.marginTop = '10px';
        
        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.min = '1';
        countInput.max = '20';
        countInput.value = '3';
        countInput.style.width = '60px';
        
        const addMultiHorizontalBtn = document.createElement('button');
        addMultiHorizontalBtn.textContent = '添加多条横向线';
        addMultiHorizontalBtn.onclick = () => {
            const count = parseInt(countInput.value);
            if (count > 0) this.addMultipleLines('horizontal', count);
        };
        
        const addMultiVerticalBtn = document.createElement('button');
        addMultiVerticalBtn.textContent = '添加多条纵向线';
        addMultiVerticalBtn.onclick = () => {
            const count = parseInt(countInput.value);
            if (count > 0) this.addMultipleLines('vertical', count);
        };

        multiLineDiv.appendChild(countInput);
        multiLineDiv.appendChild(addMultiHorizontalBtn);
        multiLineDiv.appendChild(addMultiVerticalBtn);
        
        // 添加所有控制元素
        this.controls.appendChild(addHorizontalBtn);
        this.controls.appendChild(addVerticalBtn);
        this.controls.appendChild(document.createElement('hr'));
        this.controls.appendChild(percentInput);
        this.controls.appendChild(addByPercentBtn);
        this.controls.appendChild(document.createElement('hr'));
        this.controls.appendChild(clearBtn);
        this.controls.appendChild(multiLineDiv);

        document.body.appendChild(this.controls);
    }

    removeControls() {
        if (this.controls && this.controls.parentNode) {
            this.controls.parentNode.removeChild(this.controls);
        }
    }

    setupEventListeners() {
        this.canvas.on('object:moving', this.onLineMoving.bind(this));
        this.canvas.on('mouse:dblclick', this.onDoubleClick.bind(this));
    }

    removeEventListeners() {
        this.canvas.off('object:moving', this.onLineMoving.bind(this));
        this.canvas.off('mouse:dblclick', this.onDoubleClick.bind(this));
    }

    addSplitLine(mode) {
        if (!this.canvas || !this.image || !this.isActive) {
            console.error('Cannot add split line: canvas or image not ready');
            return;
        }

        this.activeMode = mode;
        const isHorizontal = mode === 'horizontal';
        const coords = isHorizontal 
            ? [
                this.image.left,
                this.image.top + this.image.height * this.image.scaleY / 2,
                this.image.left + this.image.width * this.image.scaleX,
                this.image.top + this.image.height * this.image.scaleY / 2
              ]
            : [
                this.image.left + this.image.width * this.image.scaleX / 2,
                this.image.top,
                this.image.left + this.image.width * this.image.scaleX / 2,
                this.image.top + this.image.height * this.image.scaleY
              ];

        const line = new fabric.Line(coords, {
            stroke: '#007AFF',
            strokeWidth: 2,
            selectable: true,
            hasBorders: false,
            hasControls: false,
            lockMovementX: isHorizontal ? true : false,
            lockMovementY: isHorizontal ? false : true,
            name: `split-line-${mode}`,
            hoverCursor: isHorizontal ? 'ns-resize' : 'ew-resize',
            excludeFromExport: true
        });

        this.canvas.add(line);
        this.splitLines.push(line);
        this.canvas.renderAll();
        this.updatePercentages();
        
        console.log(`Added ${mode} split line`);
    }

    addSplitLineByPercent(mode, percent) {
        this.activeMode = mode;
        const image = this.canvas.getObjects().find(obj => obj.type === 'image');
        if (!image) return;

        const position = mode === 'horizontal' 
            ? (image.height * percent / 100)
            : (image.width * percent / 100);

        const coords = mode === 'horizontal'
            ? [
                image.left,
                image.top + position,
                image.left + image.width,
                image.top + position
              ]
            : [
                image.left + position,
                image.top,
                image.left + position,
                image.top + image.height
              ];

        const line = new fabric.Line(coords, {
            stroke: '#007AFF',
            strokeWidth: 2,
            selectable: true,
            hasBorders: false,
            hasControls: false,
            lockMovementX: mode === 'horizontal' ? true : false,
            lockMovementY: mode === 'horizontal' ? false : true,
            name: `split-line-${mode}`,
            hoverCursor: mode === 'horizontal' ? 'ns-resize' : 'ew-resize',
            excludeFromExport: true
        });

        this.canvas.add(line);
        this.splitLines.push(line);
        this.canvas.renderAll();
        this.updatePercentages();
    }

    onLineMoving(e) {
        const line = e.target;
        const image = this.canvas.getObjects().find(obj => obj.type === 'image');
        if (!line || !image) return;

        // 获取当前位置相对于图片的坐标
        let position = line.name.includes('horizontal') 
            ? line.top - image.top 
            : line.left - image.left;
        
        const maxPosition = line.name.includes('horizontal') ? image.height : image.width;

        // 计算网格吸附
        const gridSize = maxPosition / this.gridSize;
        const snappedPosition = Math.round(position / gridSize) * gridSize;

        // 应用网格吸附
        if (Math.abs(position - snappedPosition) < 5) { // 5px 吸附阈值
            if (line.name.includes('horizontal')) {
                line.set('top', snappedPosition + image.top);
            } else {
                line.set('left', snappedPosition + image.left);
            }
        }

        // 限制范围
        if (line.name.includes('horizontal')) {
            if (line.top < image.top) line.set('top', image.top);
            if (line.top > image.top + image.height) line.set('top', image.top + image.height);
        } else {
            if (line.left < image.left) line.set('left', image.left);
            if (line.left > image.left + image.width) line.set('left', image.left + image.width);
        }

        this.updatePercentages();
    }

    onDoubleClick(e) {
        const line = e.target;
        if (line && this.splitLines.includes(line)) {
            this.canvas.remove(line);
            this.splitLines = this.splitLines.filter(l => l !== line);
            this.canvas.renderAll();
            this.updatePercentages();
        }
    }

    updatePercentages() {
        const image = this.canvas.getObjects().find(obj => obj.type === 'image');
        if (!image) return;

        this.splitLines.forEach(line => {
            const isHorizontal = line.name.includes('horizontal');
            const percent = isHorizontal
                ? ((line.top - image.top) / image.height * 100).toFixed(1)
                : ((line.left - image.left) / image.width * 100).toFixed(1);

            // 更新或创建百分比标签
            if (!line.percentLabel) {
                line.percentLabel = new fabric.Text(`${percent}%`, {
                    fontSize: 12,
                    fill: '#007AFF',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    left: isHorizontal ? image.left + 5 : line.left + 5,
                    top: isHorizontal ? line.top - 20 : image.top + 5,
                    selectable: false,
                    excludeFromExport: true
                });
                this.canvas.add(line.percentLabel);
            } else {
                line.percentLabel.set({
                    text: `${percent}%`,
                    left: isHorizontal ? image.left + 5 : line.left + 5,
                    top: isHorizontal ? line.top - 20 : image.top + 5
                });
            }
        });

        this.canvas.renderAll();
    }

    clearAllLines() {
        if (!this.canvas || !this.isActive) return;
        
        // 保存当前canvas引用以防止在循环中被清空
        const currentCanvas = this.canvas;
        
        this.splitLines.forEach(line => {
            if (line.percentLabel) {
                currentCanvas.remove(line.percentLabel);
            }
            currentCanvas.remove(line);
        });
        this.splitLines = [];
        
        currentCanvas.renderAll();
    }

    getSplitData() {
        const image = this.canvas.getObjects().find(obj => obj.type === 'image');
        if (!image) return null;

        const horizontalLines = this.splitLines
            .filter(line => line.name.includes('horizontal'))
            .map(line => ({
                position: line.top,
                percent: (line.top / image.height * 100).toFixed(1)
            }))
            .sort((a, b) => a.position - b.position);

        const verticalLines = this.splitLines
            .filter(line => line.name.includes('vertical'))
            .map(line => ({
                position: line.left,
                percent: (line.left / image.width * 100).toFixed(1)
            }))
            .sort((a, b) => a.position - b.position);

        return {
            horizontalLines,
            verticalLines,
            imageWidth: image.width,
            imageHeight: image.height
        };
    }

    // 添加新方法：添加多条等距分割线
    addMultipleLines(mode, count) {
        if (count < 1) return;
        
        const image = this.canvas.getObjects().find(obj => obj.type === 'image');
        if (!image) return;

        const spacing = mode === 'horizontal' 
            ? image.height / (count + 1)
            : image.width / (count + 1);

        for (let i = 1; i <= count; i++) {
            const position = spacing * i;
            this.addSplitLineByPercent(mode, (position / (mode === 'horizontal' ? image.height : image.width)) * 100);
        }
    }
}

// 初始化手动分割器
window.manualSplitter = new ManualSplitter();

// 添加到 main.js 事件处理
document.getElementById('manualMode').addEventListener('click', () => {
    if (!window.canvasManager.image) {
        alert('请先上传图片！');
        return;
    }

    // 更新 UI
    document.getElementById('manualMode').classList.add('active');
    document.getElementById('autoMode').classList.remove('active');

    // 停用自动模式的分割框
    const canvas = window.canvasManager.canvas;
    const splitBoxes = canvas.getObjects().filter(obj => 
        obj.name && obj.name.startsWith('split-box-')
    );
    splitBoxes.forEach(box => canvas.remove(box));
    canvas.renderAll();

    // 激活手动分割模式
    window.manualSplitter.activate(canvas);
});