'use client';

import { Shield, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CommunityApprovedBadgeProps {
  communityApproved: boolean;
  className?: string;
}

export default function CommunityApprovedBadge({
  communityApproved,
  className = '',
}: CommunityApprovedBadgeProps) {
  const t = useTranslations('communityBadge');

  if (communityApproved) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-cyan-500/20 to-accent-blue-500/20 border border-accent-cyan-500/30 ${className}`}
      >
        <Users className="w-4 h-4 text-accent-cyan-400" />
        <span className="text-sm font-semibold text-accent-cyan-400">
          {t('approvedByCommunity')}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-purple-500/20 to-accent-pink-500/20 border border-accent-purple-500/30 ${className}`}
    >
      <Shield className="w-4 h-4 text-accent-purple-400" />
      <span className="text-sm font-semibold text-accent-purple-400">
        {t('approvedByJudge')}
      </span>
    </div>
  );
}
