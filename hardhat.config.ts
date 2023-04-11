import './tasks/accounts';
import './tasks/deploy';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import {config as dotenvConfig} from 'dotenv';
import {ethers} from 'ethers';
import type {HardhatUserConfig} from 'hardhat/config';
import type {NetworkUserConfig} from 'hardhat/types';
import {resolve} from 'path';

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || './.env';
dotenvConfig({path: resolve(__dirname, dotenvConfigPath)});

if (!process.env.INFURA_API_KEY) {
  throw new Error('INFURA_API_KEY in .env not set');
}

const networks: {[index: string]: NetworkUserConfig} = {
  arbitrumMainnet: {
    chainId: 42161,
    url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
  arbitrumGoerli: {
    chainId: 42161,
    url: `https://arbitrum-goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
  hardhat: {
    chainId: 31337,
    forking: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
  },
  mainnet: {
    chainId: 1,
    url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
  goerli: {
    chainId: 5,
    url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
  polygon: {
    chainId: 137,
    url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
  polygonMumbai: {
    chainId: 80001,
    url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
};

// uses hardhats private key if none is set. DON'T USE THIS ACCOUNT FOR DEPLOYMENTS
const accounts = process.env.ETH_KEY
  ? process.env.ETH_KEY.split(',')
  : ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'];

for (const network in networks) {
  // special treatement for hardhat
  if (network === 'hardhat') {
    networks[network].accounts = accounts.map(account => ({
      privateKey: account,
      balance: ethers.utils.parseEther('1000').toString(),
    }));
    continue;
  }
  networks[network].accounts = accounts;
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
      arbitrumMainnet: process.env.ARBISCAN_API_KEY || '',
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      goerli: process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
    },
  },
  gasReporter: {
    currency: 'USD',
    enabled: process.env.REPORT_GAS ? true : false,
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
    outDir: 'types',
    target: 'ethers-v5',
  },
};

export default config;
