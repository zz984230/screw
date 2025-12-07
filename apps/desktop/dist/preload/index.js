"use strict";

// apps/desktop/src/preload/index.ts
var import_electron = require("electron");

// packages/common/types/ipc.ts
var IPC_AI_ASK = "ipc://ai/ask";
var EVENT_AI_STREAM = "event://ai/stream";
var IPC_AI_STOP = "ipc://ai/stop";
var IPC_HISTORY_LIST = "ipc://history/list";
var IPC_HISTORY_SAVE = "ipc://history/save";
var IPC_HISTORY_DELETE_SESSION = "ipc://history/delete-session";
var IPC_HISTORY_RENAME_SESSION = "ipc://history/rename-session";
var IPC_HISTORY_PIN_SESSION = "ipc://history/pin-session";
var EVENT_UPDATE_READY = "event://update/ready";
var IPC_UPDATE_INSTALL = "ipc://update/install";
var IPC_SETTINGS_GET = "ipc://settings/get";
var IPC_SETTINGS_SET = "ipc://settings/set";
var IPC_SEARCH_MESSAGES = "ipc://search/messages";

// apps/desktop/src/preload/index.ts
var bridge = {
  selection: {
    get() {
      return Promise.resolve({ text: "" });
    }
  },
  page: {
    info() {
      return Promise.resolve({ title: "", url: "" });
    }
  },
  ai: {
    ask(input) {
      const id = String(Date.now());
      const req = { id, payload: input };
      return import_electron.ipcRenderer.invoke(IPC_AI_ASK, req).then((res) => {
        if (!res?.ok) throw new Error(res?.error?.message || "ask_failed");
        return id;
      });
    },
    onStream(cb) {
      import_electron.ipcRenderer.removeAllListeners(EVENT_AI_STREAM);
      import_electron.ipcRenderer.on(EVENT_AI_STREAM, (_e, token) => cb(token));
    },
    stop(id) {
      const req = { id, payload: null };
      return import_electron.ipcRenderer.invoke(IPC_AI_STOP, req);
    }
  },
  history: {
    list() {
      return import_electron.ipcRenderer.invoke(IPC_HISTORY_LIST);
    },
    save(input) {
      const req = { id: String(Date.now()), payload: input };
      return import_electron.ipcRenderer.invoke(IPC_HISTORY_SAVE, req);
    },
    deleteSession(input) {
      const req = { id: String(Date.now()), payload: input };
      return import_electron.ipcRenderer.invoke(IPC_HISTORY_DELETE_SESSION, req);
    },
    renameSession(input) {
      const req = { id: String(Date.now()), payload: input };
      return import_electron.ipcRenderer.invoke(IPC_HISTORY_RENAME_SESSION, req);
    },
    pinSession(input) {
      const req = { id: String(Date.now()), payload: input };
      return import_electron.ipcRenderer.invoke(IPC_HISTORY_PIN_SESSION, req);
    }
  },
  update: {
    onReady(cb) {
      import_electron.ipcRenderer.on(EVENT_UPDATE_READY, () => cb());
    },
    install() {
      const req = { id: "install", payload: null };
      return import_electron.ipcRenderer.invoke(IPC_UPDATE_INSTALL, req);
    }
  },
  settings: {
    get() {
      return import_electron.ipcRenderer.invoke(IPC_SETTINGS_GET);
    },
    set(s) {
      const req = { id: String(Date.now()), payload: s };
      return import_electron.ipcRenderer.invoke(IPC_SETTINGS_SET, req);
    }
  },
  search: {
    messages(input) {
      const req = { id: String(Date.now()), payload: input };
      return import_electron.ipcRenderer.invoke(IPC_SEARCH_MESSAGES, req);
    }
  }
};
import_electron.contextBridge.exposeInMainWorld("bridge", bridge);
