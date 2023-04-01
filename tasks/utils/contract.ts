import {log} from '../../config/logging'
import {TransactionResponse} from '@ethersproject/abstract-provider'
import {HardhatRuntimeEnvironment} from 'hardhat/types'

export interface DeployableContract<T> {
    deployed(): Promise<T>
    address: string
    deployTransaction: TransactionResponse
}

export async function deployContract<T extends DeployableContract<T>>(
    hre: HardhatRuntimeEnvironment,
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await hre.ethers.getContractFactory(name)
    const contract = <T>(<unknown>await factory.deploy(...args))

    log.info('%s deployed at: %s', name, contract.address)
    log.info(
        '%s deployment tx: %s',
        contract.address,
        contract.deployTransaction.hash
    )

    return contract.deployed()
}

export async function deployContractWithProxy<T extends DeployableContract<T>>(
    hre: HardhatRuntimeEnvironment,
    name: string,
    ...args: Array<unknown>
): Promise<T> {
    const factory = await hre.ethers.getContractFactory(name)
    const contract = <T>(
        (<unknown>(
            await hre.upgrades.deployProxy(factory, [...args], {kind: 'uups'})
        ))
    )

    log.info('%s proxy deployed at: %s', name, contract.address)
    log.info(
        '%s deployment tx: %s',
        contract.address,
        contract.deployTransaction.hash
    )

    return contract.deployed()
}

export async function verifyContract<T extends DeployableContract<T>>(
    hre: HardhatRuntimeEnvironment,
    contract: T,
    ...args: Array<unknown>
): Promise<void> {
    log.info('Verifying contract with Etherscan: %s', contract.address)

    await hre.run('verify:verify', {
        address: contract.address,
        constructorArguments: [...args]
    })
}

export async function awaitContractPropagation(sleepyTimeMs = 15000) {
    log.info('Awaiting contract propagation: %s ms', sleepyTimeMs)

    return new Promise((resolve) => {
        setTimeout(resolve, sleepyTimeMs)
    })
}
