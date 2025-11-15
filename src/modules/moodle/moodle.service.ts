// src/modules/moodle/moodle.service.ts
import axios, { type AxiosInstance } from "axios"
import { env } from "../../env"

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
  if (isTokenValid() && authToken) {
    return authToken
  }

  try {
    const response = await externalApiClient.post("/login", {
      usuario: env.BASE_API_USER,
      clave: env.BASE_API_PASSWORD,
    })

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
      authToken = String(extractedToken)
      tokenExpiry = Date.now() + 60 * 60 * 1000
      return authToken
    }

    throw new Error("No token received from external API")
  } catch (error) {
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
  const token = await getAuthToken()

  const response = await externalApiClient.get(`/usuarios/${dpi}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.data
}
