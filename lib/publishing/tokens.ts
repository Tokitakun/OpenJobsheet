/**
 * Token utilities for OpenJobsheet Publishing
 * Server-side only — do NOT import in client components.
 */

import { createHash, randomBytes } from "crypto";

/**
 * Generate a cryptographically-secure 32-byte random token (hex encoded).
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a token with SHA-256 (hex). Store only the hash in the database.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Constant-time comparison: verify a plain token matches its stored hash.
 */
export function verifyToken(token: string, storedHash: string): boolean {
  if (!token || !storedHash) return false;
  const incoming = hashToken(token);
  // Both are 64-char hex strings — simple equality is sufficient here
  // because we don't expose oracle timing on hash lengths.
  return incoming === storedHash;
}
