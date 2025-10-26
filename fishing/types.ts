/**
 * TypeScript types for fisher bot
 */

export interface PaymentData {
  from: string;
  to_address: string;
  to_identity: string;
  token: string;
  amount: bigint;
  priorityFee: bigint;
  nonce: bigint;
  priorityFlag: boolean;
  executor: string;
  signature: string;
}

export interface FisherConfig {
  privateKey: string;
  enabled: boolean;
  minPriorityFee: bigint;
  gasLimit: number;
  rpcUrl: string;
  wsUrl?: string;
}

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
  priorityFeeEarned?: bigint;
}

export interface FisherStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalMateEarned: bigint;
  totalGasSpent: bigint;
  startTime: number;
  lastExecution: number | null;
}
