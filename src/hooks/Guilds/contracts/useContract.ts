import { Contract, providers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { useMemo } from 'react';
import { getContract } from '../../../utils/contracts';
import ERC20Guild_ABI from '../../../contracts/ERC20Guild.json';
import { ERC20Guild } from '../../../types/ERC20Guild';
// const { Contract } = contract;

export default function useContract<T extends Contract>(
  contractId: string,
  abi: any,
  web3Context?: string
): T | null {
  const { library } = useWeb3React(web3Context);
  return useMemo(() => {
    if (!library) return null;
    try {
      const provider = new providers.Web3Provider(library.currentProvider);
      const contract = getContract(contractId, abi, provider);
      return contract;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [contractId, abi, web3Context, library]) as unknown as T;
}

export function useERC20Guild(contractId: string, web3Context?: string) {
  return useContract<ERC20Guild>(contractId, ERC20Guild_ABI.abi, web3Context);
}