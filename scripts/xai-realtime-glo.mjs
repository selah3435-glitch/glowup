// npm install ws
import WebSocket from 'ws'

const agentId = process.env.XAI_AGENT_ID || '00929ede-1eb1-4a74-9221-dd69617071f9'
const apiKey = process.env.XAI_API_KEY

if (!apiKey) {
  console.error('Set XAI_API_KEY first, e.g.  $env:XAI_API_KEY = "xai-..."')
  process.exit(1)
}

const ws = new WebSocket(`wss://api.x.ai/v1/realtime?agent_id=${agentId}`, {
  headers: { Authorization: `Bearer ${apiKey}` },
})

ws.on('open', () => {
  console.log('open → sending Hello!')
  ws.send(
    JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: 'Hello!' }],
      },
    }),
  )
  ws.send(JSON.stringify({ type: 'response.create' }))
})

ws.on('message', (raw) => {
  const event = JSON.parse(raw.toString())
  if (event.type === 'response.output_audio_transcript.delta') {
    process.stdout.write(event.delta)
  } else if (event.type === 'response.output_audio.delta') {
    const pcm = Buffer.from(event.delta, 'base64') // decode and play
    // pcm available for your audio pipeline
    void pcm
  } else if (event.type === 'error' || event.error) {
    console.error('\nerror', JSON.stringify(event, null, 2))
  } else if (event.type === 'response.done' || event.type === 'response.completed') {
    process.stdout.write('\n')
    console.log('(response done)')
  }
})

ws.on('error', (err) => console.error('ws error:', err.message))
ws.on('close', (code, reason) => {
  console.log('closed', code, reason?.toString?.() || '')
})
