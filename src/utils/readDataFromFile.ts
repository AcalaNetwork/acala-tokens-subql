import unNativeTokenBalances from './unNativeTokenbBalance.json'
import nativeTokenBalances from './nativeTokenBalance.json';
import { ReadBlock } from '../types';
import { updateAccountBalance } from './updateAccountBalance';
import { isNewAccount } from './isNewAccount';
import { SubstrateEvent } from '@subql/types';
import { updateToken } from './updateToken';

interface BalanceDataProsp {
  account: string;
  token: string;
  free: string;
  reserved: string;
  frozen: string;
}

export const readDataFromFile = async (event: SubstrateEvent) => {
  const exists = await ReadBlock.get('read');
  const height = event.block.block.header.number.toBigInt();
  const timestamp = event.block.timestamp

  if (exists) {
    return;
  } else if(height >= BigInt(2000000)) {
    const record = new ReadBlock('read');
    record.height = height;

    await record.save();

    await Promise.all((unNativeTokenBalances as BalanceDataProsp[]).map(async item => {
      const isNew = isNewAccount(item.account, event);
      await updateAccountBalance(item.account, item.token, BigInt(item.free), BigInt(item.reserved), BigInt(item.frozen), timestamp, height, isNew);
      await updateToken(item.token, BigInt(item.free) + BigInt(item.reserved) + BigInt(item.frozen), BigInt(0), BigInt(item.reserved), BigInt(item.frozen), height, timestamp);
    }))

    await Promise.all((nativeTokenBalances as BalanceDataProsp[]).map(async item => {
      const isNew = isNewAccount(item.account, event);
      await updateAccountBalance(item.account, item.token, BigInt(item.free), BigInt(item.reserved), BigInt(item.frozen), timestamp, height, isNew);
      await updateToken(item.token, BigInt(item.free) + BigInt(item.reserved) + BigInt(item.frozen), BigInt(0), BigInt(item.reserved), BigInt(item.frozen), height, timestamp);
    }))
  }
}