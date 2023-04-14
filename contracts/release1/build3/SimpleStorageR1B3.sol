// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.8;

import {IDAO, PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";

/// @title SimpleStorage Release 1, Build 3
contract SimpleStorageR1B3 is PluginUUPSUpgradeable {
    bytes32 public constant STORE_NUMBER_PERMISSION_ID = keccak256("STORE_NUMBER_PERMISSION"); // changed in build 3
    bytes32 public constant STORE_ACCOUNT_PERMISSION_ID = keccak256("STORE_ACCOUNT_PERMISSION"); // added in build 3

    uint256 public number; // added in build 1
    address public account; // added in build 2

    // added in build 3

    /// @notice Emitted when a number is stored.
    /// @param number The number that was stored.
    event NumberStored(uint256 number);

    /// @notice Emitted when an account is stored.
    /// @param account The account that was stored.
    event AccountStored(address account);

    /// @notice Thrown if a value was already stored.
    error AlreadyStored();

    /// @notice Initializes the plugin when build 3 is installed.
    /// @param _number The number to be stored.
    /// @param _account The account to be stored.
    function initializeBuild3(
        IDAO _dao,
        uint256 _number,
        address _account
    ) external reinitializer(3) {
        __PluginUUPSUpgradeable_init(_dao);
        number = _number;
        account = _account;

        emit NumberStored({number: _number});
        emit AccountStored({account: _account});
    }

    /// @notice Initializes the plugin when the update from build 2 to build 3 is applied.
    /// @dev The initialization of `SimpleStorageR1B2` has already happened.
    function initializeFromBuild2() external reinitializer(3) {
        emit NumberStored({number: number});
        emit AccountStored({account: account});
    }

    /// @notice Initializes the plugin when the update from build 1 to build 3 is applied.
    /// @dev The initialization of `SimpleStorageR1B1` has already happened.
    /// @param _account The account to be stored.
    function initializeFromBuild1(address _account) external reinitializer(3) {
        account = _account;

        emit NumberStored({number: number});
        emit AccountStored({account: _account});
    }

    /// @notice Stores a new number to storage. Caller needs STORE_NUMBER_PERMISSION.
    /// @param _number The number to be stored.
    function storeNumber(uint256 _number) external auth(STORE_NUMBER_PERMISSION_ID) {
        if (_number == number) revert AlreadyStored();

        number = _number;

        emit NumberStored({number: _number});
    }

    /// @notice Stores a new account to storage. Caller needs STORE_ACCOUNT_PERMISSION.
    /// @param _account The account to be stored.
    function storeAccount(address _account) external auth(STORE_ACCOUNT_PERMISSION_ID) {
        if (_account == account) revert AlreadyStored();

        account = _account;

        emit AccountStored({account: _account});
    }
}
