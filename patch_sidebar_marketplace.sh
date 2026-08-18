sed -i "s/} from 'lucide-react';/, Store, ShoppingBag } from 'lucide-react';/g" src/components/core/SidebarConfig.ts

sed -i '/super_admin: \[/a \
    { id: "marketplace", label: "Marketplace Global", icon: Store },' src/components/core/SidebarConfig.ts

sed -i '/school_admin: \[/a \
    { id: "marketplace", label: "Marketplace Global", icon: Store },' src/components/core/SidebarConfig.ts

sed -i '/corporate_admin: \[/a \
    { id: "marketplace", label: "Marketplace Global", icon: Store },' src/components/core/SidebarConfig.ts

sed -i '/teacher: \[/a \
    { id: "marketplace", label: "Marketplace Global", icon: Store },\n    { id: "marketplace-catalog", label: "Catálogo LingoLIVE", icon: ShoppingBag },' src/components/core/SidebarConfig.ts

sed -i '/student: \[/a \
    { id: "marketplace", label: "Marketplace Global", icon: Store },' src/components/core/SidebarConfig.ts

sed -i '/parent: \[/a \
    { id: "marketplace", label: "Marketplace Global", icon: Store },' src/components/core/SidebarConfig.ts
