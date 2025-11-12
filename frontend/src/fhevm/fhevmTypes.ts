// FHEVM Type definitions

export interface FhevmInstance {
  createEncryptedInput(
    contractAddress: `0x${string}`,
    userAddress: `0x${string}`
  ): EncryptedInputBuilder;
  getPublicKey(): string;
  getPublicParams(length?: number): string;
  generateKeypair?(): { publicKey: string; privateKey: string };
  createEIP712?(
    publicKey: string,
    contractAddresses: `0x${string}`[],
    startTimestamp: string,
    durationDays: string
  ): {
    domain: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    message: Record<string, unknown>;
    primaryType?: string;
  };
  userDecrypt(
    items: Array<{ handle: bigint; contractAddress: `0x${string}` }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: `0x${string}`[],
    userAddress: `0x${string}`,
    startTimestamp: number | string,
    durationDays: number | string
  ): Promise<Record<string, bigint>>;
}

export interface EncryptedInputBuilder {
  add8(value: number): EncryptedInputBuilder;
  add16(value: number): EncryptedInputBuilder;
  add32(value: number): EncryptedInputBuilder;
  add64(value: bigint): EncryptedInputBuilder;
  addBool(value: boolean): EncryptedInputBuilder;
  addAddress(value: `0x${string}`): EncryptedInputBuilder;
  encrypt(): Promise<{
    handles: Uint8Array[];
    inputProof: Uint8Array;
  }>;
}

export interface FhevmInstanceConfig {
  aclContractAddress: `0x${string}`;
  kmsContractAddress: `0x${string}`;
  inputVerifierContractAddress: `0x${string}`;
  chainId: number;
  network: string | import("ethers").Eip1193Provider;
  publicKey?: string;
  publicParams?: string;
}

