'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Layout,
  FileText,
  Edit3,
  Check,
  Save,
  Play,
  RotateCcw,
} from 'lucide-react';

interface LectureSlideViewerProps {
  htmlContent: string;
  moduleTitle?: string;
  weekNumber?: number;
  isTeacher?: boolean;
  onSaveHtml?: (newHtml: string) => Promise<void>;
}

interface ParsedSlide {
  title: string;
  html: string;
}

export default function LectureSlideViewer({
  htmlContent,
  moduleTitle = 'Lecture',
  weekNumber = 1,
  isTeacher = false,
  onSaveHtml,
}: LectureSlideViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'deck' | 'document'>('deck');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableHtml, setEditableHtml] = useState<string>(htmlContent || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditableHtml(htmlContent || '');
    setCurrentSlideIndex(0);
  }, [htmlContent]);

  // Parse HTML content into distinct slide sections
  const slides: ParsedSlide[] = useMemo(() => {
    if (!editableHtml || !editableHtml.trim()) {
      return [
        {
          title: 'Introduction',
          html: `<div class="p-8 text-center text-zinc-500">No slides authored for this week yet.</div>`,
        },
      ];
    }

    const parser = typeof window !== 'undefined' ? new DOMParser() : null;
    if (!parser) {
      return [{ title: 'Slide 1', html: editableHtml }];
    }

    try {
      const doc = parser.parseFromString(editableHtml, 'text/html');
      const sectionElements = doc.querySelectorAll('section.slide, section');

      if (sectionElements.length > 0) {
        const parsed: ParsedSlide[] = [];
        sectionElements.forEach((sec, idx) => {
          const slideTitle =
            sec.getAttribute('data-slide-title') ||
            sec.querySelector('h1, h2, h3, .slide-title')?.textContent?.trim() ||
            `Slide ${idx + 1}`;
          parsed.push({
            title: slideTitle,
            html: sec.innerHTML,
          });
        });
        return parsed;
      }
    } catch (e) {
      console.warn('Error parsing slide HTML:', e);
    }

    // Fallback: single slide with full HTML
    return [
      {
        title: 'Overview',
        html: editableHtml,
      },
    ];
  }, [editableHtml]);

  // Ensure current slide index is valid
  useEffect(() => {
    if (currentSlideIndex >= slides.length) {
      setCurrentSlideIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, currentSlideIndex]);

  // Keyboard navigation for presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return; // Disable shortcuts while typing in editor

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsFullscreen((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, isFullscreen, isEditing]);

  const handleNext = () => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSave = async () => {
    if (!onSaveHtml) return;
    setIsSaving(true);
    try {
      await onSaveHtml(editableHtml);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save slide HTML:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeSlide = slides[currentSlideIndex] || slides[0];
  const progressPct = ((currentSlideIndex + 1) / Math.max(1, slides.length)) * 100;

  return (
    <div
      ref={containerRef}
      data-testid="lecture-slide-viewer"
      className={`flex flex-col bg-canvas border border-border rounded-lg overflow-hidden transition-all duration-150 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none bg-zinc-950 text-zinc-100'
          : 'w-full h-full'
      }`}
    >
      {/* Presentation Top Control Bar */}
      <div
        className={`h-11 px-3 border-b flex items-center justify-between shrink-0 select-none ${
          isFullscreen
            ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
            : 'bg-surface border-border text-ink'
        }`}
      >
        {/* Left: Week & Current Slide Title */}
        <div className="flex items-center space-x-2 truncate">
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase font-medium ${
              isFullscreen
                ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                : 'bg-subtle border-border text-ink'
            }`}
          >
            W{weekNumber} Lecture Slide
          </span>
          <span className="text-xs font-semibold truncate max-w-[120px] sm:max-w-[220px] md:max-w-[280px]">
            {activeSlide?.title || moduleTitle}
          </span>
        </div>

        {/* Center / Right: Navigation & Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Deck vs Document Toggle */}
          <div
            className={`flex items-center p-0.5 rounded border text-[11px] font-medium ${
              isFullscreen ? 'bg-zinc-800 border-zinc-700' : 'bg-subtle border-border'
            }`}
          >
            <button
              onClick={() => setViewMode('deck')}
              data-testid="slide-mode-deck-btn"
              title="Slide Deck Presentation Mode (1 slide at a time)"
              className={`px-2 py-0.5 rounded transition-colors flex items-center space-x-1 ${
                viewMode === 'deck'
                  ? isFullscreen
                    ? 'bg-zinc-700 text-white shadow-2xs'
                    : 'bg-surface text-ink shadow-2xs font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <Layout className="w-3 h-3" />
              <span className="hidden sm:inline">Slide Deck</span>
            </button>
            <button
              onClick={() => setViewMode('document')}
              data-testid="slide-mode-doc-btn"
              title="Continuous Document Mode (read all slides)"
              className={`px-2 py-0.5 rounded transition-colors flex items-center space-x-1 ${
                viewMode === 'document'
                  ? isFullscreen
                    ? 'bg-zinc-700 text-white shadow-2xs'
                    : 'bg-surface text-ink shadow-2xs font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">All Slides</span>
            </button>
          </div>

          {/* Teacher Edit Mode Toggle */}
          {isTeacher && onSaveHtml && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              data-testid="edit-slides-btn"
              title="Edit Slide HTML"
              className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center space-x-1 ${
                isEditing
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : isFullscreen
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-surface border-border text-ink hover:bg-subtle'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span className="hidden sm:inline">{isEditing ? 'Preview' : 'Edit HTML'}</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            data-testid="fullscreen-slide-btn"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Present Fullscreen (F)'}
            className={`p-1.5 rounded border transition-colors ${
              isFullscreen
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                : 'bg-surface border-border text-ink hover:bg-subtle'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Thin Slide Progress Bar */}
      {viewMode === 'deck' && !isEditing && (
        <div className="w-full h-1 bg-border/40 shrink-0">
          <div
            className={`h-full transition-all duration-200 ease-out ${
              isFullscreen ? 'bg-zinc-100' : 'bg-ink'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {isEditing ? (
          /* Teacher HTML Code Editor */
          <div className="flex-1 flex flex-col p-4 bg-zinc-900 text-zinc-100 overflow-hidden space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Authoring Slides HTML (&lt;section class=&quot;slide&quot;&gt;...&lt;/section&gt;)</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  data-testid="save-slide-html-btn"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Slides'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={editableHtml}
              onChange={(e) => setEditableHtml(e.target.value)}
              data-testid="slides-html-textarea"
              placeholder="<section class='slide' data-slide-title='Introduction'>...</section>"
              className="flex-1 w-full bg-zinc-950 text-zinc-100 font-mono text-xs p-3 rounded border border-zinc-800 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
            />
          </div>
        ) : viewMode === 'deck' ? (
          /* DECK PRESENTATION MODE (1 slide centered with aspect canvas) */
          <div
            className={`flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto ${
              isFullscreen ? 'bg-zinc-950 text-zinc-100' : 'bg-canvas'
            }`}
          >
            <div
              data-testid="active-slide-canvas"
              className={`w-full min-h-[420px] rounded-lg border p-6 sm:p-10 shadow-xs flex flex-col justify-between transition-all duration-150 ${
                isFullscreen
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl'
                  : 'bg-surface border-border text-ink'
              }`}
            >
              {/* Slide Body HTML */}
              <div
                className="prose prose-sm max-w-none prose-zinc dark:prose-invert leading-relaxed slide-content font-sans"
                dangerouslySetInnerHTML={{ __html: activeSlide?.html || '' }}
              />

              {/* Bottom Canvas Footer within Slide */}
              <div
                className={`mt-8 pt-4 border-t flex items-center justify-between text-[11px] font-mono select-none ${
                  isFullscreen ? 'border-zinc-800 text-zinc-400' : 'border-border text-ink-secondary'
                }`}
              >
                <span>
                  {weekNumber ? `Week ${weekNumber}` : 'Master Course'} • {moduleTitle}
                </span>
                <span>
                  Slide {currentSlideIndex + 1} / {slides.length}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* CONTINUOUS DOCUMENT MODE (All slides stacked) */
          <div
            data-testid="continuous-slide-doc"
            className="flex-1 p-6 space-y-6 overflow-y-auto w-full"
          >
            {slides.map((s, idx) => (
              <div
                key={idx}
                className="p-6 bg-surface border border-border rounded-lg shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-semibold text-ink font-sans">
                    Slide {idx + 1}: {s.title}
                  </span>
                  <span className="text-[10px] font-mono text-ink-secondary">
                    {idx + 1} of {slides.length}
                  </span>
                </div>
                <div
                  className="prose prose-sm max-w-none text-xs text-ink leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: s.html }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM SLIDE DECK CONTROLS (Only in Deck Mode) */}
      {viewMode === 'deck' && !isEditing && (
        <div
          className={`h-12 px-4 border-t flex items-center justify-between shrink-0 select-none ${
            isFullscreen
              ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
              : 'bg-surface border-border text-ink'
          }`}
        >
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            data-testid="prev-slide-btn"
            className={`px-3 py-1.5 text-xs rounded border flex items-center space-x-1.5 transition-colors disabled:opacity-30 ${
              isFullscreen
                ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                : 'border-border bg-subtle hover:bg-zinc-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
            <span className="text-[10px] opacity-60 hidden sm:inline font-mono">←</span>
          </button>

          {/* Slide Indicator & Dropdown Jump */}
          <div className="flex items-center space-x-3">
            <span data-testid="slide-counter-badge" className="text-xs font-mono font-medium">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>

            <select
              value={currentSlideIndex}
              onChange={(e) => setCurrentSlideIndex(Number(e.target.value))}
              data-testid="slide-jump-select"
              className={`text-xs rounded border px-2 py-1 font-mono focus:outline-none cursor-pointer ${
                isFullscreen
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'bg-canvas border-border text-ink'
              }`}
            >
              {slides.map((s, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1}. {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentSlideIndex === slides.length - 1}
            data-testid="next-slide-btn"
            className={`px-3 py-1.5 text-xs rounded border flex items-center space-x-1.5 transition-colors disabled:opacity-30 ${
              currentSlideIndex === slides.length - 1
                ? isFullscreen
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-500'
                  : 'border-border bg-subtle text-ink-secondary'
                : 'bg-ink text-white border-ink hover:bg-ink-secondary'
            }`}
          >
            <span>Next</span>
            <span className="text-[10px] opacity-75 hidden sm:inline font-mono">→</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
