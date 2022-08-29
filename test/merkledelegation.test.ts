// Start - Support direct Mocha run & debug
import 'hardhat'
import '@nomiclabs/hardhat-ethers'
// End - Support direct Mocha run & debug

import chai, {expect} from 'chai'
import {before} from 'mocha'
import {solidity} from 'ethereum-waffle'
import {MerkleDelegation} from '../typechain-types'
import {deployContract, signer} from './framework/contracts'
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers'
import {successfulTransaction} from './framework/transaction'
import {eventOf} from './framework/event-wrapper'
import {expectEmittersAndEvents, expectEvents} from './framework/event-filters'
import {utils} from 'ethers'

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

    /* eslint-disable no-lone-blocks */

    let admin: SignerWithAddress
    let oracle: SignerWithAddress
    let md: MerkleDelegation
})
