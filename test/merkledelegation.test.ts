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

// Wires up Waffle with Chai
chai.use(solidity)

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
        oracle = await signer(1)
        delegator = await signer(2)
        delegator2 = await signer(3)
    })

    // Before each test, deploy a fresh box (clean starting state)
    beforeEach(async () => {
        md = await deployContract<MerkleDelegation>(
            'MerkleDelegation',
            oracle.address
        )
    })

    // Inner describes use the name or idea for the function they're unit testing
    describe('changeOwner', () => {
        /*
         * Describe 'it', what unit of logic is being tested
         * Keep in mind the full composition of the name: Contract > function > single test
         */
        it('same owner', async () => {
            const newOwner = admin.address

            const receipt = await successfulTransaction(
                md.changeOwner(admin.address)
            )

            eventOf(md, 'OwnerChanged').expectOne(receipt, {newOwner})

            expect(await md.owner()).equals(admin.address)
        })

        // Modifier checks contain the flattened and spaced modifier name
        it('only owner', async () => {
            await expect(
                md.connect(oracle).changeOwner(oracle.address)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe('setDelegateTrie', () => {
        it('delegator is not sender', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            await expect(
                md
                    .connect(delegator2)
                    .setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('DR: delegator must be msg.sender')
        })

        it('delegator is sender', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from('0x08')

            const receipt = await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )

            eventOf(md, 'SetDelegates').expectOne(receipt, {
                delegator: delegator.address,
                trieRoot,
                blockNumber
            })

            expect(await md.owner()).equals(admin.address)
        })

        // Modifier checks contain the flattened and spaced modifier name
        it('only owner', async () => {
            await expect(
                md.connect(oracle).changeOwner(oracle.address)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('delegator update', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from('0x0c')
            const receipt = await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )

            expect(await md.getDelegateRoot(delegator.address)).equals(trieRoot)
            expect(await md.getDelegateBlockNumber(delegator.address)).equals(
                blockNumber
            )
        })
    })

    describe('clearDelegateTrie', () => {
        it('delegator clearing', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from('0x0e')
            const receipt = await successfulTransaction(
                md
                    .connect(delegator)
                    .setDelegateTrie(delegator.address, trieRoot)
            )
            expect(await md.getDelegateRoot(delegator.address)).equals(trieRoot)
            expect(await md.getDelegateBlockNumber(delegator.address)).equals(
                blockNumber
            )
            const receipt2 = await successfulTransaction(
                md.connect(delegator).clearDelegateTrie(delegator.address)
            )
            expect(await md.getDelegateRoot(delegator.address)).equals(
                constants.HashZero
            )
            expect(await md.getDelegateBlockNumber(delegator.address)).equals(
                BigNumber.from('0')
            )
            /*
             * await expect(
             *     md.connect(delegator).getDelegateRoot(oracle.address)
             * ).to.be.revertedWith('Ownable: caller is not the owner')
             */
        })
    })

    describe('pause', () => {
        it('can pause setDelegateTrie', async () => {
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from('0x0e')
            await expect(
                md.connect(oracle).setDelegateTrie(delegator.address, trieRoot)
            ).to.be.revertedWith('Pausable: paused')
        })
        it('can pause clearDelegateTrie', async () => {
            const trieRoot = utils.soliditySha256(['string'], ['some input'])
            const blockNumber = BigNumber.from('0x0e')
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
        })
        it('can pause pause function', async () => {
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            await expect(md.connect(admin).pause()).to.be.revertedWith(
                'Pausable: paused'
            )
        })
        it('cannot pause unpause function', async () => {
            const receipt0 = await successfulTransaction(
                md.connect(admin).pause()
            )
            const receipt1 = await successfulTransaction(
                md.connect(admin).unpause()
            )
        })
    })

    /* eslint-disable no-lone-blocks */

    let admin: SignerWithAddress
    let oracle: SignerWithAddress
    let delegator: SignerWithAddress
    let delegator2: SignerWithAddress
    let md: MerkleDelegation
})
