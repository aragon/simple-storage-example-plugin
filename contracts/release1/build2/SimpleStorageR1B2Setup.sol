// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

import {PermissionLib} from "@aragon/osx/core/permission/PermissionLib.sol";
import {PluginSetup, IPluginSetup} from "@aragon/osx/framework/plugin/setup/PluginSetup.sol";
import {SimpleStorageR1B2} from "./SimpleStorageR1B2.sol";

/// @title SimpleStorageSetup build 2
contract SimpleStorageR1B2Setup is PluginSetup {
    address private immutable simpleStorageImplementation;

    constructor() {
        simpleStorageImplementation = address(new SimpleStorageR1B2());
    }

    /// @inheritdoc IPluginSetup
    function prepareInstallation(
        address _dao,
        bytes memory _data
    ) external returns (address plugin, PreparedSetupData memory preparedSetupData) {
        (uint256 _number, address _account) = abi.decode(_data, (uint256, address));

        plugin = createERC1967Proxy(
            simpleStorageImplementation,
            abi.encodeWithSelector(SimpleStorageR1B2.initialize.selector, _dao, _number, _account)
        );

        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](1);

        permissions[0] = PermissionLib.MultiTargetPermission({
            operation: PermissionLib.Operation.Grant,
            where: plugin,
            who: _dao,
            condition: PermissionLib.NO_CONDITION,
            permissionId: SimpleStorageR1B2(this.implementation()).STORE_PERMISSION_ID()
        });

        preparedSetupData.permissions = permissions;
    }

    /// @inheritdoc IPluginSetup
    function prepareUpdate(
        address _dao,
        uint16 _currentBuild,
        SetupPayload calldata _payload
    )
        external
        pure
        override
        returns (bytes memory initData, PreparedSetupData memory preparedSetupData)
    {
        (_dao, preparedSetupData);

        initData = abi.encodeWithSelector(
            SimpleStorageR1B2.initializeFrom.selector,
            _currentBuild,
            _payload.data
        );
    }

    /// @inheritdoc IPluginSetup
    function prepareUninstallation(
        address _dao,
        SetupPayload calldata _payload
    ) external pure returns (PermissionLib.MultiTargetPermission[] memory permissions) {
        permissions = new PermissionLib.MultiTargetPermission[](1);

        permissions[0] = PermissionLib.MultiTargetPermission({
            operation: PermissionLib.Operation.Revoke,
            where: _payload.plugin,
            who: _dao,
            condition: PermissionLib.NO_CONDITION,
            permissionId: keccak256("STORE_PERMISSION")
        });
    }

    /// @inheritdoc IPluginSetup
    function implementation() external view returns (address) {
        return simpleStorageImplementation;
    }
}
