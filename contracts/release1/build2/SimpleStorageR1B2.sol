// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.8;

import { IDAO, PluginUUPSUpgradeable } from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";

/// @title SimpleStorage build 2
contract SimpleStorageR1B2 is PluginUUPSUpgradeable {
    bytes32 public constant STORE_PERMISSION_ID = keccak256("STORE_PERMISSION");

    uint256 public number; // added in build 1
    address public account; // added in build 2

    /// @notice Initializes the plugin when build 2 is installed.
    function initializeBuild2(IDAO _dao, uint256 _number, address _account) external reinitializer(2) {
        __PluginUUPSUpgradeable_init(_dao);
        number = _number;
        account = _account;
    }

    /// @notice Initializes the plugin when the update from build 1 to build 2 is applied.
    /// @dev The initialization of `SimpleStorageR1B1` has already happened.
    function initializeFromBuild1(address _account) external reinitializer(2) {
        account = _account;
    }

    function storeNumber(uint256 _number) external auth(STORE_PERMISSION_ID) {
        number = _number;
    }

    function storeAccount(address _account) external auth(STORE_PERMISSION_ID) {
        account = _account;
    }
}
