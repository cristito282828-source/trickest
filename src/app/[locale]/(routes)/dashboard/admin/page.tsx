import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/auth-helpers';
import prisma from '@/app/lib/prisma';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { getServerSession } from 'next-auth/next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import {
  MdAdminPanelSettings,
  MdPeople,
  MdSportsKabaddi,
  MdVideoLibrary,
} from 'react-icons/md';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    redirect('/dashboard');
  }

  const [
    totalUsers,
    totalSubmissions,
    totalChallenges,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    roleCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.submission.count(),
    prisma.challenge.count(),
    prisma.submission.count({ where: { status: 'pending' } }),
    prisma.submission.count({ where: { status: 'approved' } }),
    prisma.submission.count({ where: { status: 'rejected' } }),
    prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
  ]);

  const skaterCount = roleCounts.find(r => r.role === 'skater')?._count.role || 0;
  const judgeCount = roleCounts.find(r => r.role === 'judge')?._count.role || 0;
  const adminCount = roleCounts.find(r => r.role === 'admin')?._count.role || 0;

  const stats = {
    totalUsers,
    totalSubmissions,
    totalChallenges,
    activeJudges: judgeCount + adminCount,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    skaterCount,
    judgeCount,
    adminCount,
  };
  const t = await getTranslations('adminDashboard');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-2">
          {`🎮 ${t('title')}`}
        </h1>
        <p className="text-neutral-600 text-lg">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-accent-cyan-500 to-accent-blue-600 border-4 border-white shadow-lg shadow-accent-cyan-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <MdPeople size={32} className="text-white" />
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wider">
                  {t('totalUsers')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-black text-white">
              {stats?.totalUsers || 0}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-accent-purple-500 to-accent-pink-600 border-4 border-white shadow-lg shadow-accent-purple-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <MdVideoLibrary size={32} className="text-white" />
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wider">
                  {t('submissions')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-black text-white">
              {stats?.totalSubmissions || 0}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-accent-teal-600 border-4 border-white shadow-lg shadow-green-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <MdSportsKabaddi size={32} className="text-white" />
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wider">
                  {t('challenges')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-black text-white">
              {stats?.totalChallenges || 0}
            </p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-accent-yellow-500 to-accent-orange-600 border-4 border-white shadow-lg shadow-accent-yellow-500/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <MdAdminPanelSettings size={32} className="text-white" />
              <div>
                <p className="text-white text-sm font-bold uppercase tracking-wider">
                  {t('activeJudges')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-black text-white">
              {stats?.activeJudges || 0}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-4 border-neutral-700">
          <CardHeader>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              {`📊 ${t('submissionsByStatus')}`}
            </h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-accent-yellow-500/10 rounded-lg border border-accent-yellow-500/20">
              <span className="text-accent-yellow-400 font-bold uppercase tracking-wider">
                {t('pending')}
              </span>
              <span className="text-2xl font-black text-accent-yellow-400">
                {stats?.pendingSubmissions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <span className="text-green-400 font-bold uppercase tracking-wider">
                {t('approved')}
              </span>
              <span className="text-2xl font-black text-green-400">
                {stats?.approvedSubmissions || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-red-400 font-bold uppercase tracking-wider">
                {t('rejected')}
              </span>
              <span className="text-2xl font-black text-red-400">
                {stats?.rejectedSubmissions || 0}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-neutral-900 border-4 border-neutral-700">
          <CardHeader>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              {`👥 ${t('roleDistribution')}`}
            </h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-accent-cyan-500/10 rounded-lg border border-accent-cyan-500/20">
              <span className="text-accent-cyan-400 font-bold uppercase tracking-wider">
                {t('skaters')}
              </span>
              <span className="text-2xl font-black text-accent-cyan-400">
                {stats?.skaterCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-accent-yellow-500/10 rounded-lg border border-accent-yellow-500/20">
              <span className="text-accent-yellow-400 font-bold uppercase tracking-wider">
                {t('judges')}
              </span>
              <span className="text-2xl font-black text-accent-yellow-400">
                {stats?.judgeCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-red-400 font-bold uppercase tracking-wider">
                {t('admins')}
              </span>
              <span className="text-2xl font-black text-red-400">
                {stats?.adminCount || 0}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
