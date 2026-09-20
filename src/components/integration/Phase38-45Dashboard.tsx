import React, { useEffect } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useABTesting, useUserABTestVariant } from '@/hooks/useABTesting';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useMonitoring, useMetrics, useMonitoringDashboard } from '@/hooks/useMonitoring';
import { useNotifications } from '@/hooks/useNotifications';
import { useAnalytics } from '@/hooks/useAnalytics';
import { auth } from '@/firebase';

export function Phase38_45Dashboard() {
  const user = auth.currentUser;
  const userId = user?.uid || '';

  // Feature Flags (Phase 42)
  const featureFlags = useFeatureFlags();

  // A/B Testing (Phase 42)
  const abTesting = useABTesting();

  // Personalization (Phase 42)
  const personalization = usePersonalization(userId);

  // Recommendations (Phase 42)
  const recommendations = useRecommendations(userId);

  // Monitoring Dashboard (Phase 44)
  const monitoringDashboard = useMonitoringDashboard();

  // Notifications (Phase 43)
  const notifications = useNotifications(userId);

  // Analytics (Phase 41)
  const analytics = useAnalytics(userId);

  useEffect(() => {
    analytics.getUserAnalytics();
  }, []);

  if (!user) {
    return <div className="p-6 text-center text-gray-600">Please log in to view dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            LingoLive Intelligence Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Unified dashboard for Phases 38-45 integration
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature Flags Section */}
          <Section title="Feature Flags" loading={featureFlags.isLoading}>
            {featureFlags.flags.length > 0 ? (
              <div className="space-y-3">
                {featureFlags.flags.slice(0, 5).map((flag) => (
                  <div
                    key={flag.flagId}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{flag.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Rollout: {flag.rollout}%
                      </p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        flag.enabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No feature flags configured</p>
            )}
          </Section>

          {/* A/B Testing Section */}
          <Section title="Active Tests" loading={abTesting.isLoading}>
            {abTesting.tests.length > 0 ? (
              <div className="space-y-3">
                {abTesting.tests.slice(0, 5).map((test) => (
                  <div
                    key={test.testId}
                    className="p-3 bg-white dark:bg-slate-700 rounded-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{test.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {test.splitPercentage}% split
                      </span>
                      <div className="flex gap-1">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          Control
                        </span>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                          Variant
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No active tests</p>
            )}
          </Section>

          {/* Personalization Section */}
          <Section title="Your Profile" loading={personalization.isLoading}>
            {personalization.profile ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Learning Style</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {personalization.profile.learningStyle}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Proficiency Level</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {personalization.profile.proficiencyLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Interests</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {personalization.profile.interests.slice(0, 3).map((interest, i) => (
                      <span
                        key={i}
                        className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No profile data</p>
            )}
          </Section>

          {/* Recommendations Section */}
          <Section title="Recommended for You" loading={recommendations.isLoading} span={2}>
            {recommendations.recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.recommendations.slice(0, 4).map((rec) => (
                  <div key={rec.recommendationId} className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{rec.reason}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {rec.itemType}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            style={{ width: `${rec.score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {Math.round(rec.score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No recommendations yet</p>
            )}
          </Section>

          {/* Monitoring Section */}
          <Section title="System Health" loading={!monitoringDashboard.dashboard}>
            {monitoringDashboard.dashboard ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      monitoringDashboard.dashboard.health === 'healthy'
                        ? 'bg-green-500'
                        : monitoringDashboard.dashboard.health === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {monitoringDashboard.dashboard.health}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(monitoringDashboard.dashboard.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            )}
          </Section>

          {/* Notifications Section */}
          <Section title="Recent Notifications" span={2}>
            {notifications.notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.notificationId}
                    className={`p-3 rounded-lg border ${
                      notif.read
                        ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700'
                        : 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{notif.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No notifications</p>
            )}
          </Section>
        </div>

        {/* Analytics Summary */}
        {analytics.analytics && (
          <Section title="Your Analytics" span={3} className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat
                label="Total Events"
                value={analytics.analytics.totalEvents.toLocaleString()}
              />
              <Stat
                label="Sessions"
                value={analytics.analytics.sessionCount.toLocaleString()}
              />
              <Stat
                label="Avg Duration"
                value={`${Math.round(analytics.analytics.avgSessionDuration)}s`}
              />
              {analytics.analytics.conversionRate && (
                <Stat
                  label="Conversion"
                  value={`${(analytics.analytics.conversionRate * 100).toFixed(1)}%`}
                />
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
  span?: number;
  className?: string;
}

function Section({ title, loading, children, span = 1, className = '' }: SectionProps) {
  return (
    <div
      className={`lg:col-span-${span} ${className}`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-lg">
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
