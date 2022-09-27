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
    using MerkleProof for bytes32[];

    address public governanceToken;
    mapping(address => DelegatorRecord[]) public delegation;

    event OwnerInitialized(address indexed owner);
    event SetDelegates(
        address indexed delegator,
        bytes32 indexed trieRoot,
        uint256 blockNumber
    );
    event ClearDelegate(address indexed delegator, bytes32 trieRoot);

    constructor(address _governanceToken) Ownable() Pausable() {
        require(
            _governanceToken != address(0),
            "MD: gov token must be non-zero"
        );
        governanceToken = _governanceToken;
        emit OwnerInitialized(_msgSender());
    }

    function setDelegateTrie(address delegator, bytes32 trieRoot)
        external
        whenNotPaused
    {
        require(trieRoot != bytes32(0), "MD: trieRoot must be non-zero");
        require(_msgSender() == delegator, "MD: delegator must be msg.sender");
        DelegatorRecord memory newRecord = DelegatorRecord(bytes32(0), 0);
        newRecord.trieRoot = trieRoot;
        newRecord.blockNumber = block.number;
        // Record to storage.
        delegation[delegator].push(newRecord);
        emit SetDelegates(delegator, trieRoot, block.number);
    }

    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    function unpause() external onlyOwner whenPaused {
        _unpause();
    }

    function getLastDelegateRoot(address delegator)
        external
        view
        returns (bytes32 trieRoot)
    {
        require(
            delegation[delegator].length > 0,
            "MD: delegator has not delegated"
        );
        return delegation[delegator][delegation[delegator].length - 1].trieRoot;
    }

    function verifyDelegatedWeight(
        address delegator,
        address voter,
        uint256 weight,
        uint256 blockNumber,
        bytes32[] calldata proof
    ) external view returns (bool) {
        // between last merkle root and now we use the last merkle root.

        // search for the appropriate merkle root (the next root with smaller block number).
        // ie. if we have root for block numbers [10,55,123] then for block 60 we have to use the hash of block 55
        // and for number 131 we use hash of block 123, and for block 9 (or 10) where is hash (with smaller #block)
        // then it can be verified that delegated stake was zero, for this voter.

        uint256 checkpoint = getPrevCheckpoint(delegator, blockNumber);
        return
            proof.verify(
                delegation[delegator][checkpoint].trieRoot,
                keccak256(abi.encodePacked(voter, weight, governanceToken))
            );
    }

    function getDelegateRoot(address delegator, uint256 blockNumber)
        external
        view
        returns (bytes32 trieRoot)
    {
        require(
            delegation[delegator].length > 0,
            "MD: delegator has not delegated"
        );
        uint256 checkpoint = getPrevCheckpoint(delegator, blockNumber);
        return delegation[delegator][checkpoint].trieRoot;
    }

    function getLastDelegateBlockNumber(address delegator)
        external
        view
        returns (uint256 blockNumber)
    {
        require(
            delegation[delegator].length > 0,
            "MD: delegator has not delegated"
        );
        return
            delegation[delegator][delegation[delegator].length - 1].blockNumber;
    }

    function getDelegateBlockNumber(address delegator, uint256 blockNumber)
        external
        view
        returns (uint256 blockNum)
    {
        require(
            delegation[delegator].length > 0,
            "MD: delegator has not delegated"
        );
        require(blockNumber < block.number, "MD: only past can be verified");
        uint256 checkpoint = getPrevCheckpoint(delegator, blockNumber);
        return delegation[delegator][checkpoint].blockNumber;
    }

    function testHash(address voter, uint256 weight)
        external
        view
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(voter, weight, governanceToken));
    }

    function transferOwnership(address newOwner)
        public
        virtual
        override
        onlyOwner
        whenNotPaused // if keys are stole you can still pause it
                      // and then unpause+transfer (in 1 tx)
    {
        _transferOwnership(newOwner);
    }

    function getPrevCheckpoint(address delegator, uint256 blockNum)
        public
        view
        returns (uint256 index)
    {
        require(blockNum < block.number, "MD: only past can be verified");
        for (uint256 i = delegation[delegator].length; i > 0; i--) {
            if (delegation[delegator][i - 1].blockNumber < blockNum) {
                // Found prev checkpoint
                return i - 1;
            }
        }
        require(false, "MD: no suitable delegation found");
    }
}
