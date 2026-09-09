# Contrato de áudio e karaokê do Ebook

## Versão 1.0

`POST /api/ebook/audio/generate` recebe `ebookId`, `chapterId`, `blockId`, `text` e `voiceId`. Somente o autor autenticado pode gerar. O servidor chama o endpoint TTS com timestamps, valida o alinhamento, converte caracteres em palavras e persiste o MP3 no Firebase Storage.

`ebook_audio_assets/{assetId}` contém `schemaVersion`, autoria, referências do livro/bloco, provedor, modelo, `audioPath`, duração e a lista ordenada `{ index, text, startMs, endMs }`. O ID é determinístico para o conteúdo, voz e modelo, evitando geração duplicada.

Metadados e ficheiros são disponibilizados apenas pelas rotas autenticadas `GET /api/ebook/audio/:assetId` e `GET /api/ebook/audio/:assetId/file`. O cliente nunca recebe o caminho interno do Storage e nunca escreve timestamps.

O leitor procura a palavra ativa por busca binária. Eventos de `timeupdate`, `seeking`, `pause` e `ended` recalculam a posição, preservando sincronização após pausa, busca ou alteração de velocidade.
