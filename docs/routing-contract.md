# Contrato de rotas da aplicação

## Estado da migração

A navegação usa URLs reais através de `useAppRouter`, preservando temporariamente a assinatura de `setView()` para os módulos legados. Novos módulos devem obter o destino em `routeRegistry` e não criar caminhos isolados.

## Convenção

- Entrada pública: `/`
- Política de privacidade: `/privacy`
- Onboarding: `/onboarding`
- Retorno de pagamento: `/billing/success`
- Módulos autenticados: `/app/<view>`

O servidor entrega `index.html` para rotas desconhecidas pelo filesystem, permitindo atualizar e partilhar URLs da SPA.

## Histórico e retornos protegidos

- Navegações normais usam `history.pushState`.
- Onboarding, verificação, suspensão e retorno de pagamento usam `replaceState`.
- Ao sair de uma rota protegida, a entrada também é substituída para impedir o botão Voltar de reabrir uma confirmação ou etapa já concluída.
- A autenticação, o estado do perfil e `getRequiredView` continuam sendo a autoridade para liberar onboarding, pagamentos e conta ativa.

## Permissões

Rotas públicas não exigem sessão. Rotas autenticadas exigem utilizador, e áreas exclusivas declaram os perfis aceites no registo central. Papéis legados são normalizados antes da comparação. Rotas ainda não exclusivas permanecem autenticadas durante a migração incremental.

## Carregamento sob demanda

Marketplace, aulas ao vivo e plataformas de professor, escola e empresa são carregados com `React.lazy` e `Suspense`. Os demais módulos podem ser migrados gradualmente sem alterar os caminhos públicos.
