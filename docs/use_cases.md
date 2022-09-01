# Use Cases

## Delegator Use Case (DEL)

**Delegator** wants to delegate to a long list of delegatees.
 
1. Navigates to *mass-delegation website*.
1. Provides list of *addresses* and *percentages*.
1. Presses Submit *button*.
1. Submits POST to our *API*.
1. *Backend* updates Off-chain Global Weight Trie (Mem).
1. *Backend* computed the new Merkle Root (Mem).
1. *Front-end* get the Root.
1. *Front-end* Delegator register the Root on-chain.
1. After previous on-chain transactions success, updates DB (Storage).

## On-chain Voting Use Case (ON)

**Delegatee/Voter** wants to use delegated balance to do on-chain voting via our own transaction.

1. Navigates to *Voting Website* (New or Existing UI).
1. Connect wallet to website.
1. Send GET request to our *API* to compute current voting power.
1. Navigates to *proposal* to be voted for.
1. Send GET to API to *compute voting power* prior to proposal creation block.
1. GET request for *Merkle Leaf Content* and *Merkle Proof*.
1. User clicks to *submit the vote*, included Context Info, Leaf Hash and Proof.
1. In the on-chain voting new transaction, the *voting power is validated* and the vote is casted (same tx).

## Off-chain Snapshot Voting Use Case (OFF)

Off-chain Snapshot integration is provided by our API. The **Voter/Delegatee** should be able to vote using Snapshot and our new Snapshot Strategy.

1. Snapshot will use our own *Voting Strategy* (that can be the default).
1. *API* has to give the exact to payload type.
1. *Payload* is a mapping of *addresses to voting weight* (example payload below).
1. Payload is specific to a point in time (ie. "snapshot" *block number*).

```json
[
  {
    "name": "Example query",
    "strategy": {
      "name": "api",
      "params": {
        "api": "https://gateway.pinata.cloud/ipfs",
        "symbol": "LIFE",
        "decimals": 0,
        "strategy": "QmQnW3TtpN8WS2YMXtWB1p7DFcVjetfZmMfJvXm5yAZ6QN"
      }
    },
    "network": "1",
    "addresses": [
      "0xeD2bcC3104Da5F5f8fA988D6e9fAFd74Ae62f319",
      "0x3c4B8C52Ed4c29eE402D9c91FfAe1Db2BAdd228D",
      "0xd649bACfF66f1C85618c5376ee4F38e43eE53b63",
      "0x726022a9fe1322fA9590FB244b8164936bB00489",
      "0xc6665eb39d2106fb1DBE54bf19190F82FD535c19",
      "0x6ef2376fa6e12dabb3a3ed0fb44e4ff29847af68"
    ],
    "snapshot": 11437846
  }
]
```
