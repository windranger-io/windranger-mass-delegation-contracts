// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
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

// https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable
// https://docs.openzeppelin.com/contracts/4.x/api/security#Pausable
// https://docs.openzeppelin.com/contracts/4.x/api/utils#MerkleProof
contract MerkleDelegation is Ownable, Pausable {
    address public governanceToken;
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

    constructor(address _governanceToken) Ownable() Pausable() {
        require(
            _governanceToken != address(0),
            "DR: token addr must be non-zero"
        );
        governanceToken = _governanceToken;
    }

    //TODO: also the owner/admin can update the governance token address that is hashed with all leafs.
    // function updateGovernanceToken(address newGovernanceToken) { governanceToken = newGovernancetoken; }

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
        require(delegator != address(0), "DR: delegator must be non-zero");
        require(msg.sender == delegator, "DR: delegator must be msg.sender");
        // Remove delegator record to save storage gas.
        delete delegation[delegator];
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unpause() external onlyOwner whenPaused {
        _unpause();
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

    function transferOwnership(address newOwner)
        public
        virtual
        override
        onlyOwner
        whenNotPaused
    {
        _transferOwnership(newOwner);
    }
}
