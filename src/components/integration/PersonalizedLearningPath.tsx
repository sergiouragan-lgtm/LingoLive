import React, { useEffect, useState } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useABTesting, useUserABTestVariant } from '@/hooks/useABTesting';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNotifications, useSendNotification } from '@/hooks/useNotifications';
import { auth } from '@/firebase';

export function PersonalizedLearningPath() {
  const user = auth.currentUser;
  const userId = user?.uid || '';

  // Get user's personalization profile
  const { profile, updateInterests } = usePersonalization(userId);

  // Get recommendations based on profile
  const { recommendations, groups, rateRecommendation } = useRecommendations(userId);

  // Track which UI variant the user sees
  const { variant: uiVariant } = useUserABTestVariant('learning-ui-test', userId);

  // Track user engagement
  const { trackEvent } = useAnalytics(userId);

  // Send notifications for achievements
  const { send: sendNotification } = useSendNotification();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // When recommendations load, track that event
  useEffect(() => {
    if (recommendations.length > 0) {
      trackEvent('recommendations_loaded', {
        count: recommendations.length,
        topCategory: groups[0]?.category,
      });
    }
  }, [recommendations.length]);

  const handleSelectPath = async (pathId: string) => {
    setSelectedPath(pathId);

    // Track selection
    trackEvent('learning_path_selected', {
      pathId,
      proficiencyLevel: profile?.proficiencyLevel,
    });

    // Send notification
    await sendNotification(
      userId,
      'Learning Path Started',
      'Your personalized journey begins now!',
      'success'
    );
  };

  const handleRateRecommendation = async (recId: string, rating: number) => {
    await rateRecommendation(recId, rating);

    // Track rating
    trackEvent('recommendation_rated', {
      recommendationId: recId,
      rating,
    });

    // Show encouragement for high ratings
    if (rating >= 4) {
      await sendNotification(
        userId,
        'Great Choice!',
        'Keep up the great engagement!',
        'success'
      );
    }
  };

  const handleUpdateInterests = async (newInterests: string[]) => {
    await updateInterests(newInterests);

    trackEvent('interests_updated', {
      oldInterests: profile?.interests,
      newInterests,
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view personalized content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Learning Path
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Personalized recommendations based on your profile
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Section */}
        {profile && (
          <section className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Profile
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    Proficiency Level
                  </label>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {profile.proficiencyLevel}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    Learning Style
                  </label>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {profile.learningStyle}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                    Current Interests
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.interests.map((interest, i) => (
                      <span
                        key={i}
                        className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const newInterests = ['conversation', 'grammar', 'vocabulary'];
                  handleUpdateInterests(newInterests);
                }}
                className="mt-6 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                Update My Interests
              </button>
            </div>
          </section>
        )}

        {/* UI Variant Info */}
        {uiVariant && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              You're testing: <strong>{uiVariant === 'control' ? 'Standard Interface' : 'Experimental Interface'}</strong>
            </p>
          </div>
        )}

        {/* Recommendations Grid */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recommended Learning Paths
          </h2>

          {groups.length > 0 ? (
            <div className="space-y-8">
              {groups.map((group, idx) => (
                <div key={idx}>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 capitalize">
                    {group.category}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.recommendations.map((rec) => (
                      <div key={rec.recommendationId}>
                        <RecommendationCard
                          recommendation={rec}
                          isSelected={selectedPath === rec.recommendationId}
                          onSelect={() => handleSelectPath(rec.recommendationId)}
                          onRate={(rating) => handleRateRecommendation(rec.recommendationId, rating)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Loading personalized recommendations...
              </p>
            </div>
          )}
        </section>

        {/* Selected Path Details */}
        {selectedPath && (
          <section className="mt-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Learning Path Started
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You've selected a personalized learning path. Track your progress as you complete each lesson and unlock achievements.
              </p>

              <button
                onClick={() => {
                  trackEvent('learning_path_started', { pathId: selectedPath });
                }}
                className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Begin Learning
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: any;
  isSelected: boolean;
  onSelect: () => void;
  onRate: (rating: number) => void;
}

function RecommendationCard({
  recommendation,
  isSelected,
  onSelect,
  onRate,
}: RecommendationCardProps) {
  const [rating, setRating] = useState(0);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all ${
        isSelected
          ? 'border-green-500 dark:border-green-400'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                {recommendation.itemType}
              </span>
              {isSelected && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">
                  Selected
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
              {recommendation.reason}
            </h4>
          </div>
        </div>

        {/* Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Match Score</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(recommendation.score * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${recommendation.score * 100}%` }}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          <p>⏱️ {recommendation.estimatedDuration || 0} mins</p>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rate this recommendation
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRating(star);
                  onRate(star);
                }}
                className={`text-2xl transition-colors ${
                  star <= rating
                    ? 'text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onSelect}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isSelected
              ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700'
              : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700'
          }`}
        >
          {isSelected ? '✓ Selected' : 'Select Path'}
        </button>
      </div>
    </div>
  );
}
