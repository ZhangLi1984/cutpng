// 主控制模块
const MainApp = (() => {
    let canvas;
    let currentMode = null;
    
    // 初始化函数
    const init = () => {
        // 初始化画布
        canvas = new fabric.Canvas('mainCanvas', {
            backgroundColor: '#f5f5f5',
            selection: false
        });
        
        // 绑定事件
        document.getElementById('autoMode').addEventListener('click', switchToAutoMode);
        document.getElementById('manualMode').addEventListener('click', switchToManualMode);
        
        console.log('Main application initialized');
    };
    
    // 切换到自动分割模式
    const switchToAutoMode = () => {
        if (currentMode) currentMode.deactivate();
        currentMode = AutoSplitMode;
        currentMode.activate(canvas);
    };
    
    // 切换到手动分割模式
    const switchToManualMode = () => {
        if (currentMode) currentMode.deactivate();
        currentMode = ManualSplitMode;
        currentMode.activate(canvas);
    };
    
    return {
        init
    };
})();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const autoModeBtn = document.getElementById('autoMode');
    const manualModeBtn = document.getElementById('manualMode');
    const downloadBtn = document.getElementById('downloadBtn');
    const container = document.querySelector('.container');

    // Disable controls initially
    autoModeBtn.disabled = true;
    manualModeBtn.disabled = true;
    downloadBtn.disabled = true;
    
    // 添加加载状态
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    container.appendChild(loadingOverlay);

    // Auto mode handler
    autoModeBtn.addEventListener('click', async () => {
        if (!window.canvasManager.image) {
            alert('请先上传图片！');
            return;
        }

        // Show loading state
        document.querySelector('.loading-overlay').classList.add('active');

        // Update UI
        autoModeBtn.classList.add('active');
        manualModeBtn.classList.remove('active');
        
        // Deactivate manual mode
        window.manualSplitter.deactivate();
        
        try {
            // Detect and apply split points
            const imageData = window.canvasManager.getImageData();
            const splitPoints = await window.autoSplitter.detectSplitPoints(imageData);
            window.autoSplitter.applySplits(splitPoints);
        } catch (error) {
            console.error('Auto split error:', error);
            alert('自动分割失败，请重试或使用手动模式');
        } finally {
            // Hide loading state
            document.querySelector('.loading-overlay').classList.remove('active');
        }
    });

    // Manual mode handler
    manualModeBtn.addEventListener('click', () => {
        if (!window.canvasManager.image) {
            alert('请先上传图片！');
            return;
        }

        // Update UI
        manualModeBtn.classList.add('active');
        autoModeBtn.classList.remove('active');
        
        // 清除自动模式的分割框
        window.canvasManager.clearLines();
        
        // 激活手动模式，传入 canvas 对象
        window.manualSplitter.activate(window.canvasManager.canvas);
        
        // 添加点击反馈
        manualModeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            manualModeBtn.style.transform = 'scale(1)';
        }, 150);
    });

    // Download handler
    downloadBtn.addEventListener('click', async () => {
        await window.imageDownloader.downloadSplitImages();
    });
});