const { build, context } = require('esbuild')
const { mkdirSync, copyFileSync, watch } = require('fs')
const { join } = require('path')

async function run() {
  const watchMode = process.argv.includes('--watch')
  mkdirSync(join(__dirname, '..', 'apps/desktop/dist/main'), { recursive: true })
  mkdirSync(join(__dirname, '..', 'apps/desktop/dist/preload'), { recursive: true })
  mkdirSync(join(__dirname, '..', 'apps/desktop/dist/renderer'), { recursive: true })

  const mainOpts = {
    entryPoints: [join(__dirname, '..', 'apps/desktop/src/main/index.ts')],
    outfile: join(__dirname, '..', 'apps/desktop/dist/main/index.js'),
    platform: 'node',
    target: 'node18',
    bundle: true,
    format: 'cjs',
    external: ['electron', 'better-sqlite3']
  }
  const preloadOpts = {
    entryPoints: [join(__dirname, '..', 'apps/desktop/src/preload/index.ts')],
    outfile: join(__dirname, '..', 'apps/desktop/dist/preload/index.js'),
    platform: 'node',
    target: 'node18',
    bundle: true,
    format: 'cjs',
    external: ['electron']
  }

  if (watchMode) {
    const mc = await context(mainOpts)
    await mc.watch()
    const pc = await context(preloadOpts)
    await pc.watch()
    const srcDir = join(__dirname, '..', 'apps/desktop/src/renderer')
    const outDir = join(__dirname, '..', 'apps/desktop/dist/renderer')
    const copyAll = () => {
      copyFileSync(join(srcDir, 'index.html'), join(outDir, 'index.html'))
      copyFileSync(join(srcDir, 'main.js'), join(outDir, 'main.js'))
    }
    copyAll()
    watch(srcDir, { recursive: true }, () => copyAll())
  } else {
    await build(mainOpts)
    await build(preloadOpts)
    copyFileSync(
      join(__dirname, '..', 'apps/desktop/src/renderer/index.html'),
      join(__dirname, '..', 'apps/desktop/dist/renderer/index.html')
    )
    copyFileSync(
      join(__dirname, '..', 'apps/desktop/src/renderer/main.js'),
      join(__dirname, '..', 'apps/desktop/dist/renderer/main.js')
    )
  }
}

run().catch(err => {
  console.error(err)
  process.exitCode = 1
})

