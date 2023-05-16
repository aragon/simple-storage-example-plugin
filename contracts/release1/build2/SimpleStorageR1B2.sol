// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.8;

import {IDAO, PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";

/// @title SimpleStorage Release 1, Build 2
contract SimpleStorageR1B2 is PluginUUPSUpgradeable {
    bytes32 public constant STORE_PERMISSION_ID = keccak256("STORE_PERMISSION");

    uint256 public number; // added in build 1
    address public account; // added in build 2

    /// @notice Initializes the plugin when build 2 is installed.
    /// @param _number The number to be stored.
    /// @param _account The account to be stored.
    function initialize(IDAO _dao, uint256 _number, address _account) external reinitializer(2) {
        __PluginUUPSUpgradeable_init(_dao);
        number = _number;
        account = _account;
    }

    /// @notice Initializes the plugin when updating from a previous build.
    /// @param _build The number of the build that the update transitioned from.
    /// @param _data The bytes-encoded initialization data.
    function initializeFrom(uint16 _build, bytes calldata _data) external reinitializer(2) {
        if (_build == 1) {
            account = abi.decode(_data, (address));
        }
    }

    /// @notice Stores a new number to storage. Caller needs STORE_PERMISSION.
    /// @param _number The number to be stored.
    function storeNumber(uint256 _number) external auth(STORE_PERMISSION_ID) {
        number = _number;
    }

    /// @notice Stores a new account to storage. Caller needs STORE_PERMISSION.
    /// @param _account The account to be stored.
    function storeAccount(address _account) external auth(STORE_PERMISSION_ID) {
        account = _account;
    }
}
