/**
 * SERVER-SIDE ONLY Package Configuration
 * Fetches token packages from database - single source of truth
 * Client should only send packageId, server validates and uses database values
 */

import { prisma } from './prisma';

export interface TokenPackage {
  id: string;
  name: string;
  description: string | null;
  tokens: number;
  price: number;
  currency: string;
  isActive: boolean;
}

/**
 * Get a package by ID from database with validation
 * @param packageId - The package ID to look up
 * @returns The package if found and active, null otherwise
 */
export async function getPackageById(packageId: string): Promise<TokenPackage | null> {
  try {
    const pkg = await prisma.tokenPackage.findUnique({
      where: { id: packageId }
    });
    
    if (!pkg) {
      return null;
    }
    
    if (!pkg.isActive) {
      return null;
    }
    
    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      tokens: pkg.tokens,
      price: pkg.price,
      currency: pkg.currency,
      isActive: pkg.isActive
    };
  } catch (error) {
    console.error('Error fetching package from database:', error);
    return null;
  }
}

/**
 * Get all active packages from database
 * @returns Array of active packages
 */
export async function getAllActivePackages(): Promise<TokenPackage[]> {
  try {
    const packages = await prisma.tokenPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' } // Order by price ascending
    });
    
    return packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      tokens: pkg.tokens,
      price: pkg.price,
      currency: pkg.currency,
      isActive: pkg.isActive
    }));
  } catch (error) {
    console.error('Error fetching packages from database:', error);
    return [];
  }
}

/**
 * Validate that an amount matches a package price from database
 * @param packageId - The package ID
 * @param amount - The amount to validate
 * @returns true if amount matches package price, false otherwise
 */
export async function validatePackageAmount(packageId: string, amount: number): Promise<boolean> {
  const pkg = await getPackageById(packageId);
  
  if (!pkg) {
    return false;
  }
  
  return pkg.price === amount;
}

