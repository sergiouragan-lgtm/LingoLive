# Contrato editorial do Ebook Studio

## Documento 2.0

Cada e-book possui `schemaVersion: "2.0"` e `contentVersion` incremental. Capítulos preservam conteúdo Markdown para exportação e blocos tipados para edição e WebReader. O servidor limita tamanho total, número de capítulos/blocos e tipos permitidos.

O cliente guarda enviando `baseVersion`. O servidor arquiva a versão anterior em `ebooks/{ebookId}/versions/{version}` dentro da mesma transação e recusa versões obsoletas com `409 EBOOK_CONFLICT`. A interface permite carregar a versão remota ou preservar a edição local numa cópia vinculada ao original.

O autosave é ativado 1,5 segundos após a última alteração e apresenta os estados pendente, guardando, guardado, conflito e falha. Histórico e restauração também exigem autoria e respeitam a versão corrente.

PDF e EPUB3 usam `updatedAt` como relógio fixo. Para a mesma entrada, os bytes são idênticos. O EPUB inclui navegação, idioma e metadados de acessibilidade, e todo Markdown é escapado antes de virar XHTML.
