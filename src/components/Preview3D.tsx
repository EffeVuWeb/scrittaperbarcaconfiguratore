import React, { Suspense, useState, useEffect, useRef, useLayoutEffect, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import opentype from 'opentype.js';
import { FinishType, MountingMethod } from '../types';
import { Plus, Minus, Info, Sun, Moon } from 'lucide-react';

interface Preview3DProps {
    text: string;
    finishType: FinishType;
    paintColor: string;
    fontFamily?: string;
    thickness: string;
    onAspectRatioChange?: (ratio: number) => void;
    mountingMethod?: MountingMethod;
    lengthCm?: number | string;
    heightCm?: number | string;
}

// --- Utils: Font URL Construction ---
const getFontSourceUrl = (fontFamilyStr: string): string => {
    // Check if it's a local font (family contains url() pointing to /fonts/)
    if (fontFamilyStr.includes('url(')) {
        // Extract the URL from url('...') format
        const match = fontFamilyStr.match(/url\(['"]?([^'")\]]+)['"]?\)/);
        if (match && match[1]) {
            return match[1]; // Return URL like '/fonts/NomeFonte.ttf'
        }
    }
    
    // Otherwise, treat as CDN font name
    const cleanName = fontFamilyStr.split(',')[0].replace(/['"]/g, '').trim();
    if (cleanName.toLowerCase() === 'times new roman') return 'https://cdn.jsdelivr.net/npm/@fontsource/tinos/files/tinos-latin-400-normal.woff';
    if (cleanName.toLowerCase() === 'courier new') return 'https://cdn.jsdelivr.net/npm/@fontsource/cousine/files/cousine-latin-400-normal.woff';
    const id = cleanName.toLowerCase().replace(/\s+/g, '-');
    return `https://cdn.jsdelivr.net/npm/@fontsource/${id}/files/${id}-latin-400-normal.woff`;
};

// --- Utils: Opentype to Three.Shape ---
function getShapesFromFont(font: opentype.Font, text: string, size: number): THREE.Shape[] {
    // Request kerning so punctuation (quotes) sits correctly next to letters
    const path = font.getPath(text, 0, 0, size, { kerning: true });
    const shapePath = new THREE.ShapePath();
    path.commands.forEach((cmd) => {
        switch (cmd.type) {
            case 'M': shapePath.moveTo(cmd.x, cmd.y); break;
            case 'L': shapePath.lineTo(cmd.x, cmd.y); break;
            case 'Q': shapePath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y); break;
            case 'C': shapePath.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y); break;
            case 'Z': shapePath.currentPath.closePath(); break;
        }
    });
    return shapePath.toShapes(true);
}

// --- Internal Component: Zoom Handler ---
const ZoomHandler = () => {
    const { camera } = useThree();
    useEffect(() => {
        const handleZoomIn = () => camera.position.multiplyScalar(0.8);
        const handleZoomOut = () => camera.position.multiplyScalar(1.25);
        window.addEventListener('preview-zoom-in', handleZoomIn);
        window.addEventListener('preview-zoom-out', handleZoomOut);
        return () => {
            window.removeEventListener('preview-zoom-in', handleZoomIn);
            window.removeEventListener('preview-zoom-out', handleZoomOut);
        };
    }, [camera]);
    return null;
};

// --- OrbitControls Target Syncer: keeps rotation center at origin ---
const OrbitTargetSyncer: React.FC = () => {
    const orbitControlsRef = useRef<any>(null);
    
    useEffect(() => {
        if (orbitControlsRef.current) {
            // Always target the origin (0,0,0)
            orbitControlsRef.current.target.set(0, 0, 0);
            orbitControlsRef.current.update();
        }
    }, []);
    
    return <OrbitControls ref={orbitControlsRef} makeDefault enableRotate enableZoom enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI} target={[0, 0, 0]} />;
};

