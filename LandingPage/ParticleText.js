class ParticleText {
    constructor() {
        this.container = document.getElementById('particle-canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        this.particles = null;
        this.particleCount = window.innerWidth < 768 ? 5000 : 12000;
        this.mouse = new THREE.Vector2(-9999, -9999);
        this.raycaster = new THREE.Raycaster();
        
        this.init();
        this.createParticles();
        this.animate();
        this.bindEvents();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 250;

        // Orbit Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 1.5;
        
        this.lastInteractionTime = Date.now();
    }

    createParticles() {
        const text = "ERIDA";
        const fontSize = 150;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1000;
        canvas.height = 400;

        ctx.fillStyle = 'white';
        ctx.font = `700 ${fontSize}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = "0.2em";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const points = [];

        for (let y = 0; y < canvas.height; y += 2) {
            for (let x = 0; x < canvas.width; x += 2) {
                const index = (y * canvas.width + x) * 4;
                if (imageData.data[index] > 128) {
                    points.push({
                        x: (x - canvas.width / 2) * 0.8,
                        y: (canvas.height / 2 - y) * 0.8,
                        z: 0
                    });
                }
            }
        }

        // Geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const initialPositions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        const phases = new Float32Array(this.particleCount);

        const colorCore = new THREE.Color('#3d6fff');
        const colorScatter = new THREE.Color('#7a9fff');

        for (let i = 0; i < this.particleCount; i++) {
            const point = points[i % points.length];
            
            // Initial positions (home)
            initialPositions[i * 3] = point.x;
            initialPositions[i * 3 + 1] = point.y;
            initialPositions[i * 3 + 2] = point.z;

            // Current positions (start at home)
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;

            // Colors
            const color = Math.random() > 0.9 ? colorScatter : colorCore;
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 2 + 1;
            phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.initialPositions = initialPositions;
        this.phases = phases;
        this.velocities = new Float32Array(this.particleCount * 3);

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.lastInteractionTime = Date.now();
            this.controls.autoRotate = false;
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.container.addEventListener('mousedown', () => {
            this.lastInteractionTime = Date.now();
            this.controls.autoRotate = false;
        });
    }

    animate() {
        const time = Date.now() * 0.001;
        const positions = this.particles.geometry.attributes.position.array;
        
        // Auto-rotate logic
        if (Date.now() - this.lastInteractionTime > 4000) {
            this.controls.autoRotate = true;
        }

        this.controls.update();

        // Mouse in 3D space
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const mouseWorld = new THREE.Vector3();
        this.raycaster.ray.at(this.camera.position.z, mouseWorld);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Home position
            const hX = this.initialPositions[i3];
            const hY = this.initialPositions[i3 + 1];
            const hZ = this.initialPositions[i3 + 2];

            // Current position
            let pX = positions[i3];
            let pY = positions[i3 + 1];
            let pZ = positions[i3 + 2];

            // 1. Breathing animation
            const breath = Math.sin(time + this.phases[i]) * 2;
            const targetX = hX + breath;
            const targetY = hY + breath;

            // 2. Interaction physics
            const dx = pX - mouseWorld.x;
            const dy = pY - mouseWorld.y;
            const dz = pZ - mouseWorld.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(distSq);

            if (dist < 120) {
                const force = (120 - dist) / 120;
                this.velocities[i3] += (dx / dist) * force * 5;
                this.velocities[i3 + 1] += (dy / dist) * force * 5;
                this.velocities[i3 + 2] += (Math.random() - 0.5) * force * 10;
            }

            // Spring physics to return home
            this.velocities[i3] += (targetX - pX) * 0.04;
            this.velocities[i3 + 1] += (targetY - pY) * 0.04;
            this.velocities[i3 + 2] += (hZ - pZ) * 0.04;

            // Damping
            this.velocities[i3] *= 0.88;
            this.velocities[i3 + 1] *= 0.88;
            this.velocities[i3 + 2] *= 0.88;

            // Update positions
            positions[i3] += this.velocities[i3];
            positions[i3 + 1] += this.velocities[i3 + 1];
            positions[i3 + 2] += this.velocities[i3 + 2];
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

window.addEventListener('load', () => {
    new ParticleText();
});
