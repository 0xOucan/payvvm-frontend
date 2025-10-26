import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Balance {
  symbol: string
  amount: string
}

interface BalanceCardProps {
  title: string
  tokens: Balance[]
}

export function BalanceCard({ title, tokens }: BalanceCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-primary/50">
      <CardHeader>
        <CardTitle className="text-sm font-mono">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokens.map((token) => (
          <div key={token.symbol} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{token.symbol}</span>
            <span className="font-mono font-semibold">{token.amount}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
