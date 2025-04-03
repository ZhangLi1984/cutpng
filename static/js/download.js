// 下载处理模块
const DownloadHandler = (() => {
    let canvas;
    
    // 初始化函数
    const init = (mainCanvas) => {
        canvas = mainCanvas;
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', handleDownload);
    };
    
    // 处理下载
    const handleDownload = () => {
        if (!canvas) return;
        
        // 获取画布数据URL
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1
        });
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = '分割结果.png';
        link.href = dataURL;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return {
        init
    };
})();

class ImageDownloader {
    constructor() {
        this.zip = null;
    }

    async downloadSplitImages() {
        const imageData = window.canvasManager.getImageData();
        if (!imageData.image) {
            alert('请先上传图片！');
            return;
        }

        const canvas = window.canvasManager.canvas;
        const splitBoxes = canvas.getObjects().filter(obj => obj.name && obj.name.startsWith('split-box-'));
        const splitLines = canvas.getObjects().filter(obj => obj.name && obj.name.startsWith('split-line-'));

        // 检查是否有分割框或分割线
        if (splitBoxes.length === 0 && splitLines.length === 0) {
            alert('请先添加分割框或分割线！');
            return;
        }

        // Load JSZip dynamically if not already loaded
        if (typeof JSZip === 'undefined') {
            await this.loadJSZip();
        }

        this.zip = new JSZip();
        
        // 处理不同的分割模式
        if (splitBoxes.length > 0) {
            // 自动模式：处理分割框
            await this.processSplitBoxes(splitBoxes, imageData);
        } else if (splitLines.length > 0) {
            // 手动模式：处理分割线
            await this.processSplitLines(splitLines, imageData);
        }
        
        await this.generateAndDownloadZip();
    }

    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async processSplitBoxes(splitBoxes, imageData) {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        // Get the original image scale
        const originalImage = imageData.image;
        const scaleX = originalImage.width / originalImage.scaleX;
        const scaleY = originalImage.height / originalImage.scaleY;

        splitBoxes.forEach((box, index) => {
            // Calculate actual dimensions and positions
            const actualLeft = (box.left - originalImage.left) / originalImage.scaleX;
            const actualTop = (box.top - originalImage.top) / originalImage.scaleY;
            const actualWidth = box.width * box.scaleX / originalImage.scaleX;
            const actualHeight = box.height * box.scaleY / originalImage.scaleY;

            // Set canvas size to actual dimensions
            tempCanvas.width = Math.round(actualWidth);
            tempCanvas.height = Math.round(actualHeight);

            // Clear canvas with transparent background
            ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            try {
                // Draw the portion of the original image
                ctx.drawImage(
                    originalImage._element,
                    Math.round(actualLeft),
                    Math.round(actualTop),
                    Math.round(actualWidth),
                    Math.round(actualHeight),
                    0,
                    0,
                    tempCanvas.width,
                    tempCanvas.height
                );

                // Convert to base64 and add to zip
                const base64Data = tempCanvas.toDataURL('image/png').split(',')[1];
                this.zip.file(`sprite_${index + 1}.png`, base64Data, { base64: true });
            } catch (error) {
                console.error('Error processing box:', error, {
                    actualLeft,
                    actualTop,
                    actualWidth,
                    actualHeight,
                    box
                });
            }
        });
    }

    async processSplitLines(splitLines, imageData) {
        const originalImage = imageData.image;
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        // 分别获取横向和纵向分割线
        const horizontalLines = splitLines
            .filter(line => line.name.includes('horizontal'))
            .map(line => line.top)
            .sort((a, b) => a - b);
        
        const verticalLines = splitLines
            .filter(line => line.name.includes('vertical'))
            .map(line => line.left)
            .sort((a, b) => a - b);

        // 添加图片边界
        const boundaries = {
            horizontal: [originalImage.top, ...horizontalLines, originalImage.top + originalImage.height * originalImage.scaleY],
            vertical: [originalImage.left, ...verticalLines, originalImage.left + originalImage.width * originalImage.scaleX]
        };

        // 生成所有分割区域
        let index = 0;
        for (let i = 0; i < boundaries.vertical.length - 1; i++) {
            for (let j = 0; j < boundaries.horizontal.length - 1; j++) {
                const left = boundaries.vertical[i];
                const top = boundaries.horizontal[j];
                const width = boundaries.vertical[i + 1] - left;
                const height = boundaries.horizontal[j + 1] - top;

                // 计算实际尺寸（考虑缩放）
                const actualLeft = (left - originalImage.left) / originalImage.scaleX;
                const actualTop = (top - originalImage.top) / originalImage.scaleY;
                const actualWidth = width / originalImage.scaleX;
                const actualHeight = height / originalImage.scaleY;

                // 设置临时画布尺寸
                tempCanvas.width = Math.round(actualWidth);
                tempCanvas.height = Math.round(actualHeight);

                // 清除画布
                ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                try {
                    // 绘制图片部分
                    ctx.drawImage(
                        originalImage._element,
                        Math.round(actualLeft),
                        Math.round(actualTop),
                        Math.round(actualWidth),
                        Math.round(actualHeight),
                        0,
                        0,
                        tempCanvas.width,
                        tempCanvas.height
                    );

                    // 添加到压缩包
                    const base64Data = tempCanvas.toDataURL('image/png').split(',')[1];
                    this.zip.file(`sprite_${++index}.png`, base64Data, { base64: true });
                } catch (error) {
                    console.error('Error processing region:', error, {
                        actualLeft,
                        actualTop,
                        actualWidth,
                        actualHeight
                    });
                }
            }
        }
    }

    async generateAndDownloadZip() {
        try {
            const content = await this.zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'split_sprites.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Error generating zip:', error);
            alert('生成压缩文件时出错，请重试！');
        }
    }
}

// Initialize downloader
window.imageDownloader = new ImageDownloader();