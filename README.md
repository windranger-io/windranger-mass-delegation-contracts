# Mass Delegation 🎩👒

Providing a project with a template for the files, folder structure, dependencies, scripting, configuration (local & remote) and development standards used in a Windranger Soldity project with TypeScript tests.

## Problem/Hypothesis

DAOs and treasury admins experience challenges delegating voting rights to their employees/communities. The current lack of tooling means doing so is a highly manual process that is:

- Time consuming: Both initial delegation and ongoing maintenance (accounting for new/departing DAOm members/delegates)
- Costly: High gas costs make delegation expensive and impractical in most scenarios
- Prone to mistakes: highly manual process that typically requires the admin to manually track information through spreadsheets, etc

## Solution: Offchain Merkle Delegation Contract

Merkle roots smart contract for a negligible gas cost approach is an oracle-based one where delegations are collated into merkle trie nodes and the root is published on chain for every delegation cycle. In order to maintain trust for each update a changelog should be published along with instructions for individuals to be able to generate the merkle trie root from the data.

## Specification

- [On-chain](./blob/main/docs/on-chain.md)
- [Off-chain](./blob/main/docs/off-chain.md)

---

## Development Process

Development follows these processes outlined in [development process](docs/development_process.md)

---

## Install, build and run

Start by cloning the git repo locally.

#### Install

To retrieve the project dependencies and before any further tasks will run correctly.

```shell
npm ci
```

#### Husky Git Commit Hooks

To enable Husky commit hooks to trigger the lint-staged behaviour of formatting and linting the staged files prior
before committing, prepare your repo with `prepare`.

```shell
npm run prepare
```

#### Build and Test

```shell
npm run build
npm test
```

If you make changes that don't get picked up then add a clean into the process

```shell
npm run clean
npm run build
npm test
```

## Tools

Setup and run instructions:

- [Hardhat](./docs/tools/hardhat.md)
- [PlantUML](./docs/tools/plantuml.md); UML diagram generation from code.
- [Slither](./docs/tools/slither.md); Trail of Bits Solidity static analyzer.
