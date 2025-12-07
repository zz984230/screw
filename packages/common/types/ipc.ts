export type IpcRequest<T> = { id: string; payload: T }
export type IpcResponse<T> = { id: string; ok: boolean; data?: T; error?: { code: string; message: string } }

export type AskInput = { text: string; sessionId?: string; stream?: boolean }
export type StreamChunk = { type: 'token' | 'end' | 'error'; data?: string }

export type CreateSessionInput = { name?: string }
export type Message = { id: string; sessionId: string; role: 'user' | 'assistant'; content: string; ts: number }
export type Session = { id: string; name: string; createdAt: number }

export const IPC_AI_ASK = 'ipc://ai/ask'
export const EVENT_AI_STREAM = 'event://ai/stream'
export const IPC_AI_STOP = 'ipc://ai/stop'
export const IPC_HISTORY_LIST = 'ipc://history/list'
export const IPC_HISTORY_SAVE = 'ipc://history/save'
export const IPC_HISTORY_DELETE_SESSION = 'ipc://history/delete-session'
export const IPC_HISTORY_RENAME_SESSION = 'ipc://history/rename-session'

export type HistoryMessage = { role: 'user' | 'assistant'; content: string; ts: number; pinned?: boolean }
export type HistorySession = { id: string; name?: string; createdAt: number; messages: HistoryMessage[]; pinned?: boolean }
export type HistoryListResponse = { sessions: HistorySession[] }
export type HistorySaveInput = { sessionId: string; messages: HistoryMessage[]; name?: string }
export const IPC_HISTORY_PIN_SESSION = 'ipc://history/pin-session'
export type HistoryPinInput = { sessionId: string; pinned: boolean }
export type HistoryDeleteInput = { sessionId: string }
export type HistoryRenameInput = { sessionId: string; name: string }
export const EVENT_UPDATE_READY = 'event://update/ready'
export const IPC_UPDATE_INSTALL = 'ipc://update/install'
export const IPC_SETTINGS_GET = 'ipc://settings/get'
export const IPC_SETTINGS_SET = 'ipc://settings/set'
export type Settings = { openaiApiKey?: string; providerOrder?: Array<'openai' | 'ollama' | 'anthropic' | 'gemini'> }
export const IPC_SEARCH_MESSAGES = 'ipc://search/messages'
export type SearchInput = { q: string; limit?: number }
export type SearchHit = { sessionId: string; ts: number; role: 'user' | 'assistant'; content: string }
export type SearchResponse = { hits: SearchHit[] }
