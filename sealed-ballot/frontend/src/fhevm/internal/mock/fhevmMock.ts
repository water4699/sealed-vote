//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAYS USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  const mockInstance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: parameters.metadata.ACLAddress,
    chainId: parameters.chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption:
      "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification:
      "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });
  
  // Adapt MockFhevmInstance to FhevmInstance interface
  const adaptedInstance: FhevmInstance = {
    createEncryptedInput: mockInstance.createEncryptedInput.bind(mockInstance),
    getPublicKey: () => {
      const pk = mockInstance.getPublicKey();
      return pk ? pk.publicKey.toString() : "";
    },
    getPublicParams: (_length?: number) => {
      // Mock implementation - return empty string
      return "";
    },
    userDecrypt: async (items, privateKey, publicKey, signature, contractAddresses, userAddress, startTimestamp, durationDays) => {
      // Convert items format for mock
      const handles = items.map(item => ({
        handle: item.handle.toString(),
        contractAddress: item.contractAddress,
      }));
      
      const result = await mockInstance.userDecrypt(
        handles,
        privateKey,
        publicKey,
        signature,
        contractAddresses,
        userAddress,
        startTimestamp,
        durationDays
      );
      
      // Convert DecryptedResults to Record<string, bigint>
      const converted: Record<string, bigint> = {};
      for (const key in result) {
        const value = result[key];
        if (typeof value === 'bigint') {
          converted[key] = value;
        } else if (typeof value === 'number') {
          converted[key] = BigInt(value);
        } else if (typeof value === 'string') {
          converted[key] = BigInt(value);
        } else if (typeof value === 'boolean') {
          converted[key] = value ? BigInt(1) : BigInt(0);
        }
      }
      return converted;
    },
  };
  
  return adaptedInstance;
};

