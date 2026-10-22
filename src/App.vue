<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './components/AppIcon.vue'
import { fetchServices, fetchTickets, fetchUnits, normalizeTicket } from './services/legacySgaApi.js'

const STORAGE_KEY = 'painel-sga-modern-config-v1'

const createDefaultConfig = () => ({
  mode: 'demo',
  apiUrl: '',
  unitId: '',
  serviceIds: [],
  pollSeconds: '3',
  brandName: 'Painel de Atendimento',
  brandSubtitle: 'CENTRAL DE ATENDIMENTO',
  showClientName: false,
  alertSound: 'standard',
  vocalize: false,
  vocalizeLocation: true,
})

const config = ref(createDefaultConfig())
const settingsOpen = ref(false)
const isFullscreen = ref(false)
const activeTab = ref('connection')
const units = ref([])
const services = ref([])
const unitsLoading = ref(false)
const servicesLoading = ref(false)
const connectionError = ref('')
const connectionState = ref('demo')
const isTestingSound = ref(false)
const timeNow = ref(new Date())
const lastSeenId = ref(0)
const currentTicket = ref({
  id: 42,
  code: 'A042',
  service: 'Atendimento geral',
  location: 'Guichê',
  locationNumber: '03',
  priority: false,
  clientName: 'Maria Oliveira',
  calledAt: '14:52',
})
const history = ref([
  { id: 41, code: 'A041', service: 'Atendimento geral', location: 'Guichê', locationNumber: '02', priority: false, clientName: 'João Santos', calledAt: '14:50' },
  { id: 40, code: 'P006', service: 'Atendimento prioritário', location: 'Guichê', locationNumber: '01', priority: true, clientName: 'Ana Pereira', calledAt: '14:48' },
  { id: 39, code: 'B018', service: 'Retirada de documentos', location: 'Guichê', locationNumber: '04', priority: false, clientName: 'Carlos Souza', calledAt: '14:47' },
  { id: 38, code: 'A040', service: 'Atendimento geral', location: 'Guichê', locationNumber: '03', priority: false, clientName: 'Luciana Lima', calledAt: '14:43' },
])

const statusLabels = {
  demo: 'Modo demonstração',
  idle: 'Configure a conexão',
  connecting: 'Conectando ao SGA',
  online: 'Conectado ao SGA',
  error: 'Sem conexão com o SGA',
}
const statusLabel = computed(() => statusLabels[connectionState.value] || 'Painel SGA')
const clockLabel = computed(() => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(timeNow.value))
const dateLabel = computed(() => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(timeNow.value))
const greeting = computed(() => {
  const hour = timeNow.value.getHours()
  if (hour < 12) return 'Bom dia!'
  if (hour < 18) return 'Boa tarde!'
  return 'Boa noite!'
})
const currentLocation = computed(() => {
  const number = String(currentTicket.value.locationNumber || '').trim()
  return number ? `${currentTicket.value.location} ${number}` : currentTicket.value.location
})
const allServicesSelected = computed(() => {
  if (!services.value.length) return false
  const selectedIds = new Set((config.value.serviceIds || []).map(String))
  return services.value.every(service => selectedIds.has(String(service.id)))
})

let clockTimer = null
let pollTimer = null
let pollingEnabled = false
let requestInProgress = false
let queueProcessing = false
const callQueue = []
let demoCounter = 43

function timestampLabel() {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())
}

