import type { UserRole } from "../types";

export type RouteAccess = "public" | "authenticated";

export interface RouteDefinition {
  view: string;
  path: string;
  access: RouteAccess;
  roles?: readonly string[];
  history: "push" | "replace";
}

export const APP_VIEW_IDS = [
  "privacy-policy", "backup", "logs", "global-settings", "ia-tutor", "practice-room",
  "calendario-escolar", "certificacoes", "clients", "ia-analytics", "licenses", "meus-filhos", "notas", "payments", "subscriptions", "support", "users",
  "gestao-financeira", "marketplace", "marketplace-catalog", "marketplace-services", "marketplace-subscriptions", "marketplace-analytics", "marketplace-lars",
  "live-classes", "live-calendar", "live-teachers", "live-rooms", "live-recordings", "live-analytics", "area-empresarial", "colaboradores", "equipas", "academias", "programas", "competencias", "compliance", "analytics-corp", "financeiro-corp", "command-center-corp",
  "professores", "alunos", "turmas", "salas", "horarios", "disciplinas", "frequencia", "financeiro", "configuracoes-escola", "ia-escolar", "biblioteca", "minhas-turmas", "meus-alunos", "mensagens", "avaliacoes", "presencas", "trabalhos", "ia-professor", "calendario", "comunicacao", "gamification", "adaptive-engine",
  "dashboard", "practice", "feedback", "vocab", "quiz", "admin-dashboard", "educator-dashboard", "area-escolar", "area-escolar-b2b", "area-professor", "area-aluno", "area-pais", "live-chat", "languages", "live-sessions", "community", "profile", "perfil", "perfil-aprendizagem", "settings", "subscription", "subscription-plans", "learning-path", "adaptive-learning", "pronunciation", "assessment-platform",
  "pagamentos", "pagamentos-sucesso", "marketing", "criar-turma", "adicionar-alunos", "landing", "onboarding", "activation", "school-registration", "b2b-payment", "school-management", "welcome", "assessment", "waiting-verification", "suspended", "jogos", "ranking", "cms", "certificados", "analytics",
  "ebook-studio", "ebook-curation", "ebook-analytics", "ebook-recommendations", "ebook-notifications", "ebook-achievements", "ebook-assignments-teacher", "ebook-assignments-student", "ebook-flashcards", "ebook-student-dashboard", "ebook-reader", "ebook-student-reader", "ebook-marketplace",
] as const;

const PUBLIC_VIEWS = new Set<string>(["landing", "privacy-policy"]);
const REPLACE_HISTORY_VIEWS = new Set<string>(["onboarding", "waiting-verification", "suspended", "pagamentos-sucesso"]);

const ROLE_POLICIES: Partial<Record<string, readonly string[]>> = {
  "admin-dashboard": ["SUPER_ADMIN", "PLATFORM_ADMIN", "ADMIN"],
  "gestao-financeira": ["SUPER_ADMIN", "PLATFORM_ADMIN", "ADMIN"],
  "area-empresarial": ["COMPANY_OWNER", "COMPANY_ADMIN", "COMPANY_MANAGER", "ORG_ADMIN", "MANAGER"],
  "command-center-corp": ["COMPANY_OWNER", "COMPANY_ADMIN", "COMPANY_MANAGER", "ORG_ADMIN", "MANAGER"],
  "school-management": ["SCHOOL_OWNER", "SCHOOL_ADMIN", "SCHOOL_MANAGER"],
  "configuracoes-escola": ["SCHOOL_OWNER", "SCHOOL_ADMIN", "SCHOOL_MANAGER"],
  "area-professor": ["TEACHER", "NATIVE_LANGUAGE_INSTRUCTOR", "NATIVE_TEACHER", "PROFESSOR NATIVO", "INSTRUTOR DE LÍNGUA NATIVA"],
  "educator-dashboard": ["TEACHER", "NATIVE_LANGUAGE_INSTRUCTOR", "NATIVE_TEACHER", "PROFESSOR NATIVO", "INSTRUTOR DE LÍNGUA NATIVA"],
  "area-pais": ["PARENT_GUARDIAN", "PARENT"],
};

function routePath(view: string): string {
  if (view === "landing") return "/";
  if (view === "privacy-policy") return "/privacy";
  if (view === "pagamentos-sucesso") return "/billing/success";
  if (view === "onboarding") return "/onboarding";
  return `/app/${view}`;
}

export const routeRegistry: ReadonlyMap<string, RouteDefinition> = new Map(
  APP_VIEW_IDS.map((view) => [view, {
    view,
    path: routePath(view),
    access: PUBLIC_VIEWS.has(view) ? "public" : "authenticated",
    roles: ROLE_POLICIES[view],
    history: REPLACE_HISTORY_VIEWS.has(view) ? "replace" : "push",
  }]),
);

const routesByPath = new Map(Array.from(routeRegistry.values(), (route) => [route.path, route]));

export function getRoute(view: string): RouteDefinition {
  return routeRegistry.get(view)!;
}

export function resolveRoute(pathname: string): RouteDefinition | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return routesByPath.get(normalized);
}

export function normalizeRole(role: UserRole | string | null | undefined): string {
  return String(role ?? "").trim().replace(/[\s-]+/g, "_").toUpperCase();
}

export function canAccessRoute(route: RouteDefinition, role?: UserRole | string | null, authenticated = Boolean(role)): boolean {
  if (route.access === "public") return true;
  if (!authenticated) return false;
  if (!route.roles?.length) return true;
  return route.roles.includes(normalizeRole(role));
}

export function isProtectedReturnRoute(view: string): boolean {
  return view === "pagamentos-sucesso" || view === "onboarding" || view === "waiting-verification" || view === "suspended";
}
