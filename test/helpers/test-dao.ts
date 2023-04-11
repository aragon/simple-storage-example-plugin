import {Admin, Admin__factory, DAO, DAO__factory} from '../../types';
import {
  ADDRESS_ZERO,
  EMPTY_DATA,
} from '../simple-storage/simple-storage-common';
import {deployWithProxy} from './helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

export async function deployDao(
  signer: SignerWithAddress
): Promise<[DAO, Admin]> {
  const DAO = new DAO__factory(signer);
  const dao = await deployWithProxy<DAO>(DAO);

  const daoExampleURI = 'https://example.com';

  await dao.initialize(EMPTY_DATA, signer.address, ADDRESS_ZERO, daoExampleURI);

  const Admin = new Admin__factory(signer);
  const admin = await Admin.deploy();

  await dao.grant(
    dao.address,
    admin.address,
    ethers.utils.id('EXECUTE_PERMISSION')
  );
  await dao.grant(
    dao.address,
    admin.address,
    ethers.utils.id('UPGRADE_PERMISSION')
  );

  return [dao, admin];
}
