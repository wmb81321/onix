import { createConfig, http } from 'wagmi'
import { tempoModerato } from 'viem/chains'
import { tempoWallet } from 'wagmi/tempo'

export const wagmiConfig = createConfig({
  chains: [tempoModerato],
  connectors: [tempoWallet()],
  transports: {
    [tempoModerato.id]: http(process.env.NEXT_PUBLIC_TEMPO_RPC_URL ?? 'https://rpc.moderato.tempo.xyz'),
  },
})
