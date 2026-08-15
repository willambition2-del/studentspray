/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Plus, Edit2, Trash2, X, CheckSquare, Info } from 'lucide-react';
import { Role, Permission } from '../types';

interface RolesManagementProps {
  roles: Role[];
  onAddRole: (role: Partial<Role>) => void;
  onUpdateRole: (id: string, role: Partial<Role>) => void;
  onDeleteRole: (id: string) => Promise<boolean>;
}

// System predefined Permission mapping dictionary
const SYSTEM_PERMISSIONS: Permission[] = [
  { id: 'view_strategic_dashboard', category: 'القيادة الاستراتيجية', name: 'عرض لوحة الأداء والمؤشرات الاستراتيجية (مركز القيادة)', description: 'الوصول إلى مركز القيادة والتحليل الإستراتيجي للمدير العام والمدير التنفيذي.' },
  { id: 'manage_students', category: 'شؤون الطلاب', name: 'إدارة الطلاب ومتابعة الحفظ', description: 'إضافة وتعديل بيانات الطلاب، رصد الغياب وحلقات التسميع.' },
  { id: 'manage_circles', category: 'شؤون الطلاب', name: 'إدارة الحلقات والمعاهد', description: 'تأسيس الحلقات وتعيين معلميها وتقسيم مستويات الطلاب.' },
  { id: 'manage_teachers', category: 'الشؤون الإدارية', name: 'إدارة شؤون المعلمين والمقرئين', description: 'توثيق بيانات معلمي القرآن، عقود العمل والمقابلات والفروع.' },
  { id: 'manage_supervisors', category: 'الشؤون الإدارية', name: 'إدارة شؤون المشرفين', description: 'منح صلاحيات الإشراف، المتابعة الميدانية لفروع الملتقى.' },
  { id: 'manage_plans', category: 'المناهج التعليمية', name: 'إدارة الخطط المقررة والمناهج', description: 'تصميم وجدولة مناهج الحفظ والمراجعة لعامة المراحل الدراسية.' },
  { id: 'manage_activities', category: 'الأنشطة والاحتفالات', name: 'إدارة الأنشطة والرحلات الصيفية', description: 'تنظيم المعسكرات والمخيمات القرآنية وحوافز النوابغ والطلاب.' },
  { id: 'manage_graduates', category: 'الأنشطة والاحتفالات', name: 'إدارة شؤون الخريجين والمجازين', description: 'اعتماد ختمات المصحف الشامل، طباعة شهادات الإجازة بالسند المتصل.' },
  { id: 'manage_reports', category: 'التدقيق والجودة', name: 'إدارة التقارير والتحليلات السنوية', description: 'استعراض البيانات الختامية والإحصائيات وتدقيق نسب تسرب المعلمين.' },
  { id: 'manage_settings', category: 'التدقيق والجودة', name: 'إدارة إعدادات النظام والهوية البصرية', description: 'تغيير الاسم اللفظي وتدبيج الترويسة المرفقة للتقارير قبل الطباعة.' },
  { id: 'manage_backups', category: 'الأمن الوقائي', name: 'إدارة النسخ الاحتياطية والاسترداد', description: 'إنشاء ومقارنة النسخ ووقاية قاعدة البيانات من الضياع والتلف.' },
  { id: 'manage_approvals', category: 'الأمن الوقائي', name: 'إدارة الاعتمادات والقرارات التنفيذية', description: 'البت والموافقة على خطط الحلقات وتحويل التنبيهات وإصدار القرارات.' }
];

