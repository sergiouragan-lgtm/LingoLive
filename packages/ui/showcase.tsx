import { Bell, MoreHorizontal, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../src/index.css";
import {
  Alert, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Checkbox, Drawer, Dropdown, EmptyState, ErrorState, IconButton, Input, Loading, Modal,
  PageContainer, PageHeader, Select, Skeleton, Tabs, Textarea,
} from "./index";

function Showcase() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState("components");
  return (
    <div className="min-h-screen bg-ui-bg text-ui-text">
      <PageContainer>
        <PageHeader title="LingoLIVE UI" description="Componentes partilhados para uma experiência coerente em todo o ecossistema." actions={<><Button leadingIcon={<Plus className="size-4" />} onClick={() => setModal(true)}>Nova ação</Button><IconButton aria-label="Abrir definições" icon={<Settings className="size-5" />} variant="outline" onClick={() => setDrawer(true)} /></>} />
        <Tabs className="mt-6" value={tab} onValueChange={setTab} tabs={[
          { id: "components", label: "Componentes", panel: <div className="grid gap-6">
            <Card><CardHeader><CardTitle>Ações e estados</CardTitle><CardDescription>Hierarquia, feedback e carregamento.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-3"><Button>Primário</Button><Button variant="secondary">Secundário</Button><Button variant="outline">Contorno</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Eliminar</Button><Button loading>A guardar</Button><IconButton aria-label="Notificações" icon={<Bell className="size-5" />} /><Dropdown trigger="Opções" items={[{ id: "details", label: "Ver detalhes", onSelect: () => undefined }]} /></CardContent></Card>
            <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Formulário</CardTitle></CardHeader><CardContent className="grid gap-4"><Input label="Nome" placeholder="Nome do aluno" /><Select label="Nível"><option>A1</option><option>B2</option></Select><Textarea label="Objetivo" placeholder="Descreva o objetivo" /><Checkbox label="Receber lembretes" description="Um lembrete diário de estudo." /></CardContent><CardFooter><Button fullWidth>Guardar perfil</Button></CardFooter></Card><div className="grid content-start gap-3"><Alert title="Informação">A aula começa em 10 minutos.</Alert><Alert variant="success" title="Concluído">Progresso guardado.</Alert><Alert variant="warning" title="Atenção">Revise os dados.</Alert><Alert variant="error" title="Erro">Não foi possível sincronizar.</Alert><div className="flex gap-2"><Badge variant="primary">B2</Badge><Badge variant="success">Ativo</Badge><Badge variant="warning">Pendente</Badge></div><Loading /><Skeleton lines={3} /></div></div>
          </div> },
          { id: "states", label: "Estados", panel: <div className="grid gap-6 lg:grid-cols-2"><EmptyState title="Nenhuma aula" description="Crie a primeira aula para começar." actionLabel="Criar aula" onAction={() => undefined} /><ErrorState title="Falha ao carregar" description="Verifique a ligação e tente novamente." actionLabel="Tentar novamente" onAction={() => undefined} /></div> },
        ]} />
      </PageContainer>
      <Modal open={modal} onClose={() => setModal(false)} title="Criar atividade" description="Defina os dados essenciais." footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => setModal(false)}>Criar</Button></>}><Input label="Título" autoFocus /></Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Definições" description="Preferências da experiência."><Checkbox label="Modo focado" /><IconButton className="mt-4" aria-label="Mais opções" icon={<MoreHorizontal className="size-5" />} variant="outline" /></Drawer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Showcase />);
