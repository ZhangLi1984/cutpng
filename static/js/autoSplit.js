// 自动分割模式模块
const AutoSplitMode = (() => {
    let canvas;
    let splitRects = [];
    let isDrawing = false;
    let startPoint = null;
    
    // 激活模式
    const activate = (mainCanvas) => {
        canvas = mainCanvas;
        setupEventListeners();
        addControlButtons();
        console.log('Auto split mode activated');
    };
    
    // 停用模式
    const deactivate = () => {
        removeEventListeners();
        clearSplitRects();
        removeControlButtons();
        console.log('Auto split mode deactivated');
    };
    
    // 添加控制按钮
    const addControlButtons = () => {
        const controls = document.querySelector('.controls');
        const addButton = document.createElement('button');
        addButton.id = 'addSplitRect';
        addButton.textContent = '添加分割区域';
        addButton.onclick = () => { isDrawing = true; };
        
        const clearButton = document.createElement('button');
        clearButton.id = 'clearSplitRects';
        clearButton.textContent = '清除所有区域';
        clearButton.onclick = clearSplitRects;
        
        controls.appendChild(addButton);
        controls.appendChild(clearButton);
    };
    
    // 移除控制按钮
    const removeControlButtons = () => {
        const addButton = document.getElementById('addSplitRect');
        const clearButton = document.getElementById('clearSplitRects');
        if (addButton) addButton.remove();
        if (clearButton) clearButton.remove();
    };
    
    // 设置事件监听
    const setupEventListeners = () => {
        canvas.on('mouse:down', onMouseDown);
        canvas.on('mouse:move', onMouseMove);
        canvas.on('mouse:up', onMouseUp);
        canvas.on('object:modified', onObjectModified);
    };
    
    // 移除事件监听
    const removeEventListeners = () => {
        canvas.off('mouse:down', onMouseDown);
        canvas.off('mouse:move', onMouseMove);
        canvas.off('mouse:up', onMouseUp);
        canvas.off('object:modified', onObjectModified);
    };
    
    // 鼠标按下事件
    const onMouseDown = (e) => {
        if (!isDrawing || !e.pointer) return;
        startPoint = e.pointer;
    };
    
    // 鼠标移动事件
    const onMouseMove = (e) => {
        if (!isDrawing || !startPoint || !e.pointer) return;
        
        const pointer = e.pointer;
        const width = Math.abs(pointer.x - startPoint.x);
        const height = Math.abs(pointer.y - startPoint.y);
        const left = Math.min(startPoint.x, pointer.x);
        const top = Math.min(startPoint.y, pointer.y);
        
        if (splitRects.length > 0) {
            const lastRect = splitRects[splitRects.length - 1];
            lastRect.set({
                width: width,
                height: height,
                left: left,
                top: top
            });
        } else {
            createSplitRect(left, top, width, height);
        }
        
        canvas.renderAll();
    };
    
    // 鼠标释放事件
    const onMouseUp = () => {
        if (!isDrawing) return;
        isDrawing = false;
        startPoint = null;
    };
    
    // 对象修改事件
    const onObjectModified = (e) => {
        const rect = e.target;
        if (!rect || !splitRects.includes(rect)) return;
        
        // 确保矩形在画布范围内
        const image = CanvasUtils.getMainImage();
        if (!image) return;
        
        const bounds = {
            left: image.left,
            top: image.top,
            right: image.left + image.width,
            bottom: image.top + image.height
        };
        
        rect.set({
            left: Math.max(bounds.left, Math.min(bounds.right - rect.width, rect.left)),
            top: Math.max(bounds.top, Math.min(bounds.bottom - rect.height, rect.top))
        });
        
        canvas.renderAll();
    };
    
    // 创建分割矩形
    const createSplitRect = (x, y, width, height) => {
        const rect = new fabric.Rect({
            left: x,
            top: y,
            width: width,
            height: height,
            fill: 'rgba(0, 0, 255, 0.2)',
            stroke: 'blue',
            strokeWidth: 2,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            transparentCorners: false,
            cornerColor: 'blue',
            cornerSize: 30, // 增大控制点大小，更容易点击
            cornerStyle: 'circle',
            lockRotation: true,     
            lockSkewingX: true,     
            lockSkewingY: true,
            padding: 10,
            borderColor: 'blue',
            cornerStrokeColor: 'blue',
            // 确保以下属性设置正确
            lockUniScaling: false,  // 允许非等比缩放
            lockScalingX: false,    // 允许水平缩放
            lockScalingY: false,    // 允许垂直缩放
            centeredScaling: false, // 从边角进行缩放
            hasRotatingPoint: false // 禁用旋转点
        });
        
        // 添加事件处理
        rect.on({
            'mousedown': (e) => {
                rect.isDragging = true;
                rect.dragOffsetX = e.pointer.x - rect.left;
                rect.dragOffsetY = e.pointer.y - rect.top;
            },
            'scaling': (e) => {
                // 处理缩放事件
                const target = e.target;
                const image = CanvasUtils.getMainImage();
                if (!image) return;
    
                // 确保不会缩放到图片范围外
                const bounds = {
                    left: image.left,
                    top: image.top,
                    right: image.left + image.width,
                    bottom: image.top + image.height
                };
    
                // 限制最小尺寸
                const minSize = 20;
                const currentWidth = target.getScaledWidth();
                const currentHeight = target.getScaledHeight();
    
                if (currentWidth < minSize) {
                    target.scaleX = minSize / target.width;
                }
                if (currentHeight < minSize) {
                    target.scaleY = minSize / target.height;
                }
    
                // 限制在图片范围内
                if (target.left < bounds.left) target.left = bounds.left;
                if (target.top < bounds.top) target.top = bounds.top;
    
                const currentRight = target.left + currentWidth;
                const currentBottom = target.top + currentHeight;
    
                if (currentRight > bounds.right) {
                    target.scaleX = (bounds.right - target.left) / target.width;
                }
                if (currentBottom > bounds.bottom) {
                    target.scaleY = (bounds.bottom - target.top) / target.height;
                }
    
                canvas.renderAll();
            },
            'modified': () => {
                canvas.renderAll();
            }
        });
        
        canvas.add(rect);
        splitRects.push(rect);
        canvas.renderAll();
    };
    
    // 清除所有分割矩形
    const clearSplitRects = () => {
        splitRects.forEach(rect => canvas.remove(rect));
        splitRects = [];
        canvas.renderAll();
    };
    
    return {
        activate,
        deactivate
    };
})();

