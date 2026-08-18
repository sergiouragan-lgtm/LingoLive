sed -i '/{(\["professores", "alunos"/i \
        {(["area-empresarial", "colaboradores", "equipas", "academias", "programas", "competencias", "compliance", "analytics-corp", "financeiro-corp", "command-center-corp"].includes(view)) \&\& (\n          <CorporateEnterprisePlatform activeView={view} setView={setView} />\n        )}\n' src/App.tsx
