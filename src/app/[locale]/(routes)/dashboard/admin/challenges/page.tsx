'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import { Textarea } from '@nextui-org/react';
import { Select, SelectItem } from '@nextui-org/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { MdAdd, MdEdit, MdDelete, MdPlayArrow, MdSportsKabaddi } from 'react-icons/md';
import { Button, IconButton } from '@/components/atoms';

interface Challenge {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  points: number;
  demoVideoUrl: string;
  isBonus: boolean;
  createdAt: string;
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  averageScore: number;
}

export default function AdminChallengesPage() {
  const t = useTranslations('adminChallengesPage');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'easy',
    points: 100,
    demoVideoUrl: '',
    isBonus: false,
  });

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/challenges');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const openCreateModal = () => {
    setEditingChallenge(null);
    setFormData({
      name: '',
      description: '',
      difficulty: 'easy',
      points: 100,
      demoVideoUrl: '',
      isBonus: false,
    });
    onOpen();
  };

  const openEditModal = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      name: challenge.name,
      description: challenge.description,
      difficulty: challenge.difficulty,
      points: challenge.points,
      demoVideoUrl: challenge.demoVideoUrl,
      isBonus: challenge.isBonus,
    });
    onOpen();
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = '/api/admin/challenges';
      const method = editingChallenge ? 'PATCH' : 'POST';
      const body = editingChallenge
        ? { challengeId: editingChallenge.id, action: 'update', ...formData }
        : formData;

      console.log('Sending:', { method, body });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        alert(editingChallenge ? t('challengeUpdated') : t('challengeCreated'));
        fetchChallenges();
        onClose();
      } else {
        alert(data.error || t('errorSaving'));
        console.error('Error saving challenge:', data);
      }
    } catch (error) {
      console.error('Error saving challenge:', error);
      alert(t('errorSaving'));
    }
    setSaving(false);
  };

  const handleDelete = async (challengeId: number) => {
    if (!confirm(t('confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch('/api/admin/challenges', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });

      if (response.ok) {
        fetchChallenges();
      } else {
        const data = await response.json();
        alert(data.error || t('errorDeleting'));
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert(t('errorDeleting'));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-500 hover:bg-green-600',
      medium: 'bg-yellow-500 hover:bg-yellow-600',
      hard: 'bg-red-500 hover:bg-red-600',
      expert: 'bg-purple-500 hover:bg-purple-600',
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
  };

  const getDifficultyBadge = (difficulty: string) => {
    return (
      <span className={`text-xs ${getDifficultyColor(difficulty)} text-white px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer`}>
        {difficulty}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-16 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider mb-2">
            {`🛹 ${t('title')}`}
          </h1>
          <p className="text-neutral-300 text-lg mb-10">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex justify-center relative z-10 pb-4">
          <Button
            onClick={openCreateModal}
            variant="primary"
            size="lg"
            leftIcon={<MdAdd size={20} />}
          >
            {t('newChallenge')}
          </Button>
        </div>
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-cyan-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="bg-neutral-900 border-4 border-neutral-700 shadow-lg hover:shadow-cyan-500/20 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between w-full gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <MdSportsKabaddi size={24} className="text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-black text-lg uppercase tracking-wider mb-2 break-words">
                        {challenge.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {getDifficultyBadge(challenge.difficulty)}
                        {challenge.isBonus && (
                          <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-black uppercase">
                            🌟 BONUS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <IconButton
                      variant="edit"
                      size="sm"
                      onClick={() => openEditModal(challenge)}
                      icon={<MdEdit size={16} />}
                    />
                    <IconButton
                      variant="delete"
                      size="sm"
                      onClick={() => handleDelete(challenge.id)}
                      icon={<MdDelete size={16} />}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {challenge.description}
                </p>

                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-neutral-400 text-xs uppercase tracking-wider">{t('points')}</p>
                    <p className="text-2xl font-black text-yellow-400">{challenge.points}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-neutral-400 text-xs uppercase tracking-wider">{t('submissions')}</p>
                    <p className="text-2xl font-black text-cyan-400">{challenge.totalSubmissions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-neutral-400 text-xs uppercase tracking-wider">{t('avgScore')}</p>
                    <p className="text-2xl font-black text-green-400">
                      {challenge.averageScore > 0 ? challenge.averageScore.toFixed(1) : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-green-500/20 p-2 rounded text-center">
                    <p className="text-green-400 text-xs font-bold uppercase tracking-wider">{t('approved')}</p>
                    <p className="text-green-400 font-black">{challenge.approvedSubmissions}</p>
                  </div>
                  <div className="flex-1 bg-yellow-500/20 p-2 rounded text-center">
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">{t('pending')}</p>
                    <p className="text-yellow-400 font-black">{challenge.pendingSubmissions}</p>
                  </div>
                  <div className="flex-1 bg-red-500/20 p-2 rounded text-center">
                    <p className="text-red-400 text-xs font-bold uppercase tracking-wider">{t('rejected')}</p>
                    <p className="text-red-400 font-black">{challenge.rejectedSubmissions}</p>
                  </div>
                </div>

                {challenge.demoVideoUrl && (
                  <a
                    href={challenge.demoVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button
                      variant="purple"
                      size="md"
                      leftIcon={<MdPlayArrow size={16} />}
                      className="w-full"
                    >
                      {t('viewDemo')}
                    </Button>
                  </a>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        className="bg-neutral-900 border-4 border-neutral-700"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="text-white font-black uppercase tracking-wider text-center pb-4 pt-8 border-b-2 border-neutral-700">
            {editingChallenge ? `✏️ ${t('editChallenge')}` : `➕ ${t('createNewChallenge')}`}
          </ModalHeader>

          <ModalBody className="px-8 py-8">
            <div className="space-y-8">
              {/* Challenge Name */}
              <div>
                <label className="block text-neutral-300 font-bold uppercase tracking-wider text-sm mb-3">
                  {t('challengeName')}
                </label>
                <Input
                  placeholder={t('challengeNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-white"
                  size="lg"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 focus-within:!border-neutral-600"
                  }}
                  style={{ color: 'white' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-300 font-bold uppercase tracking-wider text-sm mb-3">
                  {t('description')}
                </label>
                <Textarea
                  placeholder={t('descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="text-white"
                  minRows={4}
                  size="lg"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 focus-within:!border-neutral-600"
                  }}
                  style={{ color: 'white' }}
                />
              </div>

              {/* Difficulty and Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-neutral-300 font-bold uppercase tracking-wider text-sm mb-3">
                    {t('difficulty')}
                  </label>
                  <Select
                    selectedKeys={[formData.difficulty]}
                    onSelectionChange={(keys) => setFormData(prev => ({
                      ...prev,
                      difficulty: Array.from(keys)[0] as string
                    }))}
                    size="lg"
                    classNames={{
                      trigger: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 text-white",
                      value: "text-white",
                      listbox: "bg-neutral-800",
                      popoverContent: "bg-neutral-800"
                    }}
                    style={{ color: 'white' }}
                  >
                    <SelectItem key="easy" value="easy" className="text-white">{t('easy')}</SelectItem>
                    <SelectItem key="medium" value="medium" className="text-white">{t('medium')}</SelectItem>
                    <SelectItem key="hard" value="hard" className="text-white">{t('hard')}</SelectItem>
                    <SelectItem key="expert" value="expert" className="text-white">{t('expert')}</SelectItem>
                  </Select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold uppercase tracking-wider text-sm mb-3">
                    {t('pointsLabel')}
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={formData.points.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    size="lg"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 focus-within:!border-neutral-600"
                    }}
                    style={{ color: 'white' }}
                  />
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-neutral-300 font-bold uppercase tracking-wider text-sm mb-3">
                  {t('demoVideoUrl')}
                </label>
                <Input
                  placeholder={t('demoVideoUrlPlaceholder')}
                  value={formData.demoVideoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, demoVideoUrl: e.target.value }))}
                  size="lg"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-neutral-800 border-2 border-neutral-600 hover:!border-neutral-600 focus-within:!border-neutral-600"
                  }}
                  style={{ color: 'white' }}
                />
              </div>

              {/* Challenge Bonus */}
              <div>
                <label className="flex items-start gap-4 cursor-pointer bg-neutral-800 p-5 rounded-xl border-2 border-neutral-600 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.isBonus}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBonus: e.target.checked }))}
                    className="w-6 h-6 mt-1 rounded border-2 border-neutral-600 bg-neutral-900 checked:bg-yellow-500 checked:border-yellow-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-white font-bold uppercase tracking-wider mb-1">{`🌟 ${t('challengeBonus')}`}</p>
                    <p className="text-neutral-400 text-sm leading-relaxed">{t('challengeBonusDesc')}</p>
                  </div>
                </label>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="pt-6 pb-8 px-8 gap-4 border-t-2 border-neutral-700">
            <Button
              onClick={onClose}
              variant="secondary"
              size="lg"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={saving}
              variant="primary"
              size="lg"
            >
              {editingChallenge ? t('updateChallenge') : t('createChallenge')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}