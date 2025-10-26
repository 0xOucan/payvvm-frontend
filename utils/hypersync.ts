/**
 * HyperSync Utility for PayVVM Explorer
 *
 * Uses HyperSync HTTP API instead of native client to avoid Turbopack/native module issues
 * Server-side only - fetches transaction data from HyperSync REST endpoint
 */

// Contract Addresses on Sepolia
export const EVVM_CONTRACT = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;
export const GOLDEN_FISHER = '0x121c631B7aEa24316bD90B22C989Ca008a84E5Ed' as const;
export const PYUSD_TOKEN = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' as const;

// HyperSync HTTP API endpoint
const HYPERSYNC_URL = 'https://sepolia.hypersync.xyz/query';

// Function selectors
const PAY_FUNCTION_SELECTOR = '0x2e9621cb'; // pay() function

export interface PayVVMTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string; // Original sender
  to: string; // Recipient
  token: string;
  amount: string;
  type: 'send' | 'receive';
  executedBy: string; // Golden fisher address
  gasUsed?: string;
}

export interface ETHTransfer {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  type: 'send' | 'receive';
  gasUsed?: string;
}

export interface PYUSDTransfer {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  type: 'send' | 'receive';
  logIndex: number;
}

/**
 * Decode pay() function parameters from transaction input
 */
function decodePay(input: string): { from: string; to: string; token: string; amount: string } | null {
  try {
    // Remove 0x and function selector (first 4 bytes = 8 hex chars)
    const data = input.slice(2 + 8); // Remove "0x" + "2e9621cb"

    // pay(address from, address to_address, string to_identity, address token, uint256 amount, uint256 priorityFee, uint256 nonce, bool priorityFlag, address executor, bytes signature)
    // Parameters are ABI-encoded in 32-byte slots

    // Slot 0: from address (last 20 bytes of 32-byte slot)
    const fromAddress = '0x' + data.slice(24, 64);

    // Slot 1: to_address (last 20 bytes of 32-byte slot)
    const toAddress = '0x' + data.slice(64 + 24, 64 + 64);

    // Slot 2: offset to to_identity string (we skip this)

    // Slot 3: token address (last 20 bytes of 32-byte slot)
    const tokenAddress = '0x' + data.slice(192 + 24, 192 + 64);

    // Slot 4: amount (full 32 bytes)
    const amountHex = data.slice(256, 320);
    const amount = BigInt('0x' + amountHex).toString();

    return {
      from: fromAddress.toLowerCase(),
      to: toAddress.toLowerCase(),
      token: tokenAddress.toLowerCase(),
      amount,
    };
  } catch (error) {
    console.error('Failed to decode pay() input:', error);
    return null;
  }
}

/**
 * Query HyperSync HTTP API
 */
async function queryHyperSync(query: any): Promise<any> {
  console.log('[HyperSync HTTP] Querying:', JSON.stringify(query).slice(0, 200));

  const response = await fetch(HYPERSYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HyperSync HTTP API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // HyperSync response format: { data: [{ transactions: [...], blocks: [...] }], ... }
  const firstResult = data.data?.[0] || { transactions: [], blocks: [] };
  console.log(`[HyperSync HTTP] Got ${firstResult.transactions?.length || 0} transactions, ${firstResult.blocks?.length || 0} blocks`);

  return data;
}

/**
 * Fetch PayVVM transactions (pay() function calls from golden fisher)
 * IMPORTANT: Only returns SUCCESSFUL transactions (filters out reverted transactions)
 */
export async function fetchPayVVMTransactions(
  userAddress: string,
  fromBlock: number,
  toBlock: number,
  limit: number = 50
): Promise<PayVVMTransaction[]> {
  const userAddr = userAddress.toLowerCase();

  // HyperSync's Sepolia indexer doesn't index EVVM contract events by default
  // So we use status-based filtering instead of log-based filtering
  const query = {
    from_block: fromBlock,
    to_block: toBlock,
    transactions: [
      {
        from: [GOLDEN_FISHER.toLowerCase()],
        to: [EVVM_CONTRACT.toLowerCase()],
      },
    ],
    include_all_blocks: false,
    field_selection: {
      block: ['number', 'timestamp', 'hash'],
      transaction: [
        'block_number',
        'transaction_index',
        'hash',
        'from',
        'to',
        'value',
        'input',
        'gas_used',
        'status', // 1 = success, 0 = failed
      ],
    },
    // IMPORTANT: Request many more transactions than the limit
    // because we need to fetch ALL transactions and filter out failed ones client-side
    max_num_transactions: Math.max(limit * 20, 1000),
  };

  console.log(`[HyperSync] Querying PayVVM transactions from block ${fromBlock} to ${toBlock} (max ${query.max_num_transactions} txs)`);

  const response = await queryHyperSync(query);
  const result = response.data?.[0] || { transactions: [], blocks: [] };

  console.log(`[HyperSync] HyperSync returned ${result.transactions?.length || 0} raw transactions`);

  const transactions: PayVVMTransaction[] = [];
  let successfulCount = 0;
  let failedCount = 0;
  let payFunctionCount = 0;
  let decodedCount = 0;
  let matchedUserCount = 0;

  // Create a map of block numbers to blocks for timestamp lookup
  const blockMap = new Map();
  if (result.blocks) {
    for (const block of result.blocks) {
      blockMap.set(Number(block.number), block);
    }
  }

  for (const tx of result.transactions || []) {
    // CRITICAL: Filter out failed transactions using status field
    // status: 1 = success, 0 = failed, undefined = treat as failed
    const txStatus = tx.status !== undefined ? Number(tx.status) : 0;
    if (txStatus !== 1) {
      console.log(`[HyperSync] ❌ SKIP failed tx (status=${txStatus}): ${tx.hash.slice(0, 10)}...`);
      failedCount++;
      continue;
    }
    successfulCount++;

    // Only process pay() function calls
    if (!tx.input || !tx.input.startsWith(PAY_FUNCTION_SELECTOR)) {
      console.log(`[HyperSync] ⚠️ SKIP non-pay() tx: ${tx.hash.slice(0, 10)}...`);
      continue;
    }
    payFunctionCount++;

    const decoded = decodePay(tx.input);
    if (!decoded) {
      console.log(`[HyperSync] ⚠️ Failed to decode pay() tx: ${tx.hash.slice(0, 10)}...`);
      continue;
    }
    decodedCount++;

    // Only include transactions where user is sender or recipient
    if (decoded.from !== userAddr && decoded.to !== userAddr) {
      console.log(`[HyperSync] ⚠️ User not involved: ${tx.hash.slice(0, 10)}... (from=${decoded.from.slice(0, 8)}, to=${decoded.to.slice(0, 8)})`);
      continue;
    }
    matchedUserCount++;

    const block = blockMap.get(Number(tx.block_number));
    const timestamp = block ? Number(block.timestamp) : 0;

    console.log(`[HyperSync] ✅ MATCH: ${tx.hash} block=${tx.block_number} from=${decoded.from.slice(0, 8)} to=${decoded.to.slice(0, 8)} amount=${decoded.amount}`);

    transactions.push({
      hash: tx.hash,
      blockNumber: Number(tx.block_number),
      timestamp,
      from: decoded.from,
      to: decoded.to,
      token: decoded.token,
      amount: decoded.amount,
      type: decoded.from === userAddr ? 'send' : 'receive',
      executedBy: tx.from.toLowerCase(),
      gasUsed: tx.gas_used ? tx.gas_used.toString() : undefined,
    });

    if (transactions.length >= limit) break;
  }

  console.log(`[HyperSync] Summary: raw=${result.transactions?.length || 0}, successful=${successfulCount}, failed=${failedCount}, pay()=${payFunctionCount}, decoded=${decodedCount}, matched=${matchedUserCount}, final=${transactions.length}`);
  return transactions;
}

/**
 * Fetch ETH transfers (native value transfers)
 */
export async function fetchETHTransfers(
  userAddress: string,
  fromBlock: number,
  toBlock: number,
  limit: number = 50
): Promise<ETHTransfer[]> {
  const userAddr = userAddress.toLowerCase();

  const query = {
    from_block: fromBlock,
    to_block: toBlock,
    transactions: [
      {
        // Transactions where user is sender OR recipient
        // HyperSync will return both
      },
    ],
    field_selection: {
      block: ['number', 'timestamp'],
      transaction: [
        'block_number',
        'hash',
        'from',
        'to',
        'value',
        'gas_used',
      ],
    },
    max_num_transactions: limit * 5, // Request more to filter client-side
  };

  const response = await queryHyperSync(query);
  const transactions: ETHTransfer[] = [];

  // HyperSync returns data as an array - get first result
  const result = response.data?.[0] || { transactions: [], blocks: [] };

  // Create block map
  const blockMap = new Map();
  if (result.blocks) {
    for (const block of result.blocks) {
      blockMap.set(Number(block.number), block);
    }
  }

  for (const tx of result.transactions || []) {
    const from = tx.from.toLowerCase();
    const to = (tx.to || '').toLowerCase();
    const value = tx.value || '0';

    // Skip if user not involved or no value
    if (from !== userAddr && to !== userAddr) continue;
    if (value === '0' || value === '0x0') continue;

    const block = blockMap.get(Number(tx.block_number));
    const timestamp = block ? Number(block.timestamp) : 0;

    transactions.push({
      hash: tx.hash,
      blockNumber: Number(tx.block_number),
      timestamp,
      from,
      to,
      value: BigInt(value).toString(),
      type: from === userAddr ? 'send' : 'receive',
      gasUsed: tx.gas_used ? tx.gas_used.toString() : undefined,
    });

    if (transactions.length >= limit) break;
  }

  return transactions;
}

/**
 * Fetch PYUSD token transfers (ERC20 Transfer events)
 */
export async function fetchPYUSDTransfers(
  userAddress: string,
  fromBlock: number,
  toBlock: number,
  limit: number = 50
): Promise<PYUSDTransfer[]> {
  const userAddr = userAddress.toLowerCase();

  // ERC20 Transfer event signature
  const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  const query = {
    from_block: fromBlock,
    to_block: toBlock,
    logs: [
      {
        address: [PYUSD_TOKEN.toLowerCase()],
        topics: [
          [transferEventSignature],
        ],
      },
    ],
    field_selection: {
      block: ['number', 'timestamp'],
      log: [
        'block_number',
        'log_index',
        'transaction_hash',
        'address',
        'data',
        'topic0',
        'topic1',
        'topic2',
        'topic3',
      ],
    },
    max_num_logs: limit * 5,
  };

  const response = await queryHyperSync(query);
  const transactions: PYUSDTransfer[] = [];

  // HyperSync returns data as an array - get first result
  const result = response.data?.[0] || { logs: [], blocks: [] };

  // Create block map
  const blockMap = new Map();
  if (result.blocks) {
    for (const block of result.blocks) {
      blockMap.set(Number(block.number), block);
    }
  }

  for (const log of result.logs || []) {
    // Decode Transfer event
    // topic1 = from (indexed)
    // topic2 = to (indexed)
    // data = amount
    const from = '0x' + (log.topic1 || '').slice(-40);
    const to = '0x' + (log.topic2 || '').slice(-40);
    const amount = BigInt(log.data || '0x0').toString();

    // Skip if user not involved
    if (from.toLowerCase() !== userAddr && to.toLowerCase() !== userAddr) continue;

    const block = blockMap.get(Number(log.block_number));
    const timestamp = block ? Number(block.timestamp) : 0;

    transactions.push({
      hash: log.transaction_hash,
      blockNumber: Number(log.block_number),
      timestamp,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      value: amount,
      type: from.toLowerCase() === userAddr ? 'send' : 'receive',
      logIndex: Number(log.log_index),
    });

    if (transactions.length >= limit) break;
  }

  return transactions;
}
