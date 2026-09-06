const { test, expect } = require('@playwright/test')
const { seedE2E, cleanE2E } = require('./setup/seed')
const { Evento } = require('../../src/models')

let seed

test.beforeAll(async () => {
  await cleanE2E()
  seed = await seedE2E()
})

test.afterAll(async () => {
  await cleanE2E()
})

test('US2 — scoping canônico restringe gestor/monitor ao evento vinculado', async ({
  page,
}) => {
  const eventoForaDoEscopo = await Evento.create({
    nome: 'Evento Fora do Escopo',
    codigo_base: 'EFE',
    ano: 2026,
  })

  const acessoDentroDoEscopo = await page.request.get(
    `/eventos/${seed.evento.id}`,
    {
      headers: {
        Authorization: `Bearer ${seed.gestorToken}`,
      },
    },
  )
  expect(acessoDentroDoEscopo.status()).toBe(200)

  const acessoForaDoEscopo = await page.request.get(
    `/eventos/${eventoForaDoEscopo.id}`,
    {
      headers: {
        Authorization: `Bearer ${seed.gestorToken}`,
      },
    },
  )
  expect(acessoForaDoEscopo.status()).toBe(403)
  expect(await acessoForaDoEscopo.json()).toMatchObject({
    error: expect.stringMatching(/escopo|restrito|evento/i),
  })

  const acessoMonitorDentroDoEscopo = await page.request.get(
    `/eventos/${seed.evento.id}`,
    {
      headers: {
        Authorization: `Bearer ${seed.monitorToken}`,
      },
    },
  )
  expect(acessoMonitorDentroDoEscopo.status()).toBe(200)

  const acessoMonitorForaDoEscopo = await page.request.get(
    `/eventos/${eventoForaDoEscopo.id}`,
    {
      headers: {
        Authorization: `Bearer ${seed.monitorToken}`,
      },
    },
  )
  expect(acessoMonitorForaDoEscopo.status()).toBe(403)
  expect(await acessoMonitorForaDoEscopo.json()).toMatchObject({
    error: expect.stringMatching(/escopo|restrito|evento/i),
  })

  await page.goto('/login')
  await page.fill('input[name="email"]', 'admin.e2e@test.com')
  await page.fill('input[name="senha"]', 'senha123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/)

  await expect(page.locator('text=Admin E2E (admin)')).toBeVisible()
  await expect(
    page.locator('a.text-decoration-none[href="/admin/eventos"]'),
  ).toBeVisible()
})
