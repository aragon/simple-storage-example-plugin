import {
  PluginRepo,
  SimpleStorageR1B1Setup,
  SimpleStorageR1B1Setup__factory,
  SimpleStorageR1B2Setup,
  SimpleStorageR1B2Setup__factory,
  SimpleStorageR1B3Setup,
  SimpleStorageR1B3Setup__factory,
} from '../../typechain';
import {getDeployedContracts, osxContracts} from '../../utils/helpers';
import {toHex} from '../../utils/ipfs-upload';
import {PluginRepoRegistry__factory} from '@aragon/osx-ethers';
import {PluginRepoRegistry} from '@aragon/osx-ethers';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {deployments, ethers} from 'hardhat';

let signers: SignerWithAddress[];
let repoRegistry: PluginRepoRegistry;
let simpleStoragePluginRepo: PluginRepo;

let setupR1B1: SimpleStorageR1B1Setup;
let setupR1B2: SimpleStorageR1B2Setup;
let setupR1B3: SimpleStorageR1B3Setup;

async function deployAll() {
  await deployments.fixture();
}

describe('SimpleStorage Deployment', function () {
  before(async () => {
    const hardhatForkNetwork = process.env.HARDHAT_FORK_NETWORK
      ? process.env.HARDHAT_FORK_NETWORK
      : 'mainnet';

    signers = await ethers.getSigners();

    // deployment should be empty
    expect(await deployments.all()).to.be.empty;

    // deploy framework
    await deployAll();

    // plugin repo registry
    repoRegistry = PluginRepoRegistry__factory.connect(
      osxContracts[hardhatForkNetwork]['PluginRepoRegistry'],
      signers[0]
    );

    // This assumes that the deployAll wrote the `PluginRepo` entry to the file.
    simpleStoragePluginRepo = PluginRepo__factory.connect(
      getDeployedContracts()['hardhat']['PluginRepo'],
      signers[0]
    );

    setupR1B1 = SimpleStorageR1B1Setup__factory.connect(
      (await deployments.get('SimpleStorageR1B1Setup')).address,
      signers[0]
    );
    setupR1B2 = SimpleStorageR1B2Setup__factory.connect(
      (await deployments.get('SimpleStorageR1B2Setup')).address,
      signers[0]
    );
    setupR1B3 = SimpleStorageR1B3Setup__factory.connect(
      (await deployments.get('SimpleStorageR1B3Setup')).address,
      signers[0]
    );
  });
  it('creates the repo', async () => {
    expect(await repoRegistry.entries(simpleStoragePluginRepo.address)).to.be
      .true;
  });

  it('registerd the SimpleStorageSetupR1B1', async () => {
    const results = await simpleStoragePluginRepo['getVersion((uint8,uint16))'](
      {
        release: 1,
        build: 1,
      }
    );

    expect(results.pluginSetup).to.equal(setupR1B1.address);
    expect(results.buildMetadata).to.equal(
      toHex('ipfs://QmY919VZ9gkeF6L169qQo89ucsUB9ScTaJVbGn8vMGGHxr')
    );
  });

  it('registerd the SimpleStorageSetupR1B2', async () => {
    const results = await simpleStoragePluginRepo['getVersion((uint8,uint16))'](
      {
        release: 1,
        build: 2,
      }
    );

    expect(results.pluginSetup).to.equal(setupR1B2.address);
    expect(results.buildMetadata).to.equal(
      toHex('ipfs://QmTs3gKa8bFzQvVep62fEzTBahxuKxT9Qbo7JQm6NBWLmN')
    );
  });

  it('registerd the SimpleStorageSetupR1B3', async () => {
    const results = await simpleStoragePluginRepo['getVersion((uint8,uint16))'](
      {
        release: 1,
        build: 3,
      }
    );

    expect(results.pluginSetup).to.equal(setupR1B3.address);
    expect(results.buildMetadata).to.equal(
      toHex('ipfs://QmdMMZZ8t4JHK9mAeYwGnvr6zzefZrVhMoAoFWqt3Vqn6U')
    );
  });

  it('makes the deployer the repo maintainer', async () => {
    expect(
      await simpleStoragePluginRepo.isGranted(
        simpleStoragePluginRepo.address,
        signers[0].address,
        ethers.utils.id('ROOT_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await simpleStoragePluginRepo.isGranted(
        simpleStoragePluginRepo.address,
        signers[0].address,
        ethers.utils.id('UPGRADE_REPO_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await simpleStoragePluginRepo.isGranted(
        simpleStoragePluginRepo.address,
        signers[0].address,
        ethers.utils.id('MAINTAINER_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;
  });
});
