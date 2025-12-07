const input = document.getElementById('chat-input')
const submit = document.getElementById('submit')
const btnStop = document.getElementById('stop')
const btnResume = document.getElementById('resume')
const btnNewSession = document.getElementById('new-session')
const sessionsEl = document.getElementById('sessions')
const history = document.getElementById('history')
const searchEl = document.getElementById('search')
const globalSearchEl = document.getElementById('global-search')
const btnCopy = document.getElementById('copy')
const btnPin = document.getElementById('pin')
const btnDelete = document.getElementById('delete')
const btnExport = document.getElementById('export')
const toast = document.getElementById('toast')
const btnRenameSession = document.getElementById('rename-session')
const btnDeleteSession = document.getElementById('delete-session')
const btnPinSession = document.getElementById('pin-session')
const btnRetryMsg = document.getElementById('retry-msg')
const cmenu = document.getElementById('context-menu')
const cmCopy = document.getElementById('cm-copy')
const cmPin = document.getElementById('cm-pin')
const cmDelete = document.getElementById('cm-delete')
const cmRetry = document.getElementById('cm-retry')
const updateBanner = document.getElementById('update-banner')
const installUpdateBtn = document.getElementById('install-update')
const openaiKeyInput = document.getElementById('openai-key')
const saveSettingsBtn = document.getElementById('save-settings')
const saveOrderBtn = document.getElementById('save-order')
const orderList = document.getElementById('order-list')
let dragSrc = null
function initDrag() {
  const items = orderList ? orderList.querySelectorAll('.prov') : []
  items.forEach(it => {
    it.addEventListener('dragstart', e => { dragSrc = it; e.dataTransfer.setData('text/plain', it.dataset.name) })
    it.addEventListener('dragover', e => { e.preventDefault() })
    it.addEventListener('drop', e => {
      e.preventDefault()
      if (!orderList || !dragSrc || dragSrc === it) return
      const children = Array.from(orderList.children)
      const srcIndex = children.indexOf(dragSrc)
      const dstIndex = children.indexOf(it)
      if (srcIndex < dstIndex) orderList.insertBefore(dragSrc, it.nextSibling)
      else orderList.insertBefore(dragSrc, it)
    })
  })
}

let currentAssistant = null
let sessionId = String(Date.now())
let messages = []
let lastText = ''
let currentReqId = ''
let selectedIndex = -1
let selectedSessionId = ''
let isStreaming = false
let cmIndex = -1

