class ParallaxBg {
    constructor() {
        this.wrapper = document.getElementById('parallax-bg');
        this.midLayer = document.getElementById('mid-parallax');
        this.starsContainer = document.getElementById('stars-container');
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lerpFactor = 0.06;
        
        this.initStars();
        this.initShootingStars();
        this.bindEvents();
        this.animate();
    }

    initStars() {
        const starCount = 80;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const x = Math.random() * 100;
            const y = Math.random() * 60; // Upper 60%
            const size = Math.random() * 2 + 1;
            const opacity = Math.random() * 0.4 + 0.2;
            
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.opacity = opacity;
            
            this.starsContainer.appendChild(star);
        }
    }

    initShootingStars() {
        // Spawn a shooting star every 2-6 seconds
        const spawn = () => {
            this.createShootingStar();
            const nextSpawn = 2000 + Math.random() * 4000;
            setTimeout(spawn, nextSpawn);
        };
        spawn();
    }

    createShootingStar() {
        const star = document.createElement('div');
        star.className = 'shooting-star';

        // Random starting position
        const startX = Math.random() * 80 + 10; // 10% to 90%
        const startY = Math.random() * 40; // Upper 40%

        // Angle between 20 and 70 degrees (down and right)
        const angle = 25 + Math.random() * 30;
        const rad = angle * (Math.PI / 180);
        
        // Travel distance
        const distance = 400 + Math.random() * 300;
        const travelX = Math.cos(rad) * distance;
        const travelY = Math.sin(rad) * distance;

        star.style.left = `${startX}%`;
        star.style.top = `${startY}%`;
        star.style.setProperty('--angle', `${angle}deg`);
        star.style.setProperty('--travel-x', `${travelX}px`);
        star.style.setProperty('--travel-y', `${travelY}px`);
        
        // Random duration
        const duration = 0.4 + Math.random() * 0.4;
        star.style.animation = `shoot ${duration}s ease-out forwards`;

        this.starsContainer.appendChild(star);

        // Cleanup after animation
        setTimeout(() => {
            star.remove();
        }, duration * 1000 + 100);
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            // Normalize coordinates to -1 to 1
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        });
    }

    animate() {
        // Smooth lerping
        this.targetX += (this.mouseX - this.targetX) * this.lerpFactor;
        this.targetY += (this.mouseY - this.targetY) * this.lerpFactor;

        // Shift background in opposite direction (max ±20px)
        const moveX = -this.targetX * 20;
        const moveY = -this.targetY * 20;
        
        this.wrapper.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Mid layer moves at half speed
        this.midLayer.style.transform = `translate(${moveX * 0.5}px, ${moveY * 0.5}px)`;
        
        // Stars drift slightly
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.style.transform = `translate(${moveX * 0.2}px, ${moveY * 0.2}px)`;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new ParallaxBg();
});
