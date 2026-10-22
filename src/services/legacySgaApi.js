/**
 * Adaptador para os endpoints encontrados no projeto Painel Web enviado.
 * A integração usa os endpoints legados; Novo SGA 2.3+ pode exigir outro
 * fluxo de autenticação/eventos e deve ser validado contra a instância real.
 */
function baseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

async function getJson(url, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`O servidor respondeu com HTTP ${response.status}.`)
    }

    return await response.json()
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('A API demorou demais para responder. Verifique a rede e o servidor.')
    }
    if (error instanceof TypeError) {
      throw new Error('Não foi possível acessar a API. Verifique a URL, o CORS e a conexão com o SGA.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export async function fetchUnits(apiUrl) {
  const payload = await getJson(`${baseUrl(apiUrl)}/api/unidades`)
  return extractItems(payload)
}

export async function fetchServices(apiUrl, unitId) {
  const payload = await getJson(`${baseUrl(apiUrl)}/api/servicos/${encodeURIComponent(unitId)}`)
  return extractItems(payload)
}

export async function fetchTickets(apiUrl, unitId, serviceIds) {
  const url = new URL(`${baseUrl(apiUrl)}/api/painel/${encodeURIComponent(unitId)}`)
  url.searchParams.set('servicos', serviceIds.join(','))
  const payload = await getJson(url.toString())
  return extractItems(payload)
}

export function normalizeTicket(item) {
  const id = Number(item?.id ?? item?.ticketId ?? 0)
  const prefix = String(item?.sigla ?? item?.prefixo ?? item?.letra ?? '')
  const number = String(item?.numero ?? item?.number ?? '')
  const length = Math.max(0, Number(item?.length ?? item?.tamanho ?? 3))
  const paddedNumber = number.padStart(length, '0')

  return {
    id,
    code: String(item?.texto ?? item?.senha ?? `${prefix}${paddedNumber}`),
    service: String(item?.mensagem ?? item?.servico?.nome ?? item?.service ?? 'Atendimento'),
    location: String(item?.local ?? item?.guiche ?? item?.localAtendimento ?? 'Guichê'),
    locationNumber: String(item?.numeroLocal ?? item?.localNumero ?? item?.numero_guiche ?? ''),
    priority: Number(item?.peso ?? item?.prioridade ?? 0) > 0,
    clientName: String(item?.nomeCliente ?? item?.cliente?.nome ?? ''),
  }
}
