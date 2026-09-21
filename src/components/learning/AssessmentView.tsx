import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { AppView } from '../../types';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useMonitoring } from '../../hooks/useMonitoring';

interface Question {
  question: string;
  options: string[];
}

interface AssessmentViewProps {
  userId: string;
  language: string;
  setView: (view: AppView) => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({ userId, language, setView }) => {
  const { trackEvent } = useAnalytics(userId);
  const { monitors } = useMonitoring();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentId, setAssessmentId] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    trackEvent('assessment_view_viewed', {
      viewName: 'Assessment View',
      language: language,
      viewType: 'proficiency_assessment'
    });
  }, [userId, trackEvent]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/generate-assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
          },
          body: JSON.stringify({ language }),
        });
        const data = await response.json();
        if (!response.ok || !data.assessmentId || !Array.isArray(data.questions)) {
          throw new Error(data.error || 'Não foi possível gerar a avaliação.');
        }
        setAssessmentId(data.assessmentId);
        setQuestions(data.questions);
        trackEvent('assessment_questions_loaded', {
          assessmentId: data.assessmentId,
          language: language,
          questionCount: data.questions.length
        });
      } catch (error) {
        console.error("Error fetching questions:", error);
        trackEvent('assessment_questions_load_failed', {
          language: language,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [language, trackEvent]);

  const handleSubmit = async () => {
    setSubmitting(true);
    trackEvent('assessment_submitted', {
      assessmentId: assessmentId,
      language: language,
      totalQuestions: questions.length,
      answersSubmitted: answers.length
    });
    try {
      const idToken = await auth.currentUser?.getIdToken();
      // Calculate score or send answers to API to get result
      const response = await fetch('/api/submit-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ assessmentId, answers }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Não foi possível corrigir a avaliação.');
      }

      trackEvent('assessment_submission_successful', {
        assessmentId: assessmentId,
        language: language
      });
      setView('dashboard');
    } catch (error) {
      console.error("Error submitting assessment:", error);
      trackEvent('assessment_submission_failed', {
        assessmentId: assessmentId,
        language: language,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Avaliação de Proficiência</h2>
      {questions.length > 0 && currentStep < questions.length ? (
        <div className="space-y-4">
          <p className="text-lg">{questions[currentStep].question}</p>
          <div className="space-y-2">
            {questions[currentStep].options.map((option, index) => (
              <button
                key={index}
                className="w-full text-left p-4 bg-white rounded-lg border hover:bg-indigo-50"
                onClick={() => {
                  trackEvent('assessment_answer_selected', {
                    assessmentId: assessmentId,
                    questionIndex: currentStep,
                    selectedAnswer: index,
                    language: language
                  });
                  setAnswers([...answers, index]);
                  setCurrentStep(currentStep + 1);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          className="w-full p-4 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2" /> Finalizar</>}
        </button>
      )}
    </div>
  );
};
