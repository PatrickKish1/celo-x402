'use client';

import { Header } from '@/components/ui/header';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: 'api' | 'network' | 'user';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  connections: string[];
}

export default function NetworkDemoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    // Generate network nodes
    const generatedNodes: Node[] = [];
    
    // Center node - X402 Platform
    generatedNodes.push({
      id: 'center',
      label: 'X402 MANAGER',
      type: 'user',
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      connections: []
    });

    // Network nodes
    const networks = ['BASE', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVALANCHE'];
    networks.forEach((network, i) => {
      const angle = (i / networks.length) * Math.PI * 2;
      const radius = 150;
      const id = `network-${i}`;
      generatedNodes.push({
        id,
        label: network,
        type: 'network',
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (i - networks.length / 2) * 30,
        vx: 0,
        vy: 0,
        vz: 0,
        connections: ['center']
      });
    });

    // API nodes
    const apiCount = 15;
    for (let i = 0; i < apiCount; i++) {
      const angle = (i / apiCount) * Math.PI * 2;
      const radius = 250 + Math.random() * 50;
      const networkId = `network-${i % networks.length}`;
      generatedNodes.push({
        id: `api-${i}`,
        label: `API ${i + 1}`,
        type: 'api',
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 200,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        connections: [networkId]
      });
    }

    setNodes(generatedNodes);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Update node positions
      const updatedNodes = nodes.map(node => {
        if (node.type === 'api') {
          return {
            ...node,
            x: node.x + node.vx,
            y: node.y + node.vy,
            z: node.z + node.vz,
            // Bounce off boundaries
            vx: Math.abs(node.x) > 300 ? -node.vx * 0.9 : node.vx,
            vy: Math.abs(node.y) > 300 ? -node.vy * 0.9 : node.vy,
            vz: Math.abs(node.z) > 150 ? -node.vz * 0.9 : node.vz,
          };
        }
        return node;
      });

      // Sort nodes by z-depth for proper rendering
      const sortedNodes = [...updatedNodes].sort((a, b) => a.z - b.z);

      // Draw connections
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      sortedNodes.forEach(node => {
        node.connections.forEach(targetId => {
          const target = updatedNodes.find(n => n.id === targetId);
          if (target) {
            const startPos = project(node, rotation, centerX, centerY);
            const endPos = project(target, rotation, centerX, centerY);
            
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(endPos.x, endPos.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      sortedNodes.forEach(node => {
        const pos = project(node, rotation, centerX, centerY);
        const scale = 1 + (node.z / 500); // Perspective scaling

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8 * scale, 0, Math.PI * 2);
        
        if (node.type === 'user') {
          ctx.fillStyle = '#000000';
        } else if (node.type === 'network') {
          ctx.fillStyle = '#3b82f6';
        } else {
          ctx.fillStyle = '#10b981';
        }
        
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        if (node.type !== 'api' || scale > 1) {
          ctx.fillStyle = '#000000';
          ctx.font = `${10 * scale}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, pos.x, pos.y - 15 * scale);
        }
      });

      // Auto-rotate
      setRotation(prev => ({
        x: prev.x,
        y: prev.y + 0.002
      }));

      setNodes(updatedNodes);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, rotation]);

  const project = (
    node: Node,
    rot: { x: number; y: number },
    centerX: number,
    centerY: number
  ) => {
    // Apply rotation
    const x = node.x;
    const y = node.y;
    const z = node.z;

    // Rotate around Y axis
    const cosY = Math.cos(rot.y);
    const sinY = Math.sin(rot.y);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate around X axis
    const cosX = Math.cos(rot.x);
    const sinX = Math.sin(rot.x);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Project to 2D
    const scale = 400 / (400 + z2);
    return {
      x: centerX + x1 * scale,
      y: centerY + y1 * scale,
      z: z2
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;

    setRotation(prev => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01
    }));

    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/discover" className="text-blue-600 hover:underline font-mono">
              <ArrowLeftIcon className="w-4 h-4" /> BACK TO DISCOVERY
            </Link>
          </nav>

          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-mono tracking-wider mb-4">
              X402 NETWORK VISUALIZATION
            </h1>
            <p className="text-xl font-mono text-gray-700 max-w-3xl mx-auto">
              Interactive 3D visualization of the x402 ecosystem showing APIs, networks, and connections.
            </p>
          </div>

          {/* Canvas */}
          <div className="retro-card mb-8">
            <canvas
              ref={canvasRef}
              width={1200}
              height={700}
              className="w-full border-2 border-black cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="retro-card">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-black border-2 border-white"></div>
                <div>
                  <div className="font-mono font-bold">X402 MANAGER</div>
                  <div className="text-sm text-gray-600">Central platform</div>
                </div>
              </div>
            </div>
            <div className="retro-card">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                <div>
                  <div className="font-mono font-bold">NETWORKS</div>
                  <div className="text-sm text-gray-600">Blockchain networks</div>
                </div>
              </div>
            </div>
            <div className="retro-card">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white"></div>
                <div>
                  <div className="font-mono font-bold">APIS</div>
                  <div className="text-sm text-gray-600">x402-enabled endpoints</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="retro-card">
            <h3 className="font-mono font-bold mb-2">CONTROLS</h3>
            <ul className="text-sm space-y-1">
              <li>• <span className="font-bold">Click and drag</span> to rotate the network</li>
              <li>• Network automatically rotates when not interacting</li>
              <li>• API nodes float and bounce within boundaries</li>
              <li>• Nodes scale with depth for 3D perspective</li>
            </ul>
          </div>
        </div>
      </main>
      
    </div>
  );
}