export default function RolesManagement({
  roles, onAddRole, onUpdateRole, onDeleteRole
}: RolesManagementProps) {
  
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleOpenAdd = () => {
    setRoleName('');
    setRoleDesc('');
    setSelectedPermissions([]);
    setIsAddOpen(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description);
    setSelectedPermissions(role.permissions);
    setErrorMsg(null);
  };

  const handleTogglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const handleSelectAllCategory = (category: string) => {
    const permIds = SYSTEM_PERMISSIONS.filter(p => p.category === category).map(p => p.id);
    const allSelected = permIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter(id => !permIds.includes(id)));
    } else {
      const news = [...selectedPermissions];
      permIds.forEach(id => {
        if (!news.includes(id)) news.push(id);
      });
      setSelectedPermissions(news);
    }
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;
    onAddRole({
      name: roleName,
      description: roleDesc,
      permissions: selectedPermissions
    });
    setIsAddOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    onUpdateRole(editingRole.id, {
      name: roleName,
      description: roleDesc,
      permissions: selectedPermissions
    });
    setEditingRole(null);
  };

  const handleDeleteClick = async (roleId: string) => {
    setErrorMsg(null);
    try {
      const success = await onDeleteRole(roleId);
      if (!success) {
        setErrorMsg('عذراً، هذا الدور مستخدم حالياً من طرف بعض العاملين في الفروع. يجب سحب الدور منهم أولاً قبل حذفه.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء محاولة الحذف.');
    }
  };

  // Group permissions by category for easier display
  const pGroups: { [key: string]: Permission[] } = {};
  SYSTEM_PERMISSIONS.forEach(p => {
    if (!pGroups[p.category]) pGroups[p.category] = [];
    pGroups[p.category].push(p);
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
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-3" id="role-error-notice">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="font-medium leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Roles Grid List */}
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
                  {role.userCount || 0} مستخدمين نشطين
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 font-display text-sm">{role.name}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">{role.description}</p>
              </div>
            </div>

            <div className="space-y-4 pt-3 border-t border-slate-50">
              {/* Permission tags summary */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {role.permissions.map((pId) => {
                  const perm = SYSTEM_PERMISSIONS.find(sp => sp.id === pId);
                  return perm ? (
                    <span key={pId} className="bg-slate-50 text-slate-600 border border-slate-100 rounded-md text-[9px] px-1.5 py-0.5 font-medium">
                      {perm.name.split(' ')[0]} {perm.name.split(' ')[1] || ''}
                    </span>
                  ) : null;
                })}
                {role.permissions.length === 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">لا تتضمن هذه الرتبة أي صلاحية حالية.</span>
                )}
              </div>

              {/* Operations */}
              <div className="flex justify-end gap-2 text-xs">
                {/* Delete button only operates if userCount is 0 to comply with safety rules */}
                <button
                  onClick={() => handleDeleteClick(role.id)}
                  title={role.userCount && role.userCount > 0 ? "لا يمكن حذف دور شاغر بالمستعملين في الفروع" : "حذف غير مستخدم"}
                  className={`p-1.5 rounded-lg border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    role.userCount && role.userCount > 0 
                      ? 'text-slate-300 border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' 
                      : 'text-red-500 border-red-100 hover:bg-red-50'
                  }`}
                  disabled={role.userCount ? role.userCount > 0 : false}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>حذف</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(role)}
                  className="p-1.5 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>تعديل الصلاحيات</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Add/Edit Dialog modal */}
      {(isAddOpen || editingRole) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-edit-role-modal">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-100 shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 font-display flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                {isAddOpen ? 'تأسيس دور وصلاحية مخصصة' : `تعديل صلاحيات ومقاصد الدور: ${editingRole?.name}`}
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">اسم الدور (بالعربية)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: معلم متميز، مشرف فرع دائم"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">وصف قصير للغرض والمهام</label>
                  <input
                    type="text"
                    placeholder="مثال: مخصص لمعلمي الفروع الذين يتملكون صلاحية تقارير الحلقات..."
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Permissions Lists per Category */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 font-display">
                  مصفوفة ربط الصلاحيات بالنظام
                </h4>

                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                  {Object.keys(pGroups).map((category) => (
                    <div key={category} className="border border-slate-100 p-3.5 rounded-xl space-y-3 bg-slate-50/20">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-emerald-700 font-display">{category}</span>
                        <button
                          type="button"
                          onClick={() => handleSelectAllCategory(category)}
                          className="text-[10px] text-indigo-600 hover:underline font-bold"
                        >
                          تحديد/إلغاء تحديد الكل
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pGroups[category].map((perm) => {
                          const isSel = selectedPermissions.includes(perm.id);
                          return (
                            <div 
                              key={perm.id}
                              onClick={() => handleTogglePermission(perm.id)}
                              className={`p-2.5 rounded-xl border text-right cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                                isSel 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs' 
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <CheckSquare className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${isSel ? 'text-emerald-600' : 'text-slate-300'}`} />
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold">{perm.name}</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{perm.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingRole(null); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء الإجراء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {isAddOpen ? 'حفظ وتشييد الدور' : 'اعتماد التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
