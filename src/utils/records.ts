import { isSystemAccount } from './systemAccounts'
import { nativeToken, getTokenDecimals, isTokenEqual, getCurrencyObject } from './tokens'
import { Token, Account, AccountBalance, DailyAccountBalance, HourAccountBalance, HourToken, DailyToken } from '../types/models'

export async function getToken(id: string) {
    let record = await Token.get(id)

    if (!record) {
        record = new Token(id)

        record.decimal = await getTokenDecimals(id)

        let issuance = BigInt(0)

        // try to read native token issuance amount from chain, the native token issuance was setted when the chain started
        if (isTokenEqual(id, nativeToken)) {
            const rawIssuance = await api.query.balances.totalIssuance()

            issuance = BigInt(rawIssuance.toString())
        }

        record.volume = BigInt(0)
        record.reserved = BigInt(0)
        record.frozen = BigInt(0)
        record.issuance = issuance
    }

    return record
}

export async function getHourToken(tokenName: string, timestamp: Date) {
    const id = `${tokenName}-${timestamp.getTime()}`

    let record = await HourToken.get(id)

    if (!record) {
        record = new HourToken(id)

        record.tokenId = tokenName
        record.volume = BigInt(0)
        record.frozen = BigInt(0)
        record.reserved = BigInt(0)
        record.timestmap = timestamp
    }

    return record
}

export async function getDailyToken(tokenName: string, timestamp: Date) {
    const id = `${tokenName}-${timestamp.getTime()}`

    let record = await DailyToken.get(id)

    if (!record) {
        record = new DailyToken(id)

        record.tokenId = tokenName
        record.volume = BigInt(0)
        record.frozen = BigInt(0)
        record.reserved = BigInt(0)
        record.timestmap = timestamp
    }

    return record
}

export async function getAccount(id: string) {
    let record = await Account.get(id)

    if (!record) {
        const systemAccount = isSystemAccount(id)

        record = new Account(id)

        record.address = id
        record.mark = systemAccount ? systemAccount.name : 'user'
    }

    return record
}

export async function getAccountBalance(address: string, tokenName: string) {
    const id = `${address}-${tokenName}`

    let record = await AccountBalance.get(id)

    if (!record) {
        record = new AccountBalance(id)

        record.accountId = address
        record.tokenId = tokenName

        let total = BigInt(0);
        let free = BigInt(0);
        let reserved = BigInt(0);
        let frozen = BigInt(0);

        if (isTokenEqual(tokenName, nativeToken)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const balanceData = (await api.query.system.account(address)) as any

            free = BigInt(balanceData.data.free.toString())
            reserved = BigInt(balanceData.data.reserved.toString())
            const miscFrozen = BigInt(balanceData.data.miscFrozen.toString())
            const feeFrozen = BigInt(balanceData.data.feeFrozen.toString())

            frozen = miscFrozen > feeFrozen ? miscFrozen : feeFrozen;
        }

        total = free + reserved

        record.total = total 
        record.free = free
        record.reserved = reserved
        record.frozen = frozen

        // some native tokens were issuced from gensis, should be marked to prevent double counting
        if (isTokenEqual(tokenName, nativeToken)) {
            return [record, true] as const
        }
    }

    return [record, false] as const
}

export async function getHourAccountBalance(address: string, tokenName: string, timestamp: Date) {
    const id = `${address}-${tokenName}-${timestamp.getTime()}`

    let record = await HourAccountBalance.get(id)

    if (!record) {
        record = new HourAccountBalance(id)

        // initialize all value
        record.accountId = address
        record.tokenId = tokenName
        record.total = BigInt(0)
        record.free = BigInt(0)
        record.reserved = BigInt(0)
        record.frozen = BigInt(0)
        record.timestamp = timestamp
    }

    return record
}

export async function getDailyAccountBalance(address: string, tokenName: string, timestamp: Date) {
    const id = `${address}-${tokenName}-${timestamp.getTime()}`

    let record = await DailyAccountBalance.get(id)

    if (!record) {
        record = new DailyAccountBalance(id)

        // initialize all value
        record.accountId = address
        record.tokenId = tokenName
        record.total = BigInt(0)
        record.free = BigInt(0)
        record.reserved = BigInt(0)
        record.frozen = BigInt(0)
        record.timestamp = timestamp
    }

    return record
}
