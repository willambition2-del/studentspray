/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { 
  UserPlus, Search, Edit2, Shield, Trash2, Key, ToggleLeft, ToggleRight, 
  MapPin, Check, X, AlertTriangle, RefreshCw, AlertCircle 
} from 'lucide-react';
import { 
  getUsers, createUser, updateUser, assignUserRole, 
  activateUser, suspendUser, forcePasswordChange,
  getRoles, getBranches,
  type UserDto, type RoleDto, type BranchDto, ProfileType, ApiError
} from '../lib/api';

export default function UserManagement() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'suspended' | 'archived' | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 20;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [resetPwdResult, setResetPwdResult] = useState<{ name: string; pass: string; forced: boolean } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formProfileType, setFormProfileType] = useState<ProfileType | ''>('');

  const loadDependencies = async () => {
    try {
      const [rolesRes, branchesRes] = await Promise.all([
        getRoles({ limit: 100 }),
        getBranches({ limit: 100 }),
      ]);
      setRoles(rolesRes.items);
      setBranches(branchesRes.items);
    } catch (err: unknown) {
      console.error('Failed to load dependencies:', err);
    }
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getUsers({
        page,
        limit,
        search: searchTerm.trim() || undefined,
        branchId: branchFilter !== 'all' ? branchFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setUsers(res.items);
      setTotalUsers(res.meta.total);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر تحميل قائمة المستخدمين';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, branchFilter, statusFilter]);

  useEffect(() => {
    void loadDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        void loadUsers();
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const clearForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormUsername('');
    setFormRoleId('');
    setFormBranchId('');
    setFormPassword('');
    setFormProfileType('');
  };

  const handleOpenAdd = () => {
    clearForm();
    if (roles.length > 0) {
      const defaultRole = roles.find((r) => r.name === 'TEACHER') || roles[0];
      setFormRoleId(defaultRole.id);
    }
    const tempPass = `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
    setFormPassword(tempPass);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (user: UserDto) => {
    setEditingUser(user);
    setFormName(user.displayName || user.username);
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormUsername(user.username);
    setFormBranchId(user.branchId || '');
    const activeAssignment = user.roles.find((r) => r.isActive);
    setFormRoleId(activeAssignment?.role.id || (roles[0]?.id ?? ''));
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername || !formRoleId || !formPassword) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const selectedRole = roles.find((r) => r.id === formRoleId);
      let profileType: ProfileType | undefined;
      if (selectedRole) {
        if (selectedRole.name === 'TEACHER') profileType = ProfileType.TEACHER;
        else if (selectedRole.name === 'TECHNICAL_SUPERVISOR') profileType = ProfileType.TECHNICAL_SUPERVISOR;
        else if (selectedRole.name === 'STUDENT') profileType = ProfileType.STUDENT;
        else if (selectedRole.name === 'PARENT') profileType = ProfileType.PARENT;
      }
      if (formProfileType) {
        profileType = formProfileType;
      }

      await createUser({
        displayName: formName.trim(),
        username: formUsername.trim(),
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        roleId: formRoleId,
        branchId: formBranchId || undefined,
        temporaryPassword: formPassword,
        profileType,
      });

      setIsAddOpen(false);
      setResetPwdResult({ name: formName, pass: formPassword, forced: true });
      clearForm();
      void loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر إنشاء الحساب';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      await updateUser(editingUser.id, {
        displayName: formName.trim(),
        username: formUsername.trim(),
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        branchId: formBranchId || undefined,
      });

      const currentRoleId = editingUser.roles.find((r) => r.isActive)?.role.id;
      if (formRoleId && formRoleId !== currentRoleId) {
        await assignUserRole(editingUser.id, {
          roleId: formRoleId,
          branchId: formBranchId || undefined,
        });
      }

      setEditingUser(null);
      clearForm();
      void loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر تحديث بيانات الحساب';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserDto) => {
    setActionLoading(true);
    try {
      if (user.isActive) {
        await suspendUser(user.id);
      } else {
        await activateUser(user.id);
      }
      void loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر تغيير حالة الحساب';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (user: UserDto) => {
    setActionLoading(true);
    try {
      await forcePasswordChange(user.id);
      setResetPwdResult({
        name: user.displayName || user.username,
        pass: 'تم إلزام المستخدم بتعيين كلمة مرور عند الدخول القادم',
        forced: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'تعذر إعادة تعيين كلمة المرور';
      setErrorMsg(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleDisplayName = (user: UserDto) => {
    const active = user.roles.find((r) => r.isActive);
    return active?.role.displayName || active?.role.name || 'بدون دور';
  };

  return (
    <div className="space-y-6" id="user-management-container">
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="user-header-ops">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">إدارة المستخدمين والحسابات</h2>
          <p className="text-slate-400 text-xs">تعيين المستخدمين والأدوار والربط الإداري الهرمي بالفروع المعتمدة</p>
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

      {errorMsg && (
        <div role="alert" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="font-bold leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Filters and search card */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col md:flex-row gap-4 justify-between" id="user-filters-bar">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث بالاسم، اسم المستخدم، البريد، أو الفرع..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
            id="user-search-input"
          />
        </div>

        {/* Branch & Status Filter */}
        <div className="flex flex-wrap gap-2">
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white font-bold"
            id="user-branch-filter"
          >
            <option value="all">كل الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'active' | 'suspended' | 'archived' | 'all');
              setPage(1);
            }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white font-bold"
            id="user-status-filter"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">معطل / موقوف</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
      </div>

      {/* Mobile grid & Desktop Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id="user-list-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold">
                <th className="p-4">الاسم وبيانات الاتصال</th>
                <th className="p-4">الرتبة والدور</th>
                <th className="p-4">الفرع المربوط</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-bold">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                      <span>جاري جلب بيانات المستخدمين من الخادم...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    لا تتوفر نتائج تطابق معايير البحث المحددة.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                          {(user.displayName || user.username).slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.displayName || user.username}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {user.email || 'بدون بريد'} | @{user.username} {user.phone ? `| ${user.phone}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {getRoleDisplayName(user)}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.branch ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{user.branch.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium text-xs">إدارة عامة العليا</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.deletedAt ? 'bg-slate-100 text-slate-800' :
                        user.isActive ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.deletedAt ? 'bg-slate-500' :
                          user.isActive ? 'bg-emerald-500' :
                          'bg-amber-500'
                        }`} />
                        {user.deletedAt ? 'مؤرشف' : user.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Toggle status */}
                        {!user.deletedAt && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleToggleStatus(user)}
                            title={user.isActive ? 'تعطيل الحساب' : 'تنشيط الحساب'}
                            className={`p-1.5 rounded-lg border hover:bg-slate-100 transition-all cursor-pointer ${
                              user.isActive ? 'text-amber-600 border-amber-100' : 'text-emerald-600 border-emerald-100'
                            }`}
                          >
                            {user.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          disabled={actionLoading}
                          onClick={() => handleOpenEdit(user)}
                          title="تعديل البيانات"
                          className="p-1.5 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Password Reset */}
                        <button
                          disabled={actionLoading}
                          onClick={() => handleResetPassword(user)}
                          title="إلزام بتغيير كلمة المرور"
                          className="p-1.5 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalUsers > limit && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>إجمالي المستخدمين: {totalUsers}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                السابق
              </button>
              <span className="px-3 py-1.5 font-mono">صفحة {page}</span>
              <button
                disabled={page * limit >= totalUsers || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Result Modal */}
      {resetPwdResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="pwd-reset-success-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4 relative">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2 rounded-full bg-emerald-50">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800 font-display">بيانات الحساب وكلمة المرور</h3>
            </div>
            
            <p className="text-slate-500 text-xs leading-relaxed font-bold">
              تم تحديث إعدادات الأمان للحساب التابع لـ <span className="font-bold text-slate-800">({resetPwdResult.name})</span>.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">كلمة المرور:</span>
              <span className="font-mono bg-white px-2.5 py-1.5 rounded-md text-sm border border-slate-100 font-bold text-indigo-600 select-all">
                {resetPwdResult.pass}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResetPwdResult(null)}
                className="bg-slate-800 hover:bg-slate-950 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-display"
              >
                حسناً، تم الحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Users Dialog */}
      {(isAddOpen || editingUser) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-edit-user-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-100 shadow-xl space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 font-display flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                {isAddOpen ? 'إضافة مستخدم جديد للنظام الكلي' : 'تعديل بيانات الحساب'}
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
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (isAddOpen && !formUsername) {
                        setFormUsername(`user_${Date.now().toString(36)}`);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white font-bold"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اسم المستخدم الفريد</label>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono bg-white font-bold"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    placeholder="example@alhudacenter.org"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono bg-white font-bold"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">رقم الهاتف (اختياري)</label>
                  <input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono bg-white font-bold"
                  />
                </div>

                {/* Temporary Password (Add only) */}
                {isAddOpen && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">كلمة المرور المؤقتة</label>
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono bg-white font-bold text-indigo-700"
                    />
                  </div>
                )}

                {/* Role / Permission Level */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    الدور الوظيفي وصلاحيات الحساب
                  </label>
                  <select
                    value={formRoleId}
                    onChange={(e) => setFormRoleId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-600 bg-emerald-50/40 font-bold text-emerald-950"
                  >
                    <option value="">اختر الدور المناسب...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName || r.name} {r.isSystem ? '(نظامي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Selection */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600">الفرع التابع له (اختياري)</label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white font-bold"
                  >
                    <option value="">إدارة عامة شاملة لجميع الفروع</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => { setIsAddOpen(false); setEditingUser(null); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 font-display"
                >
                  {actionLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isAddOpen ? 'إضافة وتشييد الحساب' : 'حفظ التغيرات المعتمدة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
