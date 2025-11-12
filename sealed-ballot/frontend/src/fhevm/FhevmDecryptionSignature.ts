// Simplified client-side decryption signature helper
import { Signer } from "ethers";
import type { FhevmInstance } from "./fhevmTypes";
import type { GenericStringStorage } from "./GenericStringStorage";

export type FhevmDecryptionSignatureType = {
  privateKey: string;
  publicKey: string;
  signature: `0x${string}`;
  contractAddresses: `0x${string}`[];
  userAddress: `0x${string}`;
  startTimestamp: number;
  durationDays: number;
};

const DEFAULT_DURATION_DAYS = 365;

export class FhevmDecryptionSignature {
  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: `0x${string}`[],
    signer: Signer,
    storage: GenericStringStorage,
    durationDays: number = DEFAULT_DURATION_DAYS
  ): Promise<FhevmDecryptionSignatureType | null> {
    const userAddress = (await signer.getAddress()) as `0x${string}`;
    const storageKey = this.getStorageKey(userAddress, contractAddresses);

    // Try cached signature
    const existing = storage.get(storageKey);
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as FhevmDecryptionSignatureType;
        if (this.isValid(parsed)) {
          console.log("✅ Using cached decryption signature");
          return parsed;
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse cached signature", e);
      }
    }

    // Create new signature
    console.log("🔑 Creating new decryption signature...");
    const signature = await this.sign(instance, contractAddresses, signer, userAddress, durationDays);

    if (signature) {
      storage.set(storageKey, JSON.stringify(signature));
      console.log("💾 Signature cached");
    }

    return signature;
  }

  private static async sign(
    instance: FhevmInstance,
    contractAddresses: `0x${string}`[],
    signer: Signer,
    userAddress: `0x${string}`,
    durationDays: number
  ): Promise<FhevmDecryptionSignatureType | null> {
    try {
      const ensure0x = (value: string) =>
        value.startsWith("0x") ? (value as `0x${string}`) : (`0x${value}` as `0x${string}`);

      const generateKeypair =
        typeof instance.generateKeypair === "function"
          ? instance.generateKeypair.bind(instance)
          : null;

      if (!generateKeypair) {
        throw new Error("FHEVM instance does not expose generateKeypair()");
      }

      const { publicKey, privateKey } = generateKeypair();
      const normalizedPublicKey = ensure0x(String(publicKey));
      const normalizedPrivateKey = ensure0x(String(privateKey));

      const startTimestamp = Math.floor(Date.now() / 1000);
      const duration = durationDays;

      const createEIP712 =
        typeof instance.createEIP712 === "function"
          ? instance.createEIP712.bind(instance)
          : null;

      let signature: `0x${string}`;

      if (createEIP712) {
        console.log("🧾 Using instance.createEIP712 helper");
        const eip712 = createEIP712(
          normalizedPublicKey,
          contractAddresses,
          startTimestamp.toString(),
          duration.toString()
        );

        const domain = eip712.domain as any;
        const message = eip712.message as any;
        const primaryType = (eip712.primaryType ??
          "UserDecryptRequestVerification") as string;

        const types = { ...eip712.types } as Record<
          string,
          Array<{ name: string; type: string }>
        >;

        // Remove EIP712Domain if present (ethers expects it separately)
        if (types.EIP712Domain) {
          delete types.EIP712Domain;
        }

        let signingTypes: Record<string, Array<{ name: string; type: string }>>;
        if (types[primaryType]) {
          signingTypes = { [primaryType]: types[primaryType] };
        } else if (types.UserDecryptRequestVerification) {
          signingTypes = {
            UserDecryptRequestVerification: types.UserDecryptRequestVerification,
          };
        } else {
          throw new Error(
            "EIP712 data does not contain UserDecryptRequestVerification type"
          );
        }

        console.log("📝 Signing EIP-712 message for reencryption...");
        signature = (await signer.signTypedData(
          domain,
          signingTypes as any,
          message
        )) as `0x${string}`;
      } else {
        console.log(
          "⚠️ createEIP712 helper unavailable - falling back to manual domain"
        );
        const chainId =
          (await signer.provider?.getNetwork().then((n) => Number(n.chainId))) ||
          31337;

        const domain = {
          name: "Authorization token",
          version: "1",
          chainId,
          verifyingContract: contractAddresses[0],
        };

        const types = {
          UserDecryptRequestVerification: [
            { name: "publicKey", type: "bytes" },
            { name: "contractAddresses", type: "address[]" },
            { name: "contractsChainId", type: "uint256" },
            { name: "startTimestamp", type: "uint256" },
            { name: "durationDays", type: "uint256" },
            { name: "extraData", type: "bytes" },
          ],
        };

        const message = {
          publicKey: normalizedPublicKey,
          contractAddresses,
          contractsChainId: chainId,
          startTimestamp,
          durationDays: duration,
          extraData: "0x00",
        };

        signature = (await signer.signTypedData(
          domain,
          types,
          message
        )) as `0x${string}`;
      }

      console.log("✅ Signature created successfully");

      return {
        privateKey: normalizedPrivateKey,
        publicKey: normalizedPublicKey,
        signature: signature.startsWith("0x")
          ? signature
          : (`0x${signature}` as `0x${string}`),
        contractAddresses,
        userAddress,
        startTimestamp,
        durationDays: duration,
      };
    } catch (error) {
      console.error("❌ Failed to create signature", error);
      return null;
    }
  }

  private static isValid(signature: FhevmDecryptionSignatureType): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiry = signature.startTimestamp + signature.durationDays * 24 * 60 * 60;
    return now < expiry;
  }

  private static getStorageKey(userAddress: `0x${string}`, contractAddresses: `0x${string}`[]): string {
    return `fhevm_sig_${userAddress}_${contractAddresses.sort().join("_")}`;
  }
}

