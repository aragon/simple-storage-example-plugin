import {NetworkNameMapping} from './utils/helpers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
import {config as dotenvConfig} from 'dotenv';
import {BigNumber} from 'ethers';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import {extendEnvironment, HardhatUserConfig} from 'hardhat/config';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import type {NetworkUserConfig} from 'hardhat/types';
import {resolve} from 'path';
import 'solidity-coverage';

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || './.env';
dotenvConfig({path: resolve(__dirname, dotenvConfigPath)});

if (!process.env.INFURA_API_KEY) {
  throw new Error('INFURA_API_KEY in .env not set');
}

const apiUrls: NetworkNameMapping = {
  arbitrumOne: 'https://arbitrumOne.infura.io/v3/',
  arbitrumGoerli: 'https://arbitrumGoerli.infura.io/v3/',
  mainnet: 'https://mainnet.infura.io/v3/',
  goerli: 'https://goerli.infura.io/v3/',
  polygon: 'https://polygon.infura.io/v3/',
  polygonMumbai: 'https://polygonMumbai.infura.io/v3/',
};

const networks: {[index: string]: NetworkUserConfig} = {
  hardhat: {
    chainId: 31337,
    forking: {
      url: `${
        apiUrls[
          process.env.HARDHAT_FORK_NETWORK
            ? process.env.HARDHAT_FORK_NETWORK
            : 'mainnet'
        ]
      }${process.env.INFURA_API_KEY}`,
    },
  },
  arbitrumOne: {
    chainId: 42161,
    url: `${apiUrls.arbitrumOne}${process.env.INFURA_API_KEY}`,
  },
  arbitrumGoerli: {
    chainId: 421613,
    url: `${apiUrls.arbitrumGoerli}${process.env.INFURA_API_KEY}`,
  },
  mainnet: {
    chainId: 1,
    url: `${apiUrls.mainnet}${process.env.INFURA_API_KEY}`,
  },
  goerli: {
    chainId: 5,
    url: `${apiUrls.goerli}${process.env.INFURA_API_KEY}`,
  },
  polygon: {
    chainId: 137,
    url: `${apiUrls.polygon}${process.env.INFURA_API_KEY}`,
  },
  polygonMumbai: {
    chainId: 80001,
    url: `${apiUrls.polygonMumbai}${process.env.INFURA_API_KEY}`,
  },
};

// Uses hardhats private key if none is set. DON'T USE THIS ACCOUNT FOR DEPLOYMENTS
const accounts = process.env.PRIVATE_KEY
  ? process.env.PRIVATE_KEY.split(',')
  : ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'];

for (const network in networks) {
  // special treatement for hardhat
  if (network.startsWith('hardhat')) {
    networks[network].accounts = accounts.map(account => ({
      privateKey: account,
      balance: BigNumber.from(10).pow(20).toString(), // Set balance to 100 ETH
    }));
    continue;
  }
  networks[network].accounts = accounts;
}

// Extend HardhatRuntimeEnvironment
extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  hre.aragonToVerifyContracts = [];
});

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || '',
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      goerli: process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  gasReporter: {
    currency: 'USD',
    enabled: process.env.REPORT_GAS === 'true' ? true : false,
    excludeContracts: [],
    src: './contracts',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  networks,
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
    deploy: './deploy',
  },

  solidity: {
    version: '0.8.17',
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: 'none',
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};

export default config;
