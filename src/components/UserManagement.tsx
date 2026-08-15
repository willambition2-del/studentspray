/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserPlus, Search, Edit2, Shield, Trash2, Key, ToggleLeft, ToggleRight, 
  MapPin, Check, X, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { User, UserType, Role } from '../types';

interface UserManagementProps {
  users: User[];
  roles: Role[];
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onUpdateStatus: (id: string, status: 'active' | 'inactive' | 'archived') => void;
  onResetPassword: (id: string) => Promise<string>;
}

export default function UserManagement({
  users, roles, onAddUser, onUpdateUser, onUpdateStatus, onResetPassword
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPwdResult, setResetPwdResult] = useState<{ name: string; pass: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formType, setFormType] = useState<UserType>('teacher');
  const [formRoleId, setFormRoleId] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formBranchName, setFormBranchName] = useState('');

  const clearForm = () => {
    setFormName('');
    setFormEmail('');
    setFormUsername('');
    setFormType('teacher');
    setFormRoleId('');
    setFormBranchId('');
    setFormBranchName('');
  };

  const handleOpenAdd = () => {
    clearForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormUsername(user.username);
    setFormType(user.type);
    setFormRoleId(user.roleId || '');
    setFormBranchId(user.branchId || '');
    setFormBranchName(user.branchName || '');
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;
    
    const autoUsername = formEmail.split('@')[0] || `user_${Date.now().toString(36)}`;

    onAddUser({
      name: formName,
      email: formEmail,
      username: autoUsername,
      type: formType,
      roleId: formRoleId || null,
      branchId: formBranchId || null,
      branchName: formBranchName || null,
      status: 'active'
    });
    setIsAddOpen(false);
    clearForm();
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const autoUsername = formUsername || formEmail.split('@')[0] || `user_${Date.now().toString(36)}`;

    onUpdateUser(editingUser.id, {
      name: formName,
      email: formEmail,
      username: autoUsername,
      type: formType,
      roleId: formRoleId || null,
      branchId: formBranchId || null,
      branchName: formBranchName || null
    });
    setEditingUser(null);
    clearForm();
  };

  const handleResetPasswordClick = async (user: User) => {
    const tempPass = await onResetPassword(user.id);
    setResetPwdResult({ name: user.name, pass: tempPass });
  };

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.branchName && user.branchName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' ? true : user.type === typeFilter;
    const matchesStatus = statusFilter === 'all' ? true : user.status === statusFilter;

    // Don't show fully archived unless requested specifically
    if (statusFilter !== 'archived' && user.status === 'archived') {
      return false;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeNameAr = (type: UserType) => {
    switch (type) {
      case 'admin': return 'المدير العام';
      case 'branch_manager': return 'المدير التنفيذي';
      case 'supervisor': return 'مشرف حلقات';
      case 'teacher': return 'معلم حلقة';
      case 'parent': return 'ولي أمر';
    }
  };

  return (
    <div className="space-y-6" id="user-management-container">
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="user-header-ops">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">إدارة المستخدمين النشطين</h2>
          <p className="text-slate-400 text-xs">تعيين المستخدمين والأنساب والربط الإداري الهرمي بالفروع</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          id="add-new-user-btn"
        >
          <UserPlus className="h-4 w-4" />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* Filters and search card */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 justify-between" id="user-filters-bar">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث بالاسم، اسم المستخدم، البريد، أو الفرع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            id="user-search-input"
          />
        </div>

        {/* Level type Filter */}
        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
            id="user-type-filter"
          >
            <option value="all">كل الرتب الإدارية</option>
            <option value="admin">المدير العام</option>
            <option value="branch_manager">المدير التنفيذي</option>
            <option value="supervisor">مشرف حلقات</option>
            <option value="teacher">معلم حلقة</option>
            <option value="parent">ولي أمر</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
            id="user-status-filter"
          >
            <option value="all">كل الحالات (عدا مؤرشف)</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
            <option value="archived">جميع الأرشيف</option>
          </select>
        </div>
      </div>

      {/* Mobile grid & Desktop Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="user-list-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold">
                <th className="p-4">الاسم والبريد</th>
                <th className="p-4">الرتبة والدور</th>
                <th className="p-4">الفرع المربوط</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                        {user.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email} | @{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-bold ${
                        user.type === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.type === 'branch_manager' ? 'bg-amber-100 text-amber-800' :
                        user.type === 'supervisor' ? 'bg-teal-100 text-teal-800' :
                        user.type === 'teacher' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {getTypeNameAr(user.type)}
                      </span>
                      {user.roleId && (
                        <p className="text-[10px] text-slate-400">
                          دور مخصص: {roles.find(r => r.id === user.roleId)?.name || 'غير مجدول'}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {user.branchName ? (
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{user.branchName}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-medium text-xs">إدارة عامة العليا</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                      user.status === 'inactive' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'inactive' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                      {user.status === 'active' ? 'نشط' : user.status === 'inactive' ? 'معطل' : 'مؤرشف'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Toggle status */}
                      <button
                        onClick={() => onUpdateStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                        title={user.status === 'active' ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                        className={`p-1.5 rounded-lg border hover:bg-slate-100 transition-all cursor-pointer ${user.status === 'active' ? 'text-amber-600 border-amber-100' : 'text-emerald-600 border-emerald-100'}`}
                      >
                        {user.status === 'active' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(user)}
                        title="تعديل البيانات"
                        className="p-1.5 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* Password Reset */}
                      <button
                        onClick={() => handleResetPasswordClick(user)}
                        title="إعادة تعيين كلمة المرور"
                        className="p-1.5 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <Key className="h-4 w-4" />
                      </button>

                      {/* Archive */}
                      {user.status !== 'archived' && (
                        <button
                          onClick={() => onUpdateStatus(user.id, 'archived')}
                          title="أرشفة الحساب"
                          className="p-1.5 text-red-600 border border-red-50 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    لا تتوفر نتائج للخيارات المحددة في النظام.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetPwdResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="pwd-reset-success-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4 relative">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 rounded-full bg-emerald-50">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800 font-display">نجاح تعيين كلمة المرور</h3>
            </div>
            
            <p className="text-slate-500 text-xs leading-relaxed">
              تم إصدار بروتوكول أمني وتوليد كلمة مرور مؤقتة صالحة للاستخدام لمرة واحدة لفائدة الحساب التابع لـ <span className="font-bold text-slate-800">({resetPwdResult.name})</span>.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">كلمة المرور المؤقتة:</span>
              <span className="font-mono bg-white px-2.5 py-1.5 rounded-md text-sm border border-slate-100 font-bold text-indigo-600 select-all">
                {resetPwdResult.pass}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResetPwdResult(null)}
                className="bg-slate-800 hover:bg-slate-950 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Users dialog */}
      {(isAddOpen || editingUser) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-edit-user-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-100 shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 font-display flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                {isAddOpen ? 'إضافة مستخدم جديد للنظام الكلي' : 'تعديل بيانات الحساب التعليمي'}
              </h3>
              <button 
                onClick={() => { setIsAddOpen(false); setEditingUser(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isAddOpen ? handleSubmitAdd : handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">الاسم الثلاثي أو اللقب</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فضيلة الشيخ عمر التركي"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white font-bold"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">البريد الإلكتروني المعتمد</label>
                  <input
                    type="email"
                    required
                    placeholder="example@alhudacenter.org"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono bg-white"
                  />
                </div>

                {/* Role / Permission Level */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    الدور المنوط بقرار المدير العام (تحديد صلاحيات الحساب)
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as UserType)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-600 bg-emerald-50/40 font-bold text-emerald-950"
                  >
                    <option value="admin">المدير العام (تحكم واختصاص شامل بالنظام)</option>
                    <option value="branch_manager">مدير تنفيذي / مدير فرع (إدارة المنهج والقرارات والاعتمادات)</option>
                    <option value="supervisor">موجه تربوي / مشرف حلقات (توجيه الحلقات والمعلمين والمتابعة)</option>
                    <option value="teacher">مدرس / معلم حلقة (تسميع ورصد الدرجات والتقارير)</option>
                    <option value="parent">ولي أمر الطالب (متابعة الأبناء والتقارير)</option>
                    <option value="student">طالب مقيد (استعراض الخطط والنتائج)</option>
                  </select>
                </div>

                {/* Custom system Roles */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      مصفوفة الصلاحيات الخاصة والأدوار المخصصة
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      تخصيص مرن من المدير العام
                    </span>
                  </div>
                  <select
                    value={formRoleId}
                    onChange={(e) => setFormRoleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white font-semibold text-slate-800"
                  >
                    <option value="">صلاحيات قياسية حسب الدور المحدد أعلاه</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        مصفوفة مخصصة: {r.name} ({r.description || 'صلاحيات خاصة'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium">
                    يمكن للمدير العام إسناد مصفوفة صلاحيات دقيقة ومستقلة لأي مستخدم (مثل: مسؤول اختبارات وتعديل الدرجات، أو مشرف تقني ومتابعة).
                  </p>
                </div>

                {/* Branch binding - ID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">رقم مصلحة الفرع (إن وجد)</label>
                  <input
                    type="text"
                    placeholder="مثال: BR-1447"
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Branch binding - Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">اسم الفرع المحلي المربوط به</label>
                  <input
                    type="text"
                    placeholder="مثال: فرع الشمال بالرياض"
                    value={formBranchName}
                    onChange={(e) => setFormBranchName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingUser(null); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {isAddOpen ? 'إضافة وتشييد الحساب' : 'حفظ التغيرات المعتمدة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
