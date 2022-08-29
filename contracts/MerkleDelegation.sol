// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

struct DelegateRecord {
    bytes32 trieRoot;
    uint256 blockNumber;
}

contract MerkleDelegation {
    address public oracle; //TODO: use AccessControl
    address public owner;
    mapping(address => DelegateRecord) public delegation;
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
        DelegateRecord memory info;
        info.trieRoot = trieRoot;
        info.blockNumber = block.number;
        delegation[delegator] = info;
    }

    function clearDelegateTrie(address delegator) external {
        require(msg.sender == delegator, "DR: delegator must be msg.sender");
        delete delegation[delegator];
    }
}
