import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Highlighter,
  Bookmark,
  Share2,
  Settings,
  Zap,
  MessageSquare,
  Download,
} from 'lucide-react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { auth } from '@/firebase';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMonitoring } from '@/hooks/useMonitoring';

interface Highlight {
  id: string;
  text: string;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  createdAt: number;
  note?: string;
}

interface Bookmark {
  id: string;
  page: number;
  timestamp: number;
  note?: string;
}

interface EbookPage {
  pageNumber: number;
  content: string;
  imageUrl?: string;
}

interface EbookReaderProps {
  ebookId: string;
  userId: string;
  title: string;
  author: string;
  pages: EbookPage[];
  totalPages: number;
  readingProgress: number;
}

const HIGHLIGHT_COLORS = {
  yellow: 'bg-yellow-200 dark:bg-yellow-700',
  green: 'bg-green-200 dark:bg-green-700',
  blue: 'bg-blue-200 dark:bg-blue-700',
  pink: 'bg-pink-200 dark:bg-pink-700',
};

export const EbookReader: React.FC<EbookReaderProps> = ({
  ebookId,
  userId: propUserId,
  title,
  author,
  pages,
  totalPages,
  readingProgress,
}) => {
  const currentUserId = auth.currentUser?.uid || '';
  const { trackEvent } = useAnalytics(currentUserId);
  const { monitors } = useMonitoring();
  const [currentPage, setCurrentPage] = useState(Math.floor((readingProgress / 100) * totalPages));
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [highlightColor, setHighlightColor] = useState<'yellow' | 'green' | 'blue' | 'pink'>('yellow');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUserId) {
      trackEvent('ebook_reader_opened', {
        ebookId,
        title,
        author,
        totalPages,
        startingProgress: readingProgress
      });
    }
  }, [currentUserId, trackEvent, ebookId, title, author, totalPages, readingProgress]);

  const { data: savedHighlights } = useRealtimeSync<Highlight[]>(
    `ebooks/${ebookId}/highlights/${propUserId}`,
    (data) => {
      if (data) setHighlights(data);
      return data || [];
    }
  );

  const { data: savedBookmarks } = useRealtimeSync<Bookmark[]>(
    `ebooks/${ebookId}/bookmarks/${propUserId}`,
    (data) => {
      if (data) setBookmarks(data);
      return data || [];
    }
  );

  const currentPageData = pages[currentPage] || pages[0];
  const progress = Math.round(((currentPage + 1) / totalPages) * 100);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setShowHighlightMenu(true);
    }
  };

  const addHighlight = async () => {
    if (!selectedText) return;

    const highlight: Highlight = {
      id: Date.now().toString(),
      text: selectedText,
      color: highlightColor,
      createdAt: Date.now(),
    };

    setHighlights([...highlights, highlight]);
    setShowHighlightMenu(false);
    setSelectedText('');

    if (currentUserId) {
      trackEvent('ebook_highlight_added', {
        ebookId,
        color: highlightColor,
        textLength: selectedText.length,
        pageNumber: currentPage
      });
    }

    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      await fetch(`/api/ebooks/${ebookId}/highlights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: propUserId, highlight }),
      });
    } catch (error) {
      console.error('Failed to save highlight:', error);
    }
  };

  const toggleBookmark = async () => {
    const existingBookmark = bookmarks.find((b) => b.page === currentPage);

    if (existingBookmark) {
      setBookmarks(bookmarks.filter((b) => b.id !== existingBookmark.id));
    } else {
      const bookmark: Bookmark = {
        id: Date.now().toString(),
        page: currentPage,
        timestamp: Date.now(),
      };
      setBookmarks([...bookmarks, bookmark]);
    }

    if (currentUserId) {
      trackEvent('ebook_bookmark_toggled', {
        ebookId,
        pageNumber: currentPage,
        action: existingBookmark ? 'removed' : 'added',
        totalBookmarks: existingBookmark ? bookmarks.length - 1 : bookmarks.length + 1
      });
    }

    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      await fetch(`/api/ebooks/${ebookId}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: propUserId,
          page: currentPage,
          action: existingBookmark ? 'remove' : 'add',
        }),
      });
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const updateProgress = async (page: number) => {
    setCurrentPage(page);
    const newProgress = Math.round(((page + 1) / totalPages) * 100);

    if (currentUserId) {
      trackEvent('ebook_page_changed', {
        ebookId,
        pageNumber: page,
        totalPages,
        progressPercent: newProgress
      });
    }

    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();
      await fetch(`/api/ebooks/${ebookId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: propUserId,
          page,
          progress: newProgress,
        }),
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const isCurrentPageBookmarked = bookmarks.some((b) => b.page === currentPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Reader Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{author}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentPage + 1} / {totalPages}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{progress}%</p>
            </div>

            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition-colors ${
                isCurrentPageBookmarked
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Bookmark className="w-5 h-5" fill={isCurrentPageBookmarked ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 dark:bg-gray-700 h-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-indigo-600 dark:bg-indigo-400"
          ></motion.div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4"
          >
            <div className="max-w-4xl mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                  Tamanho da Fonte: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                  Altura da Linha: {lineHeight.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.2"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          ref={contentRef}
          onMouseUp={handleTextSelection}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 min-h-96 cursor-text"
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          {currentPageData?.imageUrl && (
            <img
              src={currentPageData.imageUrl}
              alt={`Page ${currentPage + 1}`}
              className="w-full rounded-lg mb-6"
            />
          )}

          <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {currentPageData?.content}
          </div>

          {/* Highlights on Page */}
          {highlights.map((highlight) => (
            <motion.div
              key={highlight.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 p-3 rounded-lg ${HIGHLIGHT_COLORS[highlight.color]} border-l-4 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setSelectedHighlight(highlight)}
            >
              <p className="text-sm font-medium italic">{highlight.text}</p>
              {highlight.note && (
                <p className="text-xs mt-2 opacity-75">{highlight.note}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Highlight Menu */}
        <AnimatePresence>
          {showHighlightMenu && selectedText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50"
            >
              <div className="flex items-center gap-2 mb-3">
                {(
                  [
                    'yellow',
                    'green',
                    'blue',
                    'pink',
                  ] as const
                ).map((color) => (
                  <button
                    key={color}
                    onClick={() => setHighlightColor(color)}
                    className={`w-6 h-6 rounded ${HIGHLIGHT_COLORS[color]} ${
                      highlightColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={addHighlight}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Highlighter className="w-4 h-4" />
                Destacar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => updateProgress(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 mx-4">
            <input
              type="range"
              min="0"
              max={totalPages - 1}
              value={currentPage}
              onChange={(e) => updateProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={() => updateProgress(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Highlights Summary */}
        {highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
              <Highlighter className="w-5 h-5" />
              Seus Destaques ({highlights.length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {highlights.map((highlight) => (
                <button
                  key={highlight.id}
                  onClick={() => updateProgress(currentPage)}
                  className={`w-full text-left p-2 rounded border-l-4 ${HIGHLIGHT_COLORS[highlight.color]} hover:shadow-md transition-shadow`}
                >
                  <p className="text-sm font-medium italic">{highlight.text}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
