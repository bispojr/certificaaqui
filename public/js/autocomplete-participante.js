document.addEventListener('DOMContentLoaded', () => {
  const rootWrappers = document.querySelectorAll('.autocomplete-participante')

  rootWrappers.forEach((wrapper) => {
    const hiddenInput = wrapper.querySelector(
      'input[type="hidden"][name="participante_id"]',
    )
    const searchInput = wrapper.querySelector('#participante_busca')
    const dropdown = wrapper.querySelector('#participante_dropdown')
    const clearButton = wrapper.querySelector('#btn_limpar_participante')

    if (!hiddenInput || !searchInput || !dropdown) {
      return
    }

    let debounceTimer = null
    let activeIndex = -1

    function updateClearButton() {
      if (!clearButton) return
      clearButton.style.display = hiddenInput.value ? 'block' : 'none'
    }

    function closeDropdown() {
      dropdown.style.display = 'none'
      dropdown.innerHTML = ''
      activeIndex = -1
      searchInput.setAttribute('aria-expanded', 'false')
    }

    function openDropdown() {
      if (dropdown.innerHTML.trim() === '') {
        return
      }
      dropdown.style.display = 'block'
      searchInput.setAttribute('aria-expanded', 'true')
    }

    function renderMessage(message) {
      dropdown.innerHTML = `
        <div class="dropdown-item-text text-muted px-3 py-2">${message}</div>
      `
      openDropdown()
    }

    function updateActiveState() {
      const items = [...dropdown.querySelectorAll('.dropdown-item')]
      items.forEach((item, index) => {
        const selected = index === activeIndex
        item.classList.toggle('active', selected)
        item.setAttribute('aria-selected', String(selected))
      })
    }

    function clearSelection() {
      hiddenInput.value = ''
      searchInput.value = ''
      closeDropdown()
      updateClearButton()
      searchInput.focus()
    }

    function selectParticipant(participant) {
      hiddenInput.value = participant.id
      searchInput.value = `${participant.nomeCompleto} — ${participant.email}`
      closeDropdown()
      updateClearButton()
    }

    function renderResults(results, hasMore) {
      dropdown.innerHTML = ''

      if (!results.length) {
        renderMessage('Nenhum participante encontrado.')
        return
      }

      const limit = Math.min(results.length, 5)
      for (let index = 0; index < limit; index += 1) {
        const participant = results[index]
        const item = document.createElement('button')
        item.type = 'button'
        item.className = 'dropdown-item'
        item.setAttribute('role', 'option')
        item.dataset.id = String(participant.id)
        item.dataset.nome = participant.nomeCompleto || ''
        item.dataset.email = participant.email || ''
        item.textContent = `${participant.nomeCompleto} — ${participant.email}`

        item.addEventListener('mousedown', (event) => {
          event.preventDefault()
          selectParticipant({
            id: participant.id,
            nomeCompleto: participant.nomeCompleto,
            email: participant.email,
          })
        })

        item.addEventListener('mouseenter', () => {
          activeIndex = index
          updateActiveState()
        })

        dropdown.appendChild(item)
      }

      if (hasMore) {
        const footer = document.createElement('div')
        footer.className = 'dropdown-item-text text-muted px-3 py-2 small'
        footer.textContent =
          'Mais de 5 resultados. Continue digitando para refinar.'
        dropdown.appendChild(footer)
      }

      activeIndex = 0
      updateActiveState()
      openDropdown()
    }

    async function buscarParticipantes(term) {
      if (term.length < 2) {
        hiddenInput.value = ''
        updateClearButton()
        closeDropdown()
        return
      }

      try {
        const response = await fetch(
          `/admin/participantes/busca?q=${encodeURIComponent(term)}`,
          {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
          },
        )

        if (!response.ok) {
          throw new Error('Erro ao buscar participantes.')
        }

        const data = await response.json()
        renderResults(data.results || [], Boolean(data.hasMore))
      } catch (error) {
        renderMessage('Erro ao buscar participantes. Tente novamente.')
      }
    }

    searchInput.addEventListener('input', (event) => {
      const term = event.target.value.trim()

      if (term.length < 2) {
        hiddenInput.value = ''
        updateClearButton()
        closeDropdown()
        return
      }

      window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        buscarParticipantes(term)
      }, 300)
    })

    searchInput.addEventListener('keydown', (event) => {
      const items = [...dropdown.querySelectorAll('.dropdown-item')]

      if (event.key === 'Escape') {
        event.preventDefault()
        closeDropdown()
        return
      }

      if (items.length === 0) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        activeIndex = (activeIndex + 1) % items.length
        updateActiveState()
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        activeIndex = (activeIndex - 1 + items.length) % items.length
        updateActiveState()
        return
      }

      if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault()
        const item = items[activeIndex]
        if (!item) return

        const participant = {
          id: Number(item.dataset.id),
          nomeCompleto: item.dataset.nome,
          email: item.dataset.email,
        }
        selectParticipant(participant)
      }
    })

    searchInput.addEventListener('focus', () => {
      const termo = searchInput.value.trim()
      if (termo.length >= 2 && dropdown.innerHTML.trim() !== '') {
        openDropdown()
      }
    })

    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) {
        closeDropdown()
      }
    })

    if (clearButton) {
      clearButton.addEventListener('click', clearSelection)
    }

    updateClearButton()
    if (hiddenInput.value) {
      searchInput.value = searchInput.value || hiddenInput.value
      updateClearButton()
    }
  })
})
