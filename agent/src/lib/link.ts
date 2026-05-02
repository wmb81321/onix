import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ENV } from './env.js'

const execFile = promisify(execFileCb)

/** Write Link CLI auth config from LINK_CLI_AUTH env to disk so the binary can authenticate. */
export function initLinkCli(): void {
  if (!ENV.LINK_CLI_AUTH) return
  const dir = join(homedir(), '.config', 'link-cli-nodejs')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'config.json'), ENV.LINK_CLI_AUTH, 'utf8')
  console.log('[link] CLI config initialized from env')
}

async function cli(args: string[]): Promise<unknown> {
  const { stdout } = await execFile('link-cli', [...args, '--format', 'json'], {
    timeout: 15_000,
  })
  return JSON.parse(stdout.trim())
}

export interface SpendRequestResult {
  id: string
  approvalUrl: string
}

export async function createSpendRequest(
  paymentMethodId: string,
  amountCents:     number,
  context:         string,
  testMode:        boolean,
): Promise<SpendRequestResult> {
  const args = [
    'spend-request', 'create',
    '--payment-method-id', paymentMethodId,
    '--amount',            String(amountCents),
    '--merchant-name',     'Convexo P2P',
    '--merchant-url',      'https://convexo.finance',
    '--context',           context,
  ]
  if (testMode) args.push('--test')

  const sr = await cli(args) as { id: string; approval_url?: string }
  return { id: sr.id, approvalUrl: sr.approval_url ?? '' }
}

export async function requestApproval(spendRequestId: string): Promise<void> {
  await cli(['spend-request', 'request-approval', '--id', spendRequestId])
}

export type PollOutcome = 'approved' | 'denied' | 'expired'

export async function pollForApproval(
  spendRequestId:  string,
  timeoutSeconds = 1800,
): Promise<PollOutcome> {
  try {
    const { stdout } = await execFile('link-cli', [
      'spend-request', 'retrieve',
      '--id',       spendRequestId,
      '--interval', '5',
      '--timeout',  String(timeoutSeconds),
      '--format',   'json',
    ], { timeout: (timeoutSeconds + 30) * 1000 })

    const sr = JSON.parse(stdout.trim()) as { status: string }
    if (sr.status === 'approved') return 'approved'
    if (sr.status === 'denied')   return 'denied'
    return 'expired'
  } catch {
    return 'expired'
  }
}

export interface LinkCard {
  number:    string
  cvc:       string
  exp_month: number
  exp_year:  number
  billing_address?: {
    name?:        string
    line1?:       string
    city?:        string
    state?:       string
    postal_code?: string
    country?:     string
  }
}

export async function getCard(spendRequestId: string): Promise<LinkCard> {
  const sr = await cli([
    'spend-request', 'retrieve',
    '--id',      spendRequestId,
    '--include', 'card',
  ]) as { card?: LinkCard }
  if (!sr.card) throw new Error('No card returned from spend request')
  return sr.card
}
