/**
 * Virtual Address utilities for per-trade deposit addresses.
 *
 * One-time setup:  npx tsx src/tempo/virtualAddresses.ts --setup
 * Verify:          npx tsx src/tempo/virtualAddresses.ts --verify
 *
 * How it works:
 *  - Agent registers ONE master wallet (VirtualMaster.mineSaltAsync)
 *  - Per trade, a unique deposit address is derived OFF-CHAIN (free, instant)
 *  - Sender sends TIP-20 USDC to deposit address → auto-forwards to master wallet
 *  - Transfer events record both virtual address + master for attribution
 *
 * After mining, you must register on-chain:
 *   cast send <TIP1022_REGISTRY> "registerVirtualMaster(bytes32)" <salt> \
 *     --private-key <AGENT_PRIVATE_KEY> --rpc-url $TEMPO_TESTNET_RPC_URL
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../../.env') })

import { VirtualAddress } from 'ox/tempo'
import { keccak256, toBytes, toHex } from 'viem'

export function deriveDepositAddress(masterId: `0x${string}`, entityId: string): `0x${string}` {
  // Hash entityId (order ID or any UUID) to get a deterministic 6-byte userTag
  const hash = keccak256(toBytes(entityId))
  const userTag = toHex(toBytes(hash).slice(0, 6))
  return VirtualAddress.from({ masterId, userTag }) as `0x${string}`
}

if (process.argv.includes('--setup')) {
  const { VirtualMaster } = await import('ox/tempo')

  const masterId = process.env.AGENT_MASTER_ID
  if (masterId) {
    console.log('AGENT_MASTER_ID already set:', masterId)
    console.log('Re-run with --verify to check derived addresses.')
    process.exit(0)
  }

  const masterAddress = process.env.AGENT_MASTER_ADDRESS
  if (!masterAddress) {
    console.error('Set AGENT_MASTER_ADDRESS to your agent wallet address before running --setup')
    process.exit(1)
  }

  console.log('Mining virtual address master salt — this takes 30–90s...')
  console.log('Master address:', masterAddress)

  // Default count (2^32 ≈ 4.3B) may not find a salt for all addresses.
  // Start from the first range and extend if needed by incrementing start.
  const startHex = process.env.MINE_START ? BigInt(process.env.MINE_START) : 0n
  const countArg = process.env.MINE_COUNT ? Number(process.env.MINE_COUNT) : 2 ** 32

  if (startHex > 0n) console.log(`Resuming from salt ${startHex.toString(16)}...`)

  const result = await VirtualMaster.mineSaltAsync({
    address: masterAddress as `0x${string}`,
    start: startHex,
    count: countArg,
    onProgress: (p) => {
      if (p.attempts % 5_000_000 === 0) {
        const total = Number(startHex) + p.attempts
        process.stdout.write(`  ${(total / 1_000_000).toFixed(0)}M attempts, ${p.rate.toFixed(0)} h/s\r`)
      }
    },
  })

  if (!result) {
    const nextStart = startHex + BigInt(countArg)
    console.error(`\nNo salt found in this range. Re-run with:`)
    console.error(`  MINE_START=${nextStart} npx tsx src/tempo/virtualAddresses.ts --setup`)
    process.exit(1)
  }

  console.log('\n\n✓ Salt mined!')
  console.log(`\nAdd to .env:\n  AGENT_MASTER_ID=${result.masterId}`)
  console.log(`\nRegister on-chain (run once on testnet, then mainnet):`)
  console.log(`  cast send <TIP1022_REGISTRY_ADDRESS> "registerVirtualMaster(bytes32)" ${result.salt} \\`)
  console.log(`    --private-key <AGENT_PRIVATE_KEY> --rpc-url $TEMPO_TESTNET_RPC_URL`)
  console.log(`\nRegistration hash: ${result.registrationHash}`)
}

if (process.argv.includes('--verify')) {
  const masterId = process.env.AGENT_MASTER_ID as `0x${string}` | undefined
  if (!masterId) throw new Error('AGENT_MASTER_ID not set — run --setup first')

  const testIds = ['test-order-001', 'test-order-002', 'test-order-003']
  console.log(`Derived deposit addresses (masterId=${masterId}):`)
  for (const id of testIds) {
    console.log(`  ${id} → ${deriveDepositAddress(masterId, id)}`)
  }
}
