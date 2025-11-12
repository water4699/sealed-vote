// Simple in-memory storage for public keys
// In production, consider using IndexedDB or localStorage

interface PublicKeyData {
  publicKey: string;
  publicParams: string;
}

const storage = new Map<string, PublicKeyData>();

// Clear any old localStorage keys that might cause issues
if (typeof window !== "undefined" && window.localStorage) {
  try {
    // Clear old fhevm-related keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("fhevm") || key.includes("publicKey"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log("🧹 Cleared old FHEVM cache keys:", keysToRemove.length);
    }
  } catch (e) {
    console.warn("Could not clear old cache:", e);
  }
}

export async function publicKeyStorageGet(
  aclAddress: `0x${string}`
): Promise<PublicKeyData> {
  const existing = storage.get(aclAddress.toLowerCase());
  if (existing && existing.publicKey && existing.publicParams) {
    console.log("📦 Using cached public key for", aclAddress);
    return existing;
  }
  // Return empty values if not found - will be fetched from network
  console.log("🌐 No cached public key, will fetch from network");
  return { publicKey: "", publicParams: "" };
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: string,
  publicParams: string
): Promise<void> {
  if (publicKey && publicParams) {
    console.log("💾 Caching public key for", aclAddress);
    storage.set(aclAddress.toLowerCase(), { publicKey, publicParams });
  }
}

