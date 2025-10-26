/**
 * HyperSync Service for PayVVM Transaction Indexing
 *
 * Fetches transactions from Ethereum Sepolia:
 * 1. PayVVM transactions executed by golden fisher bot
 * 2. ETH native transfers (send/receive)
 * 3. PYUSD ERC20 transfers (send/receive)
 */

import { HypersyncClient, Query, Decoder } from '@envio-dev/hypersync-client';

// Contract addresses
export const EVVM_CONTRACT = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;
export const GOLDEN_FISHER = '0x121c631B7aEa24316bD90B22C989Ca008a84E5Ed' as const;
export const PYUSD_TOKEN = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' as const;

// ERC20 Transfer event signature
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// EVVM pay() function signature
const PAY_FUNCTION_SELECTOR = '0x2e9621cb';

export interface PayVVMTransaction {
  hash: string;
  blockNumber: bigint;
  timestamp: number;
  from: string;
  to: string;
  token: string;
  amount: bigint;
  priorityFee: bigint;
  nonce: bigint;
  executor: string;
  status: 'success' | 'failed';
  gasUsed: bigint;
}

export interface ETHTransfer {
  hash: string;
  blockNumber: bigint;
  timestamp: number;
  from: string;
  to: string;
  value: bigint;
  status: 'success' | 'failed';
  gasUsed: bigint;
}

export interface PYUSDTransfer {
  hash: string;
  blockNumber: bigint;
  timestamp: number;
  from: string;
  to: string;
  value: bigint;
  logIndex: number;
}

/**
 * Initialize HyperSync client for Ethereum Sepolia
 */
function getHyperSyncClient(): HypersyncClient {
  return HypersyncClient.new({
    url: 'https://eth-sepolia.hypersync.xyz',
  });
}

/**
 * Fetch PayVVM transactions executed by the golden fisher
 * These are gasless payments executed through the EVVM contract
 */
export async function fetchPayVVMTransactions(
  userAddress: string,
  limit = 50
): Promise<PayVVMTransaction[]> {
  const client = getHyperSyncClient();

  try {
    const query: Query = {
      fromBlock: 0,
      toBlock: undefined, // Latest block
      transactions: [
        {
          // Transactions from golden fisher to EVVM contract
          from: [GOLDEN_FISHER],
          to: [EVVM_CONTRACT],
          // Filter for pay() function calls
          input: [`${PAY_FUNCTION_SELECTOR}%`],
        },
      ],
      fieldSelection: {
        block: ['number', 'timestamp'],
        transaction: [
          'hash',
          'from',
          'to',
          'input',
          'status',
          'gas_used',
        ],
      },
    };

    const res = await client.sendReq(query);

    if (!res.data) {
      return [];
    }

    const transactions: PayVVMTransaction[] = [];
    const decoder = Decoder.new();

    for (let i = 0; i < res.data.transactions.length; i++) {
      const tx = res.data.transactions[i];
      const block = res.data.blocks.find((b) => b.number === tx.block_number);

      if (!tx.input || tx.input.length < 10) continue;

      try {
        // Decode pay() function call
        // pay(address from, address to_address, string to_identity, address token,
        //     uint256 amount, uint256 priorityFee, uint256 nonce, bool priorityFlag,
        //     address executor, bytes signature)

        const decoded = decoder.decodeTransactionInput(
          tx.input,
          [
            'address', // from
            'address', // to_address
            'string',  // to_identity
            'address', // token
            'uint256', // amount
            'uint256', // priorityFee
            'uint256', // nonce
            'bool',    // priorityFlag
            'address', // executor
            'bytes',   // signature
          ]
        );

        const [from, to_address, , token, amount, priorityFee, nonce, , executor] = decoded;

        // Filter for transactions involving the user
        const fromAddress = from.toString().toLowerCase();
        const toAddress = to_address.toString().toLowerCase();
        const userAddr = userAddress.toLowerCase();

        if (fromAddress === userAddr || toAddress === userAddr) {
          transactions.push({
            hash: tx.hash,
            blockNumber: tx.block_number,
            timestamp: block ? Number(block.timestamp) : 0,
            from: fromAddress,
            to: toAddress,
            token: token.toString(),
            amount: BigInt(amount.toString()),
            priorityFee: BigInt(priorityFee.toString()),
            nonce: BigInt(nonce.toString()),
            executor: executor.toString(),
            status: tx.status === 1 ? 'success' : 'failed',
            gasUsed: tx.gas_used ? BigInt(tx.gas_used) : 0n,
          });
        }
      } catch (error) {
        console.error('Error decoding transaction:', error);
      }

      if (transactions.length >= limit) break;
    }

    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error fetching PayVVM transactions:', error);
    return [];
  }
}

