const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

test.beforeEach(async () => {
  await cleanE2E()
  await seedE2E()
})

test.describe('Autocomplete de participante', () => {
  test('busca, debounce e seleção por clique do participante', async ({
    page,
  }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')

    await page.evaluate(async () => {
      const nomes = [
        'Ana Teste 1',
        'Ana Teste 2',
        'Ana Teste 3',
        'Ana Teste 4',
        'Ana Teste 5',
        'Ana Teste 6',
        'Ana Teste 7',
      ]

      for (let index = 0; index < nomes.length; index += 1) {
        const params = new URLSearchParams()
        params.append('nomeCompleto', nomes[index])
        params.append('email', `ana${index + 1}@teste.com`)
        params.append('instituicao', 'UFSC')

        await fetch('/admin/participantes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          credentials: 'same-origin',
        })
      }
    })

    await page.goto('/admin/certificados/novo')

    const searchInput = page.locator('#participante_busca')
    const dropdown = page.locator('#participante_dropdown')
    const hidden = page.locator('input[type="hidden"][name="participante_id"]')

    await searchInput.fill('a')
    await expect(dropdown).not.toBeVisible()

    await searchInput.fill('Ana')
    await expect(dropdown).toBeVisible()
    await expect(dropdown.locator('.dropdown-item')).toHaveCount(5)
    await expect(dropdown).toContainText(
      'Mais de 5 resultados. Continue digitando para refinar.',
    )

    await dropdown.locator('.dropdown-item').first().click()
    await expect(hidden).not.toHaveValue('')
    await expect(searchInput).not.toHaveValue('')
    await expect(dropdown).not.toBeVisible()

    await page.click('#btn_limpar_participante')
    await expect(hidden).toHaveValue('')
    await expect(searchInput).toHaveValue('')
  })

  test('permite navegar por teclado e confirmar seleção com Enter', async ({
    page,
  }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')

    await page.evaluate(async () => {
      const nomes = ['Bia Teste 1', 'Bia Teste 2', 'Bia Teste 3']

      for (let index = 0; index < nomes.length; index += 1) {
        const params = new URLSearchParams()
        params.append('nomeCompleto', nomes[index])
        params.append('email', `bia${index + 1}@teste.com`)
        params.append('instituicao', 'UFRJ')

        await fetch('/admin/participantes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          credentials: 'same-origin',
        })
      }
    })

    await page.goto('/admin/certificados/novo')

    const searchInput = page.locator('#participante_busca')
    const hidden = page.locator('input[type="hidden"][name="participante_id"]')

    await searchInput.fill('Bia')
    await expect(
      page.locator('#participante_dropdown .dropdown-item'),
    ).toHaveCount(3)

    await searchInput.click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(hidden).not.toHaveValue('')
    await expect(searchInput).not.toHaveValue('')
    await expect(page.locator('#participante_dropdown')).not.toBeVisible()
  })
})
