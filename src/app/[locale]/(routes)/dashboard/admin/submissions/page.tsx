'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { Button } from '@nextui-org/react';
import { Select, SelectItem } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import { Textarea } from '@nextui-org/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { MdPlayArrow, MdGavel, MdCheckCircle, MdCancel, MdSchedule, MdRefresh } from 'react-icons/md';
import Image from 'next/image';

interface Submission {
  id: number;
  userId: string;
  challengeId: number;
  videoUrl: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  evaluatedAt: string | null;
  evaluatedBy: string | null;
  user: {
    name: string;
    email: string;
    photo: string;
  };
  challenge: {
    name: string;
    difficulty: string;
    points: number;
  };
  judge: {
    name: string;
    email: string;
  } | null;
}

interface SubmissionsResponse {
  submissions: Submission[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminSubmissionsPage() {
  const t = useTranslations('adminSubmissionsPage');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [reevaluating, setReevaluating] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    challengeId: '',
    userId: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [reevaluateForm, setReevaluateForm] = useState({
    score: '',
    feedback: '',
  });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.challengeId) params.append('challengeId', filters.challengeId);
      if (filters.userId) params.append('userId', filters.userId);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/admin/submissions?${params}`);
      if (response.ok) {
        const data: SubmissionsResponse = await response.json();
        setSubmissions(data.submissions);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openReevaluateModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReevaluateForm({
      score: submission.score?.toString() || '',
      feedback: submission.feedback || '',
    });
    onOpen();
  };

  const handleReevaluate = async () => {
    if (!selectedSubmission) return;

    setReevaluating(selectedSubmission.id);
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          action: 'reevaluate',
          score: parseInt(reevaluateForm.score),
          feedback: reevaluateForm.feedback,
        }),
      });

      if (response.ok) {
        fetchSubmissions();
        onClose();
      } else {
        console.error('Error re-evaluating submission');
      }
    } catch (error) {
      console.error('Error re-evaluating submission:', error);
    }
    setReevaluating(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <MdCheckCircle size={20} className="text-green-400" />;
      case 'rejected': return <MdCancel size={20} className="text-red-400" />;
      default: return <MdSchedule size={20} className="text-accent-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'from-accent-yellow-500 to-accent-orange-500',
      approved: 'from-green-500 to-accent-teal-500',
      rejected: 'from-red-500 to-accent-pink-500',
    };

    return (
      <span className={`text-xs bg-gradient-to-r ${colors[status as keyof typeof colors]} text-white px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg`}>
        {status}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'from-green-500 to-accent-teal-500',
      medium: 'from-accent-yellow-500 to-accent-orange-500',
      hard: 'from-red-500 to-accent-pink-500',
      expert: 'from-accent-purple-500 to-indigo-500',
    };

    return (
      <span className={`text-xs bg-gradient-to-r ${colors[difficulty as keyof typeof colors]} text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider`}>
        {difficulty}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider mb-2">
          {`📹 ${t('title')}`}
        </h1>
        <p className="text-neutral-600 text-lg">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-accent-yellow-500 to-accent-orange-600 border-4 border-white shadow-lg shadow-accent-yellow-500/30">
          <CardBody className="text-center">
            <MdSchedule size={32} className="text-white mx-auto mb-2" />
            <p className="text-white text-sm font-bold uppercase tracking-wider">{t('pending')}</p>
            <p className="text-3xl font-black text-white">{stats.pending}</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-accent-teal-600 border-4 border-white shadow-lg shadow-green-500/30">
          <CardBody className="text-center">
            <MdCheckCircle size={32} className="text-white mx-auto mb-2" />
            <p className="text-white text-sm font-bold uppercase tracking-wider">{t('approved')}</p>
            <p className="text-3xl font-black text-white">{stats.approved}</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-accent-pink-600 border-4 border-white shadow-lg shadow-red-500/30">
          <CardBody className="text-center">
            <MdCancel size={32} className="text-white mx-auto mb-2" />
            <p className="text-white text-sm font-bold uppercase tracking-wider">{t('rejected')}</p>
            <p className="text-3xl font-black text-white">{stats.rejected}</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-900 border-4 border-neutral-700">
        <CardHeader>
          <h3 className="text-xl font-black text-white uppercase tracking-wider">
            {`🔍 ${t('filters')}`}
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label={t('status')}
              placeholder={t('allStatuses')}
              selectedKeys={[filters.status]}
              onSelectionChange={(keys) => setFilters(prev => ({
                ...prev,
                status: Array.from(keys)[0] as string,
                page: 1
              }))}
            >
              <SelectItem key="all" value="all">{t('all')}</SelectItem>
              <SelectItem key="pending" value="pending">{t('pending')}</SelectItem>
              <SelectItem key="approved" value="approved">{t('approved')}</SelectItem>
              <SelectItem key="rejected" value="rejected">{t('rejected')}</SelectItem>
            </Select>

            <Input
              label={t('challengeId')}
              placeholder={t('challengeId')}
              value={filters.challengeId}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                challengeId: e.target.value,
                page: 1
              }))}
            />

            <Input
              label={t('userEmail')}
              placeholder="user@email.com"
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                userId: e.target.value,
                page: 1
              }))}
            />

            <div className="flex items-end">
              <Button
                onClick={() => setFilters({
                  status: 'all',
                  challengeId: '',
                  userId: '',
                  page: 1,
                  limit: 20,
                })}
                className="bg-neutral-700 text-white font-bold"
              >
                {t('clearFilters')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Submissions List */}
      <Card className="bg-neutral-900 border-4 border-neutral-700">
        <CardHeader>
          <h3 className="text-xl font-black text-white uppercase tracking-wider">
            {`📋 ${t('submissions')} (${pagination.total})`}
          </h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-cyan-400"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-gradient-to-r from-neutral-800 to-neutral-700 p-4 rounded-lg border border-neutral-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 rounded-full blur-sm"></div>
                        <Image
                          className="relative rounded-full w-12 h-12 border-2 border-white"
                          src={submission.user.photo || "/logo.png"}
                          alt={submission.user.name}
                          width={48}
                          height={48}
                        />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">{submission.user.name}</h4>
                        <p className="text-neutral-400 text-sm">{submission.user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(submission.status)}
                          {getStatusBadge(submission.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-neutral-400 text-xs uppercase tracking-wider">{t('challenge')}</p>
                        <p className="text-accent-cyan-400 font-bold">{submission.challenge.name}</p>
                        {getDifficultyBadge(submission.challenge.difficulty)}
                      </div>

                      <div className="text-center">
                        <p className="text-neutral-400 text-xs uppercase tracking-wider">{t('score')}</p>
                        <p className="text-2xl font-black text-accent-yellow-400">
                          {submission.score !== null ? submission.score : '-'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          as="a"
                          href={submission.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          isIconOnly
                          className="bg-gradient-to-r from-accent-purple-500 to-accent-pink-600 text-white"
                        >
                          <MdPlayArrow size={16} />
                        </Button>

                        <Button
                          onClick={() => openReevaluateModal(submission)}
                          isIconOnly
                          className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 text-black"
                        >
                          <MdRefresh size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {submission.feedback && (
                    <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg">
                      <p className="text-neutral-300 text-sm">
                        <strong className="text-accent-cyan-400">{t('feedback')}:</strong> {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {submissions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-400 text-lg">{t('noSubmissionsFound')}</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            disabled={pagination.page <= 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            className="bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 text-white font-bold"
          >
            {t('previous')}
          </Button>

          <span className="flex items-center px-4 py-2 bg-neutral-800 text-white rounded-lg">
            {t('page', { page: pagination.page, pages: pagination.pages })}
          </span>

          <Button
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            className="bg-gradient-to-r from-accent-cyan-500 to-accent-blue-600 text-white font-bold"
          >
            {t('next')}
          </Button>
        </div>
      )}

      {/* Re-evaluate Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        className="bg-neutral-900 border-4 border-neutral-700"
      >
        <ModalContent>
          <ModalHeader className="text-white font-black uppercase tracking-wider">
            {`🔄 ${t('reevaluateTitle')}`}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {selectedSubmission && (
              <div className="bg-neutral-800 p-4 rounded-lg">
                <p className="text-white font-bold">{selectedSubmission.user.name}</p>
                <p className="text-neutral-400 text-sm">{selectedSubmission.challenge.name}</p>
              </div>
            )}

            <Input
              label={t('newScore')}
              type="number"
              min="0"
              max="100"
              placeholder="85"
              value={reevaluateForm.score}
              onChange={(e) => setReevaluateForm(prev => ({ ...prev, score: e.target.value }))}
            />

            <Textarea
              label={t('feedbackOptional')}
              placeholder={t('feedbackPlaceholder')}
              value={reevaluateForm.feedback}
              onChange={(e) => setReevaluateForm(prev => ({ ...prev, feedback: e.target.value }))}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onClose}
              className="bg-neutral-700 text-white"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleReevaluate}
              isLoading={reevaluating !== null}
              className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 text-white font-bold uppercase tracking-wider"
            >
              {t('reevaluate')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}