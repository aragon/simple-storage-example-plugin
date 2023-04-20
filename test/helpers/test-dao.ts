import {DAO, DAO__factory} from '../../typechain';
import {deployWithProxy} from '../../utils/helpers';
import {ADDRESS_ZERO, EMPTY_DATA} from '../unit-testing/simple-storage-common';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

export async function deployTestDao(signer: SignerWithAddress): Promise<DAO> {
  const DAO = new DAO__factory(signer);
  const dao = await deployWithProxy<DAO>(DAO);

  const daoExampleURI = 'https://example.com';

  await dao.initialize(EMPTY_DATA, signer.address, ADDRESS_ZERO, daoExampleURI);

  return dao;
}
