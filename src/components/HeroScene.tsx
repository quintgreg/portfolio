import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import fragmentShader from '../../references/hero.frag?raw';

const vertexShader = `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function cssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const hex = value.replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

type Pointer = { x: number; y: number; inside: boolean };

function ShaderPlane() {
  const gl = useThree((state) => state.gl);
  const pointer = useRef<Pointer>({ x: 0.5, y: 0.5, inside: false });
  const smooth = useRef({ x: 0.6, y: 0.42 });
  const size = useMemo(() => new THREE.Vector2(), []);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uHover: { value: 0.35 },
      uAccent: { value: cssColor('--accent', '#c6f432') },
      uGlow: { value: cssColor('--glow', '#5b3df5') },
      uIntensity: { value: 1 },
    }),
    [],
  );

  useEffect(() => {
    // Слушаем window, а не .hero: поверх hero лежит блок работ и перехватывает события
    const onMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (rect.bottom - event.clientY) / rect.height;
      pointer.current.x = x;
      pointer.current.y = y;
      pointer.current.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    };
    const onLeave = () => {
      pointer.current.inside = false;
    };

    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [gl]);

  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime;
    const { inside } = pointer.current;
    const targetX = inside ? pointer.current.x : 0.6 + 0.18 * Math.sin(t * 0.31);
    const targetY = inside ? pointer.current.y : 0.42 + 0.16 * Math.sin(t * 0.23 + 1.3);

    smooth.current.x += (targetX - smooth.current.x) * 0.07;
    smooth.current.y += (targetY - smooth.current.y) * 0.07;

    state.gl.getDrawingBufferSize(size);
    uniforms.uRes.value.copy(size);
    uniforms.uMouse.value.set(smooth.current.x * size.x, smooth.current.y * size.y);
    uniforms.uHover.value += ((inside ? 1 : 0.35) - uniforms.uHover.value) * 0.05;
    uniforms.uTime.value = t;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!wrap.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(wrap.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrap} className={`hero-scene${ready ? ' is-ready' : ''}`}>
      <Canvas
        flat
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={() => requestAnimationFrame(() => setReady(true))}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
