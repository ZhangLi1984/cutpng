// 文件上传处理模块
class UploadHandler {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('imageUpload');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            window.canvasManager.loadImage(e.target.result)
                .then(() => {
                    // Enable controls after successful upload
                    document.getElementById('autoMode').disabled = false;
                    document.getElementById('manualMode').disabled = false;
                    document.getElementById('downloadBtn').disabled = false;
                })
                .catch(error => {
                    console.error('Error loading image:', error);
                    alert('加载图片时出错，请重试！');
                });
        };
        reader.readAsDataURL(file);
    }
}

// Initialize upload handler
window.uploadHandler = new UploadHandler();