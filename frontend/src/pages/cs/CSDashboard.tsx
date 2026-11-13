import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Search, Headphones, Wallet, Calendar, AlertCircle } from 'lucide-react';

export const CSDashboard: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ['cs-students', search],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'STUDENT', search } });
      return res.data?.users || [];
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
          Customer Service (CS) Portal
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
          Student Support & Balance Auditing
        </h1>
        <p className="text-sm text-slate-500">
          Review student session balances, 30-day package expirations, and attendance tracking to support student queries.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm shadow-sm"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-semibold uppercase">
            <tr>
              <th className="p-4">Student</th>
              <th className="p-4">Languages</th>
              <th className="p-4">Level</th>
              <th className="p-4">Session Balances & Expiry</th>
              <th className="p-4">Total Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {usersData.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="font-semibold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="p-4 text-xs">
                  <div>Native: <span className="font-semibold">{u.nativeLanguage?.labelEn || 'English'}</span></div>
                  <div>Learning: <span className="font-semibold">{u.learningLanguage?.labelEn || 'Hebrew'}</span></div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {u.studentProfile?.levelModel?.labelEn || u.studentProfile?.level || 'Beginner'}
                  </span>
                </td>
                <td className="p-4">
                  {u.studentProfile?.sessionBalances?.length > 0 ? (
                    <div className="space-y-1">
                      {u.studentProfile.sessionBalances.map((sb: any) => (
                        <div key={sb.id} className="text-xs flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {sb.balance}x {sb.sessionType?.name}
                          </span>
                          {sb.expiresAt && (
                            <span className="text-[10px] text-amber-600">
                              (Exp: {new Date(sb.expiresAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No active sessions</span>
                  )}
                </td>
                <td className="p-4 font-bold text-amber-600">
                  {u.studentProfile?.totalPoints || 0} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
