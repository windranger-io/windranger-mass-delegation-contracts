/* eslint-disable no-console */
import {task} from 'hardhat/config'

// helpers for deploying
import {
    awaitContractPropagation,
    deployContract,
    verifyContract
} from './utils/contract'

// We'll deploy injected versions of these types
import {MerkleDelegation} from '../typechain-types'
import {HardhatRuntimeEnvironment} from 'hardhat/types'

// get timestamp from the chain to avoid out-of-sync errors
const now = async (ethers: HardhatRuntimeEnvironment['ethers']) => {
    // getting timestamp
    const blockNumBefore = await ethers.provider.getBlockNumber()
    const blockBefore = await ethers.provider.getBlock(blockNumBefore)

    return blockBefore.timestamp
}

async function deployMerkleDelegation(
    hre: HardhatRuntimeEnvironment,
    govToken: string,
    verify = false
): Promise<MerkleDelegation> {
    // deploy merkle delegation contract
    const merkleDelegation = await deployContract<MerkleDelegation>(
        hre,
        'MerkleDelegation',
        govToken
    )
    // wait 1m for bytecode to make it to etherscan
    await awaitContractPropagation(60000)

    // verify contract on etherscan
    verify &&
        (await verifyContract<MerkleDelegation>(
            hre,
            merkleDelegation,
            govToken
        ))

    // return verified contract
    return merkleDelegation
}

task('deploy', 'Deploys the MerkleDelagation Contract')
    .addParam(
        'govToken',
        'The governance token to associate with the MerkleDelegation Contract'
    )
    .addParam(
        'verify',
        'Should the contract be verified with etherscan?',
        false
    )
    .setAction(async (taskArgs: {govToken: string; verify: boolean}, hre) => {
        // get current time
        let nowts = await now(hre.ethers)

        // record deployment start ts
        const startts = nowts

        // deploy the Merkle Delegation contract then retrieve addresses
        const merkleDelegation = await deployMerkleDelegation(
            hre,
            taskArgs.govToken,
            taskArgs.verify
        )

        // done
        nowts = await now(hre.ethers)

        // log all the contract addresses
        console.log(`
        -- start: ${startts}
        -
        --- Gov Token: ${taskArgs.govToken}
        -
        --- MerkleDelegator: ${merkleDelegation.address}
        -
        -- fin: ${nowts}
    `)
    })
