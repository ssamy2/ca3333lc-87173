import { getAuthHeaders } from '@/lib/telegramAuth'
import { normalizeImageUrl } from '@/utils/urlNormalizer'

export const USE_MOCK_DATA = false

const buildApiUrl = (path: string): string => {
  return `https://www.channelsseller.site${path}`
}

const getTimeoutSignal = (ms: number): AbortSignal => {
  const anyAbortSignal = AbortSignal as any
  if (typeof anyAbortSignal?.timeout === 'function') {
    return anyAbortSignal.timeout(ms)
  }
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

export const fetchNFTGifts = async (username: string) => {
  const cleanUsername = username.startsWith('@') ? username : `@${username}`
  const apiUrl = buildApiUrl(`/api/user/${encodeURIComponent(cleanUsername)}/nfts`)
  const authHeaders = await getAuthHeaders()

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...authHeaders
      },
      signal: getTimeoutSignal(20000)
    })

    if (!response.ok) {
      if (response.status === 401) throw new Error('ACCESS_DENIED')
      if (response.status === 404) throw new Error('USER_NOT_FOUND')
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 10
        throw new Error(`RATE_LIMIT_EXCEEDED:${retrySeconds}`)
      }
      if (response.status === 403) throw new Error('ACCESS_FORBIDDEN')
      if (response.status >= 500) throw new Error('SERVER_ERROR')
      throw new Error('NETWORK_ERROR')
    }

    let responseData
    try {
      const text = await response.text()
      responseData = text ? JSON.parse(text) : {}
    } catch {
      throw new Error('PARSE_ERROR')
    }

    return processAPIResponse(responseData, cleanUsername)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('RATE_LIMIT_EXCEEDED') ||
        ['USER_NOT_FOUND', 'ACCESS_FORBIDDEN', 'SERVER_ERROR', 'PARSE_ERROR'].includes(error.message))
    ) {
      throw error
    }
    throw new Error('NETWORK_ERROR')
  }
}

export const fetchSingleGiftPrice = async (giftUrl: string) => {
  if (!giftUrl.includes('t.me/nft/') && !giftUrl.includes('telegram.me/nft/')) {
    throw new Error('INVALID_GIFT_URL')
  }

  const apiUrl = buildApiUrl(`/api/gift/from-link?url=${encodeURIComponent(giftUrl)}`)
  const authHeaders = await getAuthHeaders()

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...authHeaders
      },
      signal: getTimeoutSignal(10000)
    })

    if (!response.ok) {
      if (response.status === 401) throw new Error('ACCESS_DENIED')
      if (response.status === 404) throw new Error('GIFT_NOT_FOUND')
      throw new Error('NETWORK_ERROR')
    }

    const responseData = await response.json()
    const actual = responseData.success ? responseData.data : responseData
    const link = actual.link || ''

    return {
      success: true,
      data: {
        ...actual,
        image: normalizeImageUrl(actual.image_url || actual.image),
        tg_deeplink: link,
        details: {
          links: link ? [link] : []
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'GIFT_NOT_FOUND') throw error
    throw new Error('NETWORK_ERROR')
  }
}

const fetchImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const processAPIResponse = (responseData: any, username?: string) => {
  if (!responseData?.success || !responseData.data) {
    throw new Error('INVALID_API_RESPONSE')
  }

  const d = responseData.data
  const profile = d.profile_information || {}

  let cleanName = (profile.full_name || d.username || username || '')
    .replace(/\bNone\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const upgraded = Array.isArray(d.nfts) ? d.nfts : []

  const minPrice = upgraded.length
    ? Math.min(...upgraded.map((g: any) => g.price_ton || 0))
    : 0

  const avgPrice = upgraded.length
    ? upgraded.reduce((s: number, g: any) => s + (g.price_ton || 0), 0) / upgraded.length
    : 0

  const ratio = d.total_value_ton > 0 ? d.total_value_usd / d.total_value_ton : 2.12

  const minUSD = minPrice * ratio
  const avgUSD = avgPrice * ratio

  return {
    success: true,
    data: {
      owner: d.username || username || 'user',
      name: cleanName,
      profile_image: profile.profile_image || null,
      visible_nfts: upgraded.length,

      profile: {
        username: d.username || username || null,
        full_name: cleanName,
        user_id: d.user_id || null,
        total_nfts: d.total_nfts || upgraded.length
      },

      prices: {
        floor_price: {
          TON: parseFloat(minPrice.toFixed(2)),
          USD: parseFloat(minUSD.toFixed(2)),
          STAR: 0
        },
        avg_price: {
          TON: parseFloat(avgPrice.toFixed(2)),
          USD: parseFloat(avgUSD.toFixed(2)),
          STAR: 0
        }
      },

      nfts: upgraded.map((g: any) => {
        const img = g.image ? normalizeImageUrl(g.image) : ''
        const link = g.link || ''
        return {
          count: 1,
          name: g.gift_name || g.name || 'Unknown',
          model: g.model || 'Unknown',
          pattern: g.backdrop || '',
          floor_price: g.price_ton || 0,
          avg_price: g.price_ton || 0,
          image: img,
          title: g.gift_name || g.name || 'Unknown',
          backdrop: g.backdrop || '',
          model_rarity: g.rarity || 0,
          quantity_issued: g.mint || 0,
          quantity_total: 0,
          quantity_raw: g.mint ? `#${g.mint}` : '',
          tg_deeplink: link,
          details: {
            links: link ? [link] : []
          }
        }
      }),

      total_saved_gifts: upgraded.length
    },

    stats: {
      items: upgraded.length,
      total_gifts: d.total_nfts || upgraded.length,
      enriched: upgraded.length
    }
  }
}
