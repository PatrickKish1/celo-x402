import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/x402.png" 
            alt="x402 Logo"
            width={96}
            height={96}
            className="h-[600px] w-[600px] mx-auto animate-pulse"
          />
        </div>
        
        {/* Loading Spinner */}
        <div className="flex justify-center mb-6">
          <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
          <div className="h-8 w-8 bg-black rounded-full animate-bounce mx-2" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-8 w-8 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Loading Message */}
        <p className="text-xl font-mono text-gray-700">
          LOADING APIs...
        </p>
        
        {/* Subtitle */}
        <p className="text-sm font-mono text-gray-500 mt-2">
          Professional x402 API Management
        </p>
      </div>
    </div>
  );
}
