sed -i '/import { CorporateEnterprisePlatform }/a import { LiveClassesPlatform } from "./components/live/LiveClassesPlatform";' src/App.tsx
sed -i '/{(\["area-empresarial", "colaboradores", "equipas", "academias", "programas", "competencias", "compliance", "certificacoes", "analytics-corp", "financeiro-corp", "command-center-corp"\].includes(view)) && (/i \
        {(["live-classes", "live-calendar", "live-teachers", "live-rooms", "live-recordings", "live-analytics"].includes(view)) \&\& (\n          <LiveClassesPlatform activeView={view} setView={setView} />\n        )}\n' src/App.tsx
