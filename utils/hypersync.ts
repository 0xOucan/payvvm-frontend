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
export const PYUSD_FAUCET = '0x74F7A28aF1241cfBeC7c6DBf5e585Afc18832a9a' as const;
export const MATE_FAUCET = '0x068E9091e430786133439258C4BeeD696939405e' as const;
export const STAKING_CONTRACT = '0x64A47d84dE05B9Efda4F63Fbca2Fc8cEb96E6816' as const;
export const TREASURY_CONTRACT = '0x3D6cB29a1F97a2CFf7a48af96F7ED3A02F6aA38E' as const;

// HyperSync HTTP API endpoint
const HYPERSYNC_URL = 'https://sepolia.hypersync.xyz/query';

// Function selectors (keccak256 of function signature, first 4 bytes)
const PAY_FUNCTION_SELECTOR = '0x2e9621cb'; // pay(address,address,string,address,uint256,uint256,uint256,bool,address,bytes)
const CLAIM_PYUSD_SELECTOR = '0x5db52cf7'; // claimPyusd(address,uint256,bytes)
const CLAIM_MATE_SELECTOR = '0xf1f50eec'; // claimMate(address,uint256,bytes) - VERIFIED from Etherscan
const GOLDEN_STAKING_SELECTOR = '0x475c31ff'; // goldenStaking(bool,uint256,bytes) - VERIFIED from Etherscan
const CA_PAY_SELECTOR = '0xc898a6e9'; // caPay(address,address,uint256) - internal payment from faucet
const WITHDRAW_SELECTOR = '0xf37e8d38'; // withdraw(address,address,uint256,bytes) - Treasury withdrawal
const DEPOSIT_SELECTOR = '0x47e7ef24'; // deposit(address,uint256) - Treasury deposit
const ADD_BALANCE_SELECTOR = '0xd3bca884'; // addBalance(address,address,uint256) - Direct balance addition (admin faucet)
const RECALCULATE_REWARD_SELECTOR = '0x5300e162'; // recalculateReward() - Reward recalculation

export interface PayVVMTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string; // Original sender/claimer/signer
  to: string; // Recipient
  token: string;
  amount: string;
  type: 'send' | 'receive';
  executedBy: string; // Golden fisher address who executed the tx
  txType: 'payment' | 'faucet_claim' | 'staking' | 'treasury' | 'unknown'; // Transaction type
  functionName?: string; // Function name (pay, claimPyusd, etc.)
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
 * Decode claimPyusd() function parameters from transaction input
 * claimPyusd(address claimer, uint256 nonce, bytes signature)
 */
function decodeClaimPyusd(input: string): { claimer: string; token: string; amount: string } | null {
  try {
    const data = input.slice(2 + 8); // Remove "0x" + selector

    // Slot 0: claimer address (last 20 bytes)
    const claimerAddress = '0x' + data.slice(24, 64);

    // Fixed amount for PYUSD faucet: 1 PYUSD = 1000000 (6 decimals)
    const amount = '1000000';

    return {
      claimer: claimerAddress.toLowerCase(),
      token: PYUSD_TOKEN.toLowerCase(),
      amount,
    };
  } catch (error) {
    console.error('Failed to decode claimPyusd() input:', error);
    return null;
  }
}

/**
 * Decode claimMate() function parameters from transaction input
 * claimMate(address claimer, uint256 nonce, bytes signature)
 */
function decodeClaimMate(input: string): { claimer: string; token: string; amount: string } | null {
  try {
    const data = input.slice(2 + 8); // Remove "0x" + selector

    // Slot 0: claimer address (last 20 bytes)
    const claimerAddress = '0x' + data.slice(24, 64);

    // Fixed amount for MATE faucet: 510 MATE = 510000000000000000000 (18 decimals)
    const amount = '510000000000000000000';

    // MATE token address (protocol constant)
    const mateToken = '0x0000000000000000000000000000000000000001';

    return {
      claimer: claimerAddress.toLowerCase(),
      token: mateToken.toLowerCase(),
      amount,
    };
  } catch (error) {
    console.error('Failed to decode claimMate() input:', error);
    return null;
  }
}

/**
 * Decode withdraw() function call
 * withdraw(address token, address to, uint256 amount, bytes signature)
 */
function decodeWithdraw(input: string): { token: string; to: string; amount: string } | null {
  try {
    const data = input.slice(2 + 8); // Remove "0x" + selector

    // Slot 0: token address (last 20 bytes)
    const tokenAddress = '0x' + data.slice(24, 64);

    // Slot 1: to address (last 20 bytes)
    const toAddress = '0x' + data.slice(64 + 24, 64 + 64);

    // Slot 2: amount (full 32 bytes as hex number)
    const amountHex = '0x' + data.slice(128, 192);
    const amount = BigInt(amountHex).toString();

    return {
      token: tokenAddress.toLowerCase(),
      to: toAddress.toLowerCase(),
      amount,
    };
  } catch (error) {
    console.error('Failed to decode withdraw() input:', error);
    return null;
  }
}

