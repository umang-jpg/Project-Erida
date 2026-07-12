class DissolveTransition {
    constructor() {
        this.canvas = document.getElementById('dissolve-overlay');
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        
        this.progress = 0;
        this.isAnimating = false;
        this.duration = 1400; // ms
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth * this.dpr;
        this.canvas.height = window.innerHeight * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
    }

    start() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.startTime = Date.now();
        
        // Hide hero content
        const hero = document.getElementById('hero');
        hero.classList.add('fade-out');

        this.animate();

        // Midpoint trigger
        setTimeout(() => {
            document.getElementById('home-section').classList.add('visible');
        }, this.duration / 2);

        // Completion
        setTimeout(() => {
            this.isAnimating = false;
            this.canvas.style.display = 'none';
        }, this.duration + 500);
    }

    // Simple procedural noise for dissolve
    noise(x, y) {
        return (Math.sin(x * 0.01) * Math.cos(y * 0.01) + 1) / 2;
    }

    animate() {
        const elapsed = Date.now() - this.startTime;
        this.progress = Math.min(elapsed / this.duration, 1);

        const w = window.innerWidth;
        const h = window.innerHeight;
        const centerX = w / 2;
        const centerY = h / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

        this.ctx.clearRect(0, 0, w, h);

        // Fill with deep blue/void color
        this.ctx.fillStyle = '#02010a';
        this.ctx.fillRect(0, 0, w, h);

        // "Drain" effect from center outward
        this.ctx.globalCompositeOperation = 'destination-out';
        
        // Draw dissolve pattern
        // We use circles of varying sizes and noise to create the fluid dissolve
        const particleCount = 200;
        const sweepRadius = this.progress * maxDist * 1.5;

        this.ctx.beginPath();
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const dist = sweepRadius * (0.8 + Math.random() * 0.4);
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            
            const r = 50 + (1 - this.progress) * 100;
            this.ctx.moveTo(x, y);
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        
        // Blur effect for fluid feel
        const blurAmount = Math.max(0, (1 - this.progress) * 40);
        this.ctx.filter = `blur(${blurAmount}px)`;
        this.ctx.fill();
        this.ctx.filter = 'none';

        this.ctx.globalCompositeOperation = 'source-over';

        if (this.progress < 1) {
            requestAnimationFrame(() => this.animate());
        }
    }
}

window.addEventListener('load', () => {
    const transition = new DissolveTransition();
    window.startDissolveTransition = () => transition.start();
});
