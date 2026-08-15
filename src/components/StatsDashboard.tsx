/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, BookOpen, Activity, Clock, FileText, LayoutDashboard, 
  Brain, ShieldAlert, Award, Sparkles, RefreshCw, ChevronLeft 
} from 'lucide-react';

import { GeneralDashboardStats, CriticalAlert, ApprovalRequest, AdminDecision } from '../types';

// Importing our modular subviews
import ExecutiveSummaryView from './dashboard/ExecutiveSummaryView';
import EducationalIndicatorsView from './dashboard/EducationalIndicatorsView';
import TeachersCirclesView from './dashboard/TeachersCirclesView';
import GraduatesTimelineView from './dashboard/GraduatesTimelineView';
import QuickReportsView from './dashboard/QuickReportsView';

import { canViewStrategicDashboard } from '../App';

interface StatsDashboardProps {
  stats: GeneralDashboardStats;
  alerts: CriticalAlert[];
  approvals: ApprovalRequest[];
  onNavigate: (tabId: string) => void;
  onRefresh: () => void;
  onAddDecision: (data: Partial<AdminDecision>) => void;
  currentUser?: any;
}

export default function StatsDashboard({ 
  stats, alerts, approvals, onNavigate, onRefresh, onAddDecision, currentUser 
}: StatsDashboardProps) {
  // Navigation State representing the 5 major thematic panels mapping Section 1-9
  const [activeTabMenu, setActiveTabMenu] = useState<'overview' | 'educational' | 'teachers' | 'timeline' | 'reports'>('overview');
  
  // Guard check: Do not render if user is not authorized
  if (currentUser && !canViewStrategicDashboard(currentUser)) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-xs" dir="rtl">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 font-display">صلاحية محجوبة (مركز القيادة)</h3>
        <p className="text-slate-600 text-xs leading-relaxed">
          عذراً، لوحة الأداء والمؤشرات الاستراتيجية (مركز القيادة) مخصصة فقط للمدير العام والمدير التنفيذي. ليس لديك الصلاحية المطلوبة (<code className="bg-slate-100 px-2 py-0.5 rounded text-amber-800 font-mono text-[11px]">view_strategic_dashboard</code>) للوصول إلى هذا القسم.
        </p>
      </div>
    );
  }
  
  // Bridge method to convert recommendations / support alerts into legal executive decision structures
  const handleDirectDecisionGeneration = (title: string, content: string) => {
    onAddDecision({
      title,
      content,
      type: 'general',
      status: 'ongoing'
    });
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl" id="general-manager-command-node">
      
      {/* GLOWING HEADER BLOCK */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden" id="dashboard-hub-header">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-12 translate-y-[-12px] opacity-35" />
        <div className="space-y-1.5 z-10 relative">
          <div className="flex items-center gap-2">
            <span className="p-1 px-3 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px] uppercase">وحدة المشرف العام والمدير العام</span>
            <div className="flex items-center gap-1.5 text-amber-500 animate-pulse text-xs font-bold">
              <Brain className="h-4 w-4" />
              <span>مساعد الذكاء الاصطناعي نشط</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 font-display">لوحة الأداء والمؤشرات الاستراتيجية (مركز القيادة)</h2>
          <p className="text-slate-400 text-xs font-medium">مركز تحليل فوري يمنح الإدارة رؤية شاملة وتفصيلية عن الحلقات، المدرسين، الطلاب، الخريجين ومعدلات الالتزام.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10">
          <button 
            onClick={onRefresh}
            className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95"
            title="تحديث دراسات الكفاءة"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span>تحديث المؤشرات</span>
          </button>
        </div>
      </div>

      {/* CORE THEMATIC NAV TABS IN ARABIC */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 pb-1 scrollbar-thin scrollbar-thumb-slate-200" id="advanced-tabs-bar">
        
        <button 
          onClick={() => setActiveTabMenu('overview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold shrink-0 transition-all border-b-2 ${activeTabMenu === 'overview' ? 'border-emerald-600 text-emerald-700 font-display' : 'border-transparent text-slate-550 hover:text-slate-700'}`}
        >
          <LayoutDashboard className="h-4 w-4" />
          ١- الملخص التنفيذي والتنبيهات
        </button>

        <button 
          onClick={() => setActiveTabMenu('educational')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold shrink-0 transition-all border-b-2 ${activeTabMenu === 'educational' ? 'border-emerald-600 text-emerald-700 font-display' : 'border-transparent text-slate-550 hover:text-slate-700'}`}
        >
          <Users className="h-4 w-4" />
          ٢- المؤشرات التعليمية والتربوية
        </button>

        <button 
          onClick={() => setActiveTabMenu('teachers')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold shrink-0 transition-all border-b-2 ${activeTabMenu === 'teachers' ? 'border-emerald-600 text-emerald-700 font-display' : 'border-transparent text-slate-550 hover:text-slate-700'}`}
        >
          <BookOpen className="h-4 w-4" />
          ٣- كفاءة الحلقات والمدرسين
        </button>

        <button 
          onClick={() => setActiveTabMenu('timeline')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold shrink-0 transition-all border-b-2 ${activeTabMenu === 'timeline' ? 'border-emerald-600 text-emerald-700 font-display' : 'border-transparent text-slate-550 hover:text-slate-700'}`}
        >
          <Clock className="h-4 w-4" />
          ٤- الخريجون والمقارنات الزمنية
        </button>

        <button 
          onClick={() => setActiveTabMenu('reports')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold shrink-0 transition-all border-b-2 ${activeTabMenu === 'reports' ? 'border-emerald-600 text-emerald-700 font-display' : 'border-transparent text-slate-550 hover:text-slate-700'}`}
        >
          <FileText className="h-4 w-4" />
          ٥- إصدار التقارير السريعة
        </button>

      </div>

      {/* RENDER ACTIVE MODULES COMPLYING TO 9 SECTIONS */}
      <div className="transition-all" id="dashboard-viewport">
        
        {/* TAB 1: EXECUTIVE SUMMARY & CRITICAL ALERTS */}
        {activeTabMenu === 'overview' && (
          <div className="animate-fade-in" id="viewport-overview">
            <ExecutiveSummaryView 
              onNavigateToTab={(index) => {
                const tabsMapping: Record<number, 'overview' | 'educational' | 'teachers' | 'timeline' | 'reports'> = {
                  0: 'overview',
                  1: 'educational',
                  2: 'teachers',
                  3: 'timeline',
                  4: 'reports'
                };
                setActiveTabMenu(tabsMapping[index] || 'overview');
              }}
              onCompareCircles={() => setActiveTabMenu('teachers')}
              onNavigateToHub={() => onNavigate('tracking-alerts')}
            />
          </div>
        )}

        {/* TAB 2: DETAILED STUDENTS & METHODOLOGY PROGRESS */}
        {activeTabMenu === 'educational' && (
          <div className="animate-fade-in" id="viewport-educational">
            <EducationalIndicatorsView 
              onAddDecision={handleDirectDecisionGeneration}
            />
          </div>
        )}

        {/* TAB 3: CIRCLES RANKING & COMPARATIVE MATRIX */}
        {activeTabMenu === 'teachers' && (
          <div className="animate-fade-in" id="viewport-teachers">
            <TeachersCirclesView />
          </div>
        )}

        {/* TAB 4: CHRONOLOGICAL COMPARISONS & ALUMNI RETROSPECTIVES */}
        {activeTabMenu === 'timeline' && (
          <div className="animate-fade-in" id="viewport-timeline">
            <GraduatesTimelineView />
          </div>
        )}

        {/* TAB 5: RAPID PAPER REPORTS MODULE */}
        {activeTabMenu === 'reports' && (
          <div className="animate-fade-in" id="viewport-reports">
            <QuickReportsView />
          </div>
        )}

      </div>

    </div>
  );
}
