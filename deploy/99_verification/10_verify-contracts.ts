import {verifyContract} from '../../utils/etherscan';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log('\nVerifying contracts');

  const {deployments} = hre;
  const deployedContracts = await deployments.all();

  for (const [k, v] of Object.entries(deployedContracts)) {
    console.log(k, v.address, v.args);

    console.log(
      `Verifying contract ${k} at address ${v.address} with constructor arguments "${v.args}".`
    );

    await verifyContract(v.address, v.args || []);
    // Etherscan Max rate limit is 1/5s,
    // use 6s just to be safe.
    console.log(
      `Delaying 6s, so we dont reach Etherscan's Max rate limit of 1/5s.`
    );
    await delay(6000);
  }
};

export default func;
func.tags = ['Verify'];
func.runAtTheEnd = true;
func.skip = (hre: HardhatRuntimeEnvironment) =>
  Promise.resolve(
    hre.network.name === 'localhost' ||
      hre.network.name === 'hardhat' ||
      hre.network.name === 'coverage'
  );
