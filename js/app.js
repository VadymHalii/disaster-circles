class DisasterCirclesApp {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.scale = 1; // pixels per meter
        this.circles = [];
        this.scalePoints = [];
        this.isDragging = false;
        this.dragStartPoint = { x: 0, y: 0 };
        this.dragOffsets = []; // Store offsets for all draggable circles
        this.circleCounter = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
    }

    setupEventListeners() {
        // File upload
        const imageInput = document.getElementById('imageInput');
        const uploadArea = document.getElementById('uploadArea');

        imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        uploadArea.addEventListener('click', () => imageInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Scale confirmation
        document.getElementById('confirmScale').addEventListener('click', () => this.confirmScale());

        // Circle controls
        document.getElementById('addCircle').addEventListener('click', () => this.addCircle());
        document.getElementById('exportImage').addEventListener('click', () => this.exportImage());
    }

    setupCanvas() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.target.classList.add('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        event.target.classList.remove('dragover');

        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.image = new Image();
            this.image.onload = () => {
                this.setupImageCanvas();
                this.showScaleSection();
            };
            this.image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setupImageCanvas() {
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;

        this.redrawCanvas();
        document.getElementById('canvasContainer').style.display = 'block';
    }

    showScaleSection() {
        document.getElementById('scaleSection').style.display = 'block';
        document.getElementById('scaleInfo').textContent = 'Клацніть на два кінці масштабної лінійки';
        this.scalePoints = [];
    }

    handleCanvasClick(event) {
        if (document.getElementById('scaleSection').style.display !== 'none' && this.scalePoints.length < 2) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;

            this.scalePoints.push({ x, y });

            if (this.scalePoints.length === 1) {
                document.getElementById('scaleInfo').textContent = 'Клацніть на другий кінець масштабної лінійки';
            } else if (this.scalePoints.length === 2) {
                const distance = Math.sqrt(
                    Math.pow(this.scalePoints[1].x - this.scalePoints[0].x, 2) +
                    Math.pow(this.scalePoints[1].y - this.scalePoints[0].y, 2)
                );
                document.getElementById('scaleInfo').textContent =
                    `Довжина відрізка: ${distance.toFixed(1)} пікселів. Введіть реальну довжину та натисніть "Підтвердити масштаб"`;
            }

            this.redrawCanvas();
        }
    }

    confirmScale() {
        if (this.scalePoints.length !== 2) {
            alert('Будь ласка, виберіть два кінці масштабної лінійки');
            return;
        }

        const scaleValue = parseFloat(document.getElementById('scaleValue').value);
        const scaleUnit = document.getElementById('scaleUnit').value;

        if (!scaleValue || scaleValue <= 0) {
            alert('Будь ласка, введіть коректне значення масштабу');
            return;
        }

        const pixelDistance = Math.sqrt(
            Math.pow(this.scalePoints[1].x - this.scalePoints[0].x, 2) +
            Math.pow(this.scalePoints[1].y - this.scalePoints[0].y, 2)
        );

        const realDistance = scaleUnit === 'km' ? scaleValue * 1000 : scaleValue;
        this.scale = pixelDistance / realDistance;

        document.getElementById('scaleSection').style.display = 'none';
        document.getElementById('circlesSection').style.display = 'block';

        this.scalePoints = [];
        this.redrawCanvas();
    }

    addCircle() {
        this.circleCounter++;
        const circle = {
            id: this.circleCounter,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 0,
            color: '#ff0000',
            lineType: 'solid',
            fillColor: '#ff0000',
            fillOpacity: 0,
            lineWidth: 2,
            showCenter: false,
            draggable: true
        };

        this.circles.push(circle);
        this.addCircleToTable(circle);
        this.redrawCanvas();
    }

    addCircleToTable(circle) {
        const tbody = document.getElementById('circlesTableBody');
        const row = document.createElement('tr');
        row.id = `circle-row-${circle.id}`;

        row.innerHTML = `
            <td>${circle.id}</td>
            <td>
                <input type="number" value="${circle.radius}" min="1" 
                       onchange="app.updateCircleRadius(${circle.id}, this.value)">
            </td>
            <td>
                <input type="color" value="${circle.color}" 
                       onchange="app.updateCircleColor(${circle.id}, this.value)">
            </td>
            <td>
                <select onchange="app.updateCircleLineType(${circle.id}, this.value)">
                    <option value="solid">Суцільна</option>
                    <option value="dashed">Пунктир</option>
                    <option value="dotted">Точкова</option>
                </select>
            </td>
            <td>
                <input type="color" value="${circle.fillColor}" 
                       onchange="app.updateCircleFillColor(${circle.id}, this.value)">
            </td>
            <td>
                <input type="range" min="0" max="1" step="0.1" value="${circle.fillOpacity}"
                       onchange="app.updateCircleFillOpacity(${circle.id}, this.value)">
                <span>${Math.round(circle.fillOpacity * 100)}%</span>
            </td>
            <td>
                <input type="checkbox" ${circle.showCenter ? 'checked' : ''} 
                       onchange="app.updateCircleShowCenter(${circle.id}, this.checked)">
            </td>
            <td>
                <input type="checkbox" ${circle.draggable ? 'checked' : ''} 
                       onchange="app.updateCircleDraggable(${circle.id}, this.checked)">
            </td>
            <td>
                <button class="delete-circle" onclick="app.deleteCircle(${circle.id})">Видалити</button>
            </td>
        `;

        tbody.appendChild(row);
    }

    updateCircleRadius(id, radius) {
        const circle = this.circles.find(c => c.id === id);
        if (circle) {
            circle.radius = parseFloat(radius);
            this.redrawCanvas();
        }
    }

    updateCircleColor(id, color) {
        const circle = this.circles.find(c => c.id === id);
        if (circle) {
            circle.color = color;
            this.redrawCanvas();
        }
    }

    updateCircleLineType(id, lineType) {
        const circle = this.circles.find(c => c.id === id);
        if (circle) {
            circle.lineType = lineType;
            this.redrawCanvas();
        }
    }

    updateCircleFillColor(id, fillColor) {
        const circle = this.circles.find(c => c.id === id);
        if (circle) {
            circle.fillColor = fillColor;
            this.redrawCanvas();
        }
    }

    updateCircleFillOpacity(id, opacity) {
        const circle = this.circles.find(c => c.id === id);
        if (circle) {
            circle.fillOpacity = parseFloat(opacity);
            // Update displayed percentage
            const span = document.querySelector(`#circle-row-${id} input[type="range"] + span`);
            if (span) {
                span.textContent = `${Math.round(opacity * 100)}%`;
            }
            this.redrawCanvas();
        }
    }

    updateCircleShowCenter(id, showCenter) {
        const circle = this.circles.find(c => c.id === id);
        if (circle) {
            circle.showCenter = showCenter;
            this.redrawCanvas();
        }
    }

    updateCircleDraggable(id, draggable) {
        const circle = this.circles.find(c => c.id === id);
        if (circle) {
            circle.draggable = draggable;
            this.redrawCanvas();
        }
    }

    deleteCircle(id) {
        this.circles = this.circles.filter(c => c.id !== id);
        document.getElementById(`circle-row-${id}`).remove();
        this.redrawCanvas();
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        // Check if clicking on any draggable circle
        let clickedOnDraggable = false;
        for (let i = this.circles.length - 1; i >= 0; i--) {
            const circle = this.circles[i];
            if (!circle.draggable) continue;

            const pixelRadius = circle.radius * this.scale;
            const distance = Math.sqrt(Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2));

            if (distance <= pixelRadius) {
                clickedOnDraggable = true;
                break;
            }
        }

        if (clickedOnDraggable) {
            this.isDragging = true;
            this.dragStartPoint = { x, y };
            this.dragOffsets = [];

            // Calculate offsets for all draggable circles
            for (let circle of this.circles) {
                if (circle.draggable) {
                    this.dragOffsets.push({
                        id: circle.id,
                        offsetX: x - circle.x,
                        offsetY: y - circle.y
                    });
                }
            }

            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        if (this.isDragging) {
            // Move all draggable circles together
            for (let offset of this.dragOffsets) {
                const circle = this.circles.find(c => c.id === offset.id);
                if (circle) {
                    circle.x = x - offset.offsetX;
                    circle.y = y - offset.offsetY;
                }
            }
            this.redrawCanvas();
        } else {
            // Check if the cursor is over any draggable circle
            let overDraggableCircle = false;
            for (let circle of this.circles) {
                if (!circle.draggable) continue;

                const pixelRadius = circle.radius * this.scale;
                const distance = Math.sqrt(Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2));
                if (distance <= pixelRadius) {
                    overDraggableCircle = true;
                    break;
                }
            }
            this.canvas.style.cursor = overDraggableCircle ? 'grab' : 'crosshair';
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.dragOffsets = [];
        this.canvas.style.cursor = 'crosshair';
    }

    redrawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw image
        if (this.image) {
            this.ctx.drawImage(this.image, 0, 0);
        }

        // Draw scale points
        if (this.scalePoints.length > 0) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;

            for (let point of this.scalePoints) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                this.ctx.fill();
            }

            if (this.scalePoints.length === 2) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.scalePoints[0].x, this.scalePoints[0].y);
                this.ctx.lineTo(this.scalePoints[1].x, this.scalePoints[1].y);
                this.ctx.stroke();
            }
        }

        // Draw circles
        for (let circle of this.circles) {
            this.drawCircle(circle);
        }
    }

    drawCircle(circle) {
        const pixelRadius = circle.radius * this.scale;

        // Fill
        if (circle.fillOpacity > 0) {
            this.ctx.globalAlpha = circle.fillOpacity;
            this.ctx.fillStyle = circle.fillColor;
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, pixelRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        // Stroke
        this.ctx.strokeStyle = circle.color;
        this.ctx.lineWidth = circle.lineWidth;

        // Set line type
        switch (circle.lineType) {
            case 'dashed':
                this.ctx.setLineDash([10, 10]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 8]);
                break;
            default:
                this.ctx.setLineDash([]);
        }

        this.ctx.beginPath();
        this.ctx.arc(circle.x, circle.y, pixelRadius, 0, 2 * Math.PI);
        this.ctx.stroke();

        // Reset line dash
        this.ctx.setLineDash([]);

        // Center point (only if showCenter is true)
        if (circle.showCenter) {
            this.ctx.fillStyle = circle.color;
            this.ctx.beginPath();
            this.ctx.arc(circle.x, circle.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    exportImage() {
        const link = document.createElement('a');
        const now = new Date();
        const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_` +
            `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

        link.download = `disaster-circles-${formatted}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Create app instance
const app = new DisasterCirclesApp();