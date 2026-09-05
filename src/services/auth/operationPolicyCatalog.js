const OPERATION_POLICY_CATALOG = {
  certificado: {
    read: 'monitor',
    write: 'gestor',
  },
  participante: {
    read: 'monitor',
    write: 'gestor',
  },
  evento: {
    read: 'monitor',
    write: 'gestor',
  },
  dashboard: {
    read: 'monitor',
    write: 'monitor',
  },
  usuario: {
    manage: 'admin',
  },
}

function getMinimumRole(operationKey) {
  if (!operationKey || typeof operationKey !== 'string') {
    return 'monitor'
  }

  if (typeof OPERATION_POLICY_CATALOG[operationKey] === 'string') {
    return OPERATION_POLICY_CATALOG[operationKey]
  }

  const [resourceKey, actionKey] = operationKey.split('.')

  if (resourceKey && actionKey) {
    return OPERATION_POLICY_CATALOG?.[resourceKey]?.[actionKey] ?? 'monitor'
  }

  if (OPERATION_POLICY_CATALOG[operationKey]) {
    return OPERATION_POLICY_CATALOG[operationKey]
  }

  return 'monitor'
}

module.exports = {
  OPERATION_POLICY_CATALOG,
  getMinimumRole,
}
