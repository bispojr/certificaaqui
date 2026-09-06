const { getMinimumRole } = require('./operationPolicyCatalog')

function evaluateOperationConformance({
  apiOperationKey,
  ssrOperationKey,
  apiMinimumRole,
  ssrMinimumRole,
} = {}) {
  const apiRole = apiMinimumRole ?? getMinimumRole(apiOperationKey)
  const ssrRole = ssrMinimumRole ?? getMinimumRole(ssrOperationKey)

  return {
    apiOperationKey,
    ssrOperationKey,
    minimumRoles: {
      api: apiRole,
      ssr: ssrRole,
    },
    isConformant: apiRole === ssrRole,
  }
}

function assertOperationConformance(options = {}) {
  const result = evaluateOperationConformance(options)

  if (!result.isConformant) {
    const error = new Error(
      `drift de perfil mínimo detectado para operação ${options.apiOperationKey ?? options.ssrOperationKey}: API=${result.minimumRoles.api}, SSR=${result.minimumRoles.ssr}`,
    )
    error.code = 'RBAC_DRIFT'
    throw error
  }

  return result
}

module.exports = {
  evaluateOperationConformance,
  assertOperationConformance,
}
