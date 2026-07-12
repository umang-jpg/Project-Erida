import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { BurnTransition } from '../utils/BurnTransition';
import StarNestBackground from '../components/landing/StarNestBackground';


const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const isReverseWarp = query.get('warp') === 'reverse';

  const containerRef = useRef<HTMLDivElement>(null);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animateUI, setAnimateUI] = useState(false);
  
  const mainRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const burnTransitionRef = useRef<BurnTransition | null>(null);

  useEffect(() => {
    if (!containerRef.current || !transitionOverlayRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true // Required for snapshot
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    mainRendererRef.current = renderer;

    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2(-9999, -9999);

    // Background particles removed as requested

    // --- Particle System ---
    const TEXT_COUNT = 12000;
    const TOTAL_COUNT = TEXT_COUNT;

    function makeParticleTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0,   'rgba(255, 245, 220, 1.0)');
      gradient.addColorStop(0.2, 'rgba(232, 168, 48, 0.9)');
      gradient.addColorStop(0.5, 'rgba(138, 90, 16, 0.4)');
      gradient.addColorStop(1.0, 'rgba(68, 44, 10, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    }

    function sampleTextPositions(count: number) {
      const offscreen = document.createElement('canvas');
      offscreen.width = 1200;
      offscreen.height = 300;
      const ctx = offscreen.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 220px Helvetica, Arial Black, sans-serif';
      ctx.letterSpacing = '18px';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText('ERIDA', 600, 150);
      const data = ctx.getImageData(0, 0, 1200, 300).data;
      const positions: {x: number, y: number, z: number}[] = [];
      for (let y = 0; y < 300; y++) {
        for (let x = 0; x < 1200; x++) {
          const alpha = data[(y * 1200 + x) * 4 + 3];
          if (alpha > 128) positions.push({ x: (x - 600) * 0.42, y: -(y - 150) * 0.42, z: 0 });
        }
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      return positions.slice(0, count);
    }

    const textTargets = sampleTextPositions(TEXT_COUNT);
    while(textTargets.length < TEXT_COUNT) textTargets.push({x: (Math.random()-0.5)*500, y: (Math.random()-0.5)*200, z: 0});

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(TOTAL_COUNT * 3);
    const scatterPos = new Float32Array(TOTAL_COUNT * 3);
    const targetPos = new Float32Array(TOTAL_COUNT * 3);
    const colors = new Float32Array(TOTAL_COUNT * 3);
    const sizes = new Float32Array(TOTAL_COUNT);
    const phases = new Float32Array(TOTAL_COUNT);
    const speeds = new Float32Array(TOTAL_COUNT);
    const radii = new Float32Array(TOTAL_COUNT);
    const staggerOffsets = new Float32Array(TOTAL_COUNT);
    const repelOffsets = new Float32Array(TOTAL_COUNT * 3);

    for (let i = 0; i < TOTAL_COUNT; i++) {
      const isNearCenter = Math.random() < 0.4;
      scatterPos[i * 3] = isNearCenter ? (Math.random()-0.5)*200 : (Math.random()-0.5)*1400;
      scatterPos[i * 3 + 1] = isNearCenter ? (Math.random()-0.5)*100 : (Math.random()-0.5)*600;
      scatterPos[i * 3 + 2] = (Math.random()-0.5)*400;

      // If reverse warp, start at scattered positions
      positions[i * 3] = scatterPos[i * 3];
      positions[i * 3 + 1] = scatterPos[i * 3 + 1];
      positions[i * 3 + 2] = scatterPos[i * 3 + 2];

      targetPos[i * 3] = textTargets[i].x;
      targetPos[i * 3 + 1] = textTargets[i].y;
      targetPos[i * 3 + 2] = textTargets[i].z;

      const color = new THREE.Color();
      color.setHex(0xFF6B2B); // Base Solar Orange
      
      const hsv: any = {};
      color.getHSL(hsv);
      color.setHSL(hsv.h + (Math.random()-0.5)*0.08, hsv.s, hsv.l);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = Math.random() * 0.6 + 0.3;
      radii[i] = Math.random() * 3.5 + 1.5;
      staggerOffsets[i] = Math.random() * 0.25;
      sizes[i] = Math.random() * 2.2 + 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.5,
      map: makeParticleTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    const bloomMaterial = new THREE.PointsMaterial({
      size: 9.0,
      map: material.map,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      opacity: 0.1,
    });
    const bloomSystem = new THREE.Points(geometry, bloomMaterial);
    scene.add(bloomSystem);

    let formationProgress = 0;
    
    if (isReverseWarp) {
      // STEP 5: Reverse Assembly (200ms to 800ms)
      gsap.to({ p: 0 }, {
        p: 1,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.2,
        onUpdate: function() {
          formationProgress = this.targets()[0].p;
          material.opacity = 0.4 + formationProgress * 0.6;
          bloomMaterial.opacity = (0.4 + formationProgress * 0.6) * 0.15;
        }
      });
      // STEP 3: Flash Outward (200ms)
      const overlay = transitionOverlayRef.current;
      if (overlay) {
        overlay.style.background = 'white';
        overlay.style.opacity = '1';
        gsap.to(overlay, { opacity: 0, duration: 0.15, delay: 0.2 });
      }
      // STEP 6: UI Fade In
      gsap.fromTo('.landing-ui', { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.9, onComplete: () => setAnimateUI(true) });
    } else {
      // Normal Load
      gsap.to({ p: 0 }, {
        p: 1,
        duration: 3.8,
        ease: 'power3.inOut',
        delay: 0.6,
        onUpdate: function() {
          formationProgress = this.targets()[0].p;
          material.opacity = 0.4 + formationProgress * 0.6;
          bloomMaterial.opacity = (0.4 + formationProgress * 0.6) * 0.15;
          material.size = 6 - formationProgress * 2.5;
          bloomMaterial.size = (6 - formationProgress * 2.5) * 2.5;
        }
      });
      gsap.fromTo('.landing-ui', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 4.4, onComplete: () => setAnimateUI(true) });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const dispersalVelocities = new Float32Array(TOTAL_COUNT * 3);
    let isDispersing = false;
    let dispersalStartTime = 0;

    const animate = () => {
      const time = clock.getElapsedTime();
      const posAttr = geometry.attributes.position.array as Float32Array;
      const colorAttr = geometry.attributes.color.array as Float32Array;
      const mouseWorldX = mouse.x * 350;
      const mouseWorldY = mouse.y * 180;

      const currentTime = performance.now();
      const dispersalElapsed = isDispersing ? currentTime - dispersalStartTime : 0;

      for (let i = 0; i < TOTAL_COUNT; i++) {
        const i3 = i * 3;

        const colorAttr = geometry.attributes.color.array as Float32Array;

        if (isDispersing) {
          // STEP 1: Particle Dispersal
          posAttr[i3] += dispersalVelocities[i3];
          posAttr[i3+1] += dispersalVelocities[i3+1];
          posAttr[i3+2] += dispersalVelocities[i3+2];
          
          // Fade opacity (via brightness)
          const fade = Math.max(0, 1 - dispersalElapsed / 600);
          colorAttr[i3] *= 0.92;
          colorAttr[i3+1] *= 0.92;
          colorAttr[i3+2] *= 0.92;
          continue;
        }

        const stagger = staggerOffsets[i];
        const t = Math.min(1, Math.max(0, (formationProgress - (isReverseWarp ? 0 : stagger)) / (1 - (isReverseWarp ? 0 : stagger))));
        const eased = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
        const homeX = scatterPos[i3] + (targetPos[i3] - scatterPos[i3]) * eased;
        const homeY = scatterPos[i3 + 1] + (targetPos[i3 + 1] - scatterPos[i3 + 1]) * eased;
        const homeZ = scatterPos[i3 + 2] + (targetPos[i3 + 2] - scatterPos[i3 + 2]) * eased;
        let finalX = homeX;
        let finalY = homeY;
        let finalZ = homeZ;

        const phase = phases[i];
        const speed = speeds[i];
        const radius = radii[i];
        
        // Subtle breathing + Per-particle drift
        finalX += Math.sin(time * speed + phase) * radius;
        finalY += Math.cos(time * speed * 0.7 + phase * 1.3) * radius * 0.6;
        finalZ += Math.sin(time * speed * 0.5 + phase * 0.8) * radius * 3;

        // Global "Alive" Drift (Very subtle floating)
        finalX += Math.sin(time * 0.4) * 4;
        finalY += Math.cos(time * 0.3) * 3;
        
        // Subtle wave shimmer across the text
        const shimmer = Math.sin(time * 1.2 + homeX * 0.015) * 2;
        finalY += shimmer;

        // --- Bioluminescent Strobe Animation ---
        // Oscillate between Solar Orange (#FF6B2B) and Warm White (#F5F0E8)
        const cycleSpeed = 2.51; // ~2.5s per full cycle
        const strobeOsc = (Math.sin(time * cycleSpeed + phase * 2.5) + 1) / 2;
        
        // Interpolate colors
        const idleR = THREE.MathUtils.lerp(255/255, 245/255, strobeOsc);
        const idleG = THREE.MathUtils.lerp(107/255, 240/255, strobeOsc);
        const idleB = THREE.MathUtils.lerp(43/255, 232/255, strobeOsc);
        
        // Opacity breathing (0.55 to 1.0)
        const opacity = THREE.MathUtils.lerp(0.55, 1.0, strobeOsc);
        const targetR = idleR * opacity;
        const targetG = idleG * opacity;
        const targetB = idleB * opacity;

        const dx = finalX - mouseWorldX;
        const dy = finalY - mouseWorldY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const repelRadius = 75;

        if (dist < repelRadius) {
          const force = (1 - dist / repelRadius) * 22;
          repelOffsets[i3] += (dx / dist) * force;
          repelOffsets[i3 + 1] += (dy / dist) * force;
          repelOffsets[i3 + 2] += (Math.random() - 0.5) * force * 0.4;
          
          // Pure White Repel Flash (#FFFFFF)
          const flash = (1 - dist / repelRadius);
          colorAttr[i3] = THREE.MathUtils.lerp(colorAttr[i3], 1.0, flash * 0.85);
          colorAttr[i3+1] = THREE.MathUtils.lerp(colorAttr[i3+1], 1.0, flash * 0.85);
          colorAttr[i3+2] = THREE.MathUtils.lerp(colorAttr[i3+2], 1.0, flash * 0.85);
        } else {
          // Smoothly transition back to the strobe cycle color
          colorAttr[i3] = THREE.MathUtils.lerp(colorAttr[i3], targetR, 0.08);
          colorAttr[i3+1] = THREE.MathUtils.lerp(colorAttr[i3+1], targetG, 0.08);
          colorAttr[i3+2] = THREE.MathUtils.lerp(colorAttr[i3+2], targetB, 0.08);
        }
        repelOffsets[i3] *= 0.88;
        repelOffsets[i3 + 1] *= 0.88;
        repelOffsets[i3 + 2] *= 0.88;
        finalX += repelOffsets[i3];
        finalY += repelOffsets[i3 + 1];
        finalZ += repelOffsets[i3 + 2];

        posAttr[i3] = finalX;
        posAttr[i3 + 1] = finalY;
        posAttr[i3 + 2] = finalZ;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Init Transition
    burnTransitionRef.current = new BurnTransition(transitionOverlayRef.current);
    gsap.fromTo('.landing-ui', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay: 4.4, onComplete: () => setAnimateUI(true) });

    // Transition Trigger
    const startWarpTransition = () => {
      if (isDispersing) return;
      
      // Trigger dispersal
      dispersalStartTime = performance.now();
      const currentPos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < TOTAL_COUNT; i++) {
        const i3 = i * 3;
        const x = currentPos[i3];
        const y = currentPos[i3+1];
        const z = currentPos[i3+2];
        const dist = Math.sqrt(x*x + y*y + z*z) || 1;
        const speed = 3 + Math.random() * 5;
        dispersalVelocities[i3] = (x / dist) * speed;
        dispersalVelocities[i3+1] = (y / dist) * speed;
        dispersalVelocities[i3+2] = (z / dist) * speed;
      }
      isDispersing = true;

      // STEP 2: Warp Acceleration (0-800ms)
      const warpStart = performance.now();
      const animateWarp = () => {
        const elapsed = performance.now() - warpStart;
        const p = Math.min(1, elapsed / 800);
        (window as any).starNestWarpFactor = 1.0 + p * 11.0;
        if (p < 1) requestAnimationFrame(animateWarp);
      };
      animateWarp();

      // STEP 3: Vignette Crush (500-900ms)
      setTimeout(() => {
        const crushStart = performance.now();
        const overlay = transitionOverlayRef.current;
        if (!overlay) return;
        overlay.style.opacity = '1';
        
        const animateCrush = () => {
          const elapsed = performance.now() - crushStart;
          const p = Math.min(1, elapsed / 400);
          const outer = 100 - p * 60;
          const inner = 60 - p * 60;
          overlay.style.background = `radial-gradient(ellipse at center, rgba(4,3,10,0) ${inner}%, rgba(4,3,10,1) ${outer}%)`;
          if (p < 1) requestAnimationFrame(animateCrush);
        };
        animateCrush();
      }, 500);

      // STEP 4: Flash (900-1000ms)
      setTimeout(() => {
        const overlay = transitionOverlayRef.current;
        if (!overlay) return;
        overlay.style.background = 'white';
        overlay.style.opacity = '0';
        
        const flashStart = performance.now();
        const animateFlash = () => {
          const elapsed = performance.now() - flashStart;
          const p = Math.min(1, elapsed / 100);
          overlay.style.opacity = `${p}`;
          if (p < 1) requestAnimationFrame(animateFlash);
        };
        animateFlash();
      }, 900);

      // STEP 5: Navigate (1000ms)
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    };

    (window as any).triggerWarpTransition = startWarpTransition;

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      burnTransitionRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);


  const handleExplore = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    if ((window as any).triggerWarpTransition) {
      (window as any).triggerWarpTransition();
    }

    // Fade UI out
    gsap.to('.landing-ui', {
      opacity: 0,
      y: -8,
      duration: 0.4,
      ease: 'power2.in',
    });
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white z-50">
      <StarNestBackground initialWarpFactor={isReverseWarp ? 12.0 : 1.0} />
      
      {/* Vignette Overlay (Base) */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1]" 
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(4,3,10,0.5) 70%, rgba(4,3,10,0.85) 100%)'
        }}
      />
      
      <div ref={containerRef} className="absolute inset-0 z-[2] pointer-events-none" />
      
      <div className="relative z-[3] w-full h-full flex flex-col items-center justify-center">
        <div className="landing-ui flex flex-col items-center pointer-events-none" style={{ opacity: isReverseWarp ? 0 : 1 }}>
          {/* Tagline */}
          <p 
            style={{ 
              fontFamily: "'Helvetica', 'Arial Black', sans-serif",
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '0.35em',
              color: '#F5F0E8',
              textShadow: '0 0 15px rgba(245,240,232,0.8), 0 0 30px rgba(245,240,232,0.4)',
              textTransform: 'uppercase',
              margin: '280px 0 40px 0',
              textAlign: 'center'
            }}
          >
            AI-POWERED COMPLIANCE. ZERO GUESSWORK.
          </p>

          <button 
            id="explore-btn" 
            onClick={handleExplore}
            className="hud-targeting-btn"
          >
            <span className="bracket-left">
              <span className="tick top"></span>
              <span className="tick bottom"></span>
            </span>
            <span className="btn-line left"></span>
            <span className="btn-text">EXPLORE</span>
            <span className="btn-line right"></span>
            <span className="bracket-right">
              <span className="tick top"></span>
              <span className="tick bottom"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Transition Overlay (Warp/Flash) */}
      <div ref={transitionOverlayRef} className="fixed inset-0 z-[100] pointer-events-none opacity-0" />
    </div>
  );
};

export default LandingPage;
