import { contextBridge, ipcRenderer } from 'electron'
import { IPC_AI_ASK, EVENT_AI_STREAM, IpcRequest, AskInput, IPC_HISTORY_LIST, IPC_HISTORY_SAVE, HistorySaveInput, HistoryListResponse, IPC_AI_STOP, IPC_HISTORY_DELETE_SESSION, IPC_HISTORY_RENAME_SESSION, HistoryDeleteInput, HistoryRenameInput, IPC_HISTORY_PIN_SESSION, HistoryPinInput, EVENT_UPDATE_READY, IPC_UPDATE_INSTALL, IPC_SETTINGS_GET, IPC_SETTINGS_SET, Settings, IPC_SEARCH_MESSAGES, SearchInput, SearchResponse } from '../../../../packages/common/types/ipc'

type Selection = { text: string }
type PageInfo = { title: string; url: string }

const bridge = {
  selection: {
    get(): Promise<Selection> {
      return Promise.resolve({ text: '' })
    }
  },
  page: {
    info(): Promise<PageInfo> {
      return Promise.resolve({ title: '', url: '' })
    }
  },
  ai: {
    ask(input: AskInput): Promise<string> {
      const id = String(Date.now())
      const req: IpcRequest<AskInput> = { id, payload: input }
      return ipcRenderer.invoke(IPC_AI_ASK, req).then((res: any) => {
        if (!res?.ok) throw new Error(res?.error?.message || 'ask_failed')
        return id
      })
    },
    onStream(cb: (token: string) => void) {
      ipcRenderer.removeAllListeners(EVENT_AI_STREAM)
      ipcRenderer.on(EVENT_AI_STREAM, (_e, token: string) => cb(token))
    },
    stop(id: string): Promise<void> {
      const req: IpcRequest<null> = { id, payload: null as any }
      return ipcRenderer.invoke(IPC_AI_STOP, req)
    }
  },
  history: {
    list(): Promise<HistoryListResponse> {
      return ipcRenderer.invoke(IPC_HISTORY_LIST)
    },
    save(input: HistorySaveInput): Promise<void> {
      const req: IpcRequest<HistorySaveInput> = { id: String(Date.now()), payload: input }
      return ipcRenderer.invoke(IPC_HISTORY_SAVE, req)
    },
    deleteSession(input: HistoryDeleteInput): Promise<void> {
      const req: IpcRequest<HistoryDeleteInput> = { id: String(Date.now()), payload: input }
      return ipcRenderer.invoke(IPC_HISTORY_DELETE_SESSION, req)
    },
    renameSession(input: HistoryRenameInput): Promise<void> {
      const req: IpcRequest<HistoryRenameInput> = { id: String(Date.now()), payload: input }
      return ipcRenderer.invoke(IPC_HISTORY_RENAME_SESSION, req)
    },
    pinSession(input: HistoryPinInput): Promise<void> {
      const req: IpcRequest<HistoryPinInput> = { id: String(Date.now()), payload: input }
      return ipcRenderer.invoke(IPC_HISTORY_PIN_SESSION, req)
    }
  },
  update: {
    onReady(cb: () => void) {
      ipcRenderer.on(EVENT_UPDATE_READY, () => cb())
    },
    install(): Promise<void> {
      const req: IpcRequest<null> = { id: 'install', payload: null as any }
      return ipcRenderer.invoke(IPC_UPDATE_INSTALL, req)
    }
  },
  settings: {
    get(): Promise<Settings> {
      return ipcRenderer.invoke(IPC_SETTINGS_GET)
    },
    set(s: Settings): Promise<void> {
      const req: IpcRequest<Settings> = { id: String(Date.now()), payload: s }
      return ipcRenderer.invoke(IPC_SETTINGS_SET, req)
    }
  },
  search: {
    messages(input: SearchInput): Promise<SearchResponse> {
      const req: IpcRequest<SearchInput> = { id: String(Date.now()), payload: input }
      return ipcRenderer.invoke(IPC_SEARCH_MESSAGES, req)
    }
  }
}

contextBridge.exposeInMainWorld('bridge', bridge)
