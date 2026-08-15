/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Plus, Edit2, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  getRoles, createRole, updateRole, setRolePermissions, getPermissions,
  type RoleDto, type PermissionDto, ApiError 
} from '../lib/api';

const PERMISSION_LABELS: Record<string, { name: string; category: string; description: string }> = {
  'branches.read': { category: 'الفروع والتنظيم', name: 'استعراض الفروع', description: 'عرض بيانات الفروع المتاحة ضمن النطاق المصرح' },
  'branches.manage': { category: 'الفروع والتنظيم', name: 'إدارة الفروع', description: 'إنشاء وتعديل وأرشفة الفروع' },
  'users.read': { category: 'المستخدمون والحسابات', name: 'استعراض المستخدمين', description: 'عرض قائمة حسابات الموظفين والطلاب والمعلمين' },
  'users.manage': { category: 'المستخدمون والحسابات', name: 'إدارة المستخدمين', description: 'إنشاء وتعديل وتجميد الحسابات وإعادة تعيين الأمان' },
  'roles.read': { category: 'الأدوار والصلاحيات', name: 'استعراض الأدوار', description: 'عرض مصفوفة الأدوار وصلاحيات النظام' },
  'roles.manage': { category: 'الأدوار والصلاحيات', name: 'إدارة الأدوار', description: 'إنشاء وتعديل مصفوفات الصلاحيات للأدوار' },
  'students.read': { category: 'شؤون الطلاب', name: 'استعراض الطلاب', description: 'عرض سجلات الطلاب والملفات التعليمية' },
  'students.manage': { category: 'شؤون الطلاب', name: 'إدارة الطلاب', description: 'إضافة وتحديث ونقل وأرشفة الطلاب' },
  'halaqas.read': { category: 'الحلقات القرآنية', name: 'استعراض الحلقات', description: 'عرض الحلقات القرآنية وبياناتها التنظيمية' },
  'halaqas.manage': { category: 'الحلقات القرآنية', name: 'إدارة الحلقات', description: 'تأسيس الحلقات وتعيين المعلمين والمشرفين' },
  'attendance.read': { category: 'الحضور والمتابعة', name: 'استعراض الحضور', description: 'الاطلاع على سجلات الحضور والانضباط' },
  'attendance.write': { category: 'الحضور والمتابعة', name: 'تسجيل الحضور', description: 'رصد الحضور والغياب اليومي' },
  'memorization.read': { category: 'المنهج والتسميع', name: 'استعراض التسميع', description: 'عرض مقادير الحفظ والمراجعة' },
  'memorization.write': { category: 'المنهج والتسميع', name: 'رصد التسميع', description: 'إدخال مقادير التسميع اليومي للطلاب' },
  'grades.read': { category: 'التقييم والدرجات', name: 'استعراض الدرجات', description: 'عرض كشوف الاختبارات والدرجات' },
  'grades.write': { category: 'التقييم والدرجات', name: 'رصد الدرجات', description: 'إدخال درجات الاختبارات التراكمية والشهرية' },
  'field_visits.read': { category: 'الجودة والتوجيه', name: 'استعراض الزيارات', description: 'الاطلاع على تقارير التوجيه والزيارات الميدانية' },
  'field_visits.write': { category: 'الجودة والتوجيه', name: 'توثيق الزيارات', description: 'إدخال تقارير التقييم الفني للمشرفين' },
  'reports.read': { category: 'التقارير والإحصاءات', name: 'استعراض التقارير', description: 'تصدير وعرض التقارير التحليلية المعتمدة' },
  'settings.manage': { category: 'إعدادات النظام', name: 'إدارة الإعدادات العامة', description: 'التحكم في إعدادات الملتقى والهوية البصرية' },
  'audit.read': { category: 'الأمن والرقابة', name: 'استعراض سجل العمليات', description: 'عرض سجل التدقيق والعمليات الإدارية الحساسة' },
};

