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
import Image from 'next/image';

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

const positionLabels = {
  GK: 'Вратари',
  DF: 'Защитники', 
  MF: 'Полузащитники',
  FW: 'Нападающие'
};

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
              <div className="relative w-48 h-40 lg:w-48 lg:h-48 bg-brand-primary/20 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center">
                {club?.logo ? (
                  <Image src={getImageUrl(club.logo)} alt={club.name} fill className="object-cover" />
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
                  {club.city}
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
                
                {club.founded && (
                  <div className="text-white/80 text-lg">
                    Основан: {club.founded}
                  </div>
                )}
              </div>
              
              {coaches && coaches.length > 0 && (
                <div className="text-white/80 text-lg">
                  Тренер: {coaches[0].first_name} {coaches[0].last_name}
                </div>
              )}
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
            { id: 'squad', label: 'Состав', icon: Users },
            { id: 'matches', label: 'Матчи', icon: Calendar },
            { id: 'management', label: 'Руководство', icon: Crown }
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
              <tab.icon className="w-5 h-5 mr-2" />
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
                const IconComponent = positionIcons[position as keyof typeof positionIcons];
                const isExpanded = expandedSections[position];
                
                return (
                  <div key={position} className="card p-6">
                    <button
                      onClick={() => toggleSection(position)}
                      className="w-full flex items-center justify-between text-left mb-4"
                    >
                      <div className="flex items-center">
                        <IconComponent className="w-6 h-6 mr-3 text-brand-primary" />
                        <h3 className="text-2xl font-bold text-white">
                          {positionLabels[position as keyof typeof positionLabels]}
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
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                          {positionPlayers.map((player) => (
                            <motion.div
                              key={player.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedPlayer(player)}
                              className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer border-l-4 border-brand-primary"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-primary/20 flex items-center justify-center">
                                  {player.photo ? (
                                    <Image src={getImageUrl(player.photo)} alt={`${player.first_name} ${player.last_name}`} width={80} height={80} className="w-20 h-20 object-cover" />
                                  ) : (
                                    <User className="w-6 h-6 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-white">
                                    {player.first_name} {player.last_name}
                                  </h3>
                                  <p className="text-sm text-white/70">#{player.number}</p>
                                  <p className="text-xs text-white/50">{player.nationality}</p>
                                </div>
                              </div>
                            </motion.div>
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
                  <div className="card p-6 text-center hover:bg-white/10 transition-all duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {club.coach_full_name}
                    </h3>
                    <p className="text-brand-primary font-medium">Главный тренер</p>
                  </div>
                )}

                {/* Ассистент/Менеджер */}
                {club.assistant_full_name && (
                  <div className="card p-6 text-center hover:bg-white/10 transition-all duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {club.assistant_full_name}
                    </h3>
                    <p className="text-blue-400 font-medium">Ассистент / Менеджер</p>
                  </div>
                )}

                {/* Капитан */}
                {club.captain_full_name && (
                  <div className="card p-6 text-center hover:bg-white/10 transition-all duration-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {club.captain_full_name}
                    </h3>
                    <p className="text-yellow-400 font-medium">Капитан команды</p>
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

      {/* Player Sidebar */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 w-96 h-full bg-brand-dark border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Информация об игроке</h2>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="text-white hover:text-brand-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Player Photo */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-primary/20 flex items-center justify-center">
                    {selectedPlayer?.photo ? (
                      <Image src={getImageUrl(selectedPlayer.photo)} alt={`${selectedPlayer?.first_name} ${selectedPlayer?.last_name}`} width={96} height={96} className="w-24 h-24 object-cover" />
                    ) : (
                      <span className="text-brand-primary font-bold text-4xl">К</span>
                    )}
                  </div>
                </div>

                {/* Player Name */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">
                    {selectedPlayer.first_name} {selectedPlayer.last_name}
                  </h3>
                  <p className="text-white/70">#{selectedPlayer.number}</p>
                </div>

                {/* Player Details */}
                <div className="space-y-4">
                  <div className="card p-4">
                    <h4 className="font-semibold text-white mb-3">Основная информация</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/70">Команда:</span>
                        <span className="text-white">{club.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Позиция:</span>
                        <span className="text-white">{positionLabels[selectedPlayer.position as keyof typeof positionLabels]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Национальность:</span>
                        <span className="text-white">{selectedPlayer.nationality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Дата рождения:</span>
                        <span className="text-white">{selectedPlayer.date_of_birth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Рост:</span>
                        <span className="text-white">{selectedPlayer.height} см</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Вес:</span>
                        <span className="text-white">{selectedPlayer.weight} кг</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Статус:</span>
                        <span className="text-white">{(selectedPlayer as any).status || '—'}</span>
                      </div>
                      {(selectedPlayer as any).phone && (
                        <div className="flex justify-between">
                          <span className="text-white/70">Телефон:</span>
                          <span className="text-white">{(selectedPlayer as any).phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="card p-4">
                    <h4 className="font-semibold text-white mb-3">Статистика</h4>
                    {statsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                        <p className="text-white/70 mt-2">Загрузка статистики...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand-primary">
                            {playerStats?.matches_played || 0}
                          </div>
                          <div className="text-sm text-white/70">Матчи</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand-primary">
                            {playerStats?.minutes_played || 0}
                          </div>
                          <div className="text-sm text-white/70">Минуты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand-primary">
                            {playerStats?.goals || 0}
                          </div>
                          <div className="text-sm text-white/70">Голы</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand-primary">
                            {playerStats?.assists || 0}
                          </div>
                          <div className="text-sm text-white/70">Ассисты</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {playerStats?.yellow_cards || 0}
                          </div>
                          <div className="text-sm text-white/70">Жёлтые карточки</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {playerStats?.red_cards || 0}
                          </div>
                          <div className="text-sm text-white/70">Красные карточки</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {selectedPlayer.bio && (
                    <div className="card p-4">
                      <h4 className="font-semibold text-white mb-3">Биография</h4>
                      <p className="text-white/70 text-sm">{selectedPlayer.bio}</p>
                    </div>
                  )}

                  {/* Extra info: примечание */}
                  {(selectedPlayer as any).bio && (
                    <div className="card p-4">
                      <h4 className="font-semibold text-white mb-3">Примечание</h4>
                      <div className="text-sm text-white/80">{(selectedPlayer as any).bio}</div>
                    </div>
                  )}

                  {/* Transfer History */}
                  <div className="card p-4">
                    <h4 className="font-semibold text-white mb-3">История трансферов</h4>
                    {playerTransfers.length ? (
                      <ul className="space-y-2">
                        {playerTransfers.map(t => (
                          <li key={t.id} className="flex justify-between text-sm">
                            <span className="text-white/80">{(typeof t.from_club === 'object' ? t.from_club?.name : t.from_club) || 'Свободный агент'} → {typeof t.to_club === 'object' ? t.to_club?.name : t.to_club}</span>
                            <span className="text-white/60">{new Date(t.transfer_date).toLocaleDateString('ru-RU')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white/60 text-sm">Нет записей</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


