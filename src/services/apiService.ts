import { getAuthHeaders } from '@/lib/telegramAuth'
import { normalizeImageUrl } from '@/utils/urlNormalizer'
import { DEV_MODE } from '@/config/devMode'

export const USE_MOCK_DATA = false

const buildApiUrl = (path: string): string => {
  const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site'
  return `${baseUrl}${path}`
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

export const fetchPortfolioAnalysis = async (username: string) => {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username
  const apiUrl = buildApiUrl(`/api/portfolio/${encodeURIComponent(cleanUsername)}`)
  const authHeaders = await getAuthHeaders()

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...authHeaders
      },
      signal: getTimeoutSignal(30000)
    })

    if (!response.ok) {
      if (response.status === 401) throw new Error('ACCESS_DENIED')
      if (response.status === 404) throw new Error('USER_NOT_FOUND')
      if (response.status === 429) throw new Error('RATE_LIMIT_EXCEEDED')
      if (response.status >= 500) throw new Error('SERVER_ERROR')
      throw new Error('NETWORK_ERROR')
    }

    const responseData = await response.json()
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Failed to analyze portfolio')
    }

    return responseData
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch portfolio analysis')
  }
}

// Fetch profile image with authentication token
export const fetchProfileImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const authHeaders = await getAuthHeaders()
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        ...authHeaders
      }
    })
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
  const regularGifts = Array.isArray(d.regular_gifts) ? d.regular_gifts : []

  // Use total_value from API response (correct total value)
  const totalValueTON = d.total_value_ton || 0
  const totalValueUSD = d.total_value_usd || 0
  const upgradedValueTON = d.upgraded_value_ton || 0
  const upgradedValueUSD = d.upgraded_value_usd || 0
  const regularValueTON = d.regular_value_ton || 0
  const regularValueUSD = d.regular_value_usd || 0

  // Calculate floor price (minimum price among all NFTs)
  const minPrice = upgraded.length
    ? Math.min(...upgraded.filter((g: any) => g.price_ton > 0).map((g: any) => g.price_ton))
    : 0

  const ratio = totalValueTON > 0 ? totalValueUSD / totalValueTON : 2.12
  const minUSD = minPrice * ratio

  // Process regular gifts - handle different API formats
  const processedRegularGifts = regularGifts.map((g: any) => {
    const count = g.quantity || g.count || 1
    const priceTon = g.price_ton || 0
    const priceUsd = g.price_usd || 0
    
    return {
      id: g.id || '',
      name: g.gift_name || g.name || g.full_name || g.short_name || 'Unknown',
      short_name: g.short_name || '',
      image: g.image || g.image_url || '',
      count: count,
      price_ton: priceTon,
      price_usd: priceUsd,
      total_ton: g.total_ton || (priceTon * count),
      total_usd: g.total_usd || (priceUsd * count),
      supply: g.supply || 0,
      multiplier: g.multiplier || '',
      change_24h: g['change_24h_ton_%'] || g.change_24h || 0,
      is_unupgraded: g.is_unupgraded !== false
    }
  })

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
        total_nfts: d.total_nfts || upgraded.length,
        total_upgraded: d.total_upgraded || upgraded.length,
        total_unupgraded: d.total_unupgraded || regularGifts.length
      },

      prices: {
        floor_price: {
          TON: parseFloat(minPrice.toFixed(2)),
          USD: parseFloat(minUSD.toFixed(2)),
          STAR: 0
        },
        // Use total_value from API (not average)
        avg_price: {
          TON: parseFloat(totalValueTON.toFixed(2)),
          USD: parseFloat(totalValueUSD.toFixed(2)),
          STAR: 0
        },
        upgraded_value: {
          TON: parseFloat(upgradedValueTON.toFixed(2)),
          USD: parseFloat(upgradedValueUSD.toFixed(2))
        },
        regular_value: {
          TON: parseFloat(regularValueTON.toFixed(2)),
          USD: parseFloat(regularValueUSD.toFixed(2))
        }
      },

      nfts: upgraded.map((g: any) => {
        // Use image URL directly from API (Google Storage)
        const img = g.image || ''
        const link = g.link || ''
        
        // Convert API colors (integer) to hex format
        const colors = g.colors ? {
          center: `#${(g.colors.center >>> 0).toString(16).padStart(6, '0')}`,
          edge: `#${(g.colors.edge >>> 0).toString(16).padStart(6, '0')}`,
          symbol: `#${(g.colors.symbol >>> 0).toString(16).padStart(6, '0')}`,
          text: `#${(g.colors.text >>> 0).toString(16).padStart(6, '0')}`
        } : null
        
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
          colors: colors,  // Add colors from API
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

      regular_gifts: processedRegularGifts,

      total_saved_gifts: upgraded.length + regularGifts.length
    },

    stats: {
      items: upgraded.length,
      regular_items: regularGifts.length,
      total_gifts: d.total_nfts || upgraded.length,
      enriched: upgraded.length
    }
  }
}