/**
 * Decode deposit() function call
 * deposit(address token, uint256 amount)
 */
function decodeDeposit(input: string): { token: string; amount: string } | null {
  try {
    const data = input.slice(2 + 8); // Remove "0x" + selector

    // Slot 0: token address (last 20 bytes)
    const tokenAddress = '0x' + data.slice(24, 64);

    // Slot 1: amount (full 32 bytes as hex number)
    const amountHex = '0x' + data.slice(64, 128);
    const amount = BigInt(amountHex).toString();

    return {
      token: tokenAddress.toLowerCase(),
      amount,
    };
  } catch (error) {
    console.error('Failed to decode deposit() input:', error);
    return null;
  }
}

/**
 * Decode addBalance() function call (admin faucet - direct balance addition)
 * addBalance(address user, address token, uint256 quantity)
 */
function decodeAddBalance(input: string): { user: string; token: string; amount: string } | null {
  try {
    const data = input.slice(2 + 8); // Remove "0x" + selector

    // Slot 0: user address (last 20 bytes)
    const userAddress = '0x' + data.slice(24, 64);

    // Slot 1: token address (last 20 bytes)
    const tokenAddress = '0x' + data.slice(64 + 24, 64 + 64);

    // Slot 2: quantity (full 32 bytes as hex number)
    const amountHex = '0x' + data.slice(128, 192);
    const amount = BigInt(amountHex).toString();

    return {
      user: userAddress.toLowerCase(),
      token: tokenAddress.toLowerCase(),
      amount,
    };
  } catch (error) {
    console.error('Failed to decode addBalance() input:', error);
    return null;
  }
}

/**
 * Query HyperSync HTTP API
 */
async function queryHyperSync(query: any): Promise<any> {
  console.log('[HyperSync HTTP] Querying:', JSON.stringify(query).slice(0, 200));

  // Build headers with optional API token for authenticated requests
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.NEXT_PUBLIC_ENVIO_API_KEY;
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    console.log('[HyperSync HTTP] Using authenticated API token');
  }

  const response = await fetch(HYPERSYNC_URL, {
    method: 'POST',
    headers,
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
 * Fetch PayVVM transactions (all fisher-executed transactions to PayVVM ecosystem)
 * IMPORTANT: Only returns SUCCESSFUL transactions (filters out reverted transactions)
 * Now includes: pay(), claimPyusd(), claimMate(), and other fisher-executed functions
 */
export async function fetchPayVVMTransactions(
  userAddress: string,
  fromBlock: number,
  toBlock: number,
  limit: number = 50
): Promise<PayVVMTransaction[]> {
  const userAddr = userAddress.toLowerCase();

  // ERC20 Transfer event signature for Treasury deposits
  const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  // Query ALL transactions TO any PayVVM contract
  // This includes fisher-executed AND direct user calls
  // ALSO query PYUSD Transfer events TO Treasury (deposits)
  const query = {
    from_block: fromBlock,
    to_block: toBlock,
    transactions: [
      {
        // NO from filter - get ALL transactions to these contracts
        to: [
          EVVM_CONTRACT.toLowerCase(),
          PYUSD_FAUCET.toLowerCase(),
          MATE_FAUCET.toLowerCase(),
          STAKING_CONTRACT.toLowerCase(),
          TREASURY_CONTRACT.toLowerCase(),
        ],
        status: 1, // CRITICAL: Filter for successful transactions only (1 = success, 0 = failed)
      },
    ],
    logs: [
      {
        // PYUSD Transfer events WHERE recipient is Treasury contract (deposits)
        address: [PYUSD_TOKEN.toLowerCase()],
        topics: [
          [transferEventSignature], // topic0 = Transfer(address,address,uint256)
          [], // topic1 = from (any sender)
          ['0x000000000000000000000000' + TREASURY_CONTRACT.slice(2).toLowerCase()], // topic2 = to (Treasury)
        ],
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
        'status', // Include status in output for verification
      ],
      log: [
        'block_number',
        'log_index',
        'transaction_hash',
        'address',
        'data',
        'topic0',
        'topic1',
        'topic2',
      ],
    },
    // Request many more transactions to ensure we get all successful ones
    max_num_transactions: Math.max(limit * 20, 1000),
    max_num_logs: Math.max(limit * 20, 1000),
  };

  const response = await queryHyperSync(query);
  const result = response.data?.[0] || { transactions: [], blocks: [], logs: [] };

  console.log(`[HyperSync] Fetched ${result.transactions?.length || 0} transactions, ${result.logs?.length || 0} logs`);

  const transactions: PayVVMTransaction[] = [];
  const seenTxHashes = new Set<string>(); // Track processed transaction hashes to avoid duplicates

  // Create a map of block numbers to blocks for timestamp lookup
  const blockMap = new Map();
  if (result.blocks) {
    for (const block of result.blocks) {
      blockMap.set(Number(block.number), block);
    }
  }

  for (const tx of result.transactions || []) {
    // Verify status (should all be 1 since we filtered at query level)
    const txStatus = tx.status !== undefined ? Number(tx.status) : 0;
    if (txStatus !== 1) {
      console.log(`[HyperSync] ⚠️ Unexpected failed tx (status=${txStatus}): ${tx.hash}`);
      continue;
    }

    if (!tx.input) continue;

    const block = blockMap.get(Number(tx.block_number));
    const timestamp = block ? Number(block.timestamp) : 0;
    const contractTo = tx.to.toLowerCase();

    // Determine transaction type and decode based on function selector
    let txType: 'payment' | 'faucet_claim' | 'staking' | 'treasury' | 'unknown' = 'unknown';
    let functionName = 'unknown';
    let userAddress_tx: string | null = null;
    let recipientAddress: string | null = null;
    let tokenAddress: string | null = null;
    let amountValue: string | null = null;

    // Decode based on function selector
    if (tx.input.startsWith(PAY_FUNCTION_SELECTOR)) {
      // pay() function
      const decoded = decodePay(tx.input);
      if (!decoded) {
        console.log(`[HyperSync] ⚠️ Failed to decode pay() tx: ${tx.hash}`);
        continue;
      }
      userAddress_tx = decoded.from;
      recipientAddress = decoded.to;
      tokenAddress = decoded.token;
      amountValue = decoded.amount;
      txType = 'payment';
      functionName = 'pay';
    } else if (tx.input.startsWith(CLAIM_PYUSD_SELECTOR)) {
      // claimPyusd() function
      const decoded = decodeClaimPyusd(tx.input);
      if (!decoded) {
        console.log(`[HyperSync] ⚠️ Failed to decode claimPyusd() tx: ${tx.hash}`);
        continue;
      }
      userAddress_tx = decoded.claimer;
      recipientAddress = decoded.claimer; // Claimer receives the PYUSD
      tokenAddress = decoded.token;
      amountValue = decoded.amount;
      txType = 'faucet_claim';
      functionName = 'claimPyusd';
    } else if (tx.input.startsWith(CLAIM_MATE_SELECTOR)) {
      // claimMate() function
      const decoded = decodeClaimMate(tx.input);
      if (!decoded) {
        console.log(`[HyperSync] ⚠️ Failed to decode claimMate() tx: ${tx.hash}`);
        continue;
      }
      userAddress_tx = decoded.claimer;
      recipientAddress = decoded.claimer; // Claimer receives the MATE
      tokenAddress = decoded.token;
      amountValue = decoded.amount;
      txType = 'faucet_claim';
      functionName = 'claimMate';
    } else if (tx.input.startsWith(WITHDRAW_SELECTOR)) {
      // withdraw() function - Treasury withdrawal
      const decoded = decodeWithdraw(tx.input);
      if (!decoded) {
        console.log(`[HyperSync] ⚠️ Failed to decode withdraw() tx: ${tx.hash}`);
        continue;
      }
      userAddress_tx = tx.from.toLowerCase(); // Withdrawer (tx sender)
      recipientAddress = decoded.to; // Recipient of withdrawn funds
      tokenAddress = decoded.token;
      amountValue = decoded.amount;
      txType = 'treasury';
      functionName = 'withdraw';
    } else if (tx.input.startsWith(DEPOSIT_SELECTOR)) {
      // deposit() function - Treasury deposit
      const decoded = decodeDeposit(tx.input);
      if (!decoded) {
        console.log(`[HyperSync] ⚠️ Failed to decode deposit() tx: ${tx.hash}`);
        continue;
      }
      userAddress_tx = tx.from.toLowerCase(); // Depositor (tx sender)
      recipientAddress = TREASURY_CONTRACT.toLowerCase(); // Treasury receives deposit
      tokenAddress = decoded.token;
      amountValue = decoded.amount;
      txType = 'treasury';
      functionName = 'deposit';
    } else if (tx.input.startsWith(ADD_BALANCE_SELECTOR)) {
      // addBalance() function - Direct balance addition (admin faucet)
      const decoded = decodeAddBalance(tx.input);
      if (!decoded) {
        console.log(`[HyperSync] ⚠️ Failed to decode addBalance() tx: ${tx.hash}`);
        continue;
      }
      userAddress_tx = decoded.user; // User receiving the balance
      recipientAddress = decoded.user; // Same as user (they receive the tokens)
      tokenAddress = decoded.token;
      amountValue = decoded.amount;
      txType = 'faucet_claim'; // Treat as faucet claim (free tokens)
      functionName = 'addBalance';
    } else if (tx.input.startsWith(RECALCULATE_REWARD_SELECTOR)) {
      // recalculateReward() function - Skip (no transfer involved)
      console.log(`[HyperSync] ℹ️ Skipping recalculateReward tx: ${tx.hash} (no transfer)`);
      continue;
    } else if (tx.input.startsWith(GOLDEN_STAKING_SELECTOR)) {
      // goldenStaking() function - Skip for now (requires signature recovery)
      console.log(`[HyperSync] ℹ️ Skipping goldenStaking tx: ${tx.hash} (not yet supported)`);
      continue;
    } else {
      // Unknown function - skip for now
      console.log(`[HyperSync] ⚠️ Unknown function selector in tx: ${tx.hash} - ${tx.input.slice(0, 10)}`);
      continue;
    }

    // Only include transactions where user is involved (skip filter if address is empty)
    if (userAddr && userAddress_tx !== userAddr && recipientAddress !== userAddr) {
      continue;
    }

    // Skip if we've already processed this transaction hash (avoids duplicates)
    if (seenTxHashes.has(tx.hash)) {
      console.log(`[HyperSync] Skipping duplicate tx: ${tx.hash}`);
      continue;
    }

    seenTxHashes.add(tx.hash);

    transactions.push({
      hash: tx.hash,
      blockNumber: Number(tx.block_number),
      timestamp,
      from: userAddress_tx || '',
      to: recipientAddress || '',
      token: tokenAddress || '',
      amount: amountValue || '0',
      type: userAddress_tx === userAddr ? 'send' : 'receive',
      executedBy: tx.from.toLowerCase(),
      txType,
      functionName,
      gasUsed: tx.gas_used ? tx.gas_used.toString() : undefined,
    });

    if (transactions.length >= limit) break;
  }

  // Process Transfer event logs (Treasury deposits)
  console.log(`[HyperSync] Processing ${result.logs?.length || 0} Transfer logs for Treasury deposits`);
  for (const log of result.logs || []) {
    // Decode Transfer event
    // topic0 = Transfer(address,address,uint256)
    // topic1 = from (indexed, padded address)
    // topic2 = to (indexed, padded address) - should be Treasury
    // data = amount (uint256)

    const from = '0x' + (log.topic1 || '').slice(-40); // Last 40 hex chars = 20 bytes
    const to = '0x' + (log.topic2 || '').slice(-40);
    const amount = BigInt(log.data || '0x0').toString();

    // Verify this is a deposit to Treasury (should always be true due to query filter)
    if (to.toLowerCase() !== TREASURY_CONTRACT.toLowerCase()) {
      console.log(`[HyperSync] ⚠️ Unexpected Transfer recipient: ${to} (expected Treasury)`);
      continue;
    }

    // Only include if user is involved (skip filter if address is empty)
    if (userAddr && from.toLowerCase() !== userAddr && to.toLowerCase() !== userAddr) {
      continue;
    }

    // Skip if we've already processed this transaction hash (avoids duplicates with deposit() function calls)
    if (seenTxHashes.has(log.transaction_hash)) {
      console.log(`[HyperSync] Skipping duplicate Transfer event for tx: ${log.transaction_hash}`);
      continue;
    }

    seenTxHashes.add(log.transaction_hash);

    const block = blockMap.get(Number(log.block_number));
    const timestamp = block ? Number(block.timestamp) : 0;

    transactions.push({
      hash: log.transaction_hash,
      blockNumber: Number(log.block_number),
      timestamp,
      from: from.toLowerCase(),
      to: to.toLowerCase(), // Treasury contract
      token: PYUSD_TOKEN.toLowerCase(),
      amount,
      type: from.toLowerCase() === userAddr ? 'send' : 'receive',
      executedBy: from.toLowerCase(), // User executed this directly (not fisher)
      txType: 'treasury',
      functionName: 'deposit',
      gasUsed: undefined, // Not available from log data
    });

    if (transactions.length >= limit) break;
  }

  console.log(`[HyperSync] Returning ${transactions.length} PayVVM transactions for user ${userAddr.slice(0, 8)}`);
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
