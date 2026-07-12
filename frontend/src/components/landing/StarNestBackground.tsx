import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos,0,1); }
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

#define iterations 16
#define formuparam 0.53
#define volsteps 16
#define stepsize 0.1
#define zoom 0.800
#define tile 0.850
#define speed 0.008
#define brightness 0.0015
#define darkmatter 0.300
#define distfading 0.730
#define saturation 0.850

uniform vec2 iClick;
uniform float iClickTime;

void main(void){
  vec2 uv = gl_FragCoord.xy / iResolution.xy - 0.5;
  uv.y *= iResolution.y / iResolution.x;
  vec3 dir = vec3(uv * zoom, 1.0);
  float time = iTime * speed + 0.25;

  float a1 = 0.5 + iMouse.x / iResolution.x * 2.0;
  float a2 = 0.8 + iMouse.y / iResolution.y * 2.0;
  mat2 rot1 = mat2(cos(a1), sin(a1), -sin(a1), cos(a1));
  mat2 rot2 = mat2(cos(a2), sin(a2), -sin(a2), cos(a2));
  dir.xz *= rot1;
  dir.xy *= rot2;

  vec3 from = vec3(1.0, 0.5, 0.5);
  from += vec3(time * 2.0, time, -2.0);
  from.xz *= rot1;
  from.xy *= rot2;

  float s = 0.1, fade = 1.0;
  vec3 v = vec3(0.0);

  for(int r = 0; r < volsteps; r++){
    vec3 p = from + s * dir * 0.5;
    p = abs(vec3(tile) - mod(p, vec3(tile * 2.0)));
    float pa, a = pa = 0.0;
    for(int i = 0; i < iterations; i++){
      p = abs(p) / dot(p,p) - formuparam;
      a += abs(length(p) - pa);
      pa = length(p);
    }
    float dm = max(0.0, darkmatter - a * a * 0.001);
    a *= a * a;
    if(r > 5) fade *= 1.0 - dm;
    v += fade;
    v += vec3(s, s*s, s*s*s*s) * a * brightness * fade;
    fade *= distfading;
    s += stepsize;
  }

  v = mix(vec3(length(v)), v, saturation);
  gl_FragColor = vec4(v * 0.01, 1.0);

  // Gravitational Wave Ripple
  float timeSinceClick = iTime - iClickTime;
  if(timeSinceClick < 1.5) {
    vec2 clickUV = iClick / iResolution.xy;
    vec2 pixelUV = gl_FragCoord.xy / iResolution.xy;
    float dist = length(pixelUV - clickUV);
    float waveRadius = timeSinceClick * 0.6;
    float waveFront = 0.02;
    float wave = smoothstep(waveFront, 0.0, abs(dist - waveRadius));
    float fadeRipple = 1.0 - (timeSinceClick / 1.5);
    gl_FragColor.rgb += wave * fadeRipple * 0.35 * vec3(1.0, 0.55, 0.2);
  }
}
`;

interface StarNestProps {
  initialWarpFactor?: number;
}

const StarNestBackground: React.FC<StarNestProps> = ({ initialWarpFactor = 1.0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>(performance.now());
  const warpMultiplierRef = useRef<number>(initialWarpFactor);
  const clickPosRef = useRef<{ x: number, y: number }>({ x: -9999, y: -9999 });
  const clickTimeRef = useRef<number>(-99.0);

  useEffect(() => {
    const wrap = containerRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // ... (shader setup code omitted for brevity but preserved)
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const iTimeLoc = gl.getUniformLocation(program, 'iTime');
    const iResolutionLoc = gl.getUniformLocation(program, 'iResolution');
    const iMouseLoc = gl.getUniformLocation(program, 'iMouse');
    const iClickLoc = gl.getUniformLocation(program, 'iClick');
    const iClickTimeLoc = gl.getUniformLocation(program, 'iClickTime');

    // Deceleration Lerp
    if (initialWarpFactor > 1.0) {
      const start = performance.now();
      const animateDecel = () => {
        const elapsed = performance.now() - start;
        const p = Math.min(1, elapsed / 800);
        // easeOutCubic
        const ease = 1 - Math.pow(1 - p, 3);
        warpMultiplierRef.current = initialWarpFactor + (1.0 - initialWarpFactor) * ease;
        if (p < 1) requestAnimationFrame(animateDecel);
      };
      animateDecel();
    }

    const handleResize = () => {
      canvas.width = Math.floor(wrap.offsetWidth * 0.8);
      canvas.height = Math.floor(wrap.offsetHeight * 0.8);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const x = (e.clientX - rect.left) * pixelRatio;
      const y = (rect.height - (e.clientY - rect.top)) * pixelRatio;
      clickPosRef.current = { x, y };
      clickTimeRef.current = (performance.now() - startTimeRef.current) / 1000;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('click', handleClick);
    handleResize();

    const render = () => {
      const globalWarp = (window as any).starNestWarpFactor || 1.0;
      const currentWarp = warpMultiplierRef.current * globalWarp;
      
      const time = (performance.now() - startTimeRef.current) / 1000 * currentWarp;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(iTimeLoc, time);
      gl.uniform2f(iResolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(iMouseLoc, canvas.width * 0.5, canvas.height * 0.5);
      gl.uniform2f(iClickLoc, clickPosRef.current.x, clickPosRef.current.y);
      gl.uniform1f(iClickTimeLoc, clickTimeRef.current);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleClick);
    };
  }, [initialWarpFactor]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
};

export default StarNestBackground;
