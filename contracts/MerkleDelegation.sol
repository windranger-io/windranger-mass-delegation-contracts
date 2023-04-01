// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

struct DelegatorRecord {
    bytes32 trieRoot;
    uint256 blockNumber;
}

// https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable
// https://docs.openzeppelin.com/contracts/4.x/api/security#Pausable
// https://docs.openzeppelin.com/contracts/4.x/api/utils#MerkleProof
contract MerkleDelegation is Ownable, Pausable {
    address public immutable governanceToken;
    mapping(address => DelegatorRecord) public delegation;
    mapping(address => address) public delegateToDelegator;
    bytes32 public constant EMPTY_MERKLE_TRIE_ROOT =
        bytes32(
            0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
        );

    event SetDelegates(
        address indexed delegator,
        bytes32 indexed trieRoot,
        uint256 blockNumber
    );

    constructor(address _governanceToken) Ownable() Pausable() {
        require(_governanceToken != address(0), "token addr must be non-zero");
        governanceToken = _governanceToken;
    }

    function setDelegateTrie(address delegator, bytes32 trieRoot)
        external
        whenNotPaused
    {
        require(delegator == msg.sender, "delegator must be msg.sender");
        require(trieRoot != bytes32(0), "trieRoot must be non-zero");
        _setDelegateTrie(delegator, trieRoot);
    }

    function clearDelegateTrie(address delegator) external whenNotPaused {
        require(delegator == msg.sender, "delegator must be msg.sender");
        _setDelegateTrie(delegator, EMPTY_MERKLE_TRIE_ROOT);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unpause() external onlyOwner whenPaused {
        _unpause();
    }

    function getDelegate(address delegator)
        external
        view
        returns (
            address delegatorAddress,
            bytes32 trieRoot,
            uint256 blockNumber
        )
    {
        require(delegator != address(0), "delegator must be non-zero");
        return (
            delegator,
            delegation[delegator].trieRoot,
            delegation[delegator].blockNumber
        );
    }

    function getDelegateBlockNumber(address delegator)
        external
        view
        returns (uint256 blockNumber)
    {
        require(delegator != address(0), "delegator must be non-zero");
        return delegation[delegator].blockNumber;
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

    function _setDelegateTrie(address delegator, bytes32 trieRoot)
        internal
        whenNotPaused
    {
        delegation[delegator].trieRoot = trieRoot;
        delegation[delegator].blockNumber = block.number;
        emit SetDelegates(delegator, trieRoot, block.number);
    }
}
