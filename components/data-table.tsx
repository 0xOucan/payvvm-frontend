"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Transaction } from "@/lib/mock"

interface DataTableProps {
  data: Transaction[]
  onRowClick: (item: Transaction) => void
}

export function DataTable({ data, onRowClick }: DataTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono">Type</TableHead>
            <TableHead className="font-mono">Counterparty</TableHead>
            <TableHead className="font-mono">Token</TableHead>
            <TableHead className="font-mono text-right">Amount</TableHead>
            <TableHead className="font-mono">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(item)}
              >
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs capitalize">
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.counterparty}</TableCell>
                <TableCell className="font-mono text-sm">{item.token}</TableCell>
                <TableCell className="font-mono text-sm text-right">{item.amount}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.time} ago</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
