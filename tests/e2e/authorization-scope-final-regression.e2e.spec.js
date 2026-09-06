const { test, expect } = require('@playwright/test')
const { seedE2E, cleanE2E } = require('./setup/seed')

let seed

test.beforeAll(async () => {
  await cleanE2E()
  seed = await seedE2E()
})

test.afterAll(async () => {
  await cleanE2E()
})

test('US4 — regressão final: sem legado, escopo canônico e RBAC continuam invariantes', async ({
  page,
}) => {
  const insideScope = await page.request.get(`/eventos/${seed.evento.id}`, {
    headers: {
      Authorization: `Bearer ${seed.gestorToken}`,
    },
  })
  expect(insideScope.status()).toBe(200)

  const outsideScope = await page.request.get(
    `/eventos/${seed.evento.id + 999}`,
    {
      headers: {
        Authorization: `Bearer ${seed.gestorToken}`,
      },
    },
  )
  expect(outsideScope.status()).toBe(403)
  expect(await outsideScope.json()).toMatchObject({
    error: expect.stringMatching(/escopo|restrito|evento/i),
  })

  const admin = await page.request.get('/eventos', {
    headers: {
      Authorization: `Bearer ${seed.adminToken}`,
    },
  })
  expect(admin.status()).toBe(200)

  await page.goto('/login')
  await page.fill('input[name="email"]', 'admin.e2e@test.com')
  await page.fill('input[name="senha"]', 'senha123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/)

  await expect(page.locator('text=Admin E2E (admin)')).toBeVisible()
})
