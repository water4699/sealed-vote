import type { FhevmInstance, FhevmInstanceConfig } from "../fhevmTypes";

export interface FhevmRelayerSDKType {
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: `0x${string}`;
    kmsContractAddress: `0x${string}`;
    inputVerifierContractAddress: `0x${string}`;
    chainId: number;
  };
  __initialized__?: boolean;
}

export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDKType;
}

export interface FhevmInitSDKOptions {
  // Add options if needed
}

export type FhevmLoadSDKType = () => Promise<void>;
export type FhevmInitSDKType = (
  options?: FhevmInitSDKOptions
) => Promise<boolean>;

