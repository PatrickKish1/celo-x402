'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Transaction3DMapProps {
  resourceName?: string;
  transactionCount?: number;
}

export function Transaction3DMap({ resourceName = 'API', transactionCount = 50 }: Transaction3DMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Capture container ref at the start to avoid stale reference in cleanup
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 50);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Central service node (larger, glowing sphere)
    const serviceGeometry = new THREE.SphereGeometry(2, 32, 32);
    const serviceMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.9,
    });
    const serviceNode = new THREE.Mesh(serviceGeometry, serviceMaterial);
    serviceNode.position.set(0, 0, 0);
    scene.add(serviceNode);

    // Add glow effect to service node
    const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    serviceNode.add(glow);

    // Client nodes (smaller spheres in a circle around the service)
    const clientNodes: THREE.Mesh[] = [];
    const clientCount = Math.min(12, transactionCount);
    const radius = 30;

    for (let i = 0; i < clientCount; i++) {
      const angle = (i / clientCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 10;

      const nodeGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.5 + i * 0.05, 0.7, 0.6),
        transparent: true,
        opacity: 0.8,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y, z);
      scene.add(node);
      clientNodes.push(node);

      // Connection line (initially invisible)
      const points = [new THREE.Vector3(x, y, z), new THREE.Vector3(0, 0, 0)];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.2,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    }

    // Transaction particles
    const particleCount = Math.min(100, transactionCount * 2);
    const particles: Array<{
      mesh: THREE.Mesh;
      progress: number;
      speed: number;
      startPos: THREE.Vector3;
      endPos: THREE.Vector3;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.3 + Math.random() * 0.3, 0.9, 0.6),
        transparent: true,
        opacity: 0.9,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      const sourceNode = clientNodes[Math.floor(Math.random() * clientNodes.length)];
      const startPos = sourceNode.position.clone();
      const endPos = new THREE.Vector3(0, 0, 0);

      particle.position.copy(startPos);
      scene.add(particle);

      particles.push({
        mesh: particle,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.01,
        startPos,
        endPos,
      });
    }

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Point lights for dramatic effect
    const pointLight1 = new THREE.PointLight(0x8b5cf6, 1, 100);
    pointLight1.position.set(0, 10, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4ade80, 0.5, 80);
    pointLight2.position.set(20, -10, 20);
    scene.add(pointLight2);

    // Stars background
    const starCount = 1000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 200;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    setIsLoaded(true);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Animate particles
      particles.forEach((particle) => {
        particle.progress += particle.speed;

        if (particle.progress >= 1) {
          particle.progress = 0;
          // Pick a new random start node
          const sourceNode = clientNodes[Math.floor(Math.random() * clientNodes.length)];
          particle.startPos.copy(sourceNode.position);
        }

        // Lerp between start and end
        particle.mesh.position.lerpVectors(
          particle.startPos,
          particle.endPos,
          particle.progress
        );

        // Fade out as approaching center
        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.9 - particle.progress * 0.5;
      });

      // Rotate service node
      serviceNode.rotation.y += 0.005;
      glow.rotation.y -= 0.003;
      glow.rotation.x += 0.002;

      // Pulse glow effect
      const scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
      glow.scale.set(scale, scale, scale);

      // Client nodes subtle movement
      clientNodes.forEach((node, i) => {
        node.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
      });

      // Rotate stars slowly
      stars.rotation.y += 0.0001;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [transactionCount]);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-lg overflow-hidden border-2 border-black bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Overlay Info */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border-2 border-purple-500 p-3 rounded">
        <div className="font-mono text-xs space-y-1">
          <div className="text-purple-400 font-bold">TRANSACTION MAP</div>
          <div className="text-gray-300">{resourceName}</div>
          <div className="text-green-400">{transactionCount} transactions</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm border-2 border-purple-500 p-3 rounded">
        <div className="font-mono text-xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-300">API Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-gray-300">Clients</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-gray-300">Transactions</span>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-center font-mono text-sm text-purple-400">
            <div className="mb-2">Loading 3D visualization...</div>
            <div className="w-32 h-1 bg-gray-800 rounded overflow-hidden">
              <div className="h-full bg-purple-500 animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border-2 border-cyan-500 p-2 rounded">
        <div className="font-mono text-xs text-cyan-400">
          🖱️ Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}

