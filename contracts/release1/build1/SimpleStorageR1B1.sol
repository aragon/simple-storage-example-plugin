// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.8;

import {IDAO, PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";

/// @title SimpleStorage Release 1, Build 1
contract SimpleStorageR1B1 is PluginUUPSUpgradeable {
    bytes32 public constant STORE_PERMISSION_ID = keccak256("STORE_PERMISSION");

    uint256 public number; // added in build 1

    /// @notice Initializes the plugin when build 1 is installed.
    /// @param _number The number to be stored.
    function initialize(IDAO _dao, uint256 _number) external initializer {
        __PluginUUPSUpgradeable_init(_dao);
        number = _number;
    }

    /// @notice Stores a new number to storage. Caller needs STORE_PERMISSION.
    /// @param _number The number to be stored.
    function storeNumber(uint256 _number) external auth(STORE_PERMISSION_ID) {
        number = _number;
    }
}
