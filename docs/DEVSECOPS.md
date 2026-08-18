# LingoLIVE - DevSecOps Platform & Deployment Strategy

Esta documentação descreve a infraestrutura automatizada de integração contínua, auditoria de segurança integrada e estratégias de entrega da plataforma LingoLIVE.

---

## 1. Pipeline CI/CD Integrado (DevSecOps)

O workflow do GitHub Actions em `.github/workflows/devsecops.yml` garante que nenhum código entre em produção sem passar por auditoria automática. Ele é composto por quatro fases lógicas essenciais:

1. **Security & Quality Audit (SAST/DAST & Credentials):**
   - **Gitleaks:** Escaneia de forma incremental o histórico de commits à procura de segredos ou chaves expostas.
   - **Snyk Dependency Scan:** Avalia vulnerabilidades (CVEs) em pacotes npm ou plugins Flutter de terceiros.
   - **SonarQube / SonarCloud Code Quality:** Mede a densidade de duplicação de código, cobertura de testes e code smells técnicos.

2. **React Web Compilation & Testing:**
   - Instalação segura via `npm ci`.
   - Execução de linter estrito (`npm run lint`).
   - Execução de testes unitários e de integração antes de realizar o build de produção (`npm run build`).

3. **Flutter Multiplatform Mobile Compilation:**
   - Setup automatizado de Java 17 e SDK Flutter Stable.
   - Resolução de dependências móveis e build do APK final (`flutter build apk --release`).

4. **Secure Cloud Release & Traffic Routing:**
   - Integração direta com Google Cloud Platform via conta de serviço (IAM) criptografada.
   - Deploy automático de regras de segurança do Firestore (`firestore.rules`).
   - Construção de imagem Docker do servidor Express+Vite e push para o Artifact Registry do GCP.

---

## 2. Estratégias de Implantação Secundária (Canary & Blue/Green)

Para eliminar indisponibilidades na entrega de novas funcionalidades, a esteira utiliza o modelo híbrido de implantação:

* **Canary Deployment (Roteamento de Tráfego de 10%):**
  - A nova revisão do container é implantada no **Cloud Run** com a tag temporária `canary` e sem receber tráfego global imediato (`--no-traffic`).
  - O tráfego global é atualizado gradativamente direcionando **10%** das sessões dos utilizadores para a tag `canary`, enquanto os 90% restantes continuam na revisão estável anterior.
  - Monitoramos ativamente a telemetria em tempo real (SLIs/SLOs de latência de rota e taxas de erro 5xx). Se não houver anomalias após 15 minutos, o tráfego é promovido a **100%**.

* **Blue/Green Deployment (Substituição Segura):**
  - Caso seja necessária uma troca imediata, o ambiente Green (Novo Build) é provisionado de forma paralela ao Blue (Produção atual).
  - Após os testes de fumaça (Smoke Tests) passarem com sucesso em segundo plano, a ponta de rede no Cloud Run comuta as requisições instantaneamente.

---

## 3. Política de Rollback Automatizado de Segurança

Se qualquer indicador de falha de segurança ou instabilidade (taxa de erro > 1% ou latência média > 800ms) for detectado durante o monitoramento pós-deploy:
1. Um gatilho automático via GCP Cloud Alert aciona a Cloud Function de rollback.
2. O tráfego do Cloud Run é imediatamente revertido para a última revisão conhecida como saudável (`gcloud run services update-traffic --to-revisions=STABLE=100`).
3. Uma notificação com prioridade máxima é enviada para os canais de plantão (PagerDuty/Slack) com o ID da revisão com falha e os logs agregados da falha.

---

## 4. Estratégia de Versionamento e Lançamento (Release Strategy)

Seguimos as regras do **Semantic Versioning (SemVer 2.0.0)** e políticas de branch baseadas em **Trunk-Based Development com short-lived branches**:

- **Branches Principais:**
  - `main`: Imagem fiel e imutável de produção. Cada push nesta branch resulta em deploy automático via Canary.
  - `develop`: Branch de integração diária de features estáveis e testadas.

- **Processo de Lançamento (Release Flow):**
  - Todas as alterações são submetidas via Pull Request (PR) contra `develop` ou `main`.
  - O pipeline de DevSecOps realiza a verificação de segurança no PR. A aprovação exige pelo menos 1 aprovador humano e sucesso total em todas as etapas da esteira automática (Quality Gates).
  - Lançamentos oficiais são marcados com tags Git semânticas (ex: `v2.4.0`) que consolidam e geram o changelog técnico de forma automatizada.
