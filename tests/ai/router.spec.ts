import { AiRouter } from '../../packages/ai/router'

class MockProvider {
  async *ask() {
    yield 'a'
    yield 'b'
    yield 'c'
  }
}

async function collect(it: AsyncIterable<string>) {
  const out: string[] = []
  for await (const x of it) out.push(x)
  return out.join('')
}

async function run() {
  const router = new AiRouter([] as any)
  ;(router as any).providers = [new MockProvider()]
  const res = await collect(router.ask({ text: 'hi' }))
  if (res !== 'abc') throw new Error('fail')
}

run().catch(e => {
  process.exitCode = 1
})
