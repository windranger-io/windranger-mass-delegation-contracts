// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.6;

enum DelegationType {
    WEIGHTED,
    //FIXED, //TODO: check again and remove
    PROPORTIONAL
}

struct DelegateTrie {
    bytes32 trieRoot;
    DelegationType delegationType;
    uint256 blockNumber;
}

contract DelegationRegistry {

    address oracle; //TODO: use AccessControl
    address owner;
    mapping (address => DelegateTrie) public delegation;
    mapping (address => address) public delegateToDelegator;

    event SetDelegates(address indexed delegator, bytes32 indexed trieRoot, DelegationType indexed delegationType);
    event ClearDelegate(address indexed delegator, bytes32 trieRoot, DelegationType delegationType);

    constructor(address _oracle) { 
        owner = msg.sender;
        oracle = _oracle;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    modifier onlyOracle() {
        require(oracle == msg.sender, "AccessControl: caller is not the oracle");
        _;
    }

    function changeOwner(address newOwner) public virtual onlyOwner {
        owner = newOwner;
    }

    function setDelegateTrie(address delegator, bytes32 trieRoot, DelegationType delegationType) public {}
    
    function clearDelegateTrie(address delegator) public onlyOracle {}

}