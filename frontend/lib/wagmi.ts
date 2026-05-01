import { createConfig, http } from 'wagmi'
import { tempo } from 'viem/chains'
import { tempoWallet } from 'wagmi/tempo'

export const wagmiConfig = createConfig({
  chains: [tempo],
  connectors: [tempoWallet()],
  transports: {
    [tempo.id]: http(process.env.NEXT_PUBLIC_TEMPO_RPC_URL ?? 'https://rpc.tempo.xyz'),
  },
})

export { tempo }
