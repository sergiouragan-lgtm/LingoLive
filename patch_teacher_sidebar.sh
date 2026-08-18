sed -i '/teacher: \[/a \
    { id: "live-classes", label: "Aulas ao Vivo (LCP)", icon: Video },\n    { id: "live-calendar", label: "Agenda de Aulas", icon: Calendar },\n    { id: "live-rooms", label: "Salas Inteligentes", icon: Monitor },\n    { id: "live-recordings", label: "Minhas Gravações", icon: PlayCircle },' src/components/core/SidebarConfig.ts

sed -i "s/} from 'lucide-react';/, Monitor } from 'lucide-react';/g" src/components/core/SidebarConfig.ts
