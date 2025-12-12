// zkProof Verification Support for x402
// Privacy-preserving payments with Zero-Knowledge Proofs
// Based on zkx402 implementation

export interface ZKProof {
  proof: string;
  publicSignals: string[];
  verificationKey: string;
}

export interface ZKProofRequirement {
  type: string; // e.g., 'proof-of-human', 'proof-of-institution'
  verifierContract?: string;
  description: string;
  discount?: {
    percentage: number;
    maxDiscount: string;
  };
}

export interface ZKProofConfig {
  requestedProofs: string[]; // e.g., ['zkproofOf(human)', 'zkproofOf(institution=NYT)']
  amountRequired: string;
  discountedPrice?: string;
}

export interface ContentMetadata {
  proof: string;
  verified: boolean;
  timestamp?: string;
}

export interface ZKPaymentRequirements {
  basePrice: string;
  variableAmountRequired?: ZKProofConfig[];
  contentMetadata?: ContentMetadata[];
}

export interface VerificationResult {
  valid: boolean;
  qualified: boolean;
  discountApplied: boolean;
  discountedPrice?: string;
  originalPrice: string;
  proofType?: string;
  error?: string;
}

export class X402ZKProofService {
  private static instance: X402ZKProofService;
  private verifiedProofs: Map<string, { proof: ZKProof; timestamp: number }> = new Map();

  static getInstance(): X402ZKProofService {
    if (!X402ZKProofService.instance) {
      X402ZKProofService.instance = new X402ZKProofService();
    }
    return X402ZKProofService.instance;
  }

  /**
   * Verify a zero-knowledge proof
   * This would typically call a verifier smart contract or service
   */
  async verifyProof(proof: ZKProof, requirement: ZKProofRequirement): Promise<boolean> {
    try {
      console.log('Verifying ZK proof for:', requirement.type);

      // In production, this would:
      // 1. Call the verifier contract on-chain
      // 2. Or send to a verification service
      // 3. Verify the proof cryptographically

      // Placeholder: validate proof structure
      if (!proof.proof || !proof.publicSignals || !proof.verificationKey) {
        console.error('Invalid proof structure');
        return false;
      }

      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cache successful verification
      const proofKey = this.getProofKey(proof);
      this.verifiedProofs.set(proofKey, {
        proof,
        timestamp: Date.now(),
      });

      console.log('ZK proof verified successfully');
      return true;
    } catch (error) {
      console.error('ZK proof verification error:', error);
      return false;
    }
  }