/**
 * Fetch ETH native transfers for user address
 */
export async function fetchETHTransfers(
  userAddress: string,
  limit = 50
): Promise<ETHTransfer[]> {
  const client = getHyperSyncClient();

  try {
    const query: Query = {
      fromBlock: 0,
      toBlock: undefined,
      transactions: [
        {
          // Sent by user
          from: [userAddress],
        },
        {
          // Received by user
          to: [userAddress],
        },
      ],
      fieldSelection: {
        block: ['number', 'timestamp'],
        transaction: [
          'hash',
          'from',
          'to',
          'value',
          'status',
          'gas_used',
        ],
      },
    };

    const res = await client.sendReq(query);

    if (!res.data) {
      return [];
    }

    const transfers: ETHTransfer[] = [];

    for (let i = 0; i < res.data.transactions.length; i++) {
      const tx = res.data.transactions[i];
      const block = res.data.blocks.find((b) => b.number === tx.block_number);

      // Only include transactions with value > 0
      if (tx.value && BigInt(tx.value) > 0n) {
        transfers.push({
          hash: tx.hash,
          blockNumber: tx.block_number,
          timestamp: block ? Number(block.timestamp) : 0,
          from: tx.from,
          to: tx.to || '0x0',
          value: BigInt(tx.value),
          status: tx.status === 1 ? 'success' : 'failed',
          gasUsed: tx.gas_used ? BigInt(tx.gas_used) : 0n,
        });
      }

      if (transfers.length >= limit) break;
    }

    return transfers.slice(0, limit);
  } catch (error) {
    console.error('Error fetching ETH transfers:', error);
    return [];
  }
}

/**
 * Fetch PYUSD ERC20 transfers for user address
 */
export async function fetchPYUSDTransfers(
  userAddress: string,
  limit = 50
): Promise<PYUSDTransfer[]> {
  const client = getHyperSyncClient();

  try {
    const query: Query = {
      fromBlock: 0,
      toBlock: undefined,
      logs: [
        {
          address: [PYUSD_TOKEN],
          topics: [
            [ERC20_TRANSFER_TOPIC],
            // From user (indexed parameter)
            [`0x000000000000000000000000${userAddress.slice(2).toLowerCase()}`],
          ],
        },
        {
          address: [PYUSD_TOKEN],
          topics: [
            [ERC20_TRANSFER_TOPIC],
            undefined, // Any from address
            // To user (indexed parameter)
            [`0x000000000000000000000000${userAddress.slice(2).toLowerCase()}`],
          ],
        },
      ],
      fieldSelection: {
        block: ['number', 'timestamp'],
        log: [
          'transaction_hash',
          'log_index',
          'topics',
          'data',
        ],
      },
    };

    const res = await client.sendReq(query);

    if (!res.data) {
      return [];
    }

    const transfers: PYUSDTransfer[] = [];

    for (const log of res.data.logs) {
      const block = res.data.blocks.find((b) => b.number === log.block_number);

      if (!log.topics || log.topics.length < 3) continue;

      // Decode Transfer(address indexed from, address indexed to, uint256 value)
      const fromTopic = log.topics[1];
      const toTopic = log.topics[2];

      const from = `0x${fromTopic.slice(-40)}`;
      const to = `0x${toTopic.slice(-40)}`;

      // Decode value from data
      const value = log.data ? BigInt(log.data) : 0n;

      transfers.push({
        hash: log.transaction_hash,
        blockNumber: log.block_number,
        timestamp: block ? Number(block.timestamp) : 0,
        from,
        to,
        value,
        logIndex: log.log_index || 0,
      });

      if (transfers.length >= limit) break;
    }

    return transfers.slice(0, limit);
  } catch (error) {
    console.error('Error fetching PYUSD transfers:', error);
    return [];
  }
}

/**
 * Fetch all transaction types for user
 */
export async function fetchAllTransactions(userAddress: string) {
  const [payvvm, eth, pyusd] = await Promise.all([
    fetchPayVVMTransactions(userAddress, 20),
    fetchETHTransfers(userAddress, 20),
    fetchPYUSDTransfers(userAddress, 20),
  ]);

  return {
    payvvm,
    eth,
    pyusd,
  };
}
