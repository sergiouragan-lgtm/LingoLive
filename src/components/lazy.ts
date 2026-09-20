import { lazy } from 'react';

// Lazy load feature components to reduce initial bundle size
// These are loaded on-demand only when their routes are accessed

// Admin features
export const AdminDashboard = lazy(() =>
  import('./core/AdminDashboard').then(m => ({ default: m.default }))
);
export const FinancialManagementModule = lazy(() =>
  import('./admin/FinancialManagementModule').then(m => ({ default: m.FinancialManagementModule }))
);

// B2B area features
export const AreaEscolarDashboard = lazy(() =>
  import('./b2b/area-escolar/AreaEscolarDashboard').then(m => ({ default: m.AreaEscolarDashboard }))
);
export const AreaProfessorDashboard = lazy(() =>
  import('./b2b/area-escolar/AreaProfessorDashboard').then(m => ({ default: m.AreaProfessorDashboard }))
);
export const AreaAlunoDashboard = lazy(() =>
  import('./b2b/area-aluno/AreaAlunoDashboard').then(m => ({ default: m.AreaAlunoDashboard }))
);
export const AreaPaisDashboard = lazy(() =>
  import('./b2b/area-pais/AreaPaisDashboard').then(m => ({ default: m.AreaPaisDashboard }))
);
export const EducatorDashboard = lazy(() =>
  import('./b2b/area-escolar/EducatorDashboard').then(m => ({ default: m.default }))
);
export const SchoolEnterprisePlatform = lazy(() =>
  import('./b2b/area-escolar/SchoolEnterprisePlatform').then(m => ({ default: m.SchoolEnterprisePlatform }))
);
export const CorporateEnterprisePlatform = lazy(() =>
  import('./b2b/area-empresarial/CorporateEnterprisePlatform').then(m => ({ default: m.CorporateEnterprisePlatform }))
);

// Marketplace
export const MarketplacePlatform = lazy(() =>
  import('./marketplace/MarketplacePlatform').then(m => ({ default: m.MarketplacePlatform }))
);

// Live classes
export const LiveClassesPlatform = lazy(() =>
  import('./live/LiveClassesPlatform').then(m => ({ default: m.LiveClassesPlatform }))
);

// AI Tutor features
export const AIAssistant = lazy(() =>
  import('./ai-tutor/AIAssistant').then(m => ({ default: m.AIAssistant }))
);
export const PracticeRoom = lazy(() =>
  import('./ai-tutor/conversacao/PracticeRoom').then(m => ({ default: m.default }))
);
export const LiveChatAluno = lazy(() =>
  import('./ai-tutor/LiveChatAluno').then(m => ({ default: m.default }))
);

// Learning features
export const EbookCurationPlatform = lazy(() =>
  import('./learning/ebook/EbookCurationPlatform').then(m => ({ default: m.EbookCurationPlatform }))
);
export const EbookReader = lazy(() =>
  import('./learning/ebook/EbookReader').then(m => ({ default: m.EbookReader }))
);
export const EbookAnalyticsDashboard = lazy(() =>
  import('./learning/ebook/EbookAnalyticsDashboard').then(m => ({ default: m.EbookAnalyticsDashboard }))
);
export const LearningPath = lazy(() =>
  import('./learning/LearningPath').then(m => ({ default: m.LearningPath }))
);
export const CertificationPlatform = lazy(() =>
  import('./learning/CertificationPlatform').then(m => ({ default: m.CertificationPlatform }))
);
export const EducationalCMS = lazy(() =>
  import('./learning/EducationalCMS').then(m => ({ default: m.EducationalCMS }))
);

// Analytics
export const LearningAnalyticsPlatform = lazy(() =>
  import('./learning/LearningAnalyticsPlatform').then(m => ({ default: m.LearningAnalyticsPlatform }))
);
