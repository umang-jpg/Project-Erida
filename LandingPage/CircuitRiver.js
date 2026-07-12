class CircuitRiver {
    constructor() {
        this.canvas = document.getElementById('circuit-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        
        this.paths = [];
        this.progress = 0;
        this.isAnimating = true;
        this.neonColor = '#3d6fff';
        
        this.resize();
        this.initPaths();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth * this.dpr;
        this.canvas.height = window.innerHeight * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
    }

    initPaths() {
        // Define the main river path (approximated from the image)
        // From bottom center to upper center with curves
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.paths = [
            // Main River Trace
            {
                points: [
                    {x: w * 0.5, y: h},
                    {x: w * 0.45, y: h * 0.85},
                    {x: w * 0.55, y: h * 0.75},
                    {x: w * 0.48, y: h * 0.65},
                    {x: w * 0.52, y: h * 0.55},
                    {x: w * 0.5, y: h * 0.45},
                ],
                nodes: [1, 3, 5] // Indices where pulse nodes appear
            },
            // Left Tributary
            {
                points: [
                    {x: w * 0.48, y: h * 0.65},
                    {x: w * 0.4, y: h * 0.58},
                    {x: w * 0.35, y: h * 0.5},
                ],
                nodes: [1]
            },
            // Right Tributary
            {
                points: [
                    {x: w * 0.52, y: h * 0.55},
                    {x: w * 0.6, y: h * 0.5},
                    {x: w * 0.65, y: h * 0.42},
                ],
                nodes: [1]
            }
        ];
    }

    drawPulseNode(x, y, time) {
        const pulse = Math.sin(time * 0.005) * 0.2 + 1.2; // scale 1 to 1.4
        const opacity = Math.sin(time * 0.005) * 0.2 + 0.8; // opacity 0.6 to 1

        this.ctx.beginPath();
        this.ctx.arc(x, y, 3 * pulse, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(61, 111, 255, ${opacity})`;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.neonColor;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawLine(points, progress) {
        if (points.length < 2) return;

        // Multi-layered stroke for glow effect
        const drawLayer = (width, opacity, blur) => {
            this.ctx.beginPath();
            this.ctx.lineWidth = width;
            this.ctx.strokeStyle = `rgba(61, 111, 255, ${opacity})`;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            if (blur) {
                this.ctx.shadowBlur = blur;
                this.ctx.shadowColor = this.neonColor;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.moveTo(points[0].x, points[0].y);
            
            // Draw segments based on progress
            const totalSegments = points.length - 1;
            const currentSegment = Math.floor(progress * totalSegments);
            const segmentProgress = (progress * totalSegments) % 1;

            for (let i = 1; i <= currentSegment; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }

            if (currentSegment < totalSegments) {
                const start = points[currentSegment];
                const end = points[currentSegment + 1];
                const nextX = start.x + (end.x - start.x) * segmentProgress;
                const nextY = start.y + (end.y - start.y) * segmentProgress;
                this.ctx.lineTo(nextX, nextY);
            }
            this.ctx.stroke();
        };

        // 1. Outer Halo
        drawLayer(6, 0.15, 15);
        // 2. Mid Glow
        drawLayer(3, 0.4, 5);
        // 3. Core Trace
        drawLayer(1.5, 1, 0);
    }

    animate() {
        const time = Date.now();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update progress (4s cycle + 2s pause)
        const cycleTime = 6000;
        const activeTime = 4000;
        const elapsed = time % cycleTime;

        if (elapsed < activeTime) {
            this.progress = elapsed / activeTime;
        } else {
            this.progress = 1; // Hold full at the end
            // Optional: fade out during pause
            if (elapsed > activeTime + 1800) {
                this.ctx.globalAlpha = 1 - (elapsed - (activeTime + 1800)) / 200;
            }
        }

        this.paths.forEach(path => {
            this.drawLine(path.points, this.progress);
            
            // Draw nodes
            path.nodes.forEach(idx => {
                const p = path.points[idx];
                // Only draw node if progress has reached it
                const nodeThreshold = idx / (path.points.length - 1);
                if (this.progress >= nodeThreshold) {
                    this.drawPulseNode(p.x, p.y, time);
                }
            });
        });

        this.ctx.globalAlpha = 1;
        requestAnimationFrame(() => this.animate());
    }
}

window.addEventListener('load', () => {
    new CircuitRiver();
});
