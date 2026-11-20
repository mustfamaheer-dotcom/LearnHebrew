import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  RotateCcw,
  User,
  Users,
  Baby,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Globe,
  UserCheck,
  PlusCircle,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface StudentCrmTableProps {
  users: any[];
  teachers?: any[];
  packages?: any[];
  onOpenFamilyModal: (user: any) => void;
  onOpenAddChildModal: (parent: any) => void;
  onToggleStatus?: (userId: string, currentStatus: boolean) => void;
  onResetPassword?: (user: any) => void;
  language: 'ar' | 'he' | 'en';
  isRtl?: boolean;
  initialSearch?: string;
}

export const StudentCrmTable: React.FC<StudentCrmTableProps> = ({
  users,
  teachers = [],
  packages = [],
  onOpenFamilyModal,
  onOpenAddChildModal,
  onToggleStatus,
  onResetPassword,
  language,
  isRtl,
  initialSearch = '',
}) => {
  // Search & Filter state matching client CRM screenshot
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedRegStatus, setSelectedRegStatus] = useState('ALL');
  const [selectedSubPlan, setSelectedSubPlan] = useState('ALL');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [selectedSubStatus, setSelectedSubStatus] = useState('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState('ALL');
  const [selectedInactivity, setSelectedInactivity] = useState('ALL');
  const [noFutureLessonsOnly, setNoFutureLessonsOnly] = useState(false);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Filter only students or family heads
  const studentUsers = useMemo(() => {
    return (users || []).filter(
      (u) => u.role === 'STUDENT' || u.isParent || u.familyRole === 'PARENT' || u.familyRole === 'CHILD'
    );
  }, [users]);

  // Apply filters
  const filteredStudents = useMemo(() => {
    let result = [...studentUsers];

    // 1. Search term (Search by name, email, phone, parent phone/email, child phone/email)
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      // Remove any non-alphanumeric chars for loose phone matching
      const cleanQ = q.replace(/[^a-z0-9]/g, '');

      result = result.filter((u) => {
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = (u.phone || '').toLowerCase();
        const uCleanPhone = uPhone.replace(/[^a-z0-9]/g, '');
        const uFirst = (u.firstName || '').toLowerCase();
        const uLast = (u.lastName || '').toLowerCase();
        const fullName = `${uFirst} ${uLast}`;

        // Check user self
        if (
          uEmail.includes(q) ||
          fullName.includes(q) ||
          uPhone.includes(q) ||
          (cleanQ && uCleanPhone.includes(cleanQ))
        ) {
          return true;
        }

        // Check parent
        if (u.parent) {
          const pEmail = (u.parent.email || '').toLowerCase();
          const pPhone = (u.parent.phone || '').toLowerCase();
          const pCleanPhone = pPhone.replace(/[^a-z0-9]/g, '');
          const pName = `${u.parent.firstName || ''} ${u.parent.lastName || ''}`.toLowerCase();
          if (
            pEmail.includes(q) ||
            pName.includes(q) ||
            pPhone.includes(q) ||
            (cleanQ && pCleanPhone.includes(cleanQ))
          ) {
            return true;
          }
        }

        // Check children
        if (Array.isArray(u.children) && u.children.length > 0) {
          const matchedChild = u.children.some((c: any) => {
            const cEmail = (c.email || '').toLowerCase();
            const cPhone = (c.phone || '').toLowerCase();
            const cCleanPhone = cPhone.replace(/[^a-z0-9]/g, '');
            const cName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
            return (
              cEmail.includes(q) ||
              cName.includes(q) ||
              cPhone.includes(q) ||
              (cleanQ && cCleanPhone.includes(cleanQ))
            );
          });
          if (matchedChild) return true;
        }

        return false;
      });
    }

    // 2. Subject / Language
    if (selectedSubject !== 'ALL') {
      result = result.filter((u) => {
        const code = u.learningLanguage?.code || (u.languagePref === 'he' ? 'he' : 'en');
        return code.toLowerCase() === selectedSubject.toLowerCase();
      });
    }

    // 3. Registration Status
    if (selectedRegStatus !== 'ALL') {
      if (selectedRegStatus === 'ACTIVE') result = result.filter((u) => u.isActive !== false);
      if (selectedRegStatus === 'INACTIVE') result = result.filter((u) => u.isActive === false);
    }

    // 4. Subscription Plan
    if (selectedSubPlan !== 'ALL') {
      result = result.filter((u) => {
        const pkgs = u.studentProfile?.packages || [];
        return pkgs.some((p: any) =>
          (p.package?.name || '').toLowerCase().includes(selectedSubPlan.toLowerCase())
        );
      });
    }

    // 5. Subscription Status
    if (selectedSubStatus !== 'ALL') {
      result = result.filter((u) => {
        const pkgs = u.studentProfile?.packages || [];
        const hasActivePkg = pkgs.some((p: any) => p.status === 'ACTIVE');
        if (selectedSubStatus === 'ACTIVE') return hasActivePkg;
        if (selectedSubStatus === 'NO_SUB') return pkgs.length === 0;
        if (selectedSubStatus === 'EXPIRED') return pkgs.length > 0 && !hasActivePkg;
        return true;
      });
    }

    // 6. Teacher Filter
    if (selectedTeacher !== 'ALL') {
      result = result.filter((u) => {
        const lessons = u.studentProfile?.lessons || [];
        return lessons.some((l: any) => l.teacherId === selectedTeacher);
      });
    }

    // 7. Checkbox: No future scheduled lessons
    if (noFutureLessonsOnly) {
      result = result.filter((u) => {
        const lessons = u.studentProfile?.lessons || [];
        return lessons.length === 0;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortAsc ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [
    studentUsers,
    searchTerm,
    selectedSubject,
    selectedRegStatus,
    selectedSubPlan,
    selectedPaymentMode,
    selectedSubStatus,
    selectedTeacher,
    selectedInactivity,
    noFutureLessonsOnly,
    sortField,
    sortAsc,
  ]);

  // Pagination slice
  const totalStudents = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSubject('ALL');
    setSelectedRegStatus('ALL');
    setSelectedSubPlan('ALL');
    setSelectedPaymentMode('ALL');
    setSelectedSubStatus('ALL');
    setSelectedTeacher('ALL');
    setSelectedInactivity('ALL');
    setNoFutureLessonsOnly(false);
    setCurrentPage(1);
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return { date: '09/14/26', time: '20:15' };
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return {
      date: `${mm}/${dd}/${yy}`,
      time: `${hh}:${min}`,
    };
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* 1. TOP CARD: Search & Filter (Identical to screenshot layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
          {language === 'ar' ? 'البحث والتصفية' : language === 'he' ? 'חיפוש וסינון' : 'Search & Filter'}
        </h3>

        {/* Large Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              language === 'ar'
                ? 'ابحث بالاسم، البريد، رقم الهاتف (+972...)، أو أفراد العائلة...'
                : language === 'he'
                ? 'חפש לפי שם, אימייל, טלפון (+972...), או בני משפחה...'
                : 'Search by name, email, phone number (+97254...), or family member...'
            }
            className="w-full ps-10 pe-10 py-2.5 rounded-xl border border-teal-500/60 dark:border-teal-500/50 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject */}
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Subjects</option>
              <option value="en">English</option>
              <option value="he">Hebrew</option>
              <option value="ar">Arabic</option>
            </select>

            {/* Registration Status */}
            <select
              value={selectedRegStatus}
              onChange={(e) => {
                setSelectedRegStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Registration Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Suspended</option>
            </select>

            {/* Subscription Plans */}
            <select
              value={selectedSubPlan}
              onChange={(e) => {
                setSelectedSubPlan(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Subscription Plans</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
              <option value="Annual">Annual</option>
            </select>

            {/* Payments Mode */}
            <select
              value={selectedPaymentMode}
              onChange={(e) => {
                setSelectedPaymentMode(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Payments Mode</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MANUAL">Manual / Free</option>
            </select>

            {/* Subscription Status */}
            <select
              value={selectedSubStatus}
              onChange={(e) => {
                setSelectedSubStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Subscription Status</option>
              <option value="ACTIVE">Active</option>
              <option value="NO_SUB">No subscription</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Teachers */}
            <select
              value={selectedTeacher}
              onChange={(e) => {
                setSelectedTeacher(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Teachers</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName}
                </option>
              ))}
            </select>

            {/* Inactivity Filter */}
            <select
              value={selectedInactivity}
              onChange={(e) => {
                setSelectedInactivity(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">No inactivity filter</option>
              <option value="14D">Inactive &gt; 14 days</option>
              <option value="30D">Inactive &gt; 30 days</option>
            </select>

            {/* No future scheduled lessons checkbox */}
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 select-none cursor-pointer ms-1">
              <input
                type="checkbox"
                checked={noFutureLessonsOnly}
                onChange={(e) => {
                  setNoFutureLessonsOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>No future scheduled lessons</span>
            </label>
          </div>

          {/* Clear Filters Button */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* 2. TABLE: High fidelity student CRM matching user screenshot */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                <th
                  onClick={() => {
                    setSortField('name');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 text-start font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none whitespace-nowrap"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Student Information</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-start font-semibold whitespace-nowrap">
                  Teacher Information
                </th>
                <th
                  onClick={() => {
                    setSortField('createdAt');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 text-start font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none whitespace-nowrap"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Registration</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-start font-semibold whitespace-nowrap">
                  Subscription
                </th>
                <th className="py-3 px-4 text-start font-semibold whitespace-nowrap">
                  Payment
                </th>
                <th className="py-3 px-4 text-start font-semibold whitespace-nowrap">
                  Regular Schedule
                </th>
                <th className="py-3 px-4 text-start font-semibold whitespace-nowrap">
                  Next Lesson
                </th>
                <th className="py-3 px-4 text-end font-semibold whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">
                      {language === 'ar'
                        ? 'لم يتم العثور على طلاب يطابقون خيارات البحث'
                        : language === 'he'
                        ? 'לא נמצאו תלמידים התואמים את הסינון'
                        : 'No students found matching your search and filter criteria'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student: any) => {
                  const isParent = student.isParent || (student.children && student.children.length > 0);
                  const isChild = !!student.parentId || student.familyRole === 'CHILD';
                  const regDate = formatDate(student.createdAt);

                  // Extract Subscription data
                  const packages = student.studentProfile?.packages || [];
                  const activePkg = packages.find((p: any) => p.status === 'ACTIVE') || packages[0];
                  const hasSubscription = !!activePkg;

                  // Extract Payment data
                  const payments = student.studentProfile?.payments || [];
                  const latestPayment = payments[0];
                  const hasPayment = !!latestPayment || hasSubscription;

                  // Extract Lessons data
                  const lessons = student.studentProfile?.lessons || [];
                  const nextLesson = lessons[0];

                  // Subject label
                  const subjectLabel =
                    student.learningLanguage?.nameEn ||
                    (student.languagePref === 'he' ? 'Hebrew' : 'English');

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Column 1: Student Information */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1 min-w-[200px]">
                          {/* Name + Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {subjectLabel}
                            </span>
                            {/* Family Tags */}
                            {isParent && (
                              <button
                                type="button"
                                onClick={() => onOpenFamilyModal(student)}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 inline-flex items-center gap-0.5 cursor-pointer"
                                title="Click to view Family Tree & Children"
                              >
                                <Users className="w-2.5 h-2.5" />
                                <span>Parent ({student.children?.length || 0})</span>
                              </button>
                            )}
                            {isChild && (
                              <button
                                type="button"
                                onClick={() => onOpenFamilyModal(student)}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 inline-flex items-center gap-0.5 cursor-pointer"
                                title="Click to view Parent Family Tree"
                              >
                                <Baby className="w-2.5 h-2.5" />
                                <span>Child</span>
                              </button>
                            )}
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[220px]" title={student.email}>
                            <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{student.email}</span>
                          </div>

                          {/* Phone */}
                          {student.phone ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[220px]" title={student.phone}>
                              <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{student.phone}</span>
                            </div>
                          ) : (
                            student.parent?.phone && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono italic truncate max-w-[220px]" title={`Parent Phone: ${student.parent.phone}`}>
                                <Phone className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                                <span>{student.parent.phone} (Parent)</span>
                              </div>
                            )
                          )}
                        </div>
                      </td>

                      {/* Column 2: Teacher Information */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-1.5 text-slate-400 dark:text-slate-500 min-w-[150px]">
                          <User className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                          <span className="text-[11px] leading-tight">
                            {nextLesson?.teacher ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {nextLesson.teacher.user?.firstName} {nextLesson.teacher.user?.lastName}
                              </span>
                            ) : (
                              'No teacher assigned for next class'
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Registration */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1 min-w-[90px]">
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {regDate.date}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {regDate.time}
                          </div>
                          <div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                student.isActive !== false
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {student.isActive !== false ? 'active' : 'inactive'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Subscription */}
                      <td className="py-3.5 px-4 align-top">
                        {hasSubscription ? (
                          <div className="space-y-1 min-w-[170px]">
                            <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                              {activePkg.package?.name?.split(' ')[0] || 'Quarterly'}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {activePkg.lessonsUsed || 0}/{activePkg.lessonsTotal || 16} lessons total
                              </span>
                            </div>
                            <div>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 inline-block">
                                {Math.max(0, (activePkg.lessonsTotal || 16) - (activePkg.lessonsUsed || 0))} lessons unused
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              subscribed for the past 2 months
                            </div>
                            <div>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                Active
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 pt-1 min-w-[140px]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="text-[11px]">No subscription</span>
                          </div>
                        )}
                      </td>

                      {/* Column 5: Payment */}
                      <td className="py-3.5 px-4 align-top">
                        {hasPayment ? (
                          <div className="space-y-1 min-w-[150px]">
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              Last Pay Date: <span className="font-mono">{regDate.date}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Renews: <span className="font-mono">12/14/27</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                paid (₪1000)
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                                last 4 digits: 3790
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 pt-1 min-w-[130px]">
                            <CreditCard className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="text-[11px]">No payment info</span>
                          </div>
                        )}
                      </td>

                      {/* Column 6: Regular Schedule */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 pt-1 min-w-[140px]">
                          <Calendar className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="text-[11px]">No regular schedule</span>
                        </div>
                      </td>

                      {/* Column 7: Next Lesson */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 pt-1 min-w-[140px]">
                          <Calendar className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="text-[11px]">
                            {nextLesson?.scheduledAt ? (
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {new Date(nextLesson.scheduledAt).toLocaleDateString()}
                              </span>
                            ) : (
                              'No scheduled lessons'
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Column 8: Actions */}
                      <td className="py-3.5 px-4 align-top text-end relative">
                        <div className="inline-block text-start">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuUserId(activeMenuUserId === student.id ? null : student.id)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuUserId === student.id && (
                            <div className="absolute end-4 top-10 w-52 bg-white dark:bg-slate-850 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 space-y-0.5 animate-in fade-in-50 duration-100">
                              {/* Manage Family & Children */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuUserId(null);
                                  onOpenFamilyModal(student);
                                }}
                                className="w-full px-3.5 py-2 text-start text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Manage Family & Children</span>
                              </button>

                              {/* Add Child */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuUserId(null);
                                  onOpenAddChildModal(student);
                                }}
                                className="w-full px-3.5 py-2 text-start text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                                <span>Add Child Account</span>
                              </button>

                              {/* Toggle Status */}
                              {onToggleStatus && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuUserId(null);
                                    onToggleStatus(student.id, student.isActive !== false);
                                  }}
                                  className="w-full px-3.5 py-2 text-start text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                  <span>
                                    {student.isActive !== false ? 'Deactivate Student' : 'Activate Student'}
                                  </span>
                                </button>
                              )}

                              {/* Reset Password */}
                              {onResetPassword && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuUserId(null);
                                    onResetPassword(student);
                                  }}
                                  className="w-full px-3.5 py-2 text-start text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Force Password Reset</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. TABLE FOOTER & PAGINATION (Matching screenshot) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
          {/* Showing info + Page Size */}
          <div className="flex items-center gap-3">
            <span>
              Showing {totalStudents === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM LEGEND: Registration Sources */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Registration Sources:</span>
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Sales Agent</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <Globe className="w-3.5 h-3.5 text-purple-500" />
          <span>Website</span>
        </div>
      </div>
    </div>
  );
};
