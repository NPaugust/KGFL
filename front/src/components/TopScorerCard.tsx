'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/utils';
import { Player } from '@/types';

interface TopScorerCardProps {
  player: Player;
  layout: 'horizontal' | 'vertical';
  index?: number;
}

export function TopScorerCard({ player, layout, index }: TopScorerCardProps) {
  const cardContent = (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group ${
      layout === 'horizontal' ? 'h-auto' : 'h-auto'
    }`}>
      {layout === 'horizontal' ? (
        // Горизонтальная карточка для главной страницы: фото слева, в центре имя/клуб, справа голов
        <div className="flex items-center gap-5">
          {/* Фото слева */}
          <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-white/20 flex-shrink-0">
            {((player as any).photo_url || player.photo) ? (
              <Image src={(player as any).photo_url || getImageUrl(player.photo || '')} alt={`${player.first_name} ${player.last_name}`} width={112} height={112} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <Image src="/images/player-silhouette.png" alt="Player silhouette" width={80} height={80} className="opacity-40" />
              </div>
            )}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center border-2 border-white/20">
              <span className="text-white font-bold text-xs">{player.number || 0}</span>
            </div>
          </div>
          {/* Имя и клуб по центру */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-lg truncate">{player.first_name} {player.last_name}</h4>
            <div className="flex items-center gap-2 mt-1">
              {player.club?.logo ? (
                <Image src={getImageUrl(player.club.logo)} alt={player.club?.name || 'Клуб'} width={20} height={20} className="rounded" />
              ) : (
                <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/40">{player.club?.name?.[0] || 'К'}</div>
              )}
              <span className="text-white/90 text-sm font-medium truncate">{player.club?.name || 'Неизвестный клуб'}</span>
            </div>
          </div>
          {/* Голов справа */}
          <div className="text-right flex-shrink-0">
            <div className="text-4xl font-black text-brand-accent leading-none">{player.goals_scored || 0}</div>
            <div className="text-xs text-white/60 mt-1">голов</div>
          </div>
        </div>
      ) : (
        // Вертикальный компактный layout для страницы таблицы
        <div className="flex items-center gap-4">
          {/* Слева имя и клуб */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-base truncate">{player.first_name} {player.last_name}</h4>
            <div className="flex items-center gap-2 mt-1">
              {player.club?.logo ? (
                <Image src={getImageUrl(player.club.logo)} alt={player.club?.name || 'Клуб'} width={20} height={20} className="rounded" />
              ) : (
                <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/40">{player.club?.name?.[0] || 'К'}</div>
              )}
              <span className="text-white/80 text-sm truncate">{player.club?.name || 'Неизвестный клуб'}</span>
            </div>
          </div>
          {/* По центру количество голов */}
          <div className="text-center flex-shrink-0 w-14">
            <div className="text-2xl font-black text-brand-accent leading-none">{player.goals_scored || 0}</div>
            <div className="text-[10px] text-white/60">голов</div>
          </div>
          {/* Справа фото */}
          <div className="flex-shrink-0 relative">
            <div className="w-14 h-16 rounded-xl overflow-hidden border-2 border-white/20">
              {((player as any).photo_url || player.photo) ? (
                <Image src={(player as any).photo_url || getImageUrl(player.photo || '')} alt={`${player.first_name} ${player.last_name}`} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <Image src="/images/player-silhouette.png" alt="Player silhouette" width={48} height={48} className="opacity-40" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Обертываем в Link только если есть клуб
  if (player.club?.id) {
    return (
      <Link href={`/clubs/${player.club.id}?player=${player.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
