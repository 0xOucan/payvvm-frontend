export const mockBalancesEVVM = [
  { symbol: "PYUSD", amount: "250.00", decimals: 6 },
  { symbol: "MATE", amount: "1234.56", decimals: 18 },
]

export const mockBalancesNative = [{ symbol: "ETH", amount: "0.1234", decimals: 18 }]

export const mockTxs = [
  { id: "tx_1", type: "payment", token: "PYUSD", amount: "19.99", counterparty: "vitalik.eth", time: "2m" },
  { id: "tx_2", type: "invoice", token: "PYUSD", amount: "42.00", counterparty: "team.batch", time: "1h" },
  { id: "tx_3", type: "payment", token: "PYUSD", amount: "5.50", counterparty: "0x1234...5678", time: "3h" },
  { id: "tx_4", type: "dispersal", token: "MATE", amount: "100.00", counterparty: "payroll.evvm", time: "1d" },
  { id: "tx_5", type: "payment", token: "PYUSD", amount: "75.25", counterparty: "alice.eth", time: "2d" },
]

export interface Balance {
  symbol: string
  amount: string
  decimals: number
}

export interface Transaction {
  id: string
  type: "payment" | "invoice" | "dispersal"
  token: string
  amount: string
  counterparty: string
  time: string
}
