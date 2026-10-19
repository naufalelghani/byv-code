/**
 * Web Backend Server — Fase A
 *
 * Bun HTTP server yang bertindak sebagai proxy API antara Next.js frontend
 * dan Claude Code backend services. Semua API calls ke Anthropic melewati
 * server ini untuk menjaga API key tetap server-side.
 *
 * Scope: internal subscribers dan 3P (Bedrock/Vertex/Foundry) saja.
 * 1P (direct Anthropic API) tidak termasuk dalam web version ini.
 *
 * Endpoints:
 *   GET  /api/auth/status  — return auth + subscription info
 *   GET  /api/models       — return model catalog (3P + internal only)
 *   POST /api/chat         — SSE stream endpoint
 *   GET  /health           — health check
 */

import type { ModelOption } from '../../src/utils/model/modelOptions.js'
import { getAPIProvider } from '../../src/utils/model/providers.js'
import { getAuthTokenSource, getSubscriptionType, isInternalSubscriber } from '../../src/utils/auth.js'
import { getModelOptions } from '../../src/utils/model/modelOptions.js'
import { modelSupportsThinking } from '../../src/utils/thinking.js'
import { modelSupportsEffort } from '../../src/utils/effort.js'
import { enableConfigs } from '../../src/utils/config.js'
import { getInitialSettings } from '../../src/utils/settings/settings.js'

const PORT = Number(process.env.PORT || 5000)
const ORIGIN = process.env.ORIGIN || `http://localhost:${PORT}`

// CORS headers for dev (frontend runs on :3000)
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

type ChatRequest = {
  model: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  thinking?: 'on' | 'off' | 'adaptive'
  effort?: 'low' | 'medium' | 'high' | 'max'
  maxTokens?: number
}

// Extend ModelOption with capability flags for frontend convenience
type ExtendedModelOption = ModelOption & {
  supportsThinking: boolean
  supportsEffort: boolean
}

function withCors(headers: Record<string, string>): Record<string, string> {
  return { ...CORS_HEADERS, ...headers }
}

/**
 * GET /api/auth/status
 * Returns authentication and subscription information.
 * Scope: internal subscribers and 3P providers only.
 */
function handleAuthStatus(_req: Request): Response {
  const authSource = getAuthTokenSource()
  const provider = getAPIProvider()
  const subscriptionType = getSubscriptionType()
  const isInternal = isInternalSubscriber()

  return new Response(
    JSON.stringify({
      authenticated: authSource.hasToken,
      authSource: authSource.source,
      subscriptionType,
      provider,
      isInternal,
      // Only internal + 3P are in scope for web version
      inScope: isInternal || provider !== 'firstParty',
    }),
    {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    },
  )
}

/**
 * GET /api/models
 * Returns model catalog with capability flags.
 * Mirrors getModelOptions() from src/utils/model/modelOptions.ts —
 * subscriber type, provider, and allowlist gating apply identically.
 *
 * Note: modelSupportsThinking and modelSupportsEffort in the CLI codebase
 * have a dependency on resolveAntModel that is not properly imported in some
 * builds. We wrap calls in try/catch and fall back to false to ensure
 * the server remains usable even if the underlying utility throws.
 */
function safeModelSupportsThinking(model: string): boolean {
  try {
    return modelSupportsThinking(model)
  } catch (e) {
    console.error('[backend] modelSupportsThinking failed for', model, e)
    return false
  }
}

function safeModelSupportsEffort(model: string): boolean {
  try {
    return modelSupportsEffort(model)
  } catch (e) {
    console.error('[backend] modelSupportsEffort failed for', model, e)
    return false
  }
}

function handleModels(_req: Request): Response {
  try {
    const options = getModelOptions()
    // Enrich with capability flags
    const extended: ExtendedModelOption[] = options.map((opt) => ({
      ...opt,
      supportsThinking: opt.value ? safeModelSupportsThinking(opt.value) : false,
      supportsEffort: opt.value ? safeModelSupportsEffort(opt.value) : false,
    }))

    return new Response(JSON.stringify(extended), {
      status: 200,
      headers: withCors({ 'Content-Type': 'application/json' }),
    })
  } catch (error) {
    console.error('[backend] Error fetching models:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch models' }),
      {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      },
    )
  }
}

/**
 * POST /api/chat
 * SSE stream endpoint. Proxies to Anthropic Messages API.
 *
 * TODO: Full implementation will use getAnthropicClient() +
 * client.messages.create({ stream: true }). For Phase A scaffold,
 * returns a simple streaming response for testing.
 */
