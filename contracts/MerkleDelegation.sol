// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

struct DelegatorRecord {
    bytes32 trieRoot;
    uint256 blockNumber;
}

struct DelegateeRecord {
    address delegatee;
    uint256 percentage; // 10,000 is 100%, 1,000 is 1%.
}

contract MerkleDelegation {
    address public oracle; //TODO: use AccessControl
    address public owner;
    mapping(address => DelegatorRecord) public delegation;
    mapping(address => address) public delegateToDelegator;

    event OwnerInitialized(address owner);
    event OwnerChanged(address newOwner);
    event SetDelegates(address indexed delegator, bytes32 indexed trieRoot);
    event ClearDelegate(address indexed delegator, bytes32 trieRoot);

    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    modifier onlyOracle() {
        require(oracle == msg.sender, "Access: caller is not the oracle");
        _;
    }

    constructor(address _oracle) {
        require(_oracle != address(0), "DR: oracle must be non-zero");
        owner = msg.sender;
        oracle = _oracle;
        emit OwnerInitialized(owner);
    }

    function changeOwner(address newOwner) external virtual onlyOwner {
        require(newOwner != address(0), "DR: newOwner must be non-zero");
        owner = newOwner;
        emit OwnerChanged(owner);
    }

    function setDelegateTrie(address delegator, bytes32 trieRoot) external {
        require(msg.sender == delegator, "DR: delegator must be msg.sender");
        // This memory record will be copied to storage.
        DelegatorRecord memory info;
        info.trieRoot = trieRoot;
        info.blockNumber = block.number;
        // Record to storage.
        delegation[delegator] = info;
    }

    function clearDelegateTrie(address delegator) external {
        require(msg.sender == delegator, "DR: delegator must be msg.sender");
        // Remove delegator record to save storage gas.
        delete delegation[delegator];
    }
}
