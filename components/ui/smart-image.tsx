/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { RailwayIcon } from '@/components/icons/railway-icon';
import { X402Icon } from '@/components/icons/x402-icon';

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: string;
}

// Track failed URLs to avoid retrying (persists across component mounts)
const failedUrls = new Set<string>();

// Domain-specific fallback URLs
const DOMAIN_FALLBACKS: Record<string, string> = {
  'x402labs.dev': 'https://x402labs.dev/logo.jpeg',
  'slamai.xyz': 'https://www.slamai.xyz/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FSLAMai_LOGO.d69cf009.png&w=256&q=75',
  'grapevine.markets': 'https://grapevine-assets.mypinata.cloud/ipfs/bafkreib4zfs5lxdvlqzxyvc2djb4oaw2rvizg5rzwivjlet53j6fd6mvsy',
};

/**
 * Determine fallback type based on URL patterns
 */
function getFallbackType(src: string | null | undefined): 'x402' | 'railway' | 'vercel' | 'domain' | 'none' {
  if (!src) return 'vercel';

  const lowerSrc = src.toLowerCase();
  const domain = extractDomain(src);

  // Check for domain-specific fallbacks
  if (domain && DOMAIN_FALLBACKS[domain]) {
    return 'domain';
  }

  // Pattern-based fallbacks
  if (lowerSrc.includes('x402')) {
    return 'x402';
  }

  if (lowerSrc.includes('railway')) {
    return 'railway';
  }

  if (lowerSrc.includes('vercel.app')) {
    return 'vercel';
  }

  return 'none';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    // Try to extract from string
    const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : null;
  }
}

export function SmartImage({ src, alt, width, height, className, fallback = '/vercel.png' }: SmartImageProps) {
  // Determine the initial source and fallback type
  const { initialSrc, fallbackType } = useMemo(() => {
    if (!src) {
      return { initialSrc: fallback, fallbackType: 'vercel' as const };
    }

    const domain = extractDomain(src);
    
    // Check for domain-specific fallback first
    if (domain && DOMAIN_FALLBACKS[domain]) {
      return { initialSrc: DOMAIN_FALLBACKS[domain], fallbackType: 'domain' as const };
    }

    // Check pattern-based fallbacks
    const patternFallback = getFallbackType(src);
    if (patternFallback !== 'none') {
      return { initialSrc: fallback, fallbackType: patternFallback };
    }

    // If this URL has failed before, use default fallback
    if (failedUrls.has(src)) {
      return { initialSrc: fallback, fallbackType: 'vercel' as const };
    }

    return { initialSrc: src, fallbackType: 'none' as const };
  }, [src, fallback]);

  const [imageSrc, setImageSrc] = useState<string>(initialSrc);
  const [currentFallbackType, setCurrentFallbackType] = useState<'x402' | 'railway' | 'vercel' | 'domain' | 'none'>(fallbackType);
  const [hasError, setHasError] = useState(fallbackType !== 'none');

  // Update when initialSrc changes
  useEffect(() => {
    setImageSrc(initialSrc);
    setCurrentFallbackType(fallbackType);
    setHasError(fallbackType !== 'none');
  }, [initialSrc, fallbackType]);

  const handleError = (e: any) => {
    // Mark this URL as failed to prevent future requests
    if (src && src !== fallback && !failedUrls.has(src)) {
      failedUrls.add(src);
      // console.log(`[SmartImage] Marked as failed: ${src}`);
    }

    // Determine fallback type on error
    const errorFallbackType = getFallbackType(src);
    
    // Switch to appropriate fallback
    if (!hasError || currentFallbackType !== errorFallbackType) {
      setHasError(true);
      setCurrentFallbackType(errorFallbackType);
      
      // Use domain-specific fallback if available
      const domain = extractDomain(src || '');
      if (domain && DOMAIN_FALLBACKS[domain]) {
        setImageSrc(DOMAIN_FALLBACKS[domain]);
      } else {
        setImageSrc(fallback);
      }
    }

    // Hide the broken image
    if (e?.target) {
      e.target.style.display = 'none';
    }
  };

  // Render SVG icons for specific fallback types
  if (hasError || currentFallbackType !== 'none') {
    if (currentFallbackType === 'x402') {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
          <X402Icon width={width} height={height} className="text-black dark:text-white" />
        </div>
      );
    }

    if (currentFallbackType === 'railway') {
      return (
        <div className={`flex items-center justify-center group ${className}`} style={{ width, height }}>
          <RailwayIcon width={width} height={height} className="text-black dark:text-white" />
        </div>
      );
    }
  }

  // If we're using fallback image from the start, render it directly
  if (initialSrc === fallback || (hasError && currentFallbackType === 'vercel')) {
    return (
      <Image
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        className={className}
        unoptimized
      />
    );
  }

  // For remote images, use Next.js Image with error handling
  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized={imageSrc === fallback}
    />
  );
}

