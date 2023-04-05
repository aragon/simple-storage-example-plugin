// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.8;

import { IDAO, PluginUUPSUpgradeable } from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";

/// @title SimpleStorage build 1
contract SimpleStorageR1B1 is PluginUUPSUpgradeable {
    bytes32 public constant STORE_PERMISSION_ID = keccak256("STORE_PERMISSION");

    uint256 public number; // added in build 1

    /// @notice Initializes the plugin when build 1 is installed.
    function initializeBuild1(IDAO _dao, uint256 _number) external initializer {
        __PluginUUPSUpgradeable_init(_dao);
        number = _number;
    }

    function storeNumber(uint256 _number) external auth(STORE_PERMISSION_ID) {
        number = _number;
    }
}
