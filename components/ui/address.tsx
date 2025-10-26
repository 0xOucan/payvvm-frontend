"use client"

import { useState } from "react"
import { Address as AddressType, getAddress, isAddress } from "viem"
import { Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AddressProps = {
  address?: AddressType
  disableAddressLink?: boolean
  format?: "short" | "long"
  size?: "xs" | "sm" | "base" | "lg" | "xl"
  className?: string
}

export const Address = ({
  address,
  disableAddressLink = false,
  format = "short",
  size = "base",
  className,
}: AddressProps) => {
  const [isCopied, setIsCopied] = useState(false)

  if (!address) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-muted rounded h-4 w-32"></div>
      </div>
    )
  }

  if (!isAddress(address)) {
    return <span className="text-destructive">Invalid address</span>
  }

  const checkSumAddress = getAddress(address)
  const shortAddress = `${checkSumAddress.slice(0, 6)}...${checkSumAddress.slice(-4)}`
  const displayAddress = format === "long" ? checkSumAddress : shortAddress

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(checkSumAddress)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const blockExplorerLink = `https://sepolia.etherscan.io/address/${checkSumAddress}`

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }

  const iconSizeClasses = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    base: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  }

  return (
    <div className={cn("flex items-center gap-1.5 font-mono", className)}>
      <span className={sizeClasses[size]}>
        {!disableAddressLink ? (
          <a
            href={blockExplorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            {displayAddress}
            <ExternalLink className={iconSizeClasses[size]} />
          </a>
        ) : (
          displayAddress
        )}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-auto w-auto p-1", iconSizeClasses[size])}
        onClick={handleCopy}
      >
        {isCopied ? (
          <Check className={iconSizeClasses[size]} />
        ) : (
          <Copy className={iconSizeClasses[size]} />
        )}
      </Button>
    </div>
  )
}
