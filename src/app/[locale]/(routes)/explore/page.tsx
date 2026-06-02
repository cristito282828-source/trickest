'use client';

import { Button, Card, CardBody, Select, SelectItem } from '@nextui-org/react';
import { Button as ArcadeButton } from '@/components/atoms';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { GiTrophy } from 'react-icons/gi';
import {
  MdAdminPanelSettings,
  MdGavel,
  MdGroups,
  MdLocationOn,
  MdOutlineSkateboarding,
  MdPersonAdd,
  MdRefresh,
} from 'react-icons/md';

interface Skater {
  id: number;
  username: string;
  email: string;
  name: string;
  photo: string | null;
  role: string;
  location: string | null;
  team: {
    id: number;
    name: string;
    logo: string | null;
  } | null;
  memberSince: string;
  stats: {
    totalScore: number;
    approvedSubmissions: number;
    avgScore: number;
    followerCount: number;
    followingCount: number;
  };
}

interface SkatersResponse {
  skaters: Skater[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function ExplorePage() {
  const t = useTranslations('explorePage');
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'score',
    role: 'all',
    limit: 20,
    offset: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (skaterId: number) => {
    setImageErrors((prev) => new Set(prev).add(skaterId));
  };

  const fetchSkaters = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.append('sortBy', filters.sortBy);
      params.append('role', filters.role);
      params.append('limit', filters.limit.toString());
      params.append('offset', append ? skaters.length.toString() : '0');

      const response = await fetch(`/api/skaters?${params}`);
      if (response.ok) {
        const data: SkatersResponse = await response.json();

        if (append) {
          setSkaters((prev) => [...prev, ...data.skaters]);
        } else {
          setSkaters(data.skaters);
        }

        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error fetching skaters:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSkaters();
  }, [filters.sortBy, filters.role]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: 0,
    }));
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchSkaters(true);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <MdAdminPanelSettings size={16} className="text-red-400" />;
      case 'judge':
        return <MdGavel size={16} className="text-accent-yellow-400" />;
      default:
        return <MdOutlineSkateboarding size={16} className="text-accent-cyan-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'from-red-500 to-accent-orange-500',
      judge: 'from-accent-yellow-500 to-accent-amber-500',
      skater: 'from-accent-cyan-500 to-accent-blue-500',
    };

    return (
      <span
        className={`text-xs bg-gradient-to-r ${
          colors[role as keyof typeof colors]
        } text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1`}
      >
        {getRoleIcon(role)}
        {role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-accent-purple-900 to-neutral-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-1 rounded-lg shadow-2xl shadow-accent-cyan-500/30">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400 uppercase tracking-wider text-center">
              {`🛹 ${t('title')}`}
            </h1>
            <p className="text-accent-cyan-300 mt-2 text-sm md:text-base text-center">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Select
              label={t('sortBy')}
              selectedKeys={[filters.sortBy]}
              onSelectionChange={(keys) =>
                handleFilterChange('sortBy', Array.from(keys)[0] as string)
              }
              className="w-48"
            >
              <SelectItem key="score" value="score">
                {t('score')}
              </SelectItem>
              <SelectItem key="followers" value="followers">
                {t('followers')}
              </SelectItem>
              <SelectItem key="recent" value="recent">
                {t('mostRecent')}
              </SelectItem>
            </Select>

            <Select
              label={t('role')}
              selectedKeys={[filters.role]}
              onSelectionChange={(keys) =>
                handleFilterChange('role', Array.from(keys)[0] as string)
              }
              className="w-48"
            >
              <SelectItem key="all" value="all">
                {t('all')}
              </SelectItem>
              <SelectItem key="skater" value="skater">
                {t('skaters')}
              </SelectItem>
              <SelectItem key="judge" value="judge">
                {t('judges')}
              </SelectItem>
              <SelectItem key="admin" value="admin">
                {t('admins')}
              </SelectItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Skaters Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent-cyan-400"></div>
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {skaters.map((skater) => (
              <Card
                key={skater.id}
                className="bg-gradient-to-br from-neutral-800 to-neutral-700 border-4 border-neutral-600 hover:border-accent-cyan-500/50 transition-all hover:scale-105 shadow-lg hover:shadow-accent-cyan-500/20"
              >
                <CardBody className="p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 rounded-full blur-sm"></div>
                      {skater.photo &&
                      !imageErrors.has(skater.id) &&
                      !skater.photo.includes('example.com') ? (
                        <Image
                          src={skater.photo}
                          alt={skater.name || 'Avatar'}
                          width={50}
                          height={50}
                          className="relative rounded-full border-2 border-white object-cover"
                          onError={() => handleImageError(skater.id)}
                        />
                      ) : (
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-accent-cyan-500 to-accent-purple-600 flex items-center justify-center text-white font-black text-lg border-2 border-white">
                          {skater.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg truncate">
                        {skater.name || 'Skater'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(skater.role)}
                      </div>
                    </div>
                  </div>

                  {/* Location & Team */}
                  <div className="space-y-2 mb-4">
                    {skater.location && (
                      <div className="flex items-center gap-2 text-neutral-300 text-sm">
                        <MdLocationOn className="text-accent-cyan-400" />
                        <span className="truncate">{skater.location}</span>
                      </div>
                    )}
                    {skater.team && (
                      <div className="flex items-center gap-2 text-neutral-300 text-sm">
                        <MdGroups className="text-accent-purple-400" />
                        <span className="truncate">{skater.team.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-accent-cyan-400 font-bold text-lg">
                        {skater.stats.totalScore}
                      </p>
                      <p className="text-neutral-400 text-xs uppercase">{t('score')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-400 font-bold text-lg">
                        {skater.stats.approvedSubmissions}
                      </p>
                      <p className="text-neutral-400 text-xs uppercase">{t('tricks')}</p>
                    </div>
                  </div>

                  {/* Social Stats */}
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <div className="text-center">
                      <p className="text-accent-purple-400 font-bold">
                        {skater.stats.followerCount}
                      </p>
                      <p className="text-neutral-500">{t('followers')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-accent-purple-400 font-bold">
                        {skater.stats.followingCount}
                      </p>
                      <p className="text-neutral-500">{t('following')}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/profile/${encodeURIComponent(skater.username)}`}
                      className="flex-1"
                    >
                      <ArcadeButton
                        variant="purple"
                        size="sm"
                        fullWidth
                      >
                        {t('viewProfile')}
                      </ArcadeButton>
                    </Link>
                    <ArcadeButton
                      variant="success"
                      size="sm"
                    >
                      <MdPersonAdd size={16} />
                    </ArcadeButton>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="max-w-7xl mx-auto mt-8 text-center">
              <ArcadeButton
                onClick={loadMore}
                isLoading={loadingMore}
                variant="purple"
                size="lg"
                leftIcon={!loadingMore ? <MdRefresh size={20} /> : undefined}
              >
                {loadingMore ? t('loadingMore') : t('loadMore')}
              </ArcadeButton>
            </div>
          )}

          {skaters.length === 0 && (
            <div className="text-center py-12">
              <MdOutlineSkateboarding className="text-neutral-600 text-6xl mx-auto mb-4" />
              <p className="text-neutral-500 text-xl">
                {t('noSkatersFound')}
              </p>
              <p className="text-neutral-600 mt-2">
                {t('beFirstToSignUp')}
              </p>
            </div>
          )}
        </>
      )}

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto mt-12 text-center">
        <div className="bg-gradient-to-r from-accent-yellow-500 to-accent-orange-600 p-1 rounded-lg shadow-2xl shadow-accent-yellow-500/30">
          <div className="bg-neutral-900 rounded-lg p-6">
            <GiTrophy className="text-accent-yellow-400 text-4xl mx-auto mb-4" />
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-yellow-400 to-accent-orange-400 uppercase tracking-wider mb-2">
              {t('joinCommunity')}
            </h2>
            <p className="text-neutral-300 mb-4">
              {t('joinCommunityDesc')}
            </p>
            <Link href="/dashboard">
              <ArcadeButton variant="primary" size="lg">
                {`🚀 ${t('startNow')}`}
              </ArcadeButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