function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function renderMarkdown(s){let x=escapeHtml(s);x=x.replace(/```([\s\S]*?)```/g,(m,p)=>'<pre><code>'+p.replace(/\n/g,'\n')+'</code></pre>');x=x.replace(/`([^`]+)`/g,'<code>$1</code>');x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');x=x.replace(/\*([^*]+)\*/g,'<em>$1</em>');x=x.replace(/\[(.*?)\]\((https?:[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');x=x.replace(/\n/g,'<br/>');return x}
function enhanceCodeBlocks(el){const blocks=el.querySelectorAll('pre');blocks.forEach(b=>{if(b.querySelector('.copy-btn'))return;const btn=document.createElement('button');btn.textContent='复制';btn.className='copy-btn';btn.style.float='right';btn.style.margin='4px';btn.addEventListener('click',async()=>{const code=b.querySelector('code');if(code)await navigator.clipboard.writeText(code.textContent||'')});b.insertBefore(btn,b.firstChild)})}

function addMessage(role, content, pinned, cls) {
  const div = document.createElement('div')
  div.className = 'msg ' + role
  div.textContent = content
  div.dataset.role = role
  if (role === 'assistant') div.dataset.raw = ''
  if (pinned) div.classList.add('pinned')
  if (cls) div.classList.add(cls)
  div.addEventListener('click', () => {
    const children = Array.from(history.children)
    children.forEach(c => c.classList.remove('selected'))
    div.classList.add('selected')
    selectedIndex = children.indexOf(div)
  })
  if (role === 'user') {
    const retryBtn = document.createElement('button')
    retryBtn.textContent = '重试'
    retryBtn.style.marginLeft = '8px'
    retryBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (isStreaming) return
      input.value = div.childNodes[0].nodeValue || ''
      await send()
    })
    div.appendChild(retryBtn)
    div.addEventListener('dblclick', async () => {
      div.contentEditable = 'true'
      div.focus()
    })
    div.addEventListener('blur', async () => {
      div.contentEditable = 'false'
      const idx = Array.from(history.children).indexOf(div)
      if (idx >= 0 && idx < messages.length) {
        const baseText = div.childNodes[0].nodeValue || ''
        messages[idx].content = baseText
        await window.bridge.history.save({ sessionId, messages })
      }
    })
    div.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        div.blur()
      }
    })
  }
  div.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    const children = Array.from(history.children)
    cmIndex = children.indexOf(div)
    cmenu.style.left = e.pageX + 'px'
    cmenu.style.top = e.pageY + 'px'
    cmenu.style.display = 'block'
  })
  history.appendChild(div)
  return div
}

document.addEventListener('click', () => {
  cmenu.style.display = 'none'
})

cmCopy.addEventListener('click', async () => {
  if (cmIndex < 0 || cmIndex >= messages.length) return
  await navigator.clipboard.writeText(messages[cmIndex].content)
})

cmPin.addEventListener('click', async () => {
  if (cmIndex < 0 || cmIndex >= messages.length) return
  messages[cmIndex].pinned = !messages[cmIndex].pinned
  history.children[cmIndex].classList.toggle('pinned', !!messages[cmIndex].pinned)
  await window.bridge.history.save({ sessionId, messages })
})

cmDelete.addEventListener('click', async () => {
  if (cmIndex < 0 || cmIndex >= messages.length) return
  messages.splice(cmIndex, 1)
  history.removeChild(history.children[cmIndex])
  selectedIndex = -1
  await window.bridge.history.save({ sessionId, messages })
})

cmRetry.addEventListener('click', async () => {
  if (cmIndex < 0 || cmIndex >= messages.length) return
  const m = messages[cmIndex]
  if (m.role !== 'user') return
  if (isStreaming) return
  input.value = m.content
  await send()
})

async function send() {
  const text = input.value.trim()
  if (!text) return
  addMessage('user', text)
  messages.push({ role: 'user', content: text, ts: Date.now() })
  input.value = ''
  currentAssistant = addMessage('assistant', '')
  lastText = text
  try {
    isStreaming = true
    submit.disabled = true
    input.disabled = true
    currentReqId = await window.bridge.ai.ask({ text, sessionId, stream: true })
  } catch (e) {
    const msg = String(e?.message || e)
    showToast(msg)
    addMessage('assistant', '错误: ' + msg, false, 'error')
    messages.push({ role: 'assistant', content: '错误: ' + msg, ts: Date.now() })
    await window.bridge.history.save({ sessionId, messages })
    submit.disabled = false
    input.disabled = false
    isStreaming = false
    return
  }
  const content = currentAssistant.dataset.raw || currentAssistant.textContent
  messages.push({ role: 'assistant', content, ts: Date.now() })
  await window.bridge.history.save({ sessionId, messages })
  submit.disabled = false
  input.disabled = false
  isStreaming = false
}

window.bridge.ai.onStream(token => {
  if (!currentAssistant) return
  const raw=(currentAssistant.dataset.raw||'')+token
  currentAssistant.dataset.raw=raw
  currentAssistant.innerHTML=renderMarkdown(raw)
  enhanceCodeBlocks(currentAssistant)
})

window.bridge.update.onReady(() => {
  updateBanner.style.display = 'block'
})

installUpdateBtn.addEventListener('click', async () => {
  await window.bridge.update.install()
})

submit.addEventListener('click', send)
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
})

btnStop.addEventListener('click', async () => {
  if (currentReqId) await window.bridge.ai.stop(currentReqId)
  submit.disabled = false
  input.disabled = false
  isStreaming = false
})

btnResume.addEventListener('click', async () => {
  if (!lastText) return
  input.value = lastText
  await send()
})

function renderSessions(sessions) {
  sessionsEl.innerHTML = ''
  const sorted = [...sessions].sort((a,b)=>{
    const pa = a.pinned ? 1 : 0
    const pb = b.pinned ? 1 : 0
    if (pa !== pb) return pb - pa
    return (b.createdAt || 0) - (a.createdAt || 0)
  })
  sorted.forEach(s => {
    const item = document.createElement('div')
    item.className = 'session-item'
    const nameEl = document.createElement('span')
    nameEl.textContent = s.name || s.id
    const star = document.createElement('span')
    star.className = 'session-star'
    star.textContent = s.pinned ? '★' : ''
    item.appendChild(nameEl)
    item.appendChild(star)
    item.style.cursor = 'pointer'
    item.addEventListener('click', () => {
      sessionId = s.id
      selectedSessionId = s.id
      messages = s.messages || []
      history.innerHTML = ''
      for (const m of messages) addMessage(m.role, m.content, m.pinned)
    })
    sessionsEl.appendChild(item)
  })
}

async function init() {
  try {
    try {
      const s = await window.bridge.settings.get()
      if (s?.openaiApiKey && openaiKeyInput) openaiKeyInput.value = s.openaiApiKey
      if (s?.providerOrder && Array.isArray(s.providerOrder)) {
        const setChecked = (id, name) => { const el = document.getElementById(id); if (el) el.checked = s.providerOrder.includes(name) }
        setChecked('order-openai','openai')
        setChecked('order-ollama','ollama')
        setChecked('order-anthropic','anthropic')
        setChecked('order-gemini','gemini')
      }
    } catch {}
    const res = await window.bridge.history.list()
    const sessions = res?.sessions || (res?.data?.sessions) || []
    renderSessions(sessions)
    if (sessions.length) {
      const s = sessions[sessions.length - 1]
      sessionId = s.id
      messages = s.messages || []
      history.innerHTML = ''
      for (const m of messages) addMessage(m.role, m.content, m.pinned)
    }
  } catch {}
  initDrag()
}

init()

btnNewSession.addEventListener('click', async () => {
  sessionId = String(Date.now())
  selectedSessionId = sessionId
  messages = []
  history.innerHTML = ''
  await window.bridge.history.save({ sessionId, messages })
  const res = await window.bridge.history.list()
  const sessions = res?.sessions || (res?.data?.sessions) || []
  renderSessions(sessions)
})

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', async () => {
    await window.bridge.settings.set({ openaiApiKey: openaiKeyInput ? openaiKeyInput.value : '' })
    showToast('已保存设置')
  })
}

if (saveOrderBtn) {
  saveOrderBtn.addEventListener('click', async () => {
    const order = []
    const names = orderList ? Array.from(orderList.children).map(el => el.getAttribute('data-name')) : []
    names.forEach(n => {
      const id = 'order-' + n
      if (document.getElementById(id)?.checked) order.push(n)
    })
    await window.bridge.settings.set({ openaiApiKey: openaiKeyInput ? openaiKeyInput.value : '', providerOrder: order })
    showToast('已保存模型顺序')
  })
}

btnRenameSession.addEventListener('click', async () => {
  if (!selectedSessionId) return
  const name = prompt('重命名为：', '')
  if (!name) return
  await window.bridge.history.renameSession({ sessionId: selectedSessionId, name })
  const res = await window.bridge.history.list()
  const sessions = res?.sessions || (res?.data?.sessions) || []
  renderSessions(sessions)
})

btnDeleteSession.addEventListener('click', async () => {
  if (!selectedSessionId) return
  if (!confirm('确认删除该会话？')) return
  await window.bridge.history.deleteSession({ sessionId: selectedSessionId })
  const res = await window.bridge.history.list()
  const sessions = res?.sessions || (res?.data?.sessions) || []
  renderSessions(sessions)
  history.innerHTML = ''
  messages = []
  selectedSessionId = ''
})

btnPinSession.addEventListener('click', async () => {
  if (!selectedSessionId) return
  const res = await window.bridge.history.list()
  const sessions = res?.sessions || (res?.data?.sessions) || []
  const s = sessions.find(x => x.id === selectedSessionId)
  const pinned = !(s && s.pinned)
  await window.bridge.history.pinSession({ sessionId: selectedSessionId, pinned })
  const res2 = await window.bridge.history.list()
  renderSessions(res2?.sessions || (res2?.data?.sessions) || [])
})

btnCopy.addEventListener('click', async () => {
  if (selectedIndex < 0 || selectedIndex >= messages.length) return
  const m = messages[selectedIndex]
  await navigator.clipboard.writeText(m.content)
})

btnPin.addEventListener('click', async () => {
  if (selectedIndex < 0 || selectedIndex >= messages.length) return
  messages[selectedIndex].pinned = !messages[selectedIndex].pinned
  history.children[selectedIndex].classList.toggle('pinned', !!messages[selectedIndex].pinned)
  await window.bridge.history.save({ sessionId, messages })
})

btnDelete.addEventListener('click', async () => {
  if (selectedIndex < 0 || selectedIndex >= messages.length) return
  messages.splice(selectedIndex, 1)
  history.removeChild(history.children[selectedIndex])
  selectedIndex = -1
  await window.bridge.history.save({ sessionId, messages })
})

btnExport.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ sessionId, messages }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `session-${sessionId}.json`
  a.click()
  URL.revokeObjectURL(url)
})

searchEl.addEventListener('input', () => {
  const q = searchEl.value.trim().toLowerCase()
  if (globalSearchEl && globalSearchEl.checked) {
    window.bridge.search.messages({ q, limit: 50 }).then(res => {
      history.innerHTML = ''
      const hits = res?.hits || (res?.data?.hits) || []
      hits.forEach(h => {
        const div = addMessage(h.role, h.content)
        div.addEventListener('click', async () => {
          const list = await window.bridge.history.list()
          const sessions = list?.sessions || (list?.data?.sessions) || []
          const s = sessions.find(x => x.id === h.sessionId)
          if (s) {
            sessionId = s.id
            messages = s.messages || []
            history.innerHTML = ''
            for (const m of messages) addMessage(m.role, m.content, m.pinned)
          }
        })
      })
    })
  } else {
    history.innerHTML = ''
    messages.forEach(m => {
      if (!q || (m.content || '').toLowerCase().includes(q)) addMessage(m.role, m.content, m.pinned)
    })
    selectedIndex = -1
  }
})

function showToast(msg) {
  toast.textContent = msg
  toast.style.display = 'block'
  setTimeout(() => { toast.style.display = 'none' }, 3000)
}

btnRetryMsg.addEventListener('click', async () => {
  if (selectedIndex < 0 || selectedIndex >= messages.length) return
  const m = messages[selectedIndex]
  if (m.role !== 'user') return
  if (isStreaming) return
  input.value = m.content
  await send()
})

