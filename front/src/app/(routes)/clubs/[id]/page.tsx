'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Building2, 
  UserCheck,
  ArrowLeft,
  Shirt,
  Target,
  Users2,
  Crown,
  User,
  X,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useClub } from '@/hooks/useClubs';
import { useApi } from '@/hooks/useApi';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PlayerTransfer } from '@/types';
import { apiClient, API_ENDPOINTS } from '@/services/api';
import { SeasonFilter } from '@/components/SeasonFilter';
import { useSeasonStore } from '@/store/useSeasonStore';
import { formatDate, getImageUrl } from '@/utils';
import { POSITION_LABELS, POSITION_LABELS_SINGULAR, POSITION_COLORS } from '@/utils/constants';
import Image from 'next/image';
import { PlayerCard } from '@/components/PlayerCard';

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  photo: string;
  position: string;
  number: number;
  nationality: string;
  date_of_birth: string;
  height: number;
  weight: number;
  bio: string;
}

interface Match {
  id: number;
  home_team: any;
  away_team: any;
  date: string;
  time: string;
  status: string;
  home_score: number;
  away_score: number;
  stadium: string;
}

interface Coach {
  id: number;
  first_name: string;
  last_name: string;
  photo: string;
  nationality: string;
  bio: string;
}

// Удаляем дублирующиеся константы, используем импортированные

const positionIcons = {
  GK: Target,
  DF: Shirt,
  MF: Users2,
  FW: Trophy
};

