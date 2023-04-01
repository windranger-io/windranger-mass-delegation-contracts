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
import {expectEmittersAndEvents, expectEvents} from './framework/event-filters'
import {utils, BigNumber, constants} from 'ethers'
/* eslint-disable no-duplicate-imports */
import {waffle} from 'hardhat'

// Wires up Waffle with Chai
chai.use(solidity)
const provider = waffle.provider

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
    })

    // Before each test, deploy a fresh box (clean starting state)
    beforeEach(async () => {
        md = await deployContract<MerkleDelegation>(
            'MerkleDelegation',
            govToken.address
        )
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
            ).to.be.revertedWith('delegator must be msg.sender')
        })

        it('reverts if trie root has all zero bytes', async () => {
            const trieRoot = constants.HashZero
            await expect(
                md
                    .connect(delegator2)
                    .setDelegateTrie(delegator2.address, trieRoot)
            ).to.be.revertedWith('trieRoot must be non-zero')
        })

        it('reverts if delegator not sender', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            await expect(
                md
                    .connect(delegator2)
                    .setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('delegator must be msg.sender')
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
            expect(
                JSON.stringify(await md.getDelegate(delegator.address))
            ).equals(
                `["${delegator.address}","${trieRoot}",${JSON.stringify(
                    blockNumber
                )}]`
            )
            expect(await md.getDelegateBlockNumber(delegator.address)).equals(
                blockNumber
            )
        })
    })

    describe('clearDelegateTrie', () => {
        it('reverts if delegator is zero address', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            const blockNumber = BigNumber.from(await provider.getBlockNumber())
            expect(
                JSON.stringify(await md.getDelegate(delegator.address))
            ).equals(
                `["${delegator.address}","${trieRoot}",${JSON.stringify(
                    blockNumber
                )}]`
            )
            expect(await md.getDelegateBlockNumber(delegator.address)).equals(
                blockNumber
            )
            await expect(
                md.connect(delegator).clearDelegateTrie(constants.AddressZero)
            ).to.be.revertedWith('delegator must be msg.sender')
        })

        it('delegator clearing', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            let blockNumber = BigNumber.from(await provider.getBlockNumber())
            expect(
                JSON.stringify(await md.getDelegate(delegator.address))
            ).equals(
                `["${delegator.address}","${trieRoot}",${JSON.stringify(
                    blockNumber
                )}]`
            )
            expect(await md.getDelegateBlockNumber(delegator.address)).equals(
                blockNumber
            )
            const receipt = await successfulTransaction(
                md.connect(delegator).clearDelegateTrie(delegator.address)
            )
            blockNumber = BigNumber.from(await provider.getBlockNumber())
            expect(await md.getDelegateBlockNumber(delegator.address)).equals(
                blockNumber
            )
            eventOf(md, 'SetDelegates').expectOne(receipt, {
                delegator: delegator.address,
                trieRoot:
                    '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
                blockNumber
            })
        })
    })

    describe('pause', () => {
        it('can pause setDelegateTrie', async () => {
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from(await provider.getBlockNumber())
            await expect(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('Pausable: paused')
        })

        it('can pause clearDelegateTrie', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from(await provider.getBlockNumber())
            const receipt = await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            await successfulTransaction(md.connect(admin).pause())
            await expect(
                md.connect(delegator).clearDelegateTrie(delegator.address)
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
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from(await provider.getBlockNumber())
            await expect(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('Pausable: paused')
            const receipt1 = await successfulTransaction(
                md.connect(admin).unpause()
            )
            const receipt = await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
        })

        it('can pause clearDelegateTrie', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from(await provider.getBlockNumber())
            const receipt = await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            await expect(
                md.connect(delegator).clearDelegateTrie(delegator.address)
            ).to.be.revertedWith('Pausable: paused')
            const receipt1 = await successfulTransaction(
                md.connect(admin).unpause()
            )
            const receipt3 = await successfulTransaction(
                md.connect(delegator).clearDelegateTrie(delegator.address)
            )
        })

        it('can unpause pause function', async () => {
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            await expect(md.connect(admin).pause()).to.be.revertedWith(
                'Pausable: paused'
            )
            const receipt1 = await successfulTransaction(
                md.connect(admin).unpause()
            )
            const receipt3 = await successfulTransaction(
                md.connect(admin).pause()
            )
        })

        it('cannot unpause if not paused', async () => {
            await expect(md.connect(admin).unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })

        it('cannot unpause unpause function', async () => {
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            const receipt1 = await successfulTransaction(
                md.connect(admin).unpause()
            )
            await expect(md.connect(admin).unpause()).to.be.revertedWith(
                'Pausable: not paused'
            )
        })
    })

    /* eslint-disable no-lone-blocks */

    let admin: SignerWithAddress
    let delegator: SignerWithAddress
    let delegator2: SignerWithAddress
    let govToken: SignerWithAddress
    let md: MerkleDelegation
})