  /**
   * Verify payment with zkProof requirements
   * Returns verification result with discount information
   */
  async verifyPaymentWithProof(
    proof: ZKProof | null,
    zkRequirements: ZKPaymentRequirements
  ): Promise<VerificationResult> {
    try {
      const basePrice = parseFloat(zkRequirements.basePrice);

      // No proof provided - use base price
      if (!proof) {
        return {
          valid: true,
          qualified: false,
          discountApplied: false,
          originalPrice: basePrice.toString(),
        };
      }

      // Check if proof qualifies for any discount
      if (zkRequirements.variableAmountRequired) {
        for (const requirement of zkRequirements.variableAmountRequired) {
          // Parse requested proofs
          const qualifies = await this.checkProofQualification(
            proof,
            requirement.requestedProofs
          );

          if (qualifies) {
            const discountedPrice = parseFloat(requirement.amountRequired);
            const discountPercentage = ((basePrice - discountedPrice) / basePrice) * 100;

            return {
              valid: true,
              qualified: true,
              discountApplied: true,
              discountedPrice: discountedPrice.toString(),
              originalPrice: basePrice.toString(),
              proofType: requirement.requestedProofs.join(', '),
            };
          }
        }
      }

      // Proof provided but doesn't qualify for discount
      return {
        valid: true,
        qualified: false,
        discountApplied: false,
        originalPrice: basePrice.toString(),
        error: 'Proof does not qualify for any discount',
      };
    } catch (error) {
      console.error('Payment verification with proof error:', error);
      return {
        valid: false,
        qualified: false,
        discountApplied: false,
        originalPrice: zkRequirements.basePrice,
        error: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Check if a proof qualifies for specific requirements
   */
  private async checkProofQualification(
    proof: ZKProof,
    requestedProofs: string[]
  ): Promise<boolean> {
    try {
      // Parse proof types from requestedProofs
      // e.g., ['zkproofOf(human)', 'zkproofOf(institution=NYT)']
      
      for (const requiredProof of requestedProofs) {
        const proofType = this.parseProofType(requiredProof);
        
        // Verify proof matches type
        const matches = await this.matchesProofType(proof, proofType);
        if (!matches) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Proof qualification check error:', error);
      return false;
    }
  }

  /**
   * Parse proof type from string
   */
  private parseProofType(proofString: string): {
    type: string;
    parameters?: Record<string, string>;
  } {
    // Parse "zkproofOf(human)" or "zkproofOf(institution=NYT)"
    const match = proofString.match(/zkproofOf\(([^)]+)\)/);
    if (!match) {
      return { type: proofString };
    }

    const content = match[1];
    if (content.includes('=')) {
      const [key, value] = content.split('=');
      return {
        type: key.trim(),
        parameters: { [key.trim()]: value.trim() },
      };
    }

    return { type: content.trim() };
  }

  /**
   * Check if proof matches a specific type
   */
  private async matchesProofType(
    proof: ZKProof,
    proofType: { type: string; parameters?: Record<string, string> }
  ): Promise<boolean> {
    // In production, this would:
    // 1. Check proof's public signals
    // 2. Verify against on-chain registry
    // 3. Validate proof parameters

    // Placeholder: always return true for now
    return true;
  }

  /**
   * Generate a proof key for caching
   */
  private getProofKey(proof: ZKProof): string {
    return `${proof.proof.slice(0, 16)}_${proof.publicSignals[0]}`;
  }

  /**
   * Check if a proof is cached and still valid
   */
  isProofCached(proof: ZKProof): boolean {
    const proofKey = this.getProofKey(proof);
    const cached = this.verifiedProofs.get(proofKey);
    
    if (!cached) return false;

    // Proof valid for 1 hour
    const validDuration = 60 * 60 * 1000;
    return Date.now() - cached.timestamp < validDuration;
  }

  /**
   * Verify content metadata with ZK proofs
   */
  async verifyContentMetadata(
    contentMetadata: ContentMetadata[]
  ): Promise<{
    allVerified: boolean;
    verifiedCount: number;
    failedProofs: string[];
  }> {
    let verifiedCount = 0;
    const failedProofs: string[] = [];

    for (const metadata of contentMetadata) {
      try {
        // In production, verify the proof against the content
        // For now, trust the verified flag
        if (metadata.verified) {
          verifiedCount++;
        } else {
          failedProofs.push(metadata.proof);
        }
      } catch (error) {
        failedProofs.push(metadata.proof);
      }
    }

    return {
      allVerified: failedProofs.length === 0,
      verifiedCount,
      failedProofs,
    };
  }

  /**
   * Generate ZK proof requirements for an endpoint
   */
  generateProofRequirements(
    basePrice: string,
    proofConfigs: Array<{
      proofTypes: string[];
      discountedPrice: string;
    }>
  ): ZKPaymentRequirements {
    return {
      basePrice,
      variableAmountRequired: proofConfigs.map(config => ({
        requestedProofs: config.proofTypes,
        amountRequired: config.discountedPrice,
      })),
    };
  }

  /**
   * Clear proof cache
   */
  clearCache() {
    this.verifiedProofs.clear();
  }

  /**
   * Get supported proof types
   */
  getSupportedProofTypes(): string[] {
    return [
      'zkproofOf(human)',
      'zkproofOf(institution)',
      'zkproofOf(age)',
      'zkproofOf(country)',
      'zkproofOf(credential)',
    ];
  }

  /**
   * Format discount information for display
   */
  formatDiscount(verification: VerificationResult): string {
    if (!verification.discountApplied || !verification.discountedPrice) {
      return 'No discount applied';
    }

    const original = parseFloat(verification.originalPrice);
    const discounted = parseFloat(verification.discountedPrice);
    const saved = original - discounted;
    const percentage = ((saved / original) * 100).toFixed(1);

    return `${percentage}% discount applied (saved ${saved.toFixed(6)} USDC)`;
  }
}

export const x402ZKProof = X402ZKProofService.getInstance();