function openSettings() {
  activeTab.value = 'connection'
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

function changeMode(mode) {
  config.value.mode = mode
  connectionError.value = ''
  if (mode === 'demo') {
    stopPolling()
    connectionState.value = 'demo'
  } else {
    connectionState.value = 'idle'
  }
}

async function testConnection() {
  connectionError.value = ''
  const url = config.value.apiUrl.trim().replace(/\/+$/, '')
  if (!url) {
    connectionError.value = 'Informe a URL base do Novo SGA antes de testar.'
    connectionState.value = 'error'
    return
  }

  unitsLoading.value = true
  connectionState.value = 'connecting'
  try {
    const result = await fetchUnits(url)
    units.value = result
    connectionState.value = 'online'
    if (result.length === 0) {
      connectionError.value = 'A API respondeu, mas não retornou unidades. Confirme a versão do Novo SGA e os endpoints disponíveis.'
    }
    if (config.value.unitId) await loadServices(true)
  } catch (error) {
    connectionState.value = 'error'
    connectionError.value = error?.message || 'Não foi possível validar a conexão.'
  } finally {
    unitsLoading.value = false
  }
}

async function loadServices(preserveSelection = false) {
  connectionError.value = ''
  const previouslySelected = preserveSelection ? new Set((config.value.serviceIds || []).map(String)) : new Set()
  services.value = []
  if (!preserveSelection) config.value.serviceIds = []
  if (!config.value.unitId || !config.value.apiUrl.trim()) return

  servicesLoading.value = true
  try {
    services.value = await fetchServices(config.value.apiUrl, config.value.unitId)
    if (preserveSelection) {
      config.value.serviceIds = services.value.filter(service => previouslySelected.has(String(service.id))).map(service => String(service.id))
    }
    if (services.value.length === 0) {
      connectionError.value = 'Nenhum serviço foi retornado para esta unidade.'
    }
  } catch (error) {
    connectionError.value = error?.message || 'Não foi possível carregar os serviços.'
    connectionState.value = 'error'
  } finally {
    servicesLoading.value = false
  }
}

function toggleAllServices() {
  if (servicesLoading.value || services.value.length === 0) return

  if (allServicesSelected.value) {
    config.value.serviceIds = []
    return
  }

  config.value.serviceIds = services.value.map(service => String(service.id))
}

function saveSettings() {
  config.value.apiUrl = config.value.apiUrl.trim().replace(/\/+$/, '')
  config.value.serviceIds = (config.value.serviceIds || []).map(String)
  if (config.value.mode === 'api') {
    if (!config.value.apiUrl || !config.value.unitId || config.value.serviceIds.length === 0) {
      activeTab.value = 'connection'
      connectionError.value = 'Para usar chamadas reais, informe a URL, selecione uma unidade e marque ao menos um serviço.'
      return
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
  } catch {
    connectionError.value = 'As configurações não puderam ser salvas neste navegador.'
    return
  }
  closeSettings()
  if (config.value.mode === 'demo') {
    stopPolling()
    connectionState.value = 'demo'
  } else {
    lastSeenId.value = 0
    startPolling()
  }
}

function stopPolling() {
  pollingEnabled = false
  if (pollTimer) window.clearTimeout(pollTimer)
  pollTimer = null
  requestInProgress = false
}

function startPolling() {
  stopPolling()
  if (config.value.mode !== 'api') {
    connectionState.value = 'demo'
    return
  }
  if (!config.value.apiUrl || !config.value.unitId || !config.value.serviceIds.length) {
    connectionState.value = 'idle'
    connectionError.value = 'Selecione a URL, a unidade e ao menos um serviço para iniciar as chamadas reais.'
    return
  }
  pollingEnabled = true
  connectionState.value = 'connecting'
  pollOnce()
}

async function pollOnce() {
  if (!pollingEnabled || requestInProgress) return
  requestInProgress = true
  try {
    const raw = await fetchTickets(config.value.apiUrl, config.value.unitId, config.value.serviceIds)
    const tickets = raw
      .map(normalizeTicket)
      .filter(ticket => Number.isFinite(ticket.id) && ticket.id > 0)
      .sort((a, b) => a.id - b.id)

    if (tickets.length > 0) {
      const maxId = tickets[tickets.length - 1].id
      if (lastSeenId.value === 0) {
        const latest = tickets[tickets.length - 1]
        currentTicket.value = { ...latest, calledAt: timestampLabel() }
        history.value = tickets.slice(0, -1).reverse().slice(0, 4).map((ticket, index) => ({ ...ticket, calledAt: ticket.calledAt || `--:${String(index + 1).padStart(2, '0')}` }))
        lastSeenId.value = maxId
      } else {
        const fresh = tickets.filter(ticket => ticket.id > lastSeenId.value)
        if (fresh.length > 0) {
          lastSeenId.value = maxId
          callQueue.push(...fresh)
          processCallQueue()
        }
      }
    }
    connectionState.value = 'online'
    connectionError.value = ''
  } catch (error) {
    connectionState.value = 'error'
    connectionError.value = error?.message || 'Falha ao consultar as senhas.'
  } finally {
    requestInProgress = false
    if (pollingEnabled) {
      const seconds = Math.max(2, Math.min(15, Number(config.value.pollSeconds) || 3))
      pollTimer = window.setTimeout(pollOnce, seconds * 1000)
    }
  }
}

async function processCallQueue() {
  if (queueProcessing) return
  queueProcessing = true
  try {
    while (callQueue.length > 0 && pollingEnabled) {
      const ticket = callQueue.shift()
      await showCall(ticket, true)
    }
  } finally {
    queueProcessing = false
  }
}

async function showCall(ticket, announce = false) {
  if (currentTicket.value && currentTicket.value.id !== ticket.id) {
    history.value = [
      { ...currentTicket.value, calledAt: currentTicket.value.calledAt || timestampLabel() },
      ...history.value.filter(item => item.id !== currentTicket.value.id && item.id !== ticket.id),
    ].slice(0, 4)
  }
  currentTicket.value = { ...ticket, calledAt: timestampLabel() }
  if (announce) await announceTicket(ticket)
}

async function playTone() {
  const selectedSound = config.value.alertSound
  if (!selectedSound || selectedSound === 'off') return

  // Sons personalizados ficam em public/sounds/ e são servidos pelo Vite.
  if (/\.(wav|mp3|ogg)$/i.test(selectedSound)) {
    const soundUrl = `${import.meta.env.BASE_URL}sounds/${encodeURIComponent(selectedSound)}`
    const audio = new Audio(soundUrl)
    audio.preload = 'auto'
    audio.volume = 1

    await new Promise(resolve => {
      let finished = false
      const timeoutId = window.setTimeout(finish, 15000)

      function finish() {
        if (finished) return
        finished = true
        window.clearTimeout(timeoutId)
        audio.removeEventListener('ended', finish)
        audio.removeEventListener('error', finish)
        resolve()
      }

      audio.addEventListener('ended', finish, { once: true })
      audio.addEventListener('error', finish, { once: true })
      audio.play().catch(() => {
        // Se o navegador bloquear o som, a chamada continua sem interromper o painel.
        finish()
      })
    })

    return
  }

  // Os tons padrão e suave continuam sendo gerados pelo próprio navegador.
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return

  let context
  try {
    context = new AudioContextClass()
    if (context.state === 'suspended') await context.resume()

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime

    oscillator.type = selectedSound === 'soft' ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(selectedSound === 'soft' ? 560 : 820, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.13, now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.3)
    await new Promise(resolve => window.setTimeout(resolve, 320))
  } catch {
    // A interface continua funcionando mesmo se o navegador bloquear áudio.
  } finally {
    if (context && context.state !== 'closed') await context.close().catch(() => {})
  }
}

function speak(text) {
  if (!('speechSynthesis' in window) || !config.value.vocalize) return Promise.resolve()
  return new Promise(resolve => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.88
    utterance.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const portugueseVoice = voices.find(voice => voice.lang?.toLowerCase() === 'pt-br') || voices.find(voice => voice.lang?.toLowerCase().startsWith('pt'))
    if (portugueseVoice) utterance.voice = portugueseVoice
    let finished = false
    const done = () => {
      if (finished) return
      finished = true
      resolve()
    }
    utterance.onend = done
    utterance.onerror = done
    window.speechSynthesis.speak(utterance)
    window.setTimeout(done, 12000)
  })
}

async function announceTicket(ticket) {
  await playTone()
  if (!config.value.vocalize) return
  const service = ticket.service ? `${ticket.service}. ` : ''
  const location = config.value.vocalizeLocation
    ? `. Dirija-se ao ${ticket.location || 'local de atendimento'} ${ticket.locationNumber || ''}.`
    : '.'
  await speak(`${service}Senha ${ticket.code}.${location}`)
}

async function testSound() {
  if (isTestingSound.value) return
  isTestingSound.value = true
  try {
    await playTone()
  } finally {
    isTestingSound.value = false
  }
}

async function testVoice() {
  if (isTestingSound.value) return
  isTestingSound.value = true
  try {
    await announceTicket(currentTicket.value)
  } finally {
    isTestingSound.value = false
  }
}

async function simulateCall() {
  const priority = demoCounter % 4 === 0
  const ticket = {
    id: demoCounter,
    code: `${priority ? 'P' : 'A'}${String(demoCounter - (priority ? 30 : 0)).padStart(3, '0')}`,
    service: priority ? 'Atendimento prioritário' : 'Atendimento geral',
    location: 'Guichê',
    locationNumber: String((demoCounter % 4) + 1).padStart(2, '0'),
    priority,
    clientName: ['Mariana Costa', 'Pedro Almeida', 'Beatriz Oliveira', 'Rafael Santos'][demoCounter % 4],
  }
  demoCounter += 1
  await showCall(ticket, false)
}

function syncFullscreenState() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
    syncFullscreenState()
  } catch {
    connectionError.value = 'Não foi possível ativar a tela cheia neste navegador.'
  }
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', syncFullscreenState)
  syncFullscreenState()
  clockTimer = window.setInterval(() => { timeNow.value = new Date() }, 1000)
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const savedConfig = {}
      Object.keys(createDefaultConfig()).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(parsed, key)) savedConfig[key] = parsed[key]
      })
      config.value = {
        ...createDefaultConfig(),
        ...savedConfig,
        serviceIds: Array.isArray(savedConfig.serviceIds) ? savedConfig.serviceIds.map(String) : [],
      }
    }
  } catch {
    config.value = createDefaultConfig()
  }

  if (config.value.mode === 'api') startPolling()
  else connectionState.value = 'demo'

})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  if (clockTimer) window.clearInterval(clockTimer)
  stopPolling()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
})
</script>

