# LingoLIVE UI (`@lingolive/ui`)

Biblioteca React acessível e responsiva para todos os produtos LingoLIVE. Os
componentes usam as classes semânticas de `packages/design-system/tailwind.css`.

## Configuração

O aplicativo web já importa o bridge Tailwind em `src/index.css`. Em outro
aplicativo Tailwind v4, importe depois de `tailwindcss`:

```css
@import "tailwindcss";
@import "@lingolive/design-system/tailwind.css";
```

```tsx
import { Button, Card, CardContent } from "@lingolive/ui";
```

## Componentes

| Família | Componentes | Recursos principais |
|---|---|---|
| Ações | `Button`, `IconButton` | 5 variantes, 3 tamanhos, loading e disabled |
| Formulários | `Input`, `Select`, `Textarea`, `Checkbox` | label, hint, erro e required |
| Conteúdo | `Card`, `Badge`, `Alert` | composição e feedback semântico |
| Overlays | `Modal`, `Drawer`, `Dropdown` | portal, Escape, focus trap e click-outside |
| Estados | `Loading`, `Skeleton`, `EmptyState`, `ErrorState` | carregamento, ausência e erro |
| Página | `PageHeader`, `PageContainer`, `Tabs` | layout responsivo e tabs ARIA |

## Exemplos

```tsx
<Button variant="primary" leadingIcon={<Plus />}>Nova aula</Button>
<IconButton aria-label="Fechar" icon={<X />} variant="ghost" />
<Input label="E-mail" type="email" required hint="Usado para entrar." />
<Select label="Nível CEFR"><option>A1</option><option>A2</option></Select>
<Textarea label="Objetivo" error="Descreva o seu objetivo." />
<Checkbox label="Receber lembretes" description="Pode alterar depois." />
```

```tsx
<Modal open={open} onClose={() => setOpen(false)} title="Confirmar ação"
  footer={<Button onClick={save}>Confirmar</Button>}>
  Revise os dados antes de continuar.
</Modal>
```

```tsx
<Tabs value={tab} onValueChange={setTab} tabs={[
  { id: "progress", label: "Progresso", panel: <Progress /> },
  { id: "lessons", label: "Aulas", panel: <Lessons /> },
]} />
```

## Acessibilidade e temas

- `IconButton` exige `aria-label`.
- Modal e Drawer devolvem foco e fecham com Escape.
- Campos ligam ajuda/erro por `aria-describedby`.
- Erros usam `role="alert"`; carregamentos usam `role="status"`.
- Tabs expõem `tablist`, `tab` e `tabpanel`.
- A classe `.dark` troca os tokens semânticos sem mudar as APIs.

## Demonstração local

Execute `npm run dev` e abra `/packages/ui/showcase.html`. A página não faz
parte da navegação nem do bundle de produção; existe para revisão visual e QA.
