// Canvas基础操作模块
const CanvasUtils = (() => {
    let canvas;
    let zoomLevel = 1;
    
    // 初始化函数
    const init = (mainCanvas) => {
        canvas = mainCanvas;
        setupZoom();
        console.log('Canvas utils initialized');
    };
    
    // 设置缩放功能
    const setupZoom = () => {
        canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = canvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.1) zoom = 0.1;
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
    };
    
    // 清除画布
    const clearCanvas = () => {
        canvas.clear();
        canvas.renderAll();
    };
    
    // 调整画布大小
    const resizeCanvas = (width, height) => {
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.renderAll();
    };
    
    // 添加对象到画布
    const addToCanvas = (obj) => {
        canvas.add(obj);
        canvas.renderAll();
    };
    
    // 从画布移除对象
    const removeFromCanvas = (obj) => {
        canvas.remove(obj);
        canvas.renderAll();
    };
    
    // 获取画布中的主图像
    const getMainImage = () => {
        return canvas.getObjects().find(obj => obj.type === 'image');
    };
    
    // 获取图像数据
    const getImageData = () => {
        const image = getMainImage();
        if (!image) return null;

        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        
        image.render(ctx);
        return ctx.getImageData(0, 0, image.width, image.height);
    };

    // 重置缩放
    const resetZoom = () => {
        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.renderAll();
    };
    
    return {
        init,
        clearCanvas,
        resizeCanvas,
        addToCanvas,
        removeFromCanvas,
        getMainImage,
        getImageData,
        resetZoom
    };
})();

class CanvasManager {
    constructor() {
        this.initCanvas();
        this.setupEventListeners();
    }

    initCanvas() {
        this.canvas = new fabric.Canvas('mainCanvas', {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            renderOnAddRemove: false,
            enableRetinaScaling: false,
            skipTargetFind: false,
            targetFindTolerance: 5
        });
        
        // 优化性能设置
        this.canvas.selection = false; // 禁用多选
        this.canvas.skipOffscreen = true; // 跳过屏幕外的渲染
        
        // 设置自定义属性
        this.image = null;
        this.mode = 'auto';
        this.isDrawing = false;
        this.lines = [];
    }

    setupEventListeners() {
        // 使用节流函数优化渲染
        let renderTimeout;
        const debouncedRender = () => {
            if (renderTimeout) {
                cancelAnimationFrame(renderTimeout);
            }
            renderTimeout = requestAnimationFrame(() => {
                this.canvas.renderAll();
            });
        };

        this.canvas.on({
            'object:moving': debouncedRender,
            'object:scaling': debouncedRender,
            'object:modified': debouncedRender
        });

        // 优化窗口调整大小的处理
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
            }, 100);
        });
    }

    resizeCanvas() {
        if (!this.image) return;

        const container = document.querySelector('.canvas-container');
        const maxWidth = container.clientWidth - 40;
        const scale = maxWidth / this.image.width;

        this.canvas.setDimensions({
            width: this.image.width * scale,
            height: this.image.height * scale
        });

        this.canvas.setZoom(scale);
        this.canvas.renderAll();
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(url, (img) => {
                this.image = img;
                
                // 计算适当的尺寸
                const container = document.querySelector('.canvas-container');
                const maxWidth = container.clientWidth - 40;
                const scale = maxWidth / img.width;
                
                // 设置画布尺寸
                this.canvas.setDimensions({
                    width: img.width * scale,
                    height: img.height * scale
                });
                
                // 配置图片
                img.scale(scale);
                img.set({
                    left: 0,
                    top: 0,
                    selectable: false,
                    evented: false,
                    excludeFromExport: true,
                    originX: 'left',
                    originY: 'top'
                });
                
                // 清理和添加
                this.canvas.clear();
                this.canvas.add(img);
                this.canvas.renderAll();
                
                resolve(img);
            }, (error) => {
                reject(error);
            }, {
                crossOrigin: 'anonymous'
            });
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.canvas.selection = false;
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
    }

    clearLines() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            if (obj !== this.image) {
                this.canvas.remove(obj);
            }
        });
        this.lines = [];
        this.canvas.renderAll();
    }

    addLine(points, options = {}) {
        const line = new fabric.Line(points, {
            stroke: '#007AFF',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            ...options
        });
        this.lines.push(line);
        this.canvas.add(line);
        return line;
    }

    getImageData() {
        return {
            image: this.image,
            dimensions: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        };
    }
}

// Export the canvas manager
window.canvasManager = new CanvasManager();