<template>
  <div class="app-shell" :class="{ 'is-fullscreen': isFullscreen }">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true">S</div>
        <div class="brand-copy">
          <span class="brand-kicker">SGA · SISTEMA DE GERENCIAMENTO DE ATENDIMENTO</span>
          <h1>{{ config.brandName || 'Painel de Atendimento' }}</h1>
        </div>
      </div>

      <div class="topbar-tools">
        <div class="connection-pill" :class="`state-${connectionState}`">
          <span class="connection-dot"></span>
          <span>{{ statusLabel }}</span>
        </div>
        <div class="date-block">
          <span class="date-time">{{ clockLabel }}</span>
          <span class="date-text">{{ dateLabel }}</span>
        </div>
        <button class="icon-button" type="button" aria-label="Abrir configurações" title="Configurações" @click="openSettings">
          <AppIcon name="settings" :size="21" />
        </button>
        <button class="icon-button" type="button" aria-label="Alternar tela cheia" title="Tela cheia" @click="toggleFullscreen">
          <AppIcon name="maximize" :size="21" />
        </button>
      </div>
    </header>

    <button
      v-if="isFullscreen"
      class="fullscreen-exit-button"
      type="button"
      aria-label="Sair da tela cheia"
      title="Voltar ao tamanho normal"
      @click="toggleFullscreen"
    >
      <AppIcon name="minimize" :size="19" />
    </button>

    <main class="dashboard-grid">
      <section class="current-call-panel" :class="{ 'priority-panel': currentTicket.priority }" aria-labelledby="current-call-title">
        <div class="panel-orb orb-one"></div>
        <div class="panel-orb orb-two"></div>
        <div class="call-panel-content">
          <div class="call-panel-topline">
            <div class="live-label"><span class="live-pulse"></span> CHAMADA ATUAL</div>
            <span v-if="currentTicket.priority" class="priority-chip">PRIORITÁRIO</span>
            <span v-else class="normal-chip">ATENDIMENTO</span>
          </div>

          <div class="ticket-heading">
            <p id="current-call-title">{{ currentTicket.service || 'Senha chamada' }}</p>
            <span class="ticket-caption">Por favor, fique atento ao painel</span>
          </div>

          <div class="ticket-number-wrap" :key="currentTicket.id">
            <span class="ticket-number">{{ currentTicket.code || '—' }}</span>
            <span class="ticket-number-underline"></span>
            <div class="ticket-clock" aria-label="Horário atual">
              <AppIcon name="clock" :size="18" />
              <div class="ticket-clock-copy">
                <strong>{{ clockLabel }}</strong>
                <span>{{ dateLabel }}</span>
              </div>
            </div>
          </div>

          <div class="destination-card">
            <div class="destination-icon"><AppIcon name="pin" :size="26" /></div>
            <div class="destination-copy">
              <span class="destination-label">DIRIJA-SE AO</span>
              <strong>{{ currentLocation || 'Local de atendimento' }}</strong>
              <span class="destination-hint">Seu atendimento será iniciado em breve</span>
            </div>
            <AppIcon class="destination-chevron" name="chevron" :size="22" />
          </div>

          <div v-if="config.showClientName && currentTicket.clientName" class="client-name-line">
            <span>Paciente / cliente</span>
            <strong>{{ currentTicket.clientName }}</strong>
          </div>

          <div class="call-panel-foot">
            <div class="foot-icon"><AppIcon name="volume" :size="18" /></div>
            <span>Ouça o aviso sonoro e confira o local indicado.</span>
          </div>
        </div>
      </section>

      <section class="right-content-panel">
        <div class="welcome-card">
          <div class="welcome-copy">
            <div class="section-eyebrow"><span class="eyebrow-line"></span> BEM-VINDO(A)</div>
            <h2>{{ greeting }}<br /><span>Estamos prontos para atender você.</span></h2>
            <p>Acompanhe as chamadas neste painel. Quando sua senha aparecer, dirija-se ao guichê indicado.</p>
            <div class="welcome-tags">
              <span><AppIcon name="clock" :size="15" /> Atendimento organizado</span>
              <span><AppIcon name="check" :size="15" /> Informação em tempo real</span>
            </div>
          </div>
          <div class="welcome-art" aria-hidden="true">
            <div class="art-ring ring-outer"></div>
            <div class="art-ring ring-middle"></div>
            <div class="art-ring ring-inner"></div>
            <div class="art-cross"><span></span><span></span></div>
            <div class="art-orbit orbit-a"></div>
            <div class="art-orbit orbit-b"></div>
          </div>
          <div class="welcome-card-bottom">
            <span class="welcome-bottom-dot"></span>
            <span>Obrigado por aguardar. Sua atenção é importante.</span>
          </div>
        </div>

        <section class="history-section" aria-labelledby="history-title">
          <div class="history-header">
            <div>
              <div class="section-eyebrow">ACOMPANHAMENTO</div>
              <h2 id="history-title">Últimas chamadas</h2>
            </div>
            <div class="history-live"><span class="history-live-dot"></span> Atualização automática</div>
          </div>

          <div v-if="history.length" class="history-grid">
            <article v-for="ticket in history.slice(0, 4)" :key="ticket.id" class="history-card" :class="{ 'history-priority': ticket.priority }">
              <div class="history-card-top">
                <span class="history-code">{{ ticket.code }}</span>
                <span class="history-time">{{ ticket.calledAt || '—' }}</span>
              </div>
              <div class="history-card-bottom">
                <span class="history-location"><AppIcon name="pin" :size="14" /> {{ ticket.location }} {{ ticket.locationNumber }}</span>
                <span v-if="ticket.priority" class="mini-priority">Prioritária</span>
              </div>
              <div v-if="config.showClientName && ticket.clientName" class="history-client">{{ ticket.clientName }}</div>
            </article>
          </div>
          <div v-else class="history-empty">As próximas senhas chamadas aparecerão aqui.</div>
        </section>

        <footer class="right-footer">
          <span class="footer-brand"><span class="footer-mark">S</span> {{ config.brandSubtitle || 'CENTRAL DE ATENDIMENTO' }}</span>
          <span class="footer-message">Mantenha seus documentos em mãos durante o atendimento.</span>
        </footer>
      </section>
    </main>

    <div v-if="config.mode === 'demo'" class="demo-tools">
      <span><span class="demo-dot"></span> Prévia visual · dados fictícios</span>
      <button type="button" @click="simulateCall">Simular chamada <AppIcon name="chevron" :size="15" /></button>
    </div>

    <Transition name="modal-fade">
      <div v-if="settingsOpen" class="modal-backdrop" @click.self="closeSettings">
        <section class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <header class="settings-header">
            <div class="settings-header-icon"><AppIcon name="settings" :size="22" /></div>
            <div>
              <p class="settings-overline">PERSONALIZE SEU PAINEL</p>
              <h2 id="settings-title">Configurações</h2>
            </div>
            <button class="icon-button modal-close" type="button" aria-label="Fechar configurações" @click="closeSettings"><AppIcon name="close" :size="20" /></button>
          </header>

          <nav class="settings-tabs" aria-label="Seções das configurações">
            <button type="button" :class="{ active: activeTab === 'connection' }" @click="activeTab = 'connection'"><AppIcon name="monitor" :size="17" /> Conexão</button>
            <button type="button" :class="{ active: activeTab === 'appearance' }" @click="activeTab = 'appearance'"><AppIcon name="building" :size="17" /> Aparência</button>
            <button type="button" :class="{ active: activeTab === 'sound' }" @click="activeTab = 'sound'"><AppIcon name="volume" :size="17" /> Som e voz</button>
          </nav>

          <form class="settings-body" @submit.prevent="saveSettings">
            <div v-if="activeTab === 'connection'" class="settings-pane">
              <div class="setting-intro">
                <h3>Fonte das chamadas</h3>
                <p>Escolha a prévia para testar o visual ou conecte ao Novo SGA.</p>
              </div>
              <div class="mode-switch" role="group" aria-label="Modo do painel">
                <button type="button" :class="{ selected: config.mode === 'demo' }" @click="changeMode('demo')"><AppIcon name="monitor" :size="17" /> Demonstração</button>
                <button type="button" :class="{ selected: config.mode === 'api' }" @click="changeMode('api')"><AppIcon name="wifi" :size="17" /> Conectar ao SGA</button>
              </div>

              <template v-if="config.mode === 'api'">
                <label class="field-label" for="api-url">URL base do Novo SGA</label>
                <div class="field-inline">
                  <input id="api-url" v-model="config.apiUrl" type="url" placeholder="https://sga.suaunidade.gov.br" autocomplete="url" />
                  <button class="button-secondary" type="button" :disabled="unitsLoading" @click="testConnection">
                    <AppIcon v-if="!unitsLoading" name="refresh" :size="16" />
                    <span>{{ unitsLoading ? 'Testando…' : 'Testar' }}</span>
                  </button>
                </div>
                <p class="field-hint">Use o endereço do SGA, sem acrescentar <code>/api</code>. A integração deste protótipo utiliza as rotas encontradas no projeto enviado.</p>

                <label class="field-label" for="unit-select">Unidade de atendimento</label>
                <select id="unit-select" v-model="config.unitId" :disabled="units.length === 0 || unitsLoading" @change="loadServices(false)">
                  <option value="">Selecione uma unidade</option>
                  <option v-for="unit in units" :key="unit.id" :value="String(unit.id)">{{ unit.nome || unit.name || `Unidade ${unit.id}` }}</option>
                </select>

                <div class="services-label-row">
                  <label class="field-label">Serviços exibidos</label>
                  <div class="services-label-actions">
                    <span v-if="servicesLoading" class="small-muted">Carregando…</span>
                    <span v-else-if="services.length" class="small-muted">{{ config.serviceIds.length }} selecionado(s)</span>
                    <button
                      v-if="services.length"
                      class="button-select-all"
                      type="button"
                      :disabled="servicesLoading"
                      :aria-pressed="allServicesSelected"
                      :aria-label="allServicesSelected ? 'Desmarcar todos os serviços' : 'Selecionar todos os serviços'"
                      @click="toggleAllServices"
                    >{{ allServicesSelected ? 'Desmarcar todos' : 'Selecionar todos' }}</button>
                  </div>
                </div>
                <div v-if="services.length" class="service-options">
                  <label v-for="service in services" :key="service.id" class="service-option">
                    <input v-model="config.serviceIds" type="checkbox" :value="String(service.id)" />
                    <span>{{ service.nome || service.name || `Serviço ${service.id}` }}</span>
                  </label>
                </div>
                <div v-else class="service-placeholder">Teste a conexão e selecione uma unidade para carregar os serviços.</div>

                <label class="field-label" for="poll-seconds">Intervalo de atualização</label>
                <select id="poll-seconds" v-model="config.pollSeconds">
                  <option value="2">A cada 2 segundos</option>
                  <option value="3">A cada 3 segundos</option>
                  <option value="5">A cada 5 segundos</option>
                  <option value="10">A cada 10 segundos</option>
                </select>
                <div v-if="connectionError" class="connection-error"><span class="error-icon">!</span><span>{{ connectionError }}</span></div>
              </template>

              <div v-else class="demo-notice">
                <div class="demo-notice-icon"><AppIcon name="check" :size="20" /></div>
                <div><strong>Painel pronto para visualização</strong><p>Os dados exibidos são fictícios. Use “Simular chamada” para conferir como o histórico se comporta antes de configurar a API.</p></div>
              </div>
            </div>

            <div v-else-if="activeTab === 'appearance'" class="settings-pane">
              <div class="setting-intro">
                <h3>Identidade da unidade</h3>
                <p>Personalize o cabeçalho do painel e escolha quais informações podem aparecer na TV.</p>
              </div>
              <label class="field-label" for="brand-name">Nome do painel / unidade</label>
              <input id="brand-name" v-model="config.brandName" type="text" maxlength="60" placeholder="Ex.: Central de Atendimento" />
              <label class="field-label" for="brand-subtitle">Texto secundário</label>
              <input id="brand-subtitle" v-model="config.brandSubtitle" type="text" maxlength="70" placeholder="Ex.: Unidade Central" />
              <label class="toggle-row">
                <span><strong>Exibir nome do cliente</strong><small>Quando ativo, os nomes ficam visíveis na chamada atual e no histórico.</small></span>
                <input v-model="config.showClientName" type="checkbox" />
                <span class="toggle-ui"></span>
              </label>
              <div class="privacy-note"><strong>Privacidade:</strong> por padrão, os nomes ficam ocultos. Em TVs de área pública, mantenha essa opção desativada se não for necessária.</div>
            </div>

            <div v-else-if="activeTab === 'sound'" class="settings-pane">
              <div class="setting-intro">
                <h3>Alertas de chamada</h3>
                <p>Configure o aviso sonoro e a leitura da senha pelo navegador.</p>
              </div>
              <label class="field-label" for="alert-sound">Som de alerta</label>
              <div class="field-inline">
                <select id="alert-sound" v-model="config.alertSound">
                  <option value="standard">Tom padrão</option>
                  <option value="soft">Tom suave</option>
                  <option value="ekiga-vm.wav">Ekiga</option>
                  <option value="doorbell-bingbong.wav">Doorbell bingbong</option>
                  <option value="toydoorbell.wav">Toy doorbell</option>
                  <option value="airport-bingbong.wav">Airport bingbong</option>
                  <option value="ding-dong.wav">ding-dong</option>
                  <option value="infobleep.wav">Info bleep</option>
                  <option value="quito-mariscal-sucre.wav">Quito mariscal sucre</option>
                  <option value="off">Sem som</option>
                </select>
                <button class="button-secondary" type="button" :disabled="isTestingSound" @click="testSound"><AppIcon name="play" :size="16" /> Testar som</button>
              </div>
              <label class="toggle-row">
                <span><strong>Falar a senha em voz alta</strong><small>Usa a síntese de voz do navegador em português, quando disponível.</small></span>
                <input v-model="config.vocalize" type="checkbox" />
                <span class="toggle-ui"></span>
              </label>
              <label class="toggle-row" :class="{ disabled: !config.vocalize }">
                <span><strong>Anunciar local de atendimento</strong><small>Inclui o guichê no anúncio de voz.</small></span>
                <input v-model="config.vocalizeLocation" type="checkbox" :disabled="!config.vocalize" />
                <span class="toggle-ui"></span>
              </label>
              <button class="button-secondary full-width" type="button" :disabled="!config.vocalize || isTestingSound" @click="testVoice"><AppIcon name="volume" :size="16" /> Testar anúncio de voz</button>
              <p class="field-hint">O navegador pode exigir uma interação inicial para liberar áudio. A chamada visual continua funcionando caso voz ou som não estejam disponíveis.</p>
            </div>

            <footer class="settings-footer">
              <button class="button-quiet" type="button" @click="closeSettings">Cancelar</button>
              <button class="button-primary" type="submit"><AppIcon name="check" :size="17" /> Salvar configurações</button>
            </footer>
          </form>
        </section>
      </div>
    </Transition>
  </div>
</template>
