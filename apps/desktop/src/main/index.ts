import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import { AiRouter } from '../../../../packages/ai/router'
import { IPC_AI_ASK, EVENT_AI_STREAM, IpcRequest, AskInput, IpcResponse, IPC_HISTORY_LIST, IPC_HISTORY_SAVE, HistoryListResponse, HistorySaveInput, HistorySession, IPC_AI_STOP, IPC_HISTORY_DELETE_SESSION, HistoryDeleteInput, IPC_HISTORY_RENAME_SESSION, HistoryRenameInput, IPC_HISTORY_PIN_SESSION, HistoryPinInput, EVENT_UPDATE_READY, IPC_UPDATE_INSTALL, IPC_SETTINGS_GET, IPC_SETTINGS_SET, Settings, IPC_SEARCH_MESSAGES, SearchInput, SearchResponse } from '../../../../packages/common/types/ipc'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { Storage } from '../../../../packages/storage/index'

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.js')
    }
  })
  win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(createWindow)
app.whenReady().then(() => {
  autoUpdater.autoDownload = true
  autoUpdater.checkForUpdatesAndNotify()
  autoUpdater.on('update-downloaded', () => {
    if (win) win.webContents.send(EVENT_UPDATE_READY)
  })
})

ipcMain.handle(IPC_AI_ASK, async (event, req: IpcRequest<AskInput>): Promise<IpcResponse<null>> => {
  const controller = new AbortController()
  controllers.set(req.id, controller)
  try {
    const cfgs = buildProviderConfigs(settingsStore.get())
    const router = new AiRouter(cfgs)
    for await (const token of router.ask({ text: req.payload.text, stream: true, signal: controller.signal })) {
      event.sender.send(EVENT_AI_STREAM, token)
    }
    return { id: req.id, ok: true, data: null }
  } catch (e: any) {
    return { id: req.id, ok: false, error: { code: 'ai_error', message: String(e?.message || e) } }
  }
  finally {
    controllers.delete(req.id)
  }
})

const storage = new Storage()
const controllers = new Map<string, AbortController>()
class SettingsStore {
  private file: string
  private data: Settings = {}
  constructor() {
    const dir = app.getPath('userData')
    this.file = join(dir, 'settings.json')
    try {
      if (existsSync(this.file)) {
        const raw = readFileSync(this.file, 'utf-8')
        this.data = JSON.parse(raw || '{}')
      }
    } catch {}
  }
  get(): Settings { return this.data }
  set(s: Settings) {
    this.data = s
    try { writeFileSync(this.file, JSON.stringify(s, null, 2)) } catch {}
  }
}
const settingsStore = new SettingsStore()

function buildProviderConfigs(s: Settings | undefined) {
  const order = s?.providerOrder && s.providerOrder.length ? s.providerOrder : ['openai','ollama']
  const list = [] as Array<{ name: 'openai' | 'ollama' | 'anthropic' | 'gemini'; apiKey?: string; baseUrl?: string; model?: string }>
  for (const name of order) {
    if (name === 'openai') list.push({ name, apiKey: s?.openaiApiKey || process.env.OPENAI_API_KEY, model: 'gpt-3.5-turbo' })
    if (name === 'ollama') list.push({ name, baseUrl: 'http://localhost:11434', model: 'llama3.2' })
  }
  return list
}

ipcMain.handle(IPC_HISTORY_LIST, async (): Promise<IpcResponse<HistoryListResponse>> => {
  return { id: 'list', ok: true, data: { sessions: storage.listSessions() as any } }
})

ipcMain.handle(IPC_HISTORY_SAVE, async (_e, req: IpcRequest<HistorySaveInput>): Promise<IpcResponse<null>> => {
  try {
    storage.saveSession(req.payload.sessionId, req.payload.messages, req.payload.name)
    return { id: req.id, ok: true, data: null }
  } catch (e: any) {
    return { id: req.id, ok: false, error: { code: 'history_error', message: String(e?.message || e) } }
  }
})

ipcMain.handle(IPC_HISTORY_DELETE_SESSION, async (_e, req: IpcRequest<HistoryDeleteInput>): Promise<IpcResponse<null>> => {
  try {
    storage.deleteSession(req.payload.sessionId)
    return { id: req.id, ok: true, data: null }
  } catch (e: any) {
    return { id: req.id, ok: false, error: { code: 'history_delete_error', message: String(e?.message || e) } }
  }
})

ipcMain.handle(IPC_HISTORY_RENAME_SESSION, async (_e, req: IpcRequest<HistoryRenameInput>): Promise<IpcResponse<null>> => {
  try {
    storage.renameSession(req.payload.sessionId, req.payload.name)
    return { id: req.id, ok: true, data: null }
  } catch (e: any) {
    return { id: req.id, ok: false, error: { code: 'history_rename_error', message: String(e?.message || e) } }
  }
})

ipcMain.handle(IPC_HISTORY_PIN_SESSION, async (_e, req: IpcRequest<HistoryPinInput>): Promise<IpcResponse<null>> => {
  try {
    storage.setPinned(req.payload.sessionId, req.payload.pinned)
    return { id: req.id, ok: true, data: null }
  } catch (e: any) {
    return { id: req.id, ok: false, error: { code: 'history_pin_error', message: String(e?.message || e) } }
  }
})

ipcMain.handle(IPC_AI_STOP, async (_e, req: IpcRequest<null>): Promise<IpcResponse<null>> => {
  const c = controllers.get(req.id)
  if (c) c.abort()
  controllers.delete(req.id)
  return { id: req.id, ok: true, data: null }
})
ipcMain.handle(IPC_UPDATE_INSTALL, async (): Promise<IpcResponse<null>> => {
  autoUpdater.quitAndInstall()
  return { id: 'install', ok: true, data: null }
})

ipcMain.handle(IPC_SETTINGS_GET, async (): Promise<IpcResponse<Settings>> => {
  return { id: 'get', ok: true, data: settingsStore.get() }
})

ipcMain.handle(IPC_SETTINGS_SET, async (_e, req: IpcRequest<Settings>): Promise<IpcResponse<null>> => {
  settingsStore.set(req.payload)
  return { id: req.id, ok: true, data: null }
})

ipcMain.handle(IPC_SEARCH_MESSAGES, async (_e, req: IpcRequest<SearchInput>): Promise<IpcResponse<SearchResponse>> => {
  const hits = storage.searchMessages(req.payload.q, req.payload.limit || 20) as any
  return { id: req.id, ok: true, data: { hits } }
})

