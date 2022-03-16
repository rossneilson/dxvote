import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import {
  DEFAULT_ETH_CHAIN_ID,
  getChains,
  getNetworkConnector,
} from 'provider/connectors';
import { useEagerConnect, useRpcUrls } from 'provider/providerHooks';
import { useContext } from 'contexts';
import { useInterval, usePrevious } from 'utils';
// import { InjectedConnector } from '@web3-react/injected-connector';
// import { NetworkConnector } from '@web3-react/network-connector';
// import useSWR from 'swr';

const BLOKCHAIN_FETCH_INTERVAL = 10000;

const Web3ReactManager = ({ children }) => {
  const { context } = useContext();
  const { providerStore, blockchainStore } = context;

  const location = useLocation();
  // const history = useHistory();
  const rpcUrls = useRpcUrls();

  // Overriding default fetch to check for RPC url and setting correct headers if matched
  const originalFetch = window.fetch;
  window.fetch = (url, opts): Promise<Response> => {
    if (rpcUrls && Object.values(rpcUrls).includes(url.toString()) && opts) {
      opts.headers = opts.headers || {
        'Content-Type': 'application/json',
      };
    }
    return originalFetch(url, opts);
  };

  const web3Context = useWeb3React();
  const {
    active: networkActive,
    error: networkError,
    chainId,
    account,
    // connector,
    activate,
  } = web3Context;

  console.debug('[Web3ReactManager] Start of render', {
    web3Context,
  });

  // const fetcher = () => location.pathname.split('/')[1];

  // const { data, error } = useSWR(fetcher);

  // Make sure providerStore is synchronized with web3-react
  useEffect(() => {
    providerStore.setWeb3Context(web3Context);
  }, [web3Context]);

  // try to eagerly connect to a provider if possible
  const { triedEager, tryConnecting } = useEagerConnect();

  // If eager-connect failed, try to connect to network in the URL
  // If no chain in the URL, fallback to default chain
  useEffect(() => {
    if (triedEager && !networkActive && rpcUrls) {
      const chains = getChains(rpcUrls);
      const urlNetworkName = location.pathname.split('/')[1];
      const chainId =
        chains.find(chain => chain.name == urlNetworkName)?.id ||
        DEFAULT_ETH_CHAIN_ID;
      const networkConnector = getNetworkConnector(rpcUrls, chainId);

      activate(networkConnector, undefined, true).catch(e => {
        console.error(
          '[Web3ReactManager] Unable to activate network connector.',
          e
        );
      });
    }
  }, [triedEager, networkActive, activate, rpcUrls, location]);

  const prevChainId = usePrevious(chainId);
  console.log({ chainId });
  const prevAccount = usePrevious(account);
  useEffect(() => {
    // Listen to chain / account changes and reset the app
    if (prevChainId !== chainId || prevAccount !== account) {
      try {
        providerStore.setWeb3Context(web3Context);
        context.reset();
        if (location.pathname !== '/cache') {
          blockchainStore.fetchData(web3Context, true);
        }
      } catch (e) {
        // Fallback if something goes wrong
        window.location.reload();
      }
    }
  }, [chainId, prevChainId, account, prevAccount]);

  // Setup listener to handle injected wallet events
  // useEffect(() => {
  //   if (!window.ethereum) return () => {};

  //   const handleChainChange = (chainId: string) => {
  //     const chains = getChains();
  //     const chain = chains.find(
  //       chain => `0x${chain.id.toString(16)}` == chainId
  //     );

  //     // If currently connected to an injected wallet, keep synced with it
  //     if (connector instanceof InjectedConnector) {
  //       history.push(`/${chain.name}/proposals`);
  //     } else if (connector instanceof NetworkConnector) {
  //       const urlNetworkName = location.pathname.split('/')[1];
  //       if (urlNetworkName == chain.name) {
  //         tryConnecting();
  //       }
  //     }
  //   };

  //   window.ethereum.on('chainChanged', handleChainChange);

  //   return () => {
  //     window.ethereum?.removeListener('accountsChanged', handleChainChange);
  //   };
  // }, [location, connector]);

  const urlNetworkName = useMemo(
    () => location.pathname.split('/')[1],
    [location]
  );
  const prevUrlNetworkName = usePrevious(urlNetworkName);
  if (
    urlNetworkName &&
    prevUrlNetworkName &&
    urlNetworkName !== prevUrlNetworkName
  ) {
    tryConnecting();
  }

  // Fetch user blockchain data on an interval using current params
  useInterval(
    async () => {
      if (networkActive) {
        if (location.pathname !== '/cache') {
          blockchainStore.fetchData(providerStore.getActiveWeb3React(), false);
        }
      }
    },
    networkActive ? BLOKCHAIN_FETCH_INTERVAL : 10
  );

  // on page load, do nothing until we've tried to connect to the injected connector
  if (!triedEager) {
    console.debug('[Web3ReactManager] Render: Eager load not tried');
    return null;
  }
  if (networkError) {
    console.debug(
      '[Web3ReactManager] Render: Network error, showing modal error.'
    );
    return null;
  } else {
    console.debug(
      '[Web3ReactManager] Render: Active network, render children',
      { networkActive }
    );
    return children;
  }
};

export default Web3ReactManager;
