'use client';

export function Hero3D() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating geometric shapes with CSS animations */}
      <div className="absolute top-20 left-10 w-16 h-16 border-2 border-blue-400 rotate-45 animate-float-slow opacity-60"></div>
      <div className="absolute top-40 right-20 w-12 h-12 border-2 border-green-400 rounded-full animate-float-medium opacity-60"></div>
      <div className="absolute bottom-40 left-20 w-20 h-20 border-2 border-purple-400 transform rotate-12 animate-float-fast opacity-60"></div>
      <div className="absolute top-60 left-1/4 w-8 h-8 border-2 border-orange-400 animate-float-slow opacity-60"></div>
      <div className="absolute bottom-60 right-1/4 w-16 h-16 border-2 border-pink-400 transform -rotate-45 animate-float-medium opacity-60"></div>
      
      {/* Network connection lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Animated dots */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}
