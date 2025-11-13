'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Edit, 
  Save, 
  X,
  Play,
  Square,
  CheckCircle
} from 'lucide-react';

interface Club {
  id: number;
  name: string;
  short_name: string;
  logo: string;
}

interface Match {
  id: number;
  home_team: Club;
  away_team: Club;
  date: string;
  time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string;
  round: number;
}

const statusOptions = [
  { value: 'scheduled', label: 'Запланирован', color: 'text-blue-600' },
  { value: 'live', label: 'В прямом эфире', color: 'text-red-600' },
  { value: 'finished', label: 'Завершен', color: 'text-green-600' },
  { value: 'cancelled', label: 'Отменен', color: 'text-gray-600' },
  { value: 'postponed', label: 'Перенесен', color: 'text-orange-600' }
];

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editForm, setEditForm] = useState({
    home_score: '',
    away_score: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, clubsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/matches/`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/clubs/`)
      ]);

      const matchesData = await matchesRes.json();
      const clubsData = await clubsRes.json();

      setMatches(matchesData);
      setClubs(clubsData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setEditForm({
      home_score: match.home_score?.toString() || '',
      away_score: match.away_score?.toString() || '',
      status: match.status
    });
  };

  const handleSave = async () => {
    if (!editingMatch) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/matches/${editingMatch.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          home_score: editForm.home_score ? parseInt(editForm.home_score) : null,
          away_score: editForm.away_score ? parseInt(editForm.away_score) : null,
          status: editForm.status
        })
      });

      if (response.ok) {
        await fetchData();
        setEditingMatch(null);
        setEditForm({ home_score: '', away_score: '', status: 'scheduled' });
      }
    } catch (error) {
    }
  };

  const handleCancel = () => {
    setEditingMatch(null);
    setEditForm({ home_score: '', away_score: '', status: 'scheduled' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4 text-red-600" />;
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-600" />;
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Управление матчами</h1>
          <p className="text-gray-600">Контролируйте результаты и статусы матчей</p>
        </motion.div>

        <div className="space-y-4">
          {matches.map((match) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              {editingMatch?.id === match.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Редактирование матча
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Счет домашней команды
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.home_score}
                        onChange={(e) => setEditForm({ ...editForm, home_score: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Счет гостевой команды
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.away_score}
                        onChange={(e) => setEditForm({ ...editForm, away_score: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Статус матча
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Home Team */}
                    <div className="flex items-center space-x-3">
                      {match.home_team.logo ? (
                        <Image
                          src={match.home_team.logo}
                          alt={match.home_team.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800">{match.home_team.name}</h3>
                        <p className="text-sm text-gray-600">{match.home_team.short_name}</p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800 mb-1">
                        {match.home_score !== null && match.away_score !== null
                          ? `${match.home_score} - ${match.away_score}`
                          : 'vs'
                        }
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(match.status)}
                        <span className={`text-sm font-medium ${getStatusColor(match.status)}`}>
                          {statusOptions.find(opt => opt.value === match.status)?.label}
                        </span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <h3 className="font-semibold text-gray-800">{match.away_team.name}</h3>
                        <p className="text-sm text-gray-600">{match.away_team.short_name}</p>
                      </div>
                      {match.away_team.logo ? (
                        <Image
                          src={match.away_team.logo}
                          alt={match.away_team.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(match.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      {match.time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{match.time.substring(0, 5)}</span>
                        </div>
                      )}
                      {match.stadium && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{match.stadium}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleEdit(match)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {matches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Матчи не найдены</p>
          </motion.div>
        )}
      </div>
    </div>
  );
} 