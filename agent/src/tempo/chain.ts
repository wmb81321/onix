import { createPublicClient, createWalletClient, defineChain, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ENV } from '../lib/env.js'

const rpcUrl = ENV.TEMPO_TESTNET_RPC_URL ?? ENV.TEMPO_RPC_URL

export const tempoChain = defineChain({
  id: ENV.TEMPO_CHAIN_ID,
  name: 'Tempo Moderato',
  nativeCurrency: { name: 'PathUSD', symbol: 'pathUSD', decimals: 6 },
  rpcUrls: { default: { http: [rpcUrl] } },
})

export const publicClient = createPublicClient({
  chain: tempoChain,
  transport: http(rpcUrl),
})

// EOA that holds the virtual address master registration and signs USDC transfers
export const agentAccount = privateKeyToAccount(ENV.AGENT_ACCESS_KEY as `0x${string}`)

export const walletClient = createWalletClient({
  account: agentAccount,
  chain: tempoChain,
  transport: http(rpcUrl),
})
