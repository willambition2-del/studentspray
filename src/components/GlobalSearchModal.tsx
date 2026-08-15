/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, Sparkles, Filter, Clock, ArrowRight, CheckCircle2, 
  Users, BookOpen, Sliders, ClipboardList, Award, MessageSquare, 
  FileText, ShieldCheck, ChevronRight, Scale, Zap, History, RefreshCw, AlertCircle
} from 'lucide-react';

import { SearchResultCategory, SearchResultItem, SearchHistoryItem } from '../lib/search/searchTypes';
import { CurrentUserRef } from '../lib/search/permissionFilter';
import { executeUnifiedSearch, SearchEngineResult } from '../lib/search/smartSearchService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUserRef;
  currentContextTab?: string;
  onNavigateToTab: (tabId: string, params?: any) => void;
  demoUsers?: any[];
  examsData?: any[];
  shelfData?: any[];
  decisionsData?: any[];
  alertsData?: any[];
}

const CATEGORY_TABS: Array<{ id: SearchResultCategory; label: string; icon: any }> = [
  { id: 'all', label: 'الكل', icon: Search },
  { id: 'students', label: 'الطلاب', icon: Users },
  { id: 'teachers_staff', label: 'الكادر والمعلمون', icon: Sliders },
  { id: 'circles', label: 'الحلقات', icon: BookOpen },
  { id: 'exams_grades', label: 'الدرجات والاختبارات', icon: Award },
  { id: 'field_visits', label: 'الزيارات الميدانية', icon: ClipboardList },
  { id: 'shelf_files', label: 'الملفات والمصادر', icon: FileText },
  { id: 'activities_awards', label: 'الأنشطة والأوسمة', icon: Award },
  { id: 'decisions_tasks', label: 'القرارات والمهام', icon: ShieldCheck }
];

