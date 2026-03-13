// Service para interpolação de texto_base com valores_dinamicos
module.exports = {
  interpolate(textoBase, valoresDinamicos) {
    // Substitui {{chave}} por valoresDinamicos[chave]
    return textoBase.replace(/\{\{(\w+)\}\}/g, (match, chave) => {
      return chave in valoresDinamicos ? valoresDinamicos[chave] : match
    })
  },
}