export default function ClubPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { club, loading: clubLoading, error: clubError } = useClub(params.id as string);
  
  const { data: players, loading: playersLoading } = useApi<Player[]>(
    API_ENDPOINTS.CLUB_PLAYERS(params.id as string)
  );
  
  const { selectedSeasonId } = useSeasonStore();
  const { data: matches, loading: matchesLoading } = useApi<Match[]>(
    `${API_ENDPOINTS.CLUB_MATCHES(params.id as string)}${selectedSeasonId ? `?season=${selectedSeasonId}` : ''}`
  );
  
  const { data: coaches, loading: coachesLoading } = useApi<Coach[]>(
    `${API_ENDPOINTS.COACHES}?club_id=${params.id}`
  );
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerTransfers, setPlayerTransfers] = useState<PlayerTransfer[]>([]);
  const [activeTab, setActiveTab] = useState<'squad' | 'matches' | 'management'>('squad');
  
  // Получаем статистику выбранного игрока
  const { stats: playerStats, loading: statsLoading } = usePlayerStats(selectedPlayer?.id?.toString() || null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    GK: true,
    DF: true,
    MF: true,
    FW: true
  });

  const groupedPlayers = (players || []).reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  const loading = clubLoading || playersLoading || matchesLoading || coachesLoading;

  const toggleSection = (position: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [position]: !prev[position]
    }));
  };

  // Автоматически открыть сайдбар игрока, если есть параметр в URL
  useEffect(() => {
    const playerId = searchParams.get('player')
    if (playerId && players && players.length > 0) {
      const player = players.find(p => p.id.toString() === playerId)
      if (player) {
        setSelectedPlayer(player)
      }
    }
  }, [searchParams, players])

  useEffect(() => {
    const loadTransfers = async () => {
      if (selectedPlayer) {
        const data = await apiClient.get<PlayerTransfer[]>(`${API_ENDPOINTS.PLAYER_TRANSFERS}?player=${selectedPlayer.id}`)
        setPlayerTransfers(Array.isArray(data) ? data : [])
      }
    }
    loadTransfers()
  }, [selectedPlayer])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (clubError || !club) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Клуб не найден</h1>
          <p className="text-white/70">Запрашиваемый клуб не существует</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={[
              { label: 'Клубы', href: '/clubs' },
              { label: club.name }
            ]} 
          />

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => window.history.back()}
            className="flex items-center text-white hover:text-brand-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </motion.button>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0"
            >
              <div className="relative w-48 h-40 lg:w-48 lg:h-48 bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center">
                {club?.logo ? (
                  <Image src={getImageUrl(club.logo)} alt={club.name} fill className="object-contain" />
                ) : (
                  <span className="text-brand-primary font-bold text-4xl">К</span>
                )}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 text-center lg:text-left"
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                {club.name}
              </h1>
              
              <div className="space-y-3 mb-6">
                <div className="text-white/80 text-lg">
                  <span className="text-white/60">Город:</span> {club.city || '—'}
                </div>
                
                <div className="text-white/80 text-lg">
                  <span className="text-white/60">Основан:</span> {club.founded || '—'}
                </div>
                
                <div className="text-white/80 text-lg">
                  <span className="text-white/60">Тренер:</span> {club.coach_full_name || (coaches && coaches.length > 0 ? `${coaches[0].first_name} ${coaches[0].last_name}` : '—')}
                </div>
                
                {/* Цвета формы (сводка как свотчи) */}
                {(club.primary_kit_color || club.secondary_kit_color) && (
                  <div className="flex items-center gap-4 text-white/80">
                    {club.primary_kit_color && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">Осн. форма:</span>
                        <span className="w-5 h-5 rounded-sm border border-white/20" style={{ backgroundColor: String(club.primary_kit_color) }} />
                      </div>
                    )}
                    {club.secondary_kit_color && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">Зап. форма:</span>
                        <span className="w-5 h-5 rounded-sm border border-white/20" style={{ backgroundColor: String(club.secondary_kit_color) }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 lg:px-8 pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {[
            { id: 'squad', label: 'Состав' },
            { id: 'matches', label: 'Матчи' },
            { id: 'management', label: 'Руководство' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-lg transform scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'squad' && (
            <motion.div
              key="squad"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {Object.entries(groupedPlayers).map(([position, positionPlayers]) => {
                const isExpanded = expandedSections[position];
                
                return (
                  <div key={position} className="card p-6">
                    <button
                      onClick={() => toggleSection(position)}
                      className="w-full flex items-center justify-between text-left mb-4"
                    >
                      <div className="flex items-center">
                        <h3 className="text-2xl font-bold text-white">
                          {POSITION_LABELS[position as keyof typeof POSITION_LABELS]}
                        </h3>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-white" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-white" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center"
                        >
                          {positionPlayers.map((player) => (
                            <PlayerCard
                              key={player.id}
                              player={{
                                ...player,
                                id: player.id.toString(),
                                position: player.position as 'GK' | 'DF' | 'MF' | 'FW',
                                club: club
                              }}
                              onClick={() => setSelectedPlayer(player)}
                              showStats={false}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Season Filter */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Матчи клуба</h3>
                <SeasonFilter />
              </div>

              {/* Matches Table */}
              {matches && matches.length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-3 text-left text-white font-medium">#</th>
                          <th className="px-4 py-3 text-left text-white font-medium">Дата</th>
                          <th className="px-4 py-3 text-left text-white font-medium">Хозяева</th>
                          <th className="px-4 py-3 text-center text-white font-medium">Счёт</th>
                          <th className="px-4 py-3 text-left text-white font-medium">Гости</th>
                          <th className="px-4 py-3 text-left text-white font-medium">Стадион</th>
                          <th className="px-4 py-3 text-left text-white font-medium">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((match, index) => {
                          const isFinished = match.status === 'finished'
                          const isLive = match.status === 'live'
                          const isHome = match.home_team.id === parseInt(params.id as string)
                          const isAway = match.away_team.id === parseInt(params.id as string)
                          
                          return (
                            <tr key={match.id} className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                              (isHome && isFinished && match.home_score > match.away_score) ||
                              (isAway && isFinished && match.away_score > match.home_score) 
                                ? 'bg-green-500/10' : 
                              (isHome && isFinished && match.home_score < match.away_score) ||
                              (isAway && isFinished && match.away_score < match.home_score)
                                ? 'bg-red-500/10' : ''
                            }`}>
                              <td className="px-4 py-4 text-white/70 font-medium">
                                {index + 1}
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-white">
                                  {match.date ? formatDate(match.date) : 'TBD'}
                                </div>
                                {match.time && (
                                  <div className="text-sm text-white/60 flex items-center mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {match.time.slice(0, 5)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  {match.home_team?.logo ? (
                                    <Image
                                      src={getImageUrl(match.home_team.logo)}
                                      alt={`${match.home_team.name} logo`}
                                      width={32}
                                      height={32}
                                      className="rounded mr-3"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-white/10 rounded mr-3 flex items-center justify-center text-sm text-white/40">
                                      {match.home_team.name?.[0] || 'К'}
                                    </div>
                                  )}
                                  <span className={`font-medium ${
                                    match.home_team.id === parseInt(params.id as string) 
                                      ? 'text-brand-primary' 
                                      : 'text-white'
                                  }`}>
                                    {match.home_team.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                {isFinished || isLive ? (
                                  <div className="inline-flex items-center gap-2">
                                    <span className="text-lg font-bold text-white bg-white/10 px-3 py-1 rounded">
                                      {match.home_score} : {match.away_score}
                                    </span>
                                    {isLive && (
                                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-white/50">vs</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  {match.away_team?.logo ? (
                                    <Image
                                      src={getImageUrl(match.away_team.logo)}
                                      alt={`${match.away_team.name} logo`}
                                      width={32}
                                      height={32}
                                      className="rounded mr-3"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-white/10 rounded mr-3 flex items-center justify-center text-sm text-white/40">
                                      {match.away_team.name?.[0] || 'К'}
                                    </div>
                                  )}
                                  <span className={`font-medium ${
                                    match.away_team.id === parseInt(params.id as string) 
                                      ? 'text-brand-primary' 
                                      : 'text-white'
                                  }`}>
                                    {match.away_team.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {((match as any).stadium_name || (match as any).stadium_ref?.name || match.stadium) && (
                                  <div className="flex items-center text-white/70">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span className="text-sm">{(match as any).stadium_name || (match as any).stadium_ref?.name || match.stadium}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  isLive ? 'bg-red-500/20 text-red-400' :
                                  isFinished ? 'bg-green-500/20 text-green-400' :
                                  match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                  match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {match.status === 'live' ? 'Прямой эфир' :
                                   match.status === 'finished' ? 'Завершен' :
                                   match.status === 'scheduled' ? 'Запланирован' :
                                   match.status === 'cancelled' ? 'Отменен' :
                                   match.status === 'postponed' ? 'Перенесен' :
                                   match.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70">Матчи не найдены для выбранного сезона</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'management' && (
            <motion.div
              key="management"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Главный тренер */}
                {club.coach_full_name && (
                  <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-xl font-bold text-white mb-3">{club.coach_full_name}</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm">
                      <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                      Главный тренер
                    </div>
                  </div>
                )}

                {/* Ассистент */}
                {club.assistant_full_name && (
                  <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-xl font-bold text-white mb-3">{club.assistant_full_name}</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm">
                      <span className="w-2 h-2 rounded-full bg-white/40"></span>
                      Ассистент
                    </div>
                  </div>
                )}

                {/* Капитан */}
                {club.captain_full_name && (
                  <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-xl font-bold text-white mb-3">{club.captain_full_name}</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      Капитан команды
                    </div>
                  </div>
                )}
              </div>

              {/* Если нет данных о руководстве */}
              {!club.coach_full_name && !club.assistant_full_name && !club.captain_full_name && (
                <div className="text-center py-12">
                  <Crown className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70">Информация о руководстве не указана</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay для затемнения фона */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Player Sidebar */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 w-[800px] h-full bg-brand-dark border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Основной контент */}
            <div className="flex-1 p-8 space-y-8 overflow-y-auto">

              {/* Первая карточка: Фото слева, справа Имя и ниже логотип клуба + Основные данные */}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="flex gap-8 items-start">
                  {/* Фото игрока слева */}
                  <div className="flex-shrink-0 order-1">
                    <div className="w-64 h-64 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center relative border border-white/10">
                      {selectedPlayer?.photo ? (
                        <Image 
                          src={getImageUrl(selectedPlayer.photo)} 
                          alt={`${selectedPlayer?.first_name} ${selectedPlayer?.last_name}`} 
                          width={256} 
                          height={256} 
                          className="w-64 h-64 object-cover" 
                        />
                      ) : (
                        <Image
                          src="/images/player-silhouette.png"
                          alt="Player silhouette"
                          width={256}
                          height={256}
                          className="opacity-70 object-contain"
                        />
                      )}
                      {/* Номер игрока */}
                      <div className="absolute -top-3 -right-3 w-14 h-14 bg-brand-primary rounded-xl flex items-center justify-center border-2 border-white/20 shadow-lg">
                        <span className="text-white font-bold text-lg">{selectedPlayer.number}</span>
                      </div>
                    </div>
                  </div>
                  {/* Имя в правом верхнем углу, под ним логотип клуба */}
                  <div className="flex-1 order-2">
                    <div className="flex items-start justify-between">
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        {selectedPlayer.first_name} {selectedPlayer.last_name}
                      </h2>
                      <button
                        onClick={() => setSelectedPlayer(null)}
                        className="ml-4 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        aria-label="Закрыть"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    {club?.logo && (
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/20">
                          <Image src={getImageUrl(club.logo)} alt={club.name} width={32} height={32} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white/80 font-semibold">{club?.name}</span>
                      </div>
                    )}

                    {/* Информация об игроке */}
                    <div className="mt-6 grid grid-cols-1 gap-4">
                    {/* Детали игрока */}
                      <div className="flex items-center gap-4">
                        <span className="text-white/70 text-lg">Позиция:</span>
                        <span className="text-white font-semibold text-lg">{POSITION_LABELS_SINGULAR[selectedPlayer.position as keyof typeof POSITION_LABELS_SINGULAR]}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/70 text-lg">Национальность:</span>
                        <span className="text-white font-semibold text-lg">{selectedPlayer.nationality}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/70 text-lg">Дата рождения:</span>
                        <span className="text-white font-semibold text-lg">{selectedPlayer.date_of_birth}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/70 text-lg">Рост:</span>
                        <span className="text-white font-semibold text-lg">{selectedPlayer.height} см</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/70 text-lg">Вес:</span>
                        <span className="text-white font-semibold text-lg">{selectedPlayer.weight} кг</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Вторая карточка: Статистика */}
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <h4 className="text-2xl font-bold text-white mb-8">Статистика сезона</h4>
                {statsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="text-white/70 mt-4 text-lg">Загрузка статистики...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-4xl font-black text-brand-primary mb-2">{playerStats?.matches_played || 0}</div>
                      <div className="text-sm text-white/70 font-medium">Матчи</div>
                    </div>
                    <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-4xl font-black text-brand-primary mb-2">{playerStats?.minutes_played || 0}</div>
                      <div className="text-sm text-white/70 font-medium">Минуты</div>
                    </div>
                    <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-4xl font-black text-brand-primary mb-2">{playerStats?.goals || 0}</div>
                      <div className="text-sm text-white/70 font-medium">Голы</div>
                    </div>
                    <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-4xl font-black text-brand-primary mb-2">{playerStats?.assists || 0}</div>
                      <div className="text-sm text-white/70 font-medium">Ассисты</div>
                    </div>
                    <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-4xl font-black text-yellow-400 mb-2">{playerStats?.yellow_cards || 0}</div>
                      <div className="text-sm text-white/70 font-medium">Жёлтые карточки</div>
                    </div>
                    <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-4xl font-black text-red-400 mb-2">{playerStats?.red_cards || 0}</div>
                      <div className="text-sm text-white/70 font-medium">Красные карточки</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


