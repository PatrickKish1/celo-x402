import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image 
                src="/1x402.png" 
                alt="x402 Logo" 
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl font-bold font-mono tracking-wider">
                X402 MANAGER
              </span>
            </div>
            <p className="text-gray-600 font-mono text-sm leading-relaxed max-w-md">
              Professional platform for managing and discovering x402 APIs. 
              Seamless integration with comprehensive analytics and zero-code deployment.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-mono font-bold text-sm mb-4 tracking-wide uppercase">
              PLATFORM
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/discover" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                  DISCOVER APIS
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                  DASHBOARD
                </Link>
              </li>
              <li>
                <a href="/docs" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                  DOCUMENTATION
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-mono font-bold text-sm mb-4 tracking-wide uppercase">
              RESOURCES
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="https://x402.dev" target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                  X402 PROTOCOL
                </a>
              </li>
              <li>
                <a href="https://docs.x402.dev" target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                  DEVELOPER DOCS
                </a>
              </li>
              <li>
                <a href="https://github.com/x402" target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                  GITHUB
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t-2 border-black mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm font-mono text-gray-600 mb-4 md:mb-0">
              © 2024 X402 Manager. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="/privacy" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                PRIVACY
              </a>
              <a href="/terms" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                TERMS
              </a>
              <a href="/support" className="font-mono text-sm text-gray-600 hover:text-black transition-colors">
                SUPPORT
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