class AutoSplitter {
    constructor() {
        this.threshold = 30; // Alpha threshold for detecting objects
        this.minObjectSize = 20; // Minimum size of object to be detected
        this.padding = 5; // Padding around detected objects
        this.maxObjectSize = 0.6; // 最大对象尺寸（相对于图片尺寸的比例）
    }

    // 新增的detectSplitPoints方法作为detectObjects的包装器
    async detectSplitPoints(imageData) {
        try {
            if (!imageData || !imageData.image) {
                throw new Error('Invalid image data');
            }
            
            // Ensure detectObjects returns an array
            const objects = await this.detectObjects(imageData) || [];
            
            // Validate objects before returning
            const validObjects = objects.filter(obj => 
                obj && typeof obj.x === 'number' && 
                typeof obj.y === 'number' && 
                typeof obj.width === 'number' && 
                typeof obj.height === 'number'
            );
            
            return validObjects;
        } catch (error) {
            console.error('Error detecting split points:', error);
            return []; // Return empty array instead of throwing
        }
    }

    async detectObjects(imageData) {
        const { image, dimensions } = imageData;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        // Draw the image onto the temporary canvas
        ctx.drawImage(image._element, 0, 0, dimensions.width, dimensions.height);
        
        // Get image data for analysis
        const data = ctx.getImageData(0, 0, dimensions.width, dimensions.height).data;
        
        // Find objects by scanning for non-transparent pixels
        const objects = this.findObjects(data, dimensions.width, dimensions.height);
        
        // 返回检测到的对象数组
        return objects;
    }

