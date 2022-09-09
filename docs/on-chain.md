# On Chain


## MerkleDelegation Smart Contract

### Objects

#### DelegatorRecord Types

``` solidity
struct DelegatorRecord {
    bytes32 treeRoot,
    uint256 blockNumber,
}
```

The `DelegatorRecord` will be used to represent the information neeed for one checkpoint of the delegator.

#### Delegate Trie

The Merkle tree we utilize have rectors in the leaf to check the following information: 

``` solidity
struct LeafRecord {
    address delegatee,
    uint256 weight,
    address governanceToken
}
```

#### Delegation Mapping

``` solidity
mapping(address => DelegatorRecord[]) public delegation;
```

The `delegation` mapping will be used to store the checkpoint history for each delegator. The checkpoint allow anyone to verify what is the last checkpoint before an specific block number (snapshot).

### Functions and Events

#### setDelegateTrie

```solidity
function setDelegateTrie(address delegator, bytes32 treeRoot) external
```

##### Requirements:
- `treeRoot` cannot be the zero address 
- can only be called by the delegator address

it emits the `SetDelegates` event
``` solidity
event SetDelegates(
        address indexed delegator,
        bytes32 indexed trieRoot,
        uint256 blockNumber
    );
```

To clear the delegatee list the delegator can call `setDelegateTrie()` with a single leaf (100% self-delegation).

##### Requirements:
- `delegator` cannot be the zero address 

#### verifyDelegatedWeight


```solidity
    function verifyDelegatedWeight(
        address delegator,
        address voter,
        uint256 weight,
        uint256 blockNumber,
        bytes32[] calldata proof
    ) external view returns (bool)
```

Computes and returns the voting power `msg.sender` has.

##### Requirements:
- `delegator` cannot be the zero address 
- `voter` cannot be the zero address
- `weight` is integer representing the proportional delegated power
- `blockNumber` is the block number that we are verifying (time context)
- `proof` is a list of hashes that prove that the tree the last checkpoint before
    blockNumber has a tree that validates the data.

returns a `bool` representing the verification of the data.


### Access Control

#### Admin

Owner of the contract.

#### Upgrader

To be defined, if we need an Upgrader or not.


