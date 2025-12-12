/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';

interface APINode {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  x: number;
  y: number;
  z: number;
  connections: string[];
}

interface APINetwork3DProps {
  apis: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
  }>;
}

export function APINetwork3D({ apis }: APINetwork3DProps) {
  const [hoveredNode, setHoveredNode] = useState<APINode | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<APINode | null>(null);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Ensure component only renders on client to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create 3D positioned nodes in a sphere formation with deterministic positioning
  const nodes: APINode[] = apis.slice(0, 20).map((api, index) => {
    // Use deterministic positioning based on index instead of Math.random()
    const phi = Math.acos(-1 + (2 * index) / Math.min(apis.length, 20));
    const theta = Math.sqrt(Math.min(apis.length, 20) * Math.PI) * phi;
    
    // Use index-based radius variation for consistent positioning
    const radius = 200 + (index % 3) * 20; // 200, 220, or 240
    const x = Math.cos(theta) * Math.sin(phi) * radius;
    const y = Math.sin(theta) * Math.sin(phi) * radius;
    const z = Math.cos(phi) * radius;
    
    // Create connections to nearby nodes deterministically
    const connections = [];
    for (let i = 0; i < Math.min(apis.length, 20); i++) {
      if (i !== index) {
        const otherPhi = Math.acos(-1 + (2 * i) / Math.min(apis.length, 20));
        const otherTheta = Math.sqrt(Math.min(apis.length, 20) * Math.PI) * otherPhi;
        const otherRadius = 200 + (i % 3) * 20;
        const otherX = Math.cos(otherTheta) * Math.sin(otherPhi) * otherRadius;
        const otherY = Math.sin(otherTheta) * Math.sin(otherPhi) * otherRadius;
        const otherZ = Math.cos(otherPhi) * otherRadius;
        
        const distance = Math.sqrt(
          Math.pow(x - otherX, 2) + 
          Math.pow(y - otherY, 2) + 
          Math.pow(z - otherZ, 2)
        );
        
        if (distance < 150) {
          connections.push(apis[i].id);
        }
      }
    }
    
    return {
      ...api,
      x,
      y,
      z,
      connections
    };
  });

  // Helper function to get category colors
  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'finance': '#10b981', // green
      'weather': '#3b82f6', // blue
      'news': '#f59e0b',    // yellow
      'data': '#8b5cf6',    // purple
      'social': '#ef4444',  // red
      'default': '#6b7280'  // gray
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setRotation(prev => ({
        x: prev.x + e.movementY * 0.5,
        y: prev.y + e.movementX * 0.5
      }));
    }

    // Raycasting for hover effects
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Find closest node
    let closestNode: APINode | null = null;
    let closestDistance = Infinity;
    
    nodes.forEach(node => {
      // Apply rotation and zoom transformations
      const rotatedX = node.x * Math.cos(rotation.y * Math.PI / 180) - node.z * Math.sin(rotation.y * Math.PI / 180);
      const rotatedZ = node.x * Math.sin(rotation.y * Math.PI / 180) + node.z * Math.cos(rotation.y * Math.PI / 180);
      
      const finalX = rotatedX * zoom + rect.width / 2;
      const finalY = node.y * zoom + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - finalX, 2) + 
        Math.pow(mouseY - finalY, 2)
      );
      
      if (distance < 30 && distance < closestDistance) {
        closestDistance = distance;
        closestNode = node;
      }
    });
    
    if (closestNode && closestNode !== hoveredNode) {
      setHoveredNode(closestNode);
      setMousePosition({ x: e.clientX, y: e.clientY });
    } else if (!closestNode) {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(2, prev - e.deltaY * 0.001)));
  };

  const handleNodeClick = (node: APINode) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  // Animation loop for floating effect
  useEffect(() => {
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Apply 3D transformations to nodes
  const getNodeTransform = (node: APINode) => {
    const rotatedX = node.x * Math.cos(rotation.y * Math.PI / 180) - node.z * Math.sin(rotation.y * Math.PI / 180);
    const rotatedZ = node.x * Math.sin(rotation.y * Math.PI / 180) + node.z * Math.cos(rotation.y * Math.PI / 180);
    
    const finalX = rotatedX * zoom;
    const finalY = node.y * zoom;
    const finalZ = rotatedZ * zoom;
    
    return {
      x: finalX,
      y: finalY,
      z: finalZ,
      transform: `translate3d(${finalX}px, ${finalY}px, ${finalZ}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
    };
  };

  // Don't render until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 bg-gray-200 mx-auto mb-4 animate-pulse rounded-full"></div>
            <h2 className="text-xl font-bold font-mono mb-2">LOADING 3D NETWORK</h2>
            <p className="text-gray-600 font-mono">Initializing visualization...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D Network Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* 3D Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid3d" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid3d)" />
          </svg>
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map((node, index) => 
            node.connections.map((connectionId, connectionIndex) => {
              const targetNode = nodes.find(n => n.id === connectionId);
              if (!targetNode) return null;
              
              const sourceTransform = getNodeTransform(node);
              const targetTransform = getNodeTransform(targetNode);
              
              const centerX = containerRef.current?.clientWidth || 0;
              const centerY = containerRef.current?.clientHeight || 0;
              
              return (
                <line
                  key={`${index}-${connectionIndex}`}
                  x1={sourceTransform.x + centerX / 2}
                  y1={sourceTransform.y + centerY / 2}
                  x2={targetTransform.x + centerX / 2}
                  y2={targetTransform.y + centerY / 2}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  opacity="0.4"
                  className="transition-all duration-300"
                />
              );
            })
          )}
        </svg>

        {/* API Nodes */}
        {nodes.map((node, index) => {
          const transform = getNodeTransform(node);
          const centerX = containerRef.current?.clientWidth || 0;
          const centerY = containerRef.current?.clientHeight || 0;
          
          return (
            <div
              key={node.id}
              className={`absolute w-8 h-8 rounded-full cursor-pointer transition-all duration-500 hover:scale-150 ${
                selectedNode?.id === node.id ? 'ring-4 ring-black ring-opacity-50' : ''
              }`}
              style={{
                left: transform.x + centerX / 2 - 16,
                top: transform.y + centerY / 2 - 16,
                backgroundColor: getCategoryColor(node.category),
                boxShadow: `0 0 30px ${getCategoryColor(node.category)}60`,
                transform: `translateZ(${transform.z}px)`,
                zIndex: Math.round(transform.z)
              }}
              onMouseEnter={(e) => {
                setHoveredNode(node);
                setMousePosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node)}
              title={node.name}
            >
              {/* Node Pulse Animation */}
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-75"
                style={{ backgroundColor: getCategoryColor(node.category) }}
              />
            </div>
          );
        })}

        {/* Floating Data Particles - deterministic positioning */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping"
              style={{
                left: `${(i * 7) % 100}%`, // Deterministic positioning
                top: `${(i * 11) % 100}%`,  // Deterministic positioning
                animationDelay: `${(i % 3)}s`, // Deterministic delays
                animationDuration: `${3 + (i % 2)}s` // Deterministic durations
              }}
            />
          ))}
        </div>

        {/* Network Pulse Waves */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 border-2 border-blue-300 rounded-full animate-ping opacity-20"
              style={{
                animationDelay: `${i * 2}s`,
                animationDuration: '4s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Hover Info Card */}
      {hoveredNode && (
        <div 
          className="absolute bg-white border-2 border-black p-4 rounded shadow-lg z-50 max-w-xs"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="font-mono">
            <h3 className="font-bold text-lg mb-2">{hoveredNode.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{hoveredNode.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-green-600">
                ${hoveredNode.price} USDC
              </span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {hoveredNode.category}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {hoveredNode.connections.length} connections
            </div>
          </div>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute top-4 left-4 bg-white border-2 border-black p-4 rounded shadow-lg z-50 max-w-sm">
          <div className="font-mono">
            <h3 className="font-bold text-xl mb-3">{selectedNode.name}</h3>
            <p className="text-sm text-gray-700 mb-3">{selectedNode.description}</p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="font-bold text-sm">PRICE</div>
                <div className="text-lg font-bold text-green-600">${selectedNode.price} USDC</div>
              </div>
              <div>
                <div className="font-bold text-sm">CATEGORY</div>
                <div className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {selectedNode.category}
                </div>
              </div>
            </div>
            <div className="mb-3">
              <div className="font-bold text-sm mb-2">CONNECTIONS</div>
              <div className="flex flex-wrap gap-2">
                {selectedNode.connections.slice(0, 5).map(connId => {
                  const connNode = nodes.find(n => n.id === connId);
                  return (
                    <span
                      key={connId}
                      className="px-2 py-1 bg-gray-100 text-xs border border-gray-300 rounded"
                    >
                      {connNode?.name || connId}
                    </span>
                  );
                })}
                {selectedNode.connections.length > 5 && (
                  <span className="px-2 py-1 bg-gray-200 text-xs border border-gray-300 rounded">
                    +{selectedNode.connections.length - 5}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="w-full retro-button text-sm"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
      
      {/* Controls Instructions */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3 rounded font-mono text-sm">
        <div className="font-bold mb-1">3D CONTROLS:</div>
        <div>• Drag to rotate network</div>
        <div>• Scroll to zoom in/out</div>
        <div>• Hover over nodes for info</div>
        <div>• Click nodes for details</div>
      </div>

      {/* Category Legend */}
      <div className="absolute top-4 right-4 bg-white border-2 border-black p-3 rounded font-mono text-sm">
        <div className="font-bold mb-2">CATEGORIES:</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs">Finance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs">Weather</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs">News</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-xs">Data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs">Social</span>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="absolute bottom-4 right-4 bg-white border-2 border-black p-3 rounded font-mono text-sm">
        <div className="font-bold mb-1">NETWORK STATS:</div>
        <div className="text-xs">
          <div>Nodes: {nodes.length}</div>
          <div>Connections: {nodes.reduce((sum, node) => sum + node.connections.length, 0) / 2}</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
        </div>
      </div>
    </div>
  );
}