// --- Camera Animator: inclines on thickness change ---
const CameraAnimator: React.FC<{ thickness: string }> = ({ thickness }) => {
    const { camera } = useThree();
    const animRef = useRef<{
        active: boolean;
        phase: 'tilt' | 'hold' | 'restore';
        elapsed: number;
        fromPos: THREE.Vector3;
        toPos: THREE.Vector3;
        basePos: THREE.Vector3;
    }>({
        active: false,
        phase: 'tilt',
        elapsed: 0,
        fromPos: new THREE.Vector3(),
        toPos: new THREE.Vector3(),
        basePos: new THREE.Vector3(),
    });
    const prevThickness = useRef(thickness);

    useEffect(() => {
        if (prevThickness.current === thickness) return;
        prevThickness.current = thickness;

        const anim = animRef.current;
        const curPos = camera.position.clone();
        const dist = curPos.length();

        // Rotazione di 120° nel piano XZ rispetto all'asse Z
        const angle = (120 * Math.PI) / 180;
        const tiltTarget = new THREE.Vector3(
            Math.sin(angle) * dist,   //  0.866 * dist
            curPos.y,                  // mantieni Y corrente
            Math.cos(angle) * dist    // -0.5  * dist (dietro/lato)
        );

        anim.basePos = curPos.clone();
        anim.fromPos = curPos.clone();
        anim.toPos = tiltTarget;
        anim.phase = 'tilt';
        anim.elapsed = 0;
        anim.active = true;
    }, [thickness, camera]);

    useFrame((_, delta) => {
        const anim = animRef.current;
        if (!anim.active) return;

        anim.elapsed += delta;

        if (anim.phase === 'tilt') {
            const t = Math.min(anim.elapsed / 0.5, 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            camera.position.lerpVectors(anim.fromPos, anim.toPos, eased);
            camera.lookAt(0, 0, 0);
            if (t >= 1) {
                anim.phase = 'hold';
                anim.elapsed = 0;
            }
        } else if (anim.phase === 'hold') {
            if (anim.elapsed >= 3.0) {
                anim.fromPos = camera.position.clone();
                anim.toPos = anim.basePos.clone();
                anim.phase = 'restore';
                anim.elapsed = 0;
            }
        } else if (anim.phase === 'restore') {
            const t = Math.min(anim.elapsed / 0.5, 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            camera.position.lerpVectors(anim.fromPos, anim.toPos, eased);
            camera.lookAt(0, 0, 0);
            if (t >= 1) {
                anim.active = false;
            }
        }
    });

    return null;
};

// --- Component: Dynamic3DText ---
const Dynamic3DText: React.FC<{
    text: string;
    finish: FinishType;
    color: string;
    fontUrl: string;
    thickness: string;
    onError: () => void;
    onRatioChange?: (ratio: number) => void;
    meshRef: React.RefObject<THREE.Mesh>;
    groupRef: React.RefObject<THREE.Group>;
    targetLengthCm?: number | string;
}> = ({ text, finish, color, fontUrl, thickness, onError, onRatioChange, meshRef, groupRef, targetLengthCm }) => {
    const [shapes, setShapes] = useState<THREE.Shape[]>([]);
    const [offset, setOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    const { camera } = useThree();
    const isFirstLoad = useRef(true);

    useEffect(() => {
        let isMounted = true;
        opentype.load(fontUrl, (err, loadedFont) => {
            if (err) { onError(); return; }
            if (isMounted && loadedFont) setShapes(getShapesFromFont(loadedFont, text, 5));
        });
        return () => { isMounted = false; };
    }, [fontUrl, text, onError]);

    useLayoutEffect(() => {
        if (meshRef.current && groupRef.current && shapes.length > 0) {
            const geometry = meshRef.current.geometry as THREE.BufferGeometry;
            geometry.computeBoundingBox();

            // local size
            const localBox = geometry.boundingBox!;
            const localSize = new THREE.Vector3();
            localBox.getSize(localSize);

            // If a target length is provided, scale the mesh so its width matches the target value
            const maybeTarget = !isNaN(parseFloat(String(targetLengthCm ?? NaN))) ? parseFloat(String(targetLengthCm)) : NaN;
            if (!isNaN(maybeTarget) && localSize.x > 0) {
                let scale = maybeTarget / localSize.x;
                // Clamp scale to avoid extreme values that can push camera too close or flip perspective
                scale = Math.max(0.05, Math.min(scale, 20));
                meshRef.current.scale.set(scale, scale, scale);
            }

            // compute world bounding box after scale
            meshRef.current.updateMatrixWorld(true);
            const worldBox = new THREE.Box3().setFromObject(meshRef.current);
            const center = new THREE.Vector3();
            worldBox.getCenter(center);
            
            // Con rotation=[PI,0,0] l'asse Y è invertito: correggi il segno di Y
            // Apply offset to GROUP (stable), not to geometry (gets recreated)
            const offsetVec = new THREE.Vector3(-center.x, -center.y, center.z);
            groupRef.current.position.copy(offsetVec);
            setOffset(offsetVec);

            const size = new THREE.Vector3();
            worldBox.getSize(size);
            if (size.x > 0 && onRatioChange) onRatioChange(size.y / size.x);

            // Always recalculate camera position to ensure text stays visible
            // This updates every time dimensions change (length, thickness, text)
            // Increased multiplier from 1.8 to 2.5 for larger text, and min from 8 to 15
            const maxDim = Math.max(size.x, size.y);
            const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
            const cameraZ = Math.max(Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 2.5, 15);
            camera.position.set(0, 0, cameraZ);
            camera.lookAt(0, 0, 0);
            isFirstLoad.current = false;
        }
    }, [shapes, thickness, camera, onRatioChange, targetLengthCm, meshRef, groupRef]);

    if (shapes.length === 0) return null;

    const depth = (parseInt(thickness) || 3) / 40;
    const extrudeSettings = { steps: 2, depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 12 };

    let matProps: any = { color: "#F5F5F5", metalness: 0.5, roughness: 0.5 };
    if (finish === FinishType.GLOSSY) matProps = { color: "#C8C8C8", metalness: 1.0, roughness: 0.0, envMapIntensity: 2.0 };
    else if (finish === FinishType.SATIN) matProps = { color: "#B0B0B0", metalness: 0.6, roughness: 0.75, envMapIntensity: 0.4 };
    else if (finish === FinishType.PAINTED) matProps = { color: color || "#1a1a2e", metalness: 0.0, roughness: 0.85, envMapIntensity: 0.0 };

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <mesh ref={meshRef} rotation={[Math.PI, 0, 0]} position={[0, 0, 0]}>
                <extrudeGeometry args={[shapes, extrudeSettings]} />
                <meshStandardMaterial {...matProps} />
            </mesh>
        </group>
    );
};

// Measurements overlay: projects mesh bounding box to screen and draws SVG annotations
const Measurements: React.FC<{ meshRef: React.RefObject<THREE.Mesh>, lengthCm?: number | string, heightCm?: number | string }> = ({ meshRef, lengthCm, heightCm }) => {
    const { camera, gl } = useThree();
    const [pos, setPos] = useState<{ lx: number; ly: number; rx: number; ry: number; tx: number; ty: number; bx: number; by: number } | null>(null);

    useLayoutEffect(() => {
        const update = () => {
            if (!meshRef.current) { setPos(null); return; }
            meshRef.current.updateMatrixWorld(true);
            const worldBox = new THREE.Box3().setFromObject(meshRef.current);
            const min = worldBox.min;
            const max = worldBox.max;

            const left = new THREE.Vector3(min.x, min.y, min.z);
            const right = new THREE.Vector3(max.x, min.y, min.z);
            const topRight = new THREE.Vector3(max.x, max.y, min.z);
            const bottomRight = new THREE.Vector3(max.x, min.y, min.z);

            const project = (v: THREE.Vector3) => {
                const vec = v.clone().project(camera);
                const x = (vec.x * 0.5 + 0.5) * gl.domElement.clientWidth;
                const y = (-vec.y * 0.5 + 0.5) * gl.domElement.clientHeight;
                return { x, y };
            };

            const L = project(left);
            const R = project(right);
            const T = project(topRight);
            const B = project(bottomRight);

            setPos({ lx: L.x, ly: L.y, rx: R.x, ry: R.y, tx: T.x, ty: T.y, bx: B.x, by: B.y });
        };

        update();
        // update on resize and animation frames
        const handle = () => update();
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, [meshRef, camera, gl, lengthCm, heightCm]);

    if (!pos) return null;

    const w = gl.domElement.clientWidth;
    const h = gl.domElement.clientHeight;
    const lenLabel = typeof lengthCm !== 'undefined' ? `${lengthCm} cm` : '';
    const heiLabel = typeof heightCm !== 'undefined' ? `${heightCm} cm` : '';

    return (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
            <svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
                {/* baseline */}
                <line x1={pos.lx} y1={pos.ly} x2={pos.rx} y2={pos.ry} stroke="#111" strokeWidth={2} strokeLinecap="round" />
                {/* end ticks */}
                <line x1={pos.lx} y1={pos.ly - 8} x2={pos.lx} y2={pos.ly + 8} stroke="#111" strokeWidth={2} />
                <line x1={pos.rx} y1={pos.ry - 8} x2={pos.rx} y2={pos.ry + 8} stroke="#111" strokeWidth={2} />
                {/* length label */}
                <text x={(pos.lx + pos.rx) / 2} y={pos.ly + 24} fill="#111" fontSize={14} textAnchor="middle" fontFamily="Inter, Arial">{lenLabel}</text>

                {/* vertical measurement at right */}
                <line x1={pos.rx + 12} y1={pos.ry} x2={pos.tx + 12} y2={pos.ty} stroke="#111" strokeWidth={2} />
                <line x1={pos.rx + 6} y1={pos.ry} x2={pos.rx + 18} y2={pos.ry} stroke="#111" strokeWidth={2} />
                <line x1={pos.tx + 6} y1={pos.ty} x2={pos.tx + 18} y2={pos.ty} stroke="#111" strokeWidth={2} />
                <text x={pos.rx + 26} y={(pos.ry + pos.ty) / 2} fill="#111" fontSize={14} textAnchor="start" fontFamily="Inter, Arial">{heiLabel}</text>
            </svg>
        </Html>
    );
};

const CaptureInterface = React.forwardRef<any, { meshRef: React.RefObject<THREE.Mesh> }>(({ meshRef }, ref) => {
    const { gl, camera, scene } = useThree();
    useImperativeHandle(ref, () => ({
        handleCapture: () => {
            if (!meshRef.current) return null;
            const oldPos = camera.position.clone();
            const oldRot = camera.rotation.clone();

            meshRef.current.geometry.computeBoundingBox();
            const box = meshRef.current.geometry.boundingBox!;
            const size = new THREE.Vector3();
            box.getSize(size);
            const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
            const cameraZ = Math.abs(Math.max(size.x, size.y) / (2 * Math.tan(fov / 2))) * 1.4;

            camera.position.set(0, 0, cameraZ);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            gl.render(scene, camera);

            let data: string | null = null;
            try {
                // Use very low-quality JPEG to keep email size under limit (EmailJS ~25KB per email)
                data = gl.domElement.toDataURL('image/jpeg', 0.1);
            } catch (e) {
                try {
                    data = gl.domElement.toDataURL('image/jpeg', 0.15);
                } catch (err) {
                    data = null;
                }
            }

            camera.position.copy(oldPos);
            camera.rotation.copy(oldRot);
            camera.updateProjectionMatrix();
            gl.render(scene, camera);
            return data;
        }
    }));
    return null;
});

const Preview3D = React.forwardRef<any, Preview3DProps>(({ text, finishType, paintColor, fontFamily, thickness, onAspectRatioChange, lengthCm, heightCm }, ref) => {
    const [activeUrl, setActiveUrl] = useState("");
    const [hasError, setHasError] = useState(false);
    const [isDarkBg, setIsDarkBg] = useState(true);
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
        if (fontFamily) { setHasError(false); setActiveUrl(getFontSourceUrl(fontFamily)); }
    }, [fontFamily]);

    const handleFallback = () => { if (!hasError) { setHasError(true); setActiveUrl('https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-400-normal.woff'); } };
    const triggerZoom = (dir: 'in' | 'out') => window.dispatchEvent(new CustomEvent(dir === 'in' ? 'preview-zoom-in' : 'preview-zoom-out'));

    return (
        <div className={`w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-2xl border relative group transition-colors duration-500 ${isDarkBg ? 'bg-[#0a0f1e] border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`absolute top-4 left-4 z-10 text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-sm border ${isDarkBg ? 'bg-black/50 text-white border-white/10' : 'bg-white/80 text-slate-800 border-slate-200 shadow-sm'}`}>
                Anteprima 3D Interattiva {hasError && "(Fallback)"} - {thickness}
            </div>
            <button onClick={() => setIsDarkBg(!isDarkBg)} className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${isDarkBg ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-slate-200'}`}>
                {isDarkBg ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
                <div className={`backdrop-blur-sm p-1 rounded-lg border flex flex-col gap-1 ${isDarkBg ? 'bg-black/40 border-white/20' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                    <button onClick={() => triggerZoom('in')} className={`w-8 h-8 flex items-center justify-center rounded ${isDarkBg ? 'text-white hover:bg-white/20' : 'text-slate-700 hover:bg-slate-100'}`}><Plus size={18} /></button>
                    <div className={`h-[1px] w-full ${isDarkBg ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                    <button onClick={() => triggerZoom('out')} className={`w-8 h-8 flex items-center justify-center rounded ${isDarkBg ? 'text-white hover:bg-white/20' : 'text-slate-700 hover:bg-slate-100'}`}><Minus size={18} /></button>
                </div>
            </div>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 15], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
                <color attach="background" args={[isDarkBg ? '#93c5fd' : '#ffffff']} />
                <ZoomHandler />
                <CameraAnimator thickness={thickness} />
                <Suspense fallback={null}>
                    <Dynamic3DText meshRef={meshRef} groupRef={groupRef} text={text || "ANTEPRIMA"} finish={finishType} color={paintColor} fontUrl={activeUrl} thickness={thickness} onError={handleFallback} onRatioChange={onAspectRatioChange} targetLengthCm={lengthCm} />
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                    <directionalLight position={[-5, -3, -5]} intensity={0.3} />
                    <Environment preset="studio" />
                    <OrbitTargetSyncer />
                    <CaptureInterface ref={ref} meshRef={meshRef} />
                    <Measurements meshRef={meshRef} lengthCm={lengthCm} heightCm={heightCm} />
                </Suspense>
            </Canvas>
        </div>
    );
});

export default Preview3D;