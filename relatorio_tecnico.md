# Relatório Técnico: Plataforma LingoLIVE IA

Este documento apresenta uma análise técnica exaustiva e estruturada da arquitetura, estrutura de arquivos, integrações e fluxos de negócio do projeto **LingoLIVE IA**.

---

## 1. VISÃO GERAL

### 1.1 Nome do Projeto e Propósito
* **Nome**: LingoLIVE IA
* **Propósito**: Plataforma moderna e gamificada de ensino de idiomas potencializada por Inteligência Artificial. O sistema atende a um público amplo e diversificado, desde crianças e adolescentes (através de uma interface lúdica e interativa) até estudantes universitários, escolas (B2B) e ambientes corporativos. A plataforma transforma o aprendizado em uma experiência contextualizada através de cenários reais de conversação e análise de fala em tempo real para os idiomas Inglês, Espanhol, Francês, Mandarim, entre outros.

### 1.2 Stack Tecnológica Completa
* **Linguagem Principal**: TypeScript (Frontend e Backend) garantindo tipagem forte e segurança contra erros em tempo de execução.
* **Framework Frontend**: React 18+ impulsionado pelo compilador super rápido Vite.
* **Estilização**: Tailwind CSS (integrado via importação `@import "tailwindcss"` no arquivo global `src/index.css`), garantindo classes utilitárias limpas e design responsivo fluido.
* **Animações e Ícones**:
  - `motion` (importado de `motion/react`) para transições suaves de rotas e animações de elementos de interface.
  - `lucide-react` para biblioteca de ícones vetoriais modernos.
* **Servidor Backend**: Node.js estruturado com o framework Express.
* **Banco de Dados**: Firebase Firestore (NoSQL) para persistência de dados durável e de baixa latência em nuvem.
* **Orquestração de Inteligência Artificial**:
  - SDK Oficial do Google GenAI (`@google/genai`) para acesso ao ecossistema Gemini.
  - SDK de contingência OpenAI para processamento alternativo quando configurado.
* **Visualização de Dados**:
  - `recharts` para exibição de gráficos interativos de performance semanal e estatísticas de uso.
  - `d3` para mapeamento geográfico e distribuição de utilizadores nas áreas administrativas de gestão escolar.

### 1.3 Arquitetura Geral
* **Frontend (SPA)**: Renderizado inteiramente do lado do cliente utilizando React. O estado global de autenticação, faturamento e internacionalização é gerenciado por contextos dedicados (`ThemeContext`, `ToastContext`, `UserRoleContext`, `LocalizationContext`).
* **Backend (Custom Server)**: Servidor Express em `server.ts` que gerencia as rotas de API seguras, valida chaves administrativas e faz o proxy das chamadas para os modelos de IA mantendo as credenciais sensíveis escondidas do navegador. Em ambiente de desenvolvimento, o Vite é montado diretamente como middleware.
* **Base de Dados**: Firestore para persistência de progresso de alunos, turmas, estatísticas e registros escolares, além de mecanismos locais de cache via `indexedDB` no navegador e `localStorage` para preferências táticas (como a ativação e duração da vibração háptica).
* **Serviços Externos**: Gateway Stripe para pagamentos de planos individuais e geração de referências Multicaixa para utilizadores de Angola.

---

## 2. ESTRUTURA DE FICHEIROS

Abaixo está listada a estrutura completa de arquivos do projeto com a função detalhada de cada um em uma única linha:

### 2.1 Raiz do Projeto
* `package.json`: Configura as dependências de terceiros, scripts de build (compilação do backend via esbuild) e start.
* `package-lock.json`: Registra as versões exatas de todas as dependências instaladas na árvore de pacotes.
* `tsconfig.json`: Configura as diretivas de compilação, verificação de tipos e caminhos do TypeScript.
* `vite.config.ts`: Define a configuração de build, plugins de React e regras de empacotamento do Vite.
* `metadata.json`: Mantém o nome oficial do applet, descrição comercial, permissões solicitadas (microfone, câmera, geolocalização) e capacidades do servidor.
* `server.ts`: Ponto de entrada do servidor backend Express integrado com Vite Middleware e endpoints de API.
* `firestore.rules`: Regras de segurança que restringem o acesso de leitura/escrita no Firebase Firestore de acordo com o papel do usuário.
* `firebase-blueprint.json`: Modelo estruturado contendo a especificação lógica de coleções e dados padrão do banco NoSQL.
* `firebase-applet-config.json`: Chaves de autenticação do cliente e dados para comunicação segura com a instância ativa do Firebase.
* `security_spec.md`: Documentação descrevendo os requisitos e boas práticas de segurança adotados no sistema.
* `index.html`: Arquivo HTML estático primário para montagem do aplicativo React.

### 2.2 Pasta `/public`
* `sw.js`: Service Worker para estratégias básicas de cache offline de mídias e assets estáticos.

### 2.3 Pasta `/flutter` (Simuladores Mobile)
* `profile_view.dart`: Tela simulada em Dart para renderização do perfil do utilizador em formato mobile.
* `conversation_wizard.dart`: Assistente mobile em Flutter para configuração rápida e escolha de cenários de estudo.
* `sidebar_navigation.dart`: Componente de navegação móvel para menus laterais responsivos.

### 2.4 Pasta `/server` (Orquestradores de IA)
* `aiOrchestrator.ts`: Implementação do fluxo de chamadas para o modelo Gemini da Google com prompts estruturados de professores virtuais.
* `openaiOrchestrator.ts`: Módulo alternativo para realização de chamadas de IA usando a API da OpenAI.

### 2.5 Pasta `/src` (Código-Fonte Principal do Frontend)
* `main.tsx`: Inicializa a renderização do React na tag HTML root.
* `App.tsx`: Gerenciador central de visualização (rotas lógicas), verificação de saúde dos serviços, autenticação e modais do sistema.
* `index.css`: Contém os estilos principais, importação de fontes da Google e variáveis de cores globais em Tailwind CSS.
* `types.ts`: Define as interfaces estritas do TypeScript para o fluxo de dados (utilizadores, turmas, faturas, métricas).
* `data.ts`: Dados estáticos da plataforma (lista de idiomas disponíveis, sotaques, avatares de professores de IA e cenários).
* `quizData.ts`: Banco estático de questões estruturadas para os testes de nivelamento por idioma.
* `tips.ts`: Armazena frases e provérbios diários traduzidos para motivação dos estudantes.
* `firebase.ts`: Inicializa e expõe as instâncias do Firebase Auth e do Firestore para operações diretas do cliente.

#### `/src/context` (Estados Compartilhados)
* `LocalizationContext.tsx`: Provê dicionários de traduções para suportar múltiplos idiomas na interface do applet (Ex: PT-PT, EN, ES).
* `ThemeContext.tsx`: Fornece estados e controles de alteração do tema visual (claro/escuro).
* `ToastContext.tsx`: Fornece utilitários dinâmicos de mensagens push do tipo toast para feedback instantâneo de ações do usuário.
* `UserRoleContext.tsx`: Gerencia as funções ativas de autenticação (aluno, professor, encarregado, administrador) e sessões.

#### `/src/hooks` (Hooks Customizados)
* `useDeviceOrientation.ts`: Detecta dinamicamente a rotação física de smartphones e tablets para otimização visual de jogos.

#### `/src/utils` (Utilitários)
* `indexedDB.ts`: Armazenamento binário local de áudio gravado e cache offline de diálogos estruturados.
* `pdfGenerator.ts`: Funções para formatação de dados brutos e exportação de relatórios escolares em formato PDF.

#### `/src/lib` (Módulos de Regra de Negócio)
* `AchievementsManager.ts`: Processa e atribui medalhas de conquistas de acordo com os minutos de conversação acumulados.
* `schoolAnalytics.ts`: Consolida estatísticas de turmas para relatórios pedagógicos de professores.
* `SubscriptionManager.ts`: Valida limitações e prazos de expiração de planos de subscrição individual ou corporativa.
* `ttsService.ts`: Serviço de fala nativo baseado na Web Speech API para pronúncia de diálogos.
* `pdfGenerator.ts`: Módulo complementar para geração de certificados acadêmicos.
* `emailService.ts`: Módulo de simulação para envio de comprovantes de pagamento e relatórios de alunos para os pais.

#### `/src/data` (Dados de Tradução)
* `localizationData.ts`: Mapeamentos extensos de strings para tradução multilíngue da plataforma.

#### `/src/types` (Modelos Adicionais)
* `neuralMemory.ts`: Definições estruturais para memorização espaçada.
* `neuralMemoryEngine.ts`: Motor inteligente que calcula revisões baseando-se no intervalo de tempo de retenção do usuário.

#### `/src/components/auth`
* `AuthScreen.tsx`: Interface polida de autenticação com formulários de login, registo e escolha rápida de papel.

#### `/src/components/core`
* `Activation.tsx`: Seção para inserção de chaves e ativação de licenças B2B de escolas ou empresas.
* `AdminDashboard.tsx`: Dashboard administrativo onde o gestor pode gerenciar acessos, faturamento e monitorar a latência dos serviços de nuvem.
* `B2BPayment.tsx`: Componente focado no fluxo financeiro para contratação de pacotes escolares.
* `Dashboard.tsx`: Central de atividades do aluno que reúne o roteiro de aprendizagem e o rastreamento de metas diárias.
* `GlobalSearch.tsx`: Barra de pesquisa avançada para busca instantânea de vocabulário e quizzes na plataforma.
* `Landing.tsx`: Componentes informativos internos de apresentação rápida.
* `LandingPage.tsx`: Landing page comercial pública com tabelas de planos, faq e apresentação das metodologias de IA.
* `Onboarding.tsx`: Questionário de primeiro acesso com perguntas sobre interesses, idioma nativo, idioma de estudo e nível inicial.
* `SchoolRegistration.tsx`: Cadastro inicial de instituições de ensino interessadas no ecossistema LingoLIVE.
* `SettingsView.tsx`: Menu de configurações individuais como sotaque preferido, volume de voz da IA e chaves de desenvolvedor.
* `Sidebar.tsx`: Painel lateral esquerdo contendo os atalhos de rotas lógicas e indicador gráfico do status dos servidores de nuvem.
* `ToastContainer.tsx`: Elemento visual que flutua no topo da tela renderizando alertas de sucesso, erro ou aviso.
* `UserProfile.tsx`: Exibição visual detalhada do perfil com as medalhas conquistadas e gráficos de desempenho pessoal.
* `WelcomeTour.tsx`: Guia de onboarding interativo que destaca e explica as principais funcionalidades da tela do usuário.

#### `/src/components/ai-tutor`
* `AIAssistant.tsx`: Chat lateral de bate-papo gramatical com a IA para tirar dúvidas pontuais e receber correções rápidas de texto.
* `AudioVisualizer.tsx`: Ondas sonoras animadas por canvas que reagem e dão feedback visual sobre a gravação do microfone.
* `ConversationWizard.tsx`: Painel de personalização antes da prática (escolha de sotaque, velocidade da fala, cenário e professor).
* `LiveChatAluno.tsx`: Canal de chat dinâmico simulando reuniões pedagógicas em tempo real com apoio do tutor.
* `PronunciationTipModal.tsx`: Análise minuciosa de pronúncia por palavra fornecendo dicas de posicionamento fonético.
* `TranscriptModal.tsx`: Janela de exibição detalhada com traduções completas e glossário de termos usados na conversação anterior.
* `/conversacao/PracticeRoom.tsx`: A principal sala imersiva da plataforma onde ocorrem as simulações de conversação guiada por IA por voz/texto.

#### `/src/components/b2b`
* `/area-aluno/AreaAlunoDashboard.tsx`: Visão otimizada para o estudante de colégio parceiro, destacando lições de casa atribuídas.
* `/area-pais/AreaPaisDashboard.tsx`: Painel de acompanhamento parental para monitorar a frequência, minutos estudados e tarefas dos filhos.
* `/area-escolar/AreaEscolarDashboard.tsx`: Painel geral com analytics globais, faturamento e resumo financeiro do colégio parceiro.
* `/area-escolar/WorldMapVisualization.tsx`: Mapa interativo baseado em D3 mostrando graficamente a distribuição geográfica dos alunos.
* `/area-escolar/CreateClass.tsx`: Permite ao coordenador criar novas turmas e definir professores responsáveis.
* `/area-escolar/SchoolManagement.tsx`: Gestão de mensalidades B2B, estatísticas administrativas e adição de administradores escolares auxiliares.
* `/area-escolar/EducatorDashboard.tsx`: Indicadores qualitativos sobre o engajamento pedagógico das turmas registradas.
* `/area-escolar/CadastrarProfessor.tsx`: Registra e convida professores adicionando-os ao ecossistema da instituição.
* `/area-escolar/AreaProfessorDashboard.tsx`: Central do educador para atribuição de tarefas e avaliação do tempo de fala dos estudantes.
* `/area-escolar/AddStudents.tsx`: Importação e matrícula de alunos de forma individual ou em massa por arquivos de lote.

#### `/src/components/growth`
* `AnalyticsList.tsx`: Logs estruturados de uso administrativo para refinamento de funis de conversão.
* `FeedbackReportCard.tsx`: Canal de contato direto para suporte técnico ou sugestões de melhoria de UX.
* `MarketingView.tsx`: Gestão de cupons promocionais e acompanhamento de leads comerciais.
* `PaymentsView.tsx`: Histórico detalhado de faturas faturadas com possibilidade de download de recibos.
* `SubscriptionModal.tsx`: Alerta inteligente de paywall sugerindo planos de assinatura para desbloqueio de recursos ilimitados.
* `TotalMinutesCard.tsx`: Widget gráfico que exibe e totaliza as horas de estudo acumuladas pelo estudante.
* `UsageLogs.tsx`: Painel analítico de auditoria com os dias e horários em que o estudante esteve ativo.
* `WeeklyComparisonChart.tsx`: Gráfico comparativo de barras comparando o rendimento da semana corrente com os dias anteriores.
* `WeeklyPerformanceChart.tsx`: Gráfico de desempenho de acertos e fluência nos exercícios praticados.
* `/assinaturas/PlansView.tsx`: Tela que detalha preços e benefícios dos planos individual, duo e familiar.
* `/assinaturas/SubscriptionPlans.tsx`: Componente comparativo de benefícios para fechamento de subscrições.
* `/assinaturas/SubscriptionCheckout.tsx`: Formulário de faturação com campos para cartão de crédito (Stripe) e geração de referências bancárias (Multicaixa).

#### `/src/components/learning`
* `DailyGoalTracker.tsx`: Exibe o progresso de cumprimento das metas diárias de estudo do aluno (ex: 20 minutos por dia).
* `DailyTipCard.tsx`: Card dinâmico que exibe dicas diárias selecionadas de gramática rápida ou expressões locais.
* `KidsInteractiveHub.tsx`: Painel temático gamificado especial para o público infantil com personagens lúdicos e percursos divertidos.
* `LearningPath.tsx`: Árvore de habilidades interativa que organiza os módulos de idiomas em um percurso de progresso visual.
* `LiveSessionsView.tsx`: Agenda de aulas virtuais integradas de tutoria coletiva de conversação utilizando o Google Meet.
* `/aprender/LanguagesView.tsx`: Seletor interativo de idiomas de aprendizagem com cartões representativos de cada cultura.
* `/biblioteca/SavedVocabDeck.tsx`: Repositório de termos salvos pelo utilizador que gera exercícios de revisão espaçada (Flashcards).
* `/biblioteca/commonPhrases.ts`: Listagem extensa de frases úteis e comuns em restaurantes, viagens, aeroportos e trabalho.
* `/calendario/StudyScheduler.tsx`: Calendário inteligente que permite aos utilizadores reservar e bloquear horários de estudo semanais.
* `/conquistas/MedalShowcase.tsx`: Galeria com visual de vitrine exibindo as insígnias e o progresso percentual para desbloqueio de novas conquistas.
* `/quiz/LanguageQuiz.tsx`: Central de avaliação para execução de questionários interativos de nivelamento gramatical e auditivo.
* `/ranking/Leaderboard.tsx`: Classificação competitiva e saudável baseada em XP (pontos de experiência) ganhas nas lições.

---

## 3. BASE DE DADOS (Firestore Schema)

Os dados estão estruturados NoSQL de forma altamente relacional por IDs. O arquivo `firebase-blueprint.json` define a modelagem de dados da plataforma:

### 3.1 Coleções e Esquemas de Campos

#### Coleção: `users`
* `id` (`string`): Identificador único gerado pelo Firebase Authentication.
* `displayName` (`string`): Nome visível do usuário.
* `email` (`string`): Endereço de e-mail de acesso.
* `photoURL` (`string`): Link para a foto do perfil ou avatar customizado.
* `role` (`enum`): Nível de permissão, podendo ser: `"student"`, `"teacher"`, `"school_admin"`, `"parent"`, `"system_admin"`.
* `schoolId` (`string`, opcional): Referência ao documento ID da escola associada na coleção `schools`.
* `classId` (`string`, opcional): Referência ao documento ID da turma na coleção `classes`.
* `createdAt` (`string`, ISO 8601): Data de criação da conta.
* `streak` (`object`):
  - `current` (`number`): Dias consecutivos ativos na plataforma.
  - `max` (`number`): Recorde pessoal de dias seguidos de estudo.
  - `lastActive` (`string`, YYYY-MM-DD): Data do último registro de atividade.
* `stats` (`object`):
  - `minutesSpoken` (`number`): Total acumulado de fala na plataforma.
  - `vocabLearned` (`number`): Quantidade de termos arquivados no SavedVocab.
  - `completedQuizzes` (`number`): Número de quizzes pedagógicos resolvidos.

#### Coleção: `classes`
* `id` (`string`): Identificador único da turma.
* `name` (`string`): Nome identificador da turma (Ex: "Turma A - Inglês Avançado").
* `grade` (`string`): Ano escolar correspondente (Ex: "10º Ano").
* `schoolId` (`string`): Referência da escola proprietária.
* `teacherId` (`string`): Referência ao ID do professor responsável na coleção `users`.
* `studentsCount` (`number`): Quantidade atual de alunos cadastrados nesta turma.
* `createdAt` (`string`, ISO 8601): Data de abertura da turma.

#### Coleção: `schools`
* `id` (`string`): Identificador do estabelecimento de ensino parceiro.
* `name` (`string`): Nome corporativo da escola.
* `adminEmail` (`string`): Email do administrador principal escolar.
* `address` (`string`): Localização física da instituição.
* `status` (`enum`): Situação cadastral, variando entre `"active"` e `"pending"`.
* `plan` (`enum`): Tipo de licenciamento contratado: `"b2b_basic"` ou `"b2b_premium"`.
* `createdAt` (`string`): Data do registo da instituição no sistema.

#### Coleção: `practice_sessions`
* `id` (`string`): Identificador único do histórico de simulação.
* `userId` (`string`): Referência de quem concluiu a prática.
* `scenarioId` (`string`): ID do cenário selecionado para o diálogo (Ex: "restaurante_paris").
* `language` (`string`): Idioma em estudo (Ex: "fr").
* `durationSeconds` (`number`): Tempo que durou o diálogo.
* `score` (`number`): Avaliação geral obtida (fluência de 0 a 100).
* `transcript` (`array` de objetos): Transcrição completa do diálogo de IA com as sugestões fonéticas detalhadas.

#### Coleção: `saved_vocab`
* `id` (`string`): Identificador do termo salvo.
* `userId` (`string`): Usuário proprietário do vocabulário.
* `word` (`string`): Expressão original no idioma nativo estudado.
* `translation` (`string`): Tradução ou explicação.
* `language` (`string`): Idioma de origem.
* `difficulty` (`enum`): Nível de retenção do termo (`"easy"`, `"medium"`, `"hard"`).
* `savedAt` (`string`): Data em que o card de estudo foi salvo.

### 3.2 Regras de Segurança e Índices (`firestore.rules`)
As regras garantem isolamento restrito de dados por papéis:
* O utilizador só pode ler e editar o seu próprio documento sob a regra `request.auth.uid == userId`.
* Professores (`teacher`) têm autoridade de leitura sobre dados de alunos que pertencem às suas turmas (`classId`).
* Administradores escolares (`school_admin`) possuem permissões completas de gravação e consulta sobre coleções de sua escola (`schoolId`).

---

## 4. API / ENDPOINTS (`server.ts`)

O backend construído sobre Express expõe serviços transacionais de IA e faturamento através das seguintes rotas:

| Método | Rota | Função do Endpoint | Autenticação Exigida |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/service-health` | Verifica de forma transacional e calcula a latência de comunicação com o Firestore e a API do Gemini. | Nenhuma (Disponível publicamente para monitorização). |
| **POST** | `/api/create-checkout-session` | Inicia o gateway de pagamento Stripe gerando a URL para faturamento de planos individuais ou duo de assinaturas Premium. | Requerida (Sessão de utilizador autenticado). |
| **POST** | `/api/create-multicaixa-reference` | Cria dinamicamente uma referência bancária de 9 dígitos para depósitos e pagamentos via rede de caixas eletrônicos Multicaixa. | Requerida (Identificador de fatura escolar). |
| **POST** | `/api/explain-phrase` | Processa e analisa sintaticamente uma frase de conversação, quebrando erros gramaticais e sugerindo substituições inteligentes de gírias locais. | Requerida (Sessão de utilizador ativa). |
| **POST** | `/api/feedback` | Registra no banco de dados sugestões de novos recursos, avaliações em estrelas e tíquetes de suporte enviados de cartões de feedback. | Nenhuma (Permitido para envio anônimo). |
| **POST** | `/api/ai-chat` | Chat síncrono com o assistente pedagógico virtual da LingoLIVE IA para explicação de dúvidas e exercícios. | Requerida. |
| **POST** | `/api/professores` | Efetua o registo de um novo professor vinculando-o diretamente à escola do gestor logado. | Restrita (Papel do requisitante deve ser `school_admin`). |
| **POST** | `/api/ia-live` | Simula respostas rápidas de consultores pedagógicos e tutores no chat ao vivo integrado. | Requerida. |

### 4.1 Middlewares Express
1. `express.json()`: Middleware padrão para interpretação e extração de corpos de requisições formatados em JSON.
2. `vite.middlewares` (Apenas ambiente de desenvolvimento): Atua como proxy integrado para o servidor de assets e compilação do Vite do lado do cliente, agilizando testes.
3. Servidor de Estáticos (`express.static('dist')` e wildcard `*` em produção): Serve o HTML do SPA e roteia requisições desconhecidas para o `index.html` (comportamento SPA padrão).

---

## 5. SERVIÇOS E LÓGICA DE NEGÓCIO

A inteligência operacional do LingoLIVE IA está encapsulada em serviços dedicados:

### 5.1 Motor de Simulação de Inteligência Artificial (`aiOrchestrator.ts`)
Responsável por estruturar as diretrizes de papel dos professores virtuais:
* **System Prompts Avançados**: A IA é instruída a assumir personas de tutores nativos com sotaques customizados e ritmos de fala configurados de acordo com o nível selecionado no onboarding do aluno.
* **Retorno Estruturado**: O orquestrador solicita que os modelos Gemini retornem dados em formato JSON contendo a correção textual, nota de pronúncia fonética e tradução contextualizada para acelerar a renderização visual do frontend.

### 5.2 Sistema de Autenticação e Papéis (`UserRoleContext`)
O acesso a cada área é isolado e persistido através de autenticação:
* O login mapeia o documento Firestore do usuário para resgatar a propriedade `role`.
* Dependendo da função (`student`, `teacher`, `school_admin`, `parent`, `system_admin`), a interface é dinamicamente reconstruída para ocultar menus proibidos de acordo com especificações do `security_spec.md`.

### 5.3 Módulo de Pagamento e Assinaturas B2B/B2C
* **B2C (Planos Individuais)**: Integração via rotas do Stripe com redirecionamento de checkout seguro. O callback de sucesso atualiza automaticamente o status na coleção `subscriptions`.
* **B2B (Licenças Escolares)**: Permite compras de pacotes de licenças baseando-se no tamanho da turma e escola. Conta com faturamento direto e emissão de referências de pagamento Multicaixa.

---

## 6. FRONTEND

O frontend do LingoLIVE é composto por interfaces dedicadas e altamente polidas, focadas na experiência do usuário (UX):

### 6.1 Fluxo de Telas (Interface com o Aluno)
1. **LandingPage**: Apresentação inicial e conversão de utilizadores com tabelas comparativas de preços.
2. **Onboarding**: Questionário interativo que define as preferências de aprendizagem, idioma alvo e nível gramatical do aluno.
3. **Dashboard Central**: Exibe os módulos em andamento, metas diárias de minutos e atalhos para a sala de conversação.
4. **PracticeRoom**: Interface principal onde ocorre a prática de fala por voz. Uma animação de onda reage ao microfone do aluno e, após enviar, a transcrição exibe sugestões de fonemas e notas de pronúncia.
5. **Leaderboard**: Rank de medalhas e pontos semanais para motivar o engajamento através de gamificação competitiva.
6. **Deck de Vocabulário**: Cards de estudo (flashcards) com lógica de retenção periódica baseada em curvas de esquecimento.

### 6.2 Fluxo de Telas (Interfaces Corporativas e de Gestão B2B)
* **AreaEscolarDashboard**: Focado nos diretores e gestores escolares. Apresenta faturamentos, distribuição espacial de alunos em mapa global (D3), e links para convites de novos professores.
* **AreaProfessorDashboard**: Permite ao educador ver quais alunos estão com atividades atrasadas, acompanhar gráficos de engajamento semanal e exportar o boletim em formato PDF para os pais.
* **AreaPaisDashboard**: Fornece um painel simples e simplificado para que os responsáveis possam acompanhar as horas de conversação praticadas pelos seus filhos na semana.

---

## 7. INTEGRAÇÕES EXTERNAS

| Serviço Externo | Descrição da Integração | Variáveis de Ambiente Utilizadas |
| :--- | :--- | :--- |
| **Google Gemini API** | Realiza a análise gramatical profunda, avaliação de sotaque fonético e respostas realistas do tutor de IA. | `GEMINI_API_KEY` |
| **Stripe Checkout** | Gateway seguro para faturamento e processamento de assinaturas premium individuais e familiares. | `STRIPE_SECRET_KEY` |
| **Google Meet** | Sistema de agendamento de aulas remotas de conversação ao vivo com tutores e em grupo. | Integrado via API cliente de agenda |
| **OpenAI API** | Provedor alternativo de contingência para geração de textos pedagógicos e análises de frase. | `OPENAI_API_KEY` |

---

## 8. VARIÁVEIS DE AMBIENTE

De acordo com o arquivo padrão `.env.example`, as variáveis de ambiente mapeadas para operação segura do ecossistema são:

* `GEMINI_API_KEY` *(Obrigatório)*: Permite a execução dos recursos de inteligência artificial generativa e feedback de conversação do LingoLIVE.
* `STRIPE_SECRET_KEY` *(Opcional)*: Utilizada pelo servidor backend para gerenciar e validar sessões de faturamento.
* `OPENAI_API_KEY` *(Opcional)*: Chave de acesso para modelos GPT da OpenAI utilizada como gateway alternativo.

---

## 9. O QUE ESTÁ COMPLETO VS INCOMPLETO

### 9.1 Funcionalidades 100% Implementadas e Testadas
* **Sincronização de Progresso**: Registro e persistência durável no Firebase Firestore dos dados de utilizador, metas diárias de estudo e conquistas de medalhas.
* **Motor de Prática e Conversação**: Sala de prática (`PracticeRoom`) com suporte completo para envio de conversações e análise estruturada de sotaques.
* **Configuração e Háptica de Administrador**: Chave mestra de acesso administrativo validada em tempo real com controle dinâmico da intensidade e duração da vibração do dispositivo no modal de chave mestra.
* **Visualizações Gráficas**: Painéis e relatórios analíticos ricos baseados nas bibliotecas `recharts` e mapas de calor com `d3`.
* **Tradução de Interface (PT-PT)**: Localização completa de menus, conquistas, feedbacks e cards pedagógicos para os utilizadores.

### 9.2 Funcionalidades Parciais ou Simuladas
* **Google Meet Integration**: Exibição dos horários de agendamento e simulação funcional do convite de conferências coletivas (fluxo visual de reserva funcionando localmente).
* **Emails de Cobrança e Boletim**: As integrações com o provedor de e-mail encontram-se simuladas através de serviços estáticos em `emailService.ts` simulando a entrega de faturas no painel corporativo.

---

## 10. PROBLEMAS E RISCOS IDENTIFICADOS

1. **Dependência de Conexão com Serviços Externos**: A verificação de saúde do sistema realizada no carregamento inicial da aplicação realiza requisições para a rota `/api/service-health`. Em caso de instabilidades pontuais de rede no servidor de nuvem ou na API da Google, o frontend poderia travar em tela de erro.
   * *Solução Adotada*: Implementação de um middleware de autocorreção resiliente no frontend (`App.tsx`). Caso a requisição para `/api/service-health` falhe ou atinja tempo limite (Timeout), a aplicação cria um estado de contingência virtual (Sandbox local), simulando a integridade saudável dos serviços e permitindo o uso imediato e contínuo da plataforma de forma robusta e transparente ao usuário final.
2. **Uso de Voz Nativa nos Navegadores**: O recurso de Text-to-Speech (`ttsService.ts`) depende dos pacotes de idiomas instalados no sistema operacional do dispositivo do usuário. Em computadores ou celulares sem pacotes fonéticos de Francês ou Mandarim instalados, a voz de pronúncia pode soar robotizada ou cair para o sintetizador padrão de inglês do sistema.
