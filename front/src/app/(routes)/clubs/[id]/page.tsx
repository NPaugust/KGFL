'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  ChevronRight
} from 'lucide-react';
import { useClub } from '@/hooks/useClubs';
import { useApi } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/services/api';
import { Breadcrumbs } from '@/components/Breadcrumbs';

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
  const { club, loading: clubLoading, error: clubError } = useClub(params.id as string);
  
  const { data: players, loading: playersLoading } = useApi<Player[]>(
    API_ENDPOINTS.CLUB_PLAYERS(params.id as string)
  );
  
  const { data: matches, loading: matchesLoading } = useApi<Match[]>(
    API_ENDPOINTS.CLUB_MATCHES(params.id as string)
  );
  
  const { data: coaches, loading: coachesLoading } = useApi<Coach[]>(
    `${API_ENDPOINTS.COACHES}?club_id=${params.id}`
  );
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<'squad' | 'matches' | 'management'>('squad');
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
              <div className="w-32 h-32 lg:w-40 lg:h-40 bg-brand-primary/20 rounded-2xl shadow-lg flex items-center justify-center">
                <span className="text-brand-primary font-bold text-4xl">К</span>
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
                
                {club.stadium && (
                  <div className="text-white/80 text-lg">
                    {club.stadium}
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
                                <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-white" />
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
              className="space-y-4"
            >
              {matches && matches.length > 0 ? (
                matches.map((match) => (
                  <div key={match.id} className="card p-4 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-white">{match.home_team.name}</h3>
                          <p className="text-sm text-white/70">{match.home_team.short_name}</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">
                            {match.home_score !== null && match.away_score !== null
                              ? `${match.home_score} - ${match.away_score}`
                              : 'vs'
                            }
                          </div>
                          <p className="text-sm text-white/70">{new Date(match.date).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <div className="text-right">
                          <h3 className="font-semibold text-white">{match.away_team.name}</h3>
                          <p className="text-sm text-white/70">{match.away_team.short_name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70">Матчи не найдены</p>
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
              className="space-y-4"
            >
              {coaches && coaches.length > 0 ? (
                coaches.map((coach) => (
                  <div key={coach.id} className="card p-4 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {coach.first_name} {coach.last_name}
                        </h3>
                        <p className="text-white/70">{coach.nationality}</p>
                        {coach.bio && (
                          <p className="text-sm text-white/50 mt-2">{coach.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Crown className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70">Руководство не найдено</p>
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
                  <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-4xl">К</span>
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
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="card p-4">
                    <h4 className="font-semibold text-white mb-3">Статистика</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-primary">0</div>
                        <div className="text-sm text-white/70">Матчи</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-primary">0</div>
                        <div className="text-sm text-white/70">Минуты</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-primary">0</div>
                        <div className="text-sm text-white/70">Голы</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-primary">0</div>
                        <div className="text-sm text-white/70">Ассисты</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">0</div>
                        <div className="text-sm text-white/70">Жёлтые карточки</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">0</div>
                        <div className="text-sm text-white/70">Красные карточки</div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedPlayer.bio && (
                    <div className="card p-4">
                      <h4 className="font-semibold text-white mb-3">Биография</h4>
                      <p className="text-white/70 text-sm">{selectedPlayer.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


