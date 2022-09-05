// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import {MerkleTree} from 'merkletreejs'

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {MerkleDelegation} from '../typechain-types'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {eventOf} from './framework/event-wrapper'
// import {expectEmittersAndEvents, expectEvents} from './framework/event-filters'
import {utils, BigNumber, constants} from 'ethers'

/* eslint-disable no-duplicate-imports */
import {waffle, web3} from 'hardhat'

// Wires up Waffle with Chai
chai.use(solidity)
const provider = waffle.provider
/*
 * const HashZero = constants.HashZero
 * const soliditySha3 = web3.utils.soliditySha3
 */

export function advanceBlock() {
    return provider.send('evm_mine', [])
}

function soliditySha3(strParam: string) {
    return web3.utils.soliditySha3(strParam)
}

/*
 * The below comments are only for explaining the test layout.
 *
 * Actual tests do not need them, instead should practice code as documentation.
 */

// Start with the contract name as the top level descriptor
describe('MerkleDelegation', () => {
    /*
     * Once and before any test, get a handle on the signer and observer
     * (only put variables in before, when their state is not affected by any test)
     */
    before(async () => {
        admin = await signer(0)
        delegator = await signer(1)
        delegator2 = await signer(2)
        // gov token should be a contract by an EOA will be the same in this context
        govToken = await signer(3)
        voter = await signer(4)
        voter0 = await signer(5)
        voter1 = await signer(6)
        voter2 = await signer(7)
        voter3 = await signer(8)
    })

    // Before each test, deploy a fresh box (clean starting state)
    beforeEach(async () => {
        md = await deployContract<MerkleDelegation>(
            'MerkleDelegation',
            govToken.address
        )
        // const weight = BigNumber.from(10000)
        const hash0 = soliditySha3(voter0.address) // utils.soliditySha256(['string', 'uint256', 'string'], [voter0.address, weight, govToken.address])
        const hash1 = soliditySha3(voter1.address) // utils.soliditySha256(['string', 'uint256', 'string'], [voter1.address, weight, govToken.address])
        const hash2 = soliditySha3(voter2.address) // utils.soliditySha256(['string', 'uint256', 'string'], [voter2.address, weight, govToken.address])
        const hash3 = soliditySha3(voter3.address) // utils.soliditySha256(['string', 'uint256', 'string'], [voter3.address, weight, govToken.address])
        const leaves = [hash0, hash1, hash2, hash3]
        const merkleTree = new MerkleTree(leaves, soliditySha3, {
            sortPairs: true
        })
        root = merkleTree.getHexRoot()
        const leaf = hash0! // soliditySha3(voter0.address)!
        proof = merkleTree.getHexProof(leaf)
    })

    // Inner describes use the name or idea for the function they're unit testing
    describe('transferOwnership', () => {
        /*
         * Describe 'it', what unit of logic is being tested
         * Keep in mind the full composition of the name: Contract > function > single test
         */
        it('same owner', async () => {
            const newOwner = admin.address
            const previousOwner = admin.address

            const receipt = await successfulTransaction(
                md.transferOwnership(admin.address)
            )

            eventOf(md, 'OwnershipTransferred').expectOne(receipt, {
                previousOwner,
                newOwner
            })

            expect(await md.owner()).equals(admin.address)
        })

        // Modifier checks contain the flattened and spaced modifier name
        it('only owner', async () => {
            await expect(
                md.connect(delegator).transferOwnership(delegator.address)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('setDelegateTrie', () => {
        it('reverts if delegator is zero address', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            await expect(
                md
                    .connect(delegator2)
                    .setDelegateTrie(constants.AddressZero, trieRoot)
            ).to.be.revertedWith('DR: delegator must be non-zero')
        })

        it('reverts if trie root has all zero bytes', async () => {
            const trieRoot = constants.HashZero
            await expect(
                md
                    .connect(delegator2)
                    .setDelegateTrie(delegator2.address, trieRoot)
            ).to.be.revertedWith('DR: trieRoot must be non-zero')
        })

        it('reverts if delegator not sender', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            await expect(
                md
                    .connect(delegator2)
                    .setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('DR: delegator must be msg.sender')
        })

        it('works if delegator is sender', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])

            const receipt = await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            const blockNumber = BigNumber.from(await provider.getBlockNumber())

            eventOf(md, 'SetDelegates').expectOne(receipt, {
                delegator: delegator.address,
                trieRoot,
                blockNumber
            })

            expect(await md.owner()).equals(admin.address)
        })

        it('delegator update', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            const blockNumber = BigNumber.from(await provider.getBlockNumber())
            expect(await md.getLastDelegateRoot(delegator.address)).equals(
                trieRoot
            )
            expect(
                await md.getLastDelegateBlockNumber(delegator.address)
            ).equals(blockNumber)
        })
    })

    describe('pause', () => {
        it('can pause setDelegateTrie', async () => {
            await successfulTransaction(md.connect(admin).pause())
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            // const blockNumber = BigNumber.from(await provider.getBlockNumber())
            await expect(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('Pausable: paused')
        })

        it('can pause pause function', async () => {
            await successfulTransaction(md.connect(admin).pause())
            await expect(md.connect(admin).pause()).to.be.revertedWith(
                'Pausable: paused'
            )
        })
        it('cannot pause unpause function', async () => {
            await successfulTransaction(md.connect(admin).pause())
            await successfulTransaction(md.connect(admin).unpause())
        })
    })

    describe('unpause', () => {
        it('can unpause setDelegateTrie', async () => {
            await successfulTransaction(md.connect(admin).pause())
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            // const blockNumber = BigNumber.from(await provider.getBlockNumber())
            await expect(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('Pausable: paused')
            await successfulTransaction(md.connect(admin).unpause())
            await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
        })

        it('can unpause pause function', async () => {
            await successfulTransaction(md.connect(admin).pause())
            await expect(md.connect(admin).pause()).to.be.revertedWith(
                'Pausable: paused'
            )
            await successfulTransaction(md.connect(admin).unpause())
            await successfulTransaction(md.connect(admin).pause())
        })

        it('cannot unpause if not paused', async () => {
            await expect(md.connect(admin).unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })

        it('cannot unpause unpause function', async () => {
            await successfulTransaction(md.connect(admin).pause())
            await successfulTransaction(md.connect(admin).unpause())
            await expect(md.connect(admin).unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })
    })

    describe('verifyVotingPower', () => {
        it('reverts if is a future block number', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])

            await successfulTransaction(
                md.connect(delegator).setDelegateTrie(delegator.address, root)
            )
            const blockNumber = BigNumber.from(await provider.getBlockNumber())

            const hashZero = [constants.HashZero]
            await expect(
                md
                    .connect(delegator)
                    .verifyVotingPower(
                        delegator.address,
                        voter.address,
                        BigNumber.from(10000),
                        blockNumber.add(BigNumber.from(1)),
                        hashZero
                    )
            ).to.be.revertedWith('MD: only past can be verified')
        })
        it('reverts if is the current block number', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])

            await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            const blockNumber = BigNumber.from(await provider.getBlockNumber())

            // console.log(tree.proof)
            await expect(
                md
                    .connect(delegator)
                    .verifyVotingPower(
                        delegator.address,
                        voter.address,
                        BigNumber.from(10000),
                        blockNumber,
                        proof
                    )
            ).to.be.revertedWith('MD: only past can be verified')
        })
        it('verifies a good proof from past block', async () => {
            await successfulTransaction(
                md.connect(delegator).setDelegateTrie(delegator.address, root)
            )
            /*
             * const blockNumber0 = BigNumber.from(await provider.getBlockNumber())
             *  we advance 1 the block.number so we are verifying a past block.
             */
            await advanceBlock()
            await advanceBlock()
            await advanceBlock()
            await advanceBlock()
            const blockNum = BigNumber.from(await provider.getBlockNumber())
            await advanceBlock()
            await advanceBlock()
            await advanceBlock()
            await advanceBlock()

            expect(await md.getLastDelegateRoot(delegator.address)).equals(root)
            expect(
                await md.getLastDelegateBlockNumber(delegator.address)
            ).equals(45)
            expect(
                await md.getPrevCheckpoint(delegator.address, blockNum)
            ).equals(0)

            expect(
                await md
                    .connect(delegator)
                    .verifyVotingPower(
                        delegator.address,
                        voter0.address,
                        BigNumber.from(10000),
                        blockNum,
                        proof
                    )
            ).equals(true)
        })
    })

    /* eslint-disable no-lone-blocks */

    let admin: SignerWithAddress
    let delegator: SignerWithAddress
    let delegator2: SignerWithAddress
    let govToken: SignerWithAddress
    let voter: SignerWithAddress
    let voter0: SignerWithAddress
    let voter1: SignerWithAddress
    let voter2: SignerWithAddress
    let voter3: SignerWithAddress
    let md: MerkleDelegation
    let proof: string[]
    let root: string
})
