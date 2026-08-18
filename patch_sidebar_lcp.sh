sed -i '/student: \[/a \
    { id: "live-classes", label: "Aulas ao Vivo (LCP)", icon: Video },\n    { id: "live-calendar", label: "Agenda de Aulas", icon: Calendar },\n    { id: "live-teachers", label: "Professores Nativos", icon: Users },\n    { id: "live-recordings", label: "Gravações & Resumos", icon: PlayCircle },' src/components/core/SidebarConfig.ts

sed -i '/import { /s/$/, Video, PlayCircle/' src/components/core/SidebarConfig.ts