    // 修改 createSplitBoxes 方法，添加调整大小的功能
    createSplitBoxes(objects) {
        const canvas = window.canvasManager.canvas;
        canvas.discardActiveObject();
        
        // 移除现有的分割框
        const existingBoxes = canvas.getObjects().filter(obj => 
            obj.name && obj.name.startsWith('split-box-')
        );
        existingBoxes.forEach(box => canvas.remove(box));

        // 创建新的分割框
        objects.forEach((obj, index) => {
            const rect = new fabric.Rect({
                left: obj.x,
                top: obj.y,
                width: obj.width,
                height: obj.height,
                fill: 'rgba(0, 120, 255, 0.2)',
                stroke: '#007AFF',
                strokeWidth: 2,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                transparentCorners: false,
                cornerColor: '#007AFF',
                cornerSize: 30, // 增大控制点大小，更容易点击
                cornerStyle: 'circle',
                lockRotation: true,
                name: `split-box-${index}`,
                borderColor: '#007AFF',
                cornerStrokeColor: '#007AFF',
                padding: 10,
                // 添加以下属性以启用缩放
                lockUniScaling: false,
                lockScalingX: false,
                lockScalingY: false,
                centeredScaling: false,
                hasRotatingPoint: false // 禁用旋转点
            });

            // 使用 requestAnimationFrame 优化性能
            let rafId;
            const debouncedRender = () => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => canvas.renderAll());
            };

            // 添加事件处理
            rect.on({
                'moving': (e) => {
                    this.constrainBoxMovement(e.target);
                    debouncedRender();
                },
                'scaling': (e) => {
                    this.constrainBoxScaling(e.target);
                    debouncedRender();
                },
                'modified': (e) => {
                    // 调整大小后更新约束
                    this.constrainBoxScaling(e.target);
                    debouncedRender();
                },
                'mousedown': (e) => {
                    if (e.e.detail === 2) { // 双击删除
                        canvas.remove(rect);
                        canvas.renderAll();
                    }
                }
            });

            canvas.add(rect);
        });

        canvas.renderAll();
    }

    findObjects(data, width, height) {
        const visited = new Set();
        const objects = [];
        const minArea = 100; // 最小面积阈值
        const maxArea = width * height * this.maxObjectSize; // 最大面积阈值
        const maxObjects = 50; // 最大检测对象数量

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const alpha = data[idx + 3];

                if (alpha > this.threshold && !visited.has(`${x},${y}`)) {
                    const object = this.floodFill(data, width, height, x, y, visited);
                    if (object && 
                        object.area >= minArea && 
                        object.area <= maxArea && 
                        object.width <= width * this.maxObjectSize &&
                        object.height <= height * this.maxObjectSize) {
                        objects.push(object);
                        if (objects.length >= maxObjects) break;
                    }
                }
            }
            if (objects.length >= maxObjects) break;
        }

        return objects;
    }

    floodFill(data, width, height, startX, startY, visited) {
        const queue = [[startX, startY]];
        let minX = startX, maxX = startX;
        let minY = startY, maxY = startY;
        let area = 0;
        let nonTransparentPixels = 0;

        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            visited.add(key);
            area++;

            const idx = (y * width + x) * 4;
            if (data[idx + 3] > this.threshold) {
                nonTransparentPixels++;
            }

            // Update bounds
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);

            // Check neighboring pixels (8-direction)
            for (const [nx, ny] of [
                [x + 1, y], [x - 1, y],
                [x, y + 1], [x, y - 1],
                [x + 1, y + 1], [x - 1, y - 1],
                [x + 1, y - 1], [x - 1, y + 1]
            ]) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = (ny * width + nx) * 4;
                    const alpha = data[idx + 3];
                    if (alpha > this.threshold && !visited.has(`${nx},${ny}`)) {
                        queue.push([nx, ny]);
                    }
                }
            }
        }

        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;
        const boxArea = boxWidth * boxHeight;
        
        // 过滤条件：
        // 1. 区域太小
        // 2. 边长太小
        // 3. 实际非透明像素占比太低（避免大量空白区域）
        // 4. 区域太大
        if (area < this.minObjectSize * this.minObjectSize || 
            boxWidth < this.minObjectSize || 
            boxHeight < this.minObjectSize ||
            nonTransparentPixels / boxArea < 0.1 || // 非透明像素密度阈值
            area > width * height * this.maxObjectSize) {
            return null;
        }

        return {
            x: Math.max(0, minX - this.padding),
            y: Math.max(0, minY - this.padding),
            width: Math.min(width - minX, boxWidth + 2 * this.padding),
            height: Math.min(height - minY, boxHeight + 2 * this.padding),
            area: nonTransparentPixels // 使用非透明像素数量作为面积
        };
    }

    constrainBoxMovement(box) {
        const canvas = window.canvasManager.canvas;
        const displayScale = window.canvasManager.displayScale;
        
        // 转换为原始坐标系进行约束
        const originalLeft = box.left / displayScale;
        const originalWidth = (box.width * box.scaleX) / displayScale;
        
        box.left = Math.max(0, Math.min(canvas.width - box.width * box.scaleX, box.left));
        box.top = Math.max(0, Math.min(canvas.height - box.height * box.scaleY, box.top));
    }

    constrainBoxScaling(box) {
        const canvas = window.canvasManager.canvas;
        const displayScale = window.canvasManager.displayScale;
        
        // 转换为原始尺寸进行约束
        const currentWidth = (box.width * box.scaleX) / displayScale;
        const currentHeight = (box.height * box.scaleY) / displayScale;
        
        if (currentWidth < this.minObjectSize) {
            box.scaleX = (this.minObjectSize * displayScale) / box.width;
        }
        if (currentHeight < this.minObjectSize) {
            box.scaleY = (this.minObjectSize * displayScale) / box.height;
        }

        // 边界限制
        const rightEdge = box.left + box.width * box.scaleX;
        const bottomEdge = box.top + box.height * box.scaleY;
        
        if (rightEdge > canvas.width) {
            box.scaleX = (canvas.width - box.left) / box.width;
        }
        if (bottomEdge > canvas.height) {
            box.scaleY = (canvas.height - box.top) / box.height;
        }
    }

    // 新增applySplits方法用于应用分割点
    applySplits(splitPoints) {
        if (!splitPoints || !Array.isArray(splitPoints)) {
            console.error('Invalid split points');
            return;
        }
        
        if (splitPoints.length === 0) {
            console.log('No split points detected');
            return;
        }
        
        this.createSplitBoxes(splitPoints);
    }
}

// Initialize auto splitter
window.autoSplitter = new AutoSplitter();

// Add to main.js event handler
document.getElementById('autoMode').addEventListener('click', async () => {
    if (!window.canvasManager.image) {
        alert('请先上传图片！');
        return;
    }

    // Update UI
    document.getElementById('autoMode').classList.add('active');
    document.getElementById('manualMode').classList.remove('active');
    
    // Deactivate manual mode
    window.manualSplitter.deactivate();
    
    // Detect and create split boxes
    const imageData = window.canvasManager.getImageData();
    await window.autoSplitter.detectObjects(imageData);
});