'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { getImageUrl } from '@/utils';
import { POSITION_COLORS, POSITION_LABELS_SINGULAR } from '@/utils/constants';
import { Player } from '@/types';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  showStats?: boolean;
}

export function PlayerCard({ player, onClick, showStats = false }: PlayerCardProps) {
  const positionColor = POSITION_COLORS[player.position || 'DEFAULT'];
  const positionLabel = POSITION_LABELS_SINGULAR[player.position || 'GK'];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/10 shadow-lg hover:shadow-xl"
      style={{ width: '320px' }}
    >
      {/* Левая цветная полоса */}
      <div 
        className="w-1 h-full absolute left-0 top-0"
        style={{ backgroundColor: positionColor }}
      />
      
      {/* Верхняя часть: только логотип клуба и мини-статистика */}
      <div 
        className="relative h-20 px-4 py-3 flex items-center justify-between border-b border-white/10 bg-white/5"
        style={{ 
          borderBottomColor: `${positionColor}30`
        }}
      >
        {/* Логотип клуба */}
        <div className="flex items-center gap-3">
          {player.club?.logo ? (
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/10 border border-white/20">
              <Image
                src={getImageUrl(player.club.logo)}
                alt={player.club.name || 'Клуб'}
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white/60 text-xs font-bold">К</span>
            </div>
          )}
        </div>
        
        {/* Короткая статистика */}
        <div className="text-right">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-black text-white">{player.goals_scored || 0}</div>
              <div className="text-xs text-white/70">голов</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-white">{player.assists || 0}</div>
              <div className="text-xs text-white/70">ассистов</div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="p-3 flex flex-col">
        {/* Фото игрока */}
        <div className="mb-2 relative">
          <div className="w-full h-100 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center relative">
            {player.photo ? (
              <Image 
                src={getImageUrl(player.photo)} 
                alt={`${player.first_name} ${player.last_name}`}
                width={380}
                height={380}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src="/images/player-silhouette.png"
                  alt="Player silhouette"
                  width={380}
                  height={380}
                  className="opacity-70 object-contain"
                />
              </div>
            )}
            
            {/* Номер игрока в углу */}
            <div 
              className="absolute -top-2 -right-2 w-14 h-14 rounded-xl flex items-center justify-center border-2 border-white/20 shadow-lg"
              style={{ backgroundColor: positionColor }}
            >
              <span className="text-white font-bold text-base">{player.number || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Информация под фото */}
        <div className="space-y-2 pt-1 px-1">
          <h3 className="font-extrabold text-white text-lg text-left tracking-tight">
            {player.first_name} {player.last_name}
          </h3>
          <div className="space-y-1">
            <div className="text-white/90 text-base leading-tight">{positionLabel}</div>
            {player.nationality && (
              <div className="text-white/70 text-sm leading-tight">{player.nationality}</div>
            )}
          </div>
          {showStats && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{player.goals_scored || 0}</div>
                <div className="text-xs text-white/60">Голы</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{player.assists || 0}</div>
                <div className="text-xs text-white/60">Ассисты</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