export default function GlobalSearchModal({
  isOpen,
  onClose,
  currentUser,
  currentContextTab,
  onNavigateToTab,
  demoUsers,
  examsData,
  shelfData,
  decisionsData,
  alertsData
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchResultCategory>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('alhudacenter_search_history');
      return saved ? JSON.parse(saved) : [
        { id: 'h-1', query: 'الطلاب المتفوقين', timestamp: 'اليوم' },
        { id: 'h-2', query: 'حلقة عاصم الكوفي', timestamp: 'أمس' },
        { id: 'h-3', query: 'الزيارات الميدانية', timestamp: 'هذا الأسبوع' }
      ];
    } catch (e) {
      return [];
    }
  });

  const [isDebouncing, setIsDebouncing] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query input by 200ms
  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsDebouncing(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Execute Search Engine
  const searchResult: SearchEngineResult = useMemo(() => {
    return executeUnifiedSearch({
      user: currentUser,
      query: debouncedQuery,
      categoryFilter: activeCategory,
      contextTab: currentContextTab,
      demoUsers,
      examsData,
      shelfData,
      decisionsData,
      alertsData
    });
  }, [debouncedQuery, activeCategory, currentUser, currentContextTab, demoUsers, examsData, shelfData, decisionsData, alertsData]);

  // Save history item handler
  const handleSelectQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    addToHistory(selectedQuery);
  };

  const addToHistory = (q: string) => {
    if (!q || !q.trim()) return;
    const clean = q.trim();
    const updated = [
      { id: `hist-${Date.now()}`, query: clean, timestamp: 'الآن' },
      ...searchHistory.filter(h => h.query.toLowerCase() !== clean.toLowerCase())
    ].slice(0, 8);

    setSearchHistory(updated);
    try {
      localStorage.setItem('alhudacenter_search_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving search history:', e);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('alhudacenter_search_history');
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Click Outside Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container */}
      <div className="relative bg-white rounded-3xl w-full max-w-5xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-200">
        
        {/* Top Search Bar Input Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border-b border-emerald-800/50 flex flex-col gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              {isDebouncing ? (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم، الحلقة، المعلم، الزيارة، أو جرب أمر مقارنة (مثال: قارن أحمد ومحمد)..."
                className="w-full bg-slate-800/80 text-white placeholder-slate-400 text-sm sm:text-base font-bold rounded-2xl px-4 py-3 border border-slate-700/80 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all text-right"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                showAdvanced 
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 font-extrabold' 
                  : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">بحث متقدم</span>
            </button>

            <button
              onClick={onClose}
              className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors cursor-pointer shrink-0"
              title="إغلاق (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Context & Keyboard Shortcut Hints */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 px-1 font-medium">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-800/60 px-2.5 py-0.5 rounded-lg border border-emerald-700 text-emerald-200 font-bold">
                المستخدم: {currentUser.name} ({currentUser.roleName})
              </span>
              {currentContextTab && (
                <span className="bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700 text-slate-300">
                  السياق الحالي: {currentContextTab}
                </span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-[10px]">Ctrl + K</span>
              <span>أو</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-[10px]">Esc</span>
              <span>للإغلاق</span>
            </div>
          </div>

        </div>

        {/* Advanced Filters Panel (Optional Toggle) */}
        {showAdvanced && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-slate-600 font-bold mb-1">تصنيف الوحدة:</label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value as SearchResultCategory)}
                className="w-full p-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                {CATEGORY_TABS.map(tab => (
                  <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">طبيعة البحث:</label>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700 font-bold text-[11px]">
                بحث موحد عبر الفهارس والصلاحيات الرسمية
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">إعادة تعيين الفلاتر:</label>
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); setQuery(''); }}
                className="w-full p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer text-center"
              >
                إلغاء جميع الفلاتر
              </button>
            </div>
          </div>
        )}

        {/* Category Navigation Tabs */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {CATEGORY_TABS.map(tab => {
            const count = searchResult.categoryCounts[tab.id] || 0;
            const isSelected = activeCategory === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body Content Area (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* Did You Mean / Correction Suggestion */}
          {searchResult.suggestedCorrection && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>لم نجد تطابقاً حرفياً دقيقاً، هل تقصد: <strong className="text-amber-950 font-black underline cursor-pointer" onClick={() => handleSelectQuery(searchResult.suggestedCorrection!)}>{searchResult.suggestedCorrection}</strong>؟</span>
              </div>
              <button
                onClick={() => handleSelectQuery(searchResult.suggestedCorrection!)}
                className="px-3 py-1 bg-amber-600 text-white rounded-xl text-[11px] font-bold hover:bg-amber-700 transition-colors cursor-pointer"
              >
                استخدام هذا الاقتراح
              </button>
            </div>
          )}

          {/* Smart Entity Comparison Result View (If comparison query detected) */}
          {searchResult.comparisonResult && searchResult.comparisonResult.isComparison && (
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-indigo-700 shadow-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-700/50 rounded-xl border border-indigo-500/50">
                    <Scale className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white">{searchResult.comparisonResult.title}</h3>
                    <p className="text-[11px] text-indigo-200 mt-0.5">{searchResult.comparisonResult.description}</p>
                  </div>
                </div>
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-xs">
                  مقارنة ذكية
                </span>
              </div>

              {/* Comparison Header Cards */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-indigo-950/80 rounded-2xl border border-indigo-700/60">
                  <span className="text-[10px] text-indigo-300 font-bold block">{searchResult.comparisonResult.entity1.badge}</span>
                  <strong className="text-sm font-black text-white mt-1 block">{searchResult.comparisonResult.entity1.name}</strong>
                  <span className="text-[10px] text-slate-300 block">{searchResult.comparisonResult.entity1.subtitle}</span>
                </div>

                <div className="p-3 bg-indigo-950/80 rounded-2xl border border-indigo-700/60">
                  <span className="text-[10px] text-indigo-300 font-bold block">{searchResult.comparisonResult.entity2.badge}</span>
                  <strong className="text-sm font-black text-white mt-1 block">{searchResult.comparisonResult.entity2.name}</strong>
                  <span className="text-[10px] text-slate-300 block">{searchResult.comparisonResult.entity2.subtitle}</span>
                </div>
              </div>

              {/* Metrics Table Comparison */}
              <div className="space-y-2 bg-indigo-950/40 p-3 rounded-2xl border border-indigo-800/40 text-xs">
                {searchResult.comparisonResult.metrics.map((metric, idx) => {
                  const val1 = metric.numericValue1 ?? 0;
                  const val2 = metric.numericValue2 ?? 0;
                  const is1Better = val1 > val2;
                  const is2Better = val2 > val1;

                  return (
                    <div key={idx} className="grid grid-cols-3 items-center text-center p-2 rounded-xl bg-slate-900/60 border border-indigo-900/50">
                      <div className={`font-mono font-bold text-xs ${is1Better ? 'text-emerald-400 font-black' : 'text-slate-300'}`}>
                        {metric.value1} {is1Better && '★'}
                      </div>
                      <div className="text-[11px] font-bold text-indigo-200">
                        {metric.label}
                      </div>
                      <div className={`font-mono font-bold text-xs ${is2Better ? 'text-emerald-400 font-black' : 'text-slate-300'}`}>
                        {metric.value2} {is2Better && '★'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {searchResult.comparisonResult.aiSummary && (
                <div className="p-3 bg-indigo-800/40 rounded-xl border border-indigo-700/40 text-xs text-indigo-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{searchResult.comparisonResult.aiSummary}</span>
                </div>
              )}
            </div>
          )}

          {/* Search History & Quick Suggestions (When query is short or empty) */}
          {!query && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" />
                  سجل عمليات البحث الأخيرة
                </h4>
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer"
                  >
                    مسح السجل
                  </button>
                )}
              </div>

              {searchHistory.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">لا يوجد سجل بحث سابق.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map(hist => (
                    <button
                      key={hist.id}
                      onClick={() => handleSelectQuery(hist.query)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{hist.query}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Suggested Queries */}
              <div className="pt-2">
                <h5 className="font-bold text-xs text-slate-700 mb-2">اقتراحات بحث شائعة للملتقى:</h5>
                <div className="flex flex-wrap gap-2">
                  {[
                    'الطلاب المتفوقين',
                    'حلقة عاصم الكوفي',
                    'الطلاب الغائبين هذا الأسبوع',
                    'الزيارات الميدانية',
                    'قارن أحمد ومحمد',
                    'الخطة التشغيلية لشهر رمضان',
                    'القرارات الإدارية العليا'
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuery(sug)}
                      className="px-3 py-1.5 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-3">
            {query && (
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold pb-1 border-b border-slate-200">
                <span>تم العثور على {searchResult.totalCount} نتيجة مطابقة</span>
                <span>ترتيب النتائج حسب درجة الصلة بالنظام</span>
              </div>
            )}

            {searchResult.items.length === 0 && query ? (
              <div className="py-12 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200 p-6">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-black text-base text-slate-800">لم نجد نتائج مطابقة لـ "{query}"</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  تأكد من صحة الكلمات أو جرب استخدام كلمات عامة، أو تأكد من إعطاء الصلاحية المطلوبة للوصول لهذا القسم.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setActiveCategory('all'); }}
                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    عرض جميع السجلات المتاحة
                  </button>
                </div>
              </div>
            ) : (
              searchResult.items.map((item) => {
                const badgeBg = 
                  item.badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  item.badgeColor === 'indigo' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                  item.badgeColor === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  item.badgeColor === 'rose' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                  item.badgeColor === 'purple' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                  'bg-slate-100 text-slate-800 border-slate-200';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      addToHistory(query || item.title);
                      onNavigateToTab(item.actionTab, item.actionParams);
                      onClose();
                    }}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group space-y-2.5 relative"
                  >
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${badgeBg}`}>
                            {item.badge}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            • {item.categoryLabel}
                          </span>
                          {item.matchReason && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">
                              {item.matchReason}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition-colors mt-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.relevanceScore > 0 && (
                          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200">
                            صلة {item.relevanceScore}%
                          </span>
                        )}
                        <button
                          type="button"
                          className="px-3.5 py-1.5 bg-slate-900 group-hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <span>استعراض</span>
                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>
                    </div>

                    {/* Key Metrics Pills */}
                    {item.keyMetrics && item.keyMetrics.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                        {item.keyMetrics.map((m, idx) => (
                          <div key={idx} className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-medium">
                            <span className="text-slate-400 ml-1">{m.label}:</span>
                            <strong className={`font-mono ${m.color || 'text-slate-900'}`}>{m.value}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Snippet / Description */}
                    {item.snippet && (
                      <p className="text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-normal line-clamp-2">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold px-6">
          <span>محرك البحث الموحد الذكي — ملتقى الهدى القرآني</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
