# Configuração de Faturação (Billing) para o Projeto LingoLIVE IA - Resolução de Erro HTTP 500

Este documento descreve os passos necessários para resolver o erro HTTP 500 reportado pelo Cloud Run, que ocorre porque a faturação está desativada no projeto `lingolive-ia-f5778` e todas as contas de faturação atuais se encontram fechadas/inativas.

---

### Passo 1: Aceder à Consola de Faturação

1. Abra o [Google Cloud Console](https://console.cloud.google.com/).
2. Certifique-se de que o projeto **lingolive-ia-f5778** está selecionado na barra superior.
3. Clique no menu de navegação (três linhas horizontais no canto superior esquerdo).
4. Selecione **Faturação (Billing)**.

### Passo 2: Diagnóstico

1. Na página de Faturação, verifique o estado das contas de faturação listadas.
2. Se todas as contas apresentarem o estado "Fechada" ou "Inativa", **não é possível reativá-las diretamente**.

### Passo 3: Criação de Nova Conta de Faturação (Obrigatório)

Como todas as contas existentes estão fechadas, é necessário criar uma nova para reativar os serviços:

1. Na consola de Faturação, procure a opção **Criar conta de faturação** (ou clique no menu de contas e selecione "Gerir contas de faturação" > "Criar conta").
2. Siga as instruções no ecrã:
   - Defina o nome da conta.
   - Adicione um **novo método de pagamento válido** (cartão de crédito/débito).
3. Após criar a nova conta, ela deverá aparecer como **Aberta (Open)**.

### Passo 4: Associar a Nova Conta ao Projeto

1. Volte à página principal de Faturação do projeto `lingolive-ia-f5778`.
2. Clique em **Alterar conta de faturação** (ou "Associar conta de faturação").
3. Selecione a **nova conta** que acabou de criar no Passo 3.
4. Clique em **Definir conta**.

### Passo 5: Verificação e Resumo do Serviço

1. Após associar a conta, aguarde entre 5 a 15 minutos para que a alteração propague pelo Google Cloud.
2. O erro HTTP 500 (`The request failed because billing is disabled for this project`) deverá desaparecer automaticamente.
3. Teste o serviço novamente através do URL: [https://lingolive-ai-995910450073.us-west1.run.app](https://lingolive-ai-995910450073.us-west1.run.app)

---

## Configuração do Cloud Scheduler (Warming Job / Prevenção de Cold Starts)

Para prevenir erros de indisponibilidade (*no available instance* / HTTP 429) e latências de arranque a frio (*cold start*), configure uma tarefa periódica no **Google Cloud Scheduler** que envia um pedido `GET` simples ao endpoint da aplicação.

### Passo 1: Aceder ao Cloud Scheduler
1. Aceda ao [Google Cloud Console](https://console.cloud.google.com/).
2. Verifique se o projeto **lingolive-ia-f5778** está selecionado na barra superior.
3. No menu de navegação, procure por **Cloud Scheduler** (ou pesquise "Cloud Scheduler" na barra de pesquisa).

### Passo 2: Criar Job de Manutenção (*Warm-up*)
1. Clique em **Criar job** (*Create job*).
2. Preencha os detalhes da tarefa:
   - **Nome:** `lingolive-ai-warmer`
   - **Região:** `us-west1` (ou a região do seu serviço Cloud Run)
   - **Frequência (Cron):** `*/5 * * * *` (executa a cada 5 minutos)
   - **Fuso horário:** Selecione o seu fuso horário local ou `UTC`.
3. Clique em **Continuar**.

### Passo 3: Configurar o Destino (Target)
1. **Tipo de destino (*Target type*):** `HTTP`
2. **URL:** `https://lingolive-ai-995910450073.us-west1.run.app`
3. **Método HTTP:** `GET`
4. **Cabeçalhos HTTP (opcional):**
   - `User-Agent`: `CloudScheduler-Warmer/1.0`
5. Clique em **Continuar** e depois em **Criar** (*Create*).

### Passo 4: Testar a Configuração
1. Na lista de jobs do Cloud Scheduler, localize `lingolive-ai-warmer`.
2. Clique no menu de opções (três pontos) do job e selecione **Executar agora** (*Force run*).
3. Verifique se o **Resultado do último lançamento** exibe `Sucesso` (*OK* / HTTP 200).