async function handleChat(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as ChatRequest | null

  if (!body || !body.model) {
    return new Response(
      JSON.stringify({ error: 'model and messages are required' }),
      {
        status: 400,
        headers: withCors({ 'Content-Type': 'application/json' }),
      },
    )
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Simulate streaming response
  const simulate = async () => {
    try {
      // Fase B: emit thinking_started before content
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'thinking_started' })}\n\n`,
        ),
      )

      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'message_start', model: body.model })}\n\n`,
        ),
      )

      const response =
        'Hello from web! Full streaming API integration coming in the complete implementation.'
      for (const word of response.split(' ')) {
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'content_block_delta', text: word + ' ' })}\n\n`,
          ),
        )
      }

      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'message_stop' })}\n\n`,
        ),
      )

      // Fase B: emit thinking_stopped after content finishes
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'thinking_stopped' })}\n\n`,
        ),
      )
    } catch (e) {
      console.error('[backend] Stream error:', e)
    } finally {
      writer.close()
    }
  }

  simulate()

  return new Response(stream.readable, {
    status: 200,
    headers: withCors({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }),
  })
}

/**
 * POST /api/search — Fase D
 * Performs web search with citations toggle support.
 * In full impl, calls getAnthropicClient() + web search tool.
 * For scaffold, returns mock results.
 */
async function handleSearch(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as {
    query: string
    thinking?: boolean
  } | null

  if (!body || !body.query) {
    return new Response(
      JSON.stringify({ error: 'query is required' }),
      { status: 400, headers: withCors({ 'Content-Type': 'application/json' }) },
    )
  }

  console.log('[backend] Search query:', body.query)

  // Mock search results — scaffold placeholder
  const results = [
    {
      title: `Result 1 for "${body.query}"`,
      url: 'https://example.com/doc1',
      snippet: 'This is a mock search result snippet. Full search integration coming.',
    },
    {
      title: `Result 2 for "${body.query}"`,
      url: 'https://example.com/doc2',
      snippet: 'Another mock snippet with citation support.',
    },
  ]

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: withCors({ 'Content-Type': 'application/json' }),
  })
}

/**
 * GET /api/mcp/servers, POST /api/mcp/servers, DELETE /api/mcp/servers/:id — Fase E
 * Manages MCP server connections.
 */
const mcpServers: { id: string; name: string; url: string; connected: boolean }[] = [
  { id: '1', name: 'context-server', url: 'http://localhost:8080', connected: false },
  { id: '2', name: 'docs-server', url: 'http://localhost:8081', connected: true },
]

function handleMcp(req: Request, url: URL): Response {
  const pathParts = url.pathname.split('/')
  const serverId = pathParts[3]

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ servers: mcpServers }),
      { status: 200, headers: withCors({ 'Content-Type': 'application/json' }) },
    )
  }

  if (req.method === 'POST' && pathParts.length === 3) {
    return new Response(
      JSON.stringify({ success: true, message: 'MCP server added (scaffold)' }),
      { status: 201, headers: withCors({ 'Content-Type': 'application/json' }) },
    )
  }

  if (req.method === 'DELETE' && serverId) {
    return new Response(
      JSON.stringify({ success: true, message: `MCP server ${serverId} removed` }),
      { status: 200, headers: withCors({ 'Content-Type': 'application/json' }) },
    )
  }

  if (req.method === 'POST' && pathParts[3] && pathParts[4] === 'toggle') {
    const server = mcpServers.find((s) => s.id === pathParts[3])
    if (server) {
      server.connected = !server.connected
      return new Response(
        JSON.stringify({ success: true, connected: server.connected }),
        { status: 200, headers: withCors({ 'Content-Type': 'application/json' }) },
      )
    }
  }

  return new Response(
    JSON.stringify({ error: `Unknown MCP route: ${url.pathname}` }),
    { status: 404, headers: withCors({ 'Content-Type': 'application/json' }) },
  )
}

function handleOptions(_req: Request): Response {
  return new Response(null, { status: 204, headers: withCors({}) })
}

/**
 * Health check — verifies configs can load
 */
function handleHealth(_req: Request): Response {
  try {
    const settings = getInitialSettings()
    const provider = getAPIProvider()
    return new Response(
      JSON.stringify({
        status: 'ok',
        provider,
        hasSettings: !!settings,
      }),
      {
        status: 200,
        headers: withCors({ 'Content-Type': 'application/json' }),
      },
    )
  } catch (error) {
    console.error('[backend] Health check error:', error)
    return new Response(
      JSON.stringify({ status: 'error', error: String(error) }),
      {
        status: 500,
        headers: withCors({ 'Content-Type': 'application/json' }),
      },
    )
  }
}

async function main() {
  // Load configs (settings, auth context, etc.)
  enableConfigs()

  console.log(`[backend] Web server starting on ${ORIGIN}`)
  console.log(`[backend] Provider: ${getAPIProvider()}`)

  const server = Bun.serve({
    port: PORT,
    async fetch(req: Request) {
      const url = new URL(req.url)

      if (req.method === 'OPTIONS') {
        return handleOptions(req)
      }

      switch (url.pathname) {
        case '/api/auth/status':
          return handleAuthStatus(req)

        case '/api/models':
          return handleModels(req)

        case '/api/chat':
          return handleChat(req)

        case '/api/search':
          return handleSearch(req)

        case '/api/mcp/servers':
        case '/api/mcp/servers/':
          if (req.method === 'GET') return handleMcp(req, url)
          if (req.method === 'POST') return handleMcp(req, url)
          return handleOptions(req)
        default:
          // Handle /api/mcp/servers/:id and /api/mcp/servers/:id/toggle
          if (url.pathname.startsWith('/api/mcp/servers/')) {
            return handleMcp(req, url)
          }
          if (req.method === 'OPTIONS') {
            return handleOptions(req)
          }
          return new Response(
            JSON.stringify({ error: `Unknown route: ${url.pathname}` }),
            {
              status: 404,
              headers: withCors({ 'Content-Type': 'application/json' }),
            },
          )

        default:
          return new Response(
            JSON.stringify({ error: `Unknown route: ${url.pathname}` }),
            {
              status: 404,
              headers: withCors({ 'Content-Type': 'application/json' }),
            },
          )
      }
    },
  })

  console.log(`[backend] Ready at ${ORIGIN}`)
  console.log(`[backend] Endpoints: /api/auth/status, /api/models, /api/chat, /health`)
}

main().catch((err) => {
  console.error('[backend] Fatal error:', err)
  process.exit(1)
})
