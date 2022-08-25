# On Chain


## Registry Smart Contract

### Objects

#### Delegation Types
``` solidity
enum DelegationType {
    WEIGHTED,
    FIXED, (can be removed)
    PROPORTIONAL,
}
```

the `DelegationType` enum will be used to represent the type of delegation a particular trie represents.

#### Delegate Trie
``` solidity
struct DelegateTrie {
    bytes32 trieRoot
    DelegationType delegationType
    uint256 blockNumber
    
}
```

### Mappings

The `DelegationTrie` struct will be used to store delegation trie roots as well as their associated delegation type.

#### Delegation Mapping
``` solidity
mapping (address => DelegateTrie) public delegation;
```

The `delegation` mapping will be used to store references from the delegator address to their `DelegateTrie`'s

The first key will be the delegator address and the value will be a `DelegateTrie` object.

#### delegateToDelegator

``` solidity
mapping (address => address) public delegateToDelegator
```

The `delegateToDelegator` mapping will be used to store a reference mapping delegate addresses to their Delegator


The first key will be the address of the `Delegate` and the value the associated `DelegateTrie` object

Note that with the graph indexing this contract, this is not nessessary, we would be able to build out the inverse relation through events emitted.

### Functions and Events

#### setDelegateTrie

```solidity
function setDelegateTrie(address delegator, bytes32 trieRoot, DelegationType delegationType) public
```


##### Requirements:
- `trieRoot` cannot be the zero address 
- can only be called by an address with the `oracle` role

it emits the `SetDelegate` event
``` solidity
event SetDelegates(address indexed delegator, bytes32 indexed trieRoot, DelegationType indexed delegationType) public onlyOracle;
```

#### clearDelegateTrie
```solidity
function clearDelegateTrie(address delegator) public onlyOracle;
```

sets the `DelegateTrie` at `delegateToDelegateTrie[delegator]` to a null object.

It emits the `ClearDelegate` event.
``` solidity
event ClearDelegate(address indexed delegator, bytes32 trieRoot, DelegationType delegationType);
```

##### Requirements:
- `delegator` cannot be the zero address 
- can only be called by an address with the `oracle` role


#### proveAndComputeVotingPower


```solidity
function proveAndComputeVotingPower(DelegationType delegationType, uint index, uint amountOrWeight, bytes32[] proof, address delegator) public returns (uint)
```

Computes and returns the voting power `msg.sender` has.

##### Requirements:
- `delegator` cannot be the zero address 

returns a `uint` representing the `msg.sender`'s voting power, returns `0` if the proof is invalid



### Access Control

#### Oracle

#### Super Admin

#### Upgrader


