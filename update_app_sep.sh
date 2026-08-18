sed -i 's/import { SchoolManagement } from ".\/components\/b2b\/area-escolar\/SchoolManagement";/import { SchoolEnterprisePlatform } from ".\/components\/b2b\/area-escolar\/SchoolEnterprisePlatform";/g' src/App.tsx
sed -i 's/<SchoolManagement \/>/<SchoolEnterprisePlatform activeView={view} setView={setView} \/>/g' src/App.tsx
