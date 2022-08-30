// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

struct DelegatorRecord {
    bytes32 trieRoot;
    uint256 blockNumber;
}

struct DelegateeRecord {
    address delegatee;
    uint256 percentage; // 100,000 is 100%, 1,000 is 1%.
}

contract MerkleDelegation is Pausable {
    address public oracle; //TODO: use AccessControl
    address public owner;
    mapping(address => DelegatorRecord) public delegation;
    mapping(address => address) public delegateToDelegator;

    event OwnerInitialized(address owner);
    event OwnerChanged(address newOwner);
    event SetDelegates(
        address indexed delegator,
        bytes32 indexed trieRoot,
        uint256 blockNumber
    );
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

    function changeOwner(address newOwner)
        external
        virtual
        onlyOwner
        whenNotPaused
    {
        require(newOwner != address(0), "DR: newOwner must be non-zero");
        owner = newOwner;
        emit OwnerChanged(owner);
    }

    function setDelegateTrie(address delegator, bytes32 trieRoot)
        external
        whenNotPaused
    {
        require(delegator != address(0), "DR: delegator must be non-zero");
        require(trieRoot != bytes32(0), "DR: trieRoot must be non-zero");
        require(msg.sender == delegator, "DR: delegator must be msg.sender");
        // Record to storage.
        delegation[delegator].trieRoot = trieRoot;
        delegation[delegator].blockNumber = block.number;
        emit SetDelegates(delegator, trieRoot, block.number);
    }

    function clearDelegateTrie(address delegator) external whenNotPaused {
        require(msg.sender == delegator, "DR: delegator must be msg.sender");
        // Remove delegator record to save storage gas.
        delete delegation[delegator];
    }

    function getDelegateRoot(address delegator)
        external
        view
        returns (bytes32 trieRoot)
    {
        require(delegator != address(0), "DR: delegator must be non-zero");
        return delegation[delegator].trieRoot;
    }

    function getDelegateBlockNumber(address delegator)
        external
        view
        returns (uint256 blockNumber)
    {
        require(delegator != address(0), "DR: delegator must be non-zero");
        return (delegation[delegator].blockNumber);
    }

    function pause() public onlyOwner whenNotPaused {
        _pause();
    }

    function unpause() public onlyOwner whenPaused {
        _unpause();
    }
}
