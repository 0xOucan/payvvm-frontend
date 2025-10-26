export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold font-mono mb-8">Privacy Policy</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
        <p>This is a placeholder privacy policy page for PayVVM.</p>
        <p>
          PayVVM is a demo application for testing EVVM-powered gasless PYUSD payments. No personal data is collected or
          stored by this application beyond what is necessary for blockchain interactions.
        </p>
        <p>All transactions are recorded on the Sepolia testnet and are publicly visible.</p>
      </div>
    </div>
  )
}
