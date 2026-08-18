# White Label Architecture - LingoLIVE

## 1. Theme Engine
O motor de temas aplica dinamicamente as cores (`primaryColor`, `secondaryColor`) via variáveis CSS (`root.style.setProperty`), permitindo que o Tailwind CSS utilize estas cores dinâmicas via classes utilitárias configuradas ou CSS puro.

## 2. Brand Manager
Um repositório Firestore (`tenant_brand_configs`) gerencia a configuração de cada cliente (escolas, empresas).

## 3. Deployment Strategy
- **Domínios**: CNAME apontando para o LB do LingoLIVE.
- **SSL**: Certificados gerenciados via GCP.
- **Configuração**: Alterações de branding são refletidas em tempo real (após refresh) via consulta no Firestore, sem necessidade de deploy.
