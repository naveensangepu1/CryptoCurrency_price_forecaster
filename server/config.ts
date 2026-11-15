export interface CoinMeta {
  symbol: string;
  ticker: string;
  yf_symbol: string;
  name: string;
  color: string;
  category: string;
  description: string;
}

export const SUPPORTED_COINS: Record<string, CoinMeta> = {
  "BTC-USD": { symbol: "BTC-USD", ticker: "BTC", yf_symbol: "BTC-USD", name: "Bitcoin", color: "#F7931A", category: "Layer 1 / Digital Gold", description: "Decentralized peer-to-peer cryptocurrency and the leading store of value in digital assets." },
  "ETH-USD": { symbol: "ETH-USD", ticker: "ETH", yf_symbol: "ETH-USD", name: "Ethereum", color: "#627EEA", category: "Smart Contracts & DeFi", description: "Global decentralized platform for smart contracts, decentralized applications, and DeFi." },
  "BNB-USD": { symbol: "BNB-USD", ticker: "BNB", yf_symbol: "BNB-USD", name: "BNB", color: "#F3BA2F", category: "Ecosystem & Exchange", description: "Native ecosystem token powering the BNB Chain and Binance exchange ecosystem." },
  "MATIC-USD": { symbol: "MATIC-USD", ticker: "MATIC", yf_symbol: "POL28321-USD", name: "Polygon", color: "#8247E5", category: "Layer 2 Scaling", description: "Ethereum layer-2 scaling solution designed for lower fees and high throughput." },
  "SOL-USD": { symbol: "SOL-USD", ticker: "SOL", yf_symbol: "SOL-USD", name: "Solana", color: "#14F195", category: "High-Speed Layer 1", description: "High-performance blockchain with proof-of-history consensus optimized for speed." },
  "DOGE-USD": { symbol: "DOGE-USD", ticker: "DOGE", yf_symbol: "DOGE-USD", name: "Dogecoin", color: "#C2A633", category: "Payment & Community", description: "Open-source peer-to-peer cryptocurrency popular for microtransactions and tipping." },
  "ATOM-USD": { symbol: "ATOM-USD", ticker: "ATOM", yf_symbol: "ATOM-USD", name: "Cosmos", color: "#2E3148", category: "Interoperability / IBC", description: "Network of independent interoperable blockchains communicating via IBC protocol." },
  "TRX-USD": { symbol: "TRX-USD", ticker: "TRX", yf_symbol: "TRX-USD", name: "TRON", color: "#FF060A", category: "High-Volume Payments & DeFi", description: "Decentralized blockchain operating system with high throughput and major stablecoin volume." },
};

export const VALID_RANGES: Record<string, { period: string; interval: string }> = {
  "7D": { period: "7d", interval: "1h" },
  "1M": { period: "1mo", interval: "1d" },
  "3M": { period: "3mo", interval: "1d" },
  "6M": { period: "6mo", interval: "1d" },
  "1Y": { period: "1y", interval: "1d" },
  ALL: { period: "max", interval: "1wk" },
};

export const DEFAULT_USD_INR_RATE = 84.56;
