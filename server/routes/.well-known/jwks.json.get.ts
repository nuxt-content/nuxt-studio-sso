import { getJWKS } from '../../utils/jwt'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  if (!config.jwtPublicKey) {
    throw createError({
      statusCode: 500,
      message: 'JWT public key not configured',
    })
  }

  return getJWKS(config.jwtPublicKey)
})
