# LingoLIVE - Design System (`@lingolive/design-system`)

Fonte central dos tokens visuais do ecossistema LingoLIVE. Os valores TypeScript em
`tokens/` atendem aplicações e lógica de produto; `tailwind.css` expõe os mesmos
contratos ao Tailwind CSS v4.

## Uso

```ts
import { colors, radius, spacing } from '@lingolive/design-system';
```

```css
@import "tailwindcss";
@import "@lingolive/design-system/tailwind.css";
```

Depois da importação, classes semânticas como `bg-brand-primary`, `text-ui-text`,
`border-ui-border`, `rounded-ui-lg`, `shadow-ui-md` e `z-ui-modal` ficam disponíveis.
O tema escuro é ativado adicionando a classe `dark` em um ancestral da aplicação.

Ao alterar um token canônico, atualize também a ponte CSS e execute os testes do
design system para evitar divergência entre TypeScript e Tailwind.
