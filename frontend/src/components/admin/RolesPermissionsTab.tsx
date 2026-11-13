import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../lib/enterpriseApi';
import { RoleDefinitionModel } from '../../types';
import { toast } from '../../store/toastStore';
import { ShieldCheck, Plus, Check, Save, Lock, AlertTriangle } from 'lucide-react';

export const RolesPermissionsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', labelEn: '', labelHe: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['roles-matrix'],
    queryFn: rolesApi.getMatrix,
  });

  const roles = data?.roles || [];
  const permissions = data?.permissions || [];

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  React.useEffect(() => {
    if (activeRole) {
      setSelectedRoleId(activeRole.id);
      setSelectedPermIds(
        activeRole.permissions.filter((p) => p.granted).map((p) => p.permission.id)
      );
    }
  }, [data]);

  const updatePermissionsMutation = useMutation({
    mutationFn: () => rolesApi.updatePermissions(selectedRoleId!, selectedPermIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-matrix'] });
      toast.success('Role permissions updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update permissions'),
  });

  const createRoleMutation = useMutation({
    mutationFn: () => rolesApi.createRole({ ...newRoleForm, permissionIds: selectedPermIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-matrix'] });
      toast.success('Custom role created');
      setIsCreatingRole(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create role'),
  });

  // Group permissions by category
  const groupedPermissions: Record<string, typeof permissions> = {};
  permissions.forEach((p) => {
    if (!groupedPermissions[p.group]) groupedPermissions[p.group] = [];
    groupedPermissions[p.group].push(p);
  });

  const togglePermission = (permId: string) => {
    if (selectedPermIds.includes(permId)) {
      setSelectedPermIds(selectedPermIds.filter((id) => id !== permId));
    } else {
      setSelectedPermIds([...selectedPermIds, permId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Dynamic RBAC Role & Permission Matrix
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure granular action permissions for each role (Sales, CS, Teachers, Students) or create custom roles.
          </p>
        </div>
        <button
          onClick={() => setIsCreatingRole(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="space-y-2 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">Platform Roles</h3>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRoleId(r.id);
                setSelectedPermIds(r.permissions.filter((p) => p.granted).map((p) => p.permission.id));
              }}
              className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm flex items-center justify-between transition ${
                selectedRoleId === r.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="font-bold">{r.labelEn}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{r.name}</div>
              </div>
              {r.isSystem && <Lock className="w-3.5 h-3.5 text-slate-400" aria-label="System Protected Role" />}
            </button>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Permissions for: <span className="text-emerald-600">{activeRole?.labelEn}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Toggle checkboxes to grant or revoke specific actions</p>
            </div>
            <button
              onClick={() => updatePermissionsMutation.mutate()}
              disabled={updatePermissionsMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Permissions
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedPermissions).map(([group, perms]) => (
              <div key={group} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">{group}</h4>
                <div className="space-y-2.5">
                  {perms.map((p) => {
                    const isChecked = selectedPermIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-start gap-3 cursor-pointer text-sm p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(p.id)}
                          className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{p.description}</div>
                          <div className="text-xs text-slate-400 font-mono">{p.code}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
