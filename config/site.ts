export const siteConfig = {
  name: "PayVVM",
  title: "PayVVM - Gasless PYUSD Wallet",
  description: "Gasless PYUSD payments powered by EVVM. Smart-contract native. No new infra. Data powered by Envio HyperSync.",
  links: {
    docs: {
      evvm: process.env.NEXT_PUBLIC_DOCS_EVVM || "https://www.evvm.info/docs/EVVM/Introduction",
      hypersync:
        process.env.NEXT_PUBLIC_DOCS_HYPERSYNC || "https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete",
    },
    github: "https://github.com/payvvm",
    twitter: "https://twitter.com/payvvm",
  },
  disclaimer: "⚠️ Runs on EVVM Test Networks for demonstration. Use at your own risk.",
}
