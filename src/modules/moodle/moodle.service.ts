// src/modules/moodle/moodle.service.ts
import axios, { type AxiosInstance } from "axios"
import https from "node:https"
import { env } from "../../env"

// Ignorar verificación SSL (el servidor externo tiene certificado no verificable)
const httpsAgent = new https.Agent({ rejectUnauthorized: false })

// Cliente axios con headers profesionales
const externalApiClient = axios.create({
  baseURL: env.PREFILL_API_URL,
  timeout: 15000,
  headers: {
    "User-Agent": "CGC-Registration-Service/1.0 (Contraloria Backend API)",
    "Accept": "*/*",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Accept-Encoding": "gzip, deflate, br",
  },
  httpsAgent,
})

// Variables para almacenar el token
let authToken: string | null = null
let tokenExpiry: number | null = null

function clearStoredToken() {
  authToken = null
  tokenExpiry = null
}

function isTokenValid(): boolean {
  if (!authToken) return false
  if (!tokenExpiry) return true
  return Date.now() < tokenExpiry
}

/**
 * Obtiene el token de autenticación de la API externa
 * Cachea el token por 1 hora
 */
export async function getAuthToken(): Promise<string> {
  console.log("[Prefill] getAuthToken called")
  console.log("[Prefill] Token valid:", isTokenValid(), "Has token:", !!authToken)

  if (isTokenValid() && authToken) {
    console.log("[Prefill] Using cached token")
    return authToken
  }

  console.log("[Prefill] Fetching new token from:", env.PREFILL_API_URL + "/login")
  console.log("[Prefill] Using credentials - user:", env.BASE_API_USER, "pass length:", env.BASE_API_PASSWORD?.length || 0)

  try {
    const response = await externalApiClient.post("/login", {
      usuario: env.BASE_API_USER,
      clave: env.BASE_API_PASSWORD,
    })

    console.log("[Prefill] Login response status:", response.status)
    console.log("[Prefill] Login response data:", JSON.stringify(response.data, null, 2))

    let extractedToken = null

    if (response.data?.token) {
      extractedToken = typeof response.data.token === "object" && response.data.token.value
        ? response.data.token.value
        : response.data.token
    } else if (response.data?.data?.token) {
      extractedToken = typeof response.data.data.token === "object" && response.data.data.token.value
        ? response.data.data.token.value
        : response.data.data.token
    } else if (response.data?.accessToken) {
      extractedToken = response.data.accessToken
    } else if (response.data?.access_token) {
      extractedToken = response.data.access_token
    } else if (typeof response.data === "string") {
      extractedToken = response.data
    }

    if (extractedToken) {
      console.log("[Prefill] Token extracted successfully, length:", extractedToken.length)
      authToken = String(extractedToken)
      tokenExpiry = Date.now() + 60 * 60 * 1000
      return authToken
    }

    console.log("[Prefill] No token found in response")
    throw new Error("No token received from external API")
  } catch (error) {
    console.log("[Prefill] Login error occurred")
    if (error instanceof Error) {
      console.log("[Prefill] Error message:", error.message)
      console.log("[Prefill] Error name:", error.name)
    }
    if (axios.isAxiosError(error)) {
      console.log("[Prefill] Axios error details:")
      console.log("[Prefill] - Status:", error.response?.status)
      console.log("[Prefill] - Status text:", error.response?.statusText)
      console.log("[Prefill] - Response data:", JSON.stringify(error.response?.data, null, 2))
      console.log("[Prefill] - Code:", error.code)
      console.log("[Prefill] - Request URL:", error.config?.url)
      console.log("[Prefill] - Request baseURL:", error.config?.baseURL)
    }
    clearStoredToken()

    if (axios.isAxiosError(error) && error.response?.status === 409) {
      const respData = error.response.data
      if (respData && typeof respData === "object") {
        const token = (respData as Record<string, unknown>).token
        if (typeof token === "string") {
          authToken = token
          tokenExpiry = Date.now() + 60 * 60 * 1000
          return token
        }
        if (token && typeof token === "object" && "value" in token) {
          const tokenValue = (token as { value: unknown }).value
          if (typeof tokenValue === "string") {
            authToken = tokenValue
            tokenExpiry = Date.now() + 60 * 60 * 1000
            return tokenValue
          }
        }
      }
    }

    throw error
  }
}

/**
 * Consulta un usuario por DPI en la API externa
 */
export async function getUserByDpi(dpi: string): Promise<unknown> {
  console.log("[Prefill] getUserByDpi called with DPI:", dpi)

  try {
    const token = await getAuthToken()
    console.log("[Prefill] Got token, making request to:", `/usuarios/${dpi}`)

    const response = await externalApiClient.get(`/usuarios/${dpi}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("[Prefill] getUserByDpi response status:", response.status)
    console.log("[Prefill] getUserByDpi response data:", JSON.stringify(response.data, null, 2))

    return response.data
  } catch (error) {
    console.log("[Prefill] getUserByDpi error occurred")
    if (error instanceof Error) {
      console.log("[Prefill] Error message:", error.message)
    }
    if (axios.isAxiosError(error)) {
      console.log("[Prefill] Axios error in getUserByDpi:")
      console.log("[Prefill] - Status:", error.response?.status)
      console.log("[Prefill] - Response data:", JSON.stringify(error.response?.data, null, 2))
      console.log("[Prefill] - Code:", error.code)
    }
    throw error
  }
}