export default function RolesManagement() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDisplayName, setRoleDisplayName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        getRoles({ limit: 100 }),
        getPermissions(),
      ]);
      setRoles(rolesRes.items);
      setPermissions(permsRes);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر تحميل بيانات الأدوار والصلاحيات';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setRoleName('');
    setRoleDisplayName('');
    setRoleDesc('');
    setSelectedPermissions([]);
    setIsAddOpen(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (role: RoleDto) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDisplayName(role.displayName);
    setRoleDesc(role.description || '');
    setSelectedPermissions(role.permissions.map((p) => p.permission.code));
    setErrorMsg(null);
  };

  const handleTogglePermission = (code: string) => {
    if (selectedPermissions.includes(code)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== code));
    } else {
      setSelectedPermissions([...selectedPermissions, code]);
    }
  };

  const handleSelectAllCategory = (categoryCodes: string[]) => {
    const allSelected = categoryCodes.every((code) => selectedPermissions.includes(code));
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter((code) => !categoryCodes.includes(code)));
    } else {
      const news = [...new Set([...selectedPermissions, ...categoryCodes])];
      setSelectedPermissions(news);
    }
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || !roleDisplayName) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const created = await createRole({
        name: roleName.trim().toUpperCase().replace(/\s+/g, '_'),
        displayName: roleDisplayName.trim(),
        description: roleDesc.trim() || undefined,
      });

      if (selectedPermissions.length > 0) {
        await setRolePermissions(created.id, selectedPermissions);
      }

      setIsAddOpen(false);
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر إنشاء الدور الجديد';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      await updateRole(editingRole.id, {
        displayName: roleDisplayName.trim(),
        description: roleDesc.trim() || undefined,
      });

      await setRolePermissions(editingRole.id, selectedPermissions);

      setEditingRole(null);
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر تحديث صلاحيات الدور';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Group permissions by category for easier display
  const pGroups: Record<string, PermissionDto[]> = {};
  permissions.forEach((p) => {
    const meta = PERMISSION_LABELS[p.code] || { category: 'صلاحيات عامة', name: p.code, description: p.description || '' };
    if (!pGroups[meta.category]) pGroups[meta.category] = [];
    pGroups[meta.category].push(p);
  });

  return (
    <div className="space-y-6" id="roles-management-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">ماتريكس الأدوار وصلاحيات النظام</h2>
          <p className="text-slate-400 text-xs">تأسيس أدوار مخصصة وربط الصلاحيات الإدارية بالتنظيمات المعتمدة</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          إنشاء دور وصلاحية مخصصة
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-3" id="role-error-notice">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="font-bold leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Roles Grid List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-100">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="font-bold">جاري تحميل مصفوفة الصلاحيات والأدوار...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="roles-cards-grid">
          {roles.map((role) => (
            <div 
              key={role.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-slate-50 text-emerald-600 border border-slate-100">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <span className="bg-slate-100 text-slate-800 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    {role._count?.users ?? 0} مستخدمين نشطين
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 font-display text-sm">{role.displayName || role.name}</h3>
                    {role.isSystem && (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        أساسي
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed mt-1 font-bold">{role.description || 'دور مخصص بالنظام'}</p>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-slate-50">
                {/* Permission tags summary */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {role.permissions.map((pItem) => {
                    const code = pItem.permission.code;
                    const meta = PERMISSION_LABELS[code];
                    return (
                      <span key={code} className="bg-slate-50 text-slate-700 border border-slate-100 rounded-md text-[9px] px-1.5 py-0.5 font-bold">
                        {meta?.name || code}
                      </span>
                    );
                  })}
                  {role.permissions.length === 0 && (
                    <span className="text-[10px] text-slate-400 font-bold">لا تتضمن هذه الرتبة أي صلاحية حالية.</span>
                  )}
                </div>

                {/* Operations */}
                <div className="flex justify-end gap-2 text-xs font-bold">
                  <button
                    onClick={() => handleOpenEdit(role)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>تعديل الصلاحيات</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Role Modal */}
      {(isAddOpen || editingRole) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="role-dialog-modal">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-100 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 font-display flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-emerald-600" />
                {isAddOpen ? 'إنشاء دور وصلاحية مخصصة جديدة' : `تعديل صلاحيات دور: ${editingRole?.displayName || editingRole?.name}`}
              </h3>
              <button 
                onClick={() => { setIsAddOpen(false); setEditingRole(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isAddOpen ? handleSubmitAdd : handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isAddOpen && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الرمز البرمجي للدور (Unique Code)</label>
                    <input
                      type="text"
                      required
                      placeholder="CUSTOM_AUDITOR"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                )}

                <div className={`space-y-1 ${isAddOpen ? '' : 'sm:col-span-2'}`}>
                  <label className="text-xs font-bold text-slate-700">الاسم المعرب للدور</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مسؤول الاختبارات والتقييم"
                    value={roleDisplayName}
                    onChange={(e) => setRoleDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">الوصف الإداري للمسؤولية</label>
                  <input
                    type="text"
                    placeholder="وصف مختصر للمهام المنوطة بهذا الدور..."
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Matrix checkboxes categorized */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">تعيين الصلاحيات التفصيلية:</h4>

                <div className="space-y-4">
                  {Object.entries(pGroups).map(([category, catPerms]) => {
                    const catCodes = catPerms.map((p) => p.code);
                    const allCatSelected = catCodes.every((c) => selectedPermissions.includes(c));

                    return (
                      <div key={category} className="bg-slate-50/75 p-3 rounded-xl border border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="text-xs font-bold text-slate-800">{category}</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllCategory(catCodes)}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                          >
                            {allCatSelected ? 'إلغاء تحديد القسم' : 'تحديد كل القسم'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catPerms.map((perm) => {
                            const meta = PERMISSION_LABELS[perm.code] || { name: perm.code, description: perm.description || '' };
                            const isChecked = selectedPermissions.includes(perm.code);

                            return (
                              <label
                                key={perm.code}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.code)}
                                  className="mt-0.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                />
                                <div className="space-y-0.5">
                                  <p className="font-bold text-[11px]">{meta.name}</p>
                                  <p className="text-[9px] text-slate-400 leading-tight">{meta.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => { setIsAddOpen(false); setEditingRole(null); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 font-display"
                >
                  {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isAddOpen ? 'حفظ وتثبيت الدور' : 'اعتماد الصلاحيات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
