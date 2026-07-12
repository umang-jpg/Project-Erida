import * as THREE from 'three';
import { gsap } from 'gsap';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uProgress;
  uniform float uTime;
  uniform vec2 uResolution;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.1;
    }
    return value;
  }

  void main() {
    vec4 pageColor = texture2D(uTexture, vUv);
    
    // Bias the noise so dissolve tends to start at the bottom and move upward
    vec3 noiseCoord = vec3(
      vUv.x * 2.8 + sin(uTime * 0.12) * 0.1,
      vUv.y * 2.8 - uProgress * 1.4,
      uTime * 0.18
    );
    
    float noise = fbm(noiseCoord);
    noise = noise * 0.5 + 0.5;

    float easedProgress = uProgress * uProgress * (3.0 - 2.0 * uProgress);
    float threshold = easedProgress * 1.35 - 0.18;
    float edge = noise - threshold;

    float burnWidth = 0.055;
    float burnInner = 0.012;

    float dissolved = step(edge, 0.0);
    
    // High-contrast burn shades
    vec3 burnColorOuterVal = vec3(0.04, 0.18, 1.0);
    vec3 burnColorMidVal   = vec3(0.12, 0.55, 1.0);
    vec3 burnColorCoreVal  = vec3(0.85, 0.95, 1.0);
    vec3 haloColorVal      = vec3(0.04, 0.08, 0.7);

    float inBurn = smoothstep(0.0, burnWidth, edge) * (1.0 - smoothstep(burnWidth, burnWidth + 0.02, edge));
    float inCore = smoothstep(0.0, burnInner, edge) * (1.0 - smoothstep(burnInner, burnInner + 0.015, edge));

    vec3 burnColor = mix(burnColorOuterVal, burnColorMidVal, inBurn);
    burnColor = mix(burnColor, burnColorCoreVal, inCore * 2.0);

    float haloWidth = burnWidth + 0.09;
    float halo = smoothstep(burnWidth, haloWidth, edge) * (1.0 - smoothstep(haloWidth, haloWidth + 0.04, edge)) * 0.45;

    vec3 finalColor = mix(pageColor.rgb, haloColorVal, halo * (1.0 - dissolved));
    finalColor = mix(finalColor, burnColor, (inBurn + inCore) * (1.0 - dissolved));

    float finalAlpha = pageColor.a * (1.0 - dissolved);
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export class BurnTransition {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.clock = new THREE.Clock();

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.mesh);

    this.animate = this.animate.bind(this);
  }

  private animate() {
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    this.renderer.render(this.scene, this.camera);
    if (this.material.uniforms.uProgress.value < 1.0 || this.container.style.opacity !== '0') {
      requestAnimationFrame(this.animate);
    }
  }

  public async start(sourceCanvas: HTMLCanvasElement, onComplete: () => void) {
    // Capture texture
    const texture = new THREE.CanvasTexture(sourceCanvas);
    this.material.uniforms.uTexture.value = texture;
    this.material.uniforms.uProgress.value = 0;
    
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'all';
    
    requestAnimationFrame(this.animate);

    gsap.to(this.material.uniforms.uProgress, {
      value: 1.0,
      duration: 1.9,
      ease: 'power1.inOut',
      onUpdate: () => {
        this.emitSparks(this.material.uniforms.uProgress.value);
      },
      onComplete: () => {
        gsap.to(this.container, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            this.container.style.pointerEvents = 'none';
            onComplete();
          }
        });
      }
    });
  }

  private emitSparks(progress: number) {
    if (Math.random() > 0.4) return;
    const spark = document.createElement('div');
    spark.style.position = 'fixed';
    spark.style.width = '3px';
    spark.style.height = '3px';
    spark.style.borderRadius = '50%';
    spark.style.background = '#ffffff';
    spark.style.boxShadow = '0 0 6px 2px rgba(255, 255, 255, 0.8)';
    spark.style.pointerEvents = 'none';
    spark.style.zIndex = '9999';
    spark.style.left = Math.random() * 100 + 'vw';
    spark.style.top = (1 - progress) * 100 + 'vh';
    
    document.body.appendChild(spark);
    
    gsap.to(spark, {
      y: -(30 + Math.random() * 100),
      x: (Math.random() - 0.5) * 60,
      opacity: 0,
      duration: 0.6 + Math.random() * 0.6,
      ease: 'power2.out',
      onComplete: () => spark.remove(),
    });
  }

  public resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }
}
