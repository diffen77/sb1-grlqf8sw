import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Filter, RefreshCw, AlertCircle, Trophy, Calendar, Clock, Trash2 } from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  eventNumber: number;
}

export function Predictions() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [eliminatedMatches, setEliminatedMatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleToggleElimination = (matchId: string) => {
    if (eliminatedMatches.includes(matchId)) {
      setEliminatedMatches(prev => prev.filter(id => id !== matchId));
    } else if (eliminatedMatches.length < 13) {
      setEliminatedMatches(prev => [...prev, matchId]);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .order('event_number', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedMatches: Match[] = data.map(match => ({
        id: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        datetime: match.match_time,
        eventNumber: match.event_number
      }));

      setMatches(formattedMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-gray-600">Loading matches...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Match Elimination</h1>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="text-sm text-gray-500">Matches to Eliminate</div>
          <div className="text-2xl font-bold text-blue-600">{eliminatedMatches.length} / 13</div>
        </div>

        {eliminatedMatches.length === 13 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6">
            You have selected all 13 matches to eliminate!
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {matches.map((match) => (
          <div 
            key={match.id} 
            className={`bg-white rounded-lg shadow-sm p-4 transition-all ${
              eliminatedMatches.includes(match.id) 
                ? 'border-2 border-red-500 bg-red-50' 
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-blue-600" />
                <span className="font-bold">#{match.eventNumber}</span>
                <span className="text-sm text-gray-600">
                  {new Date(match.datetime).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleToggleElimination(match.id)}
                disabled={eliminatedMatches.length >= 13 && !eliminatedMatches.includes(match.id)}
                className={`p-2 rounded-lg transition-colors ${
                  eliminatedMatches.includes(match.id)
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : eliminatedMatches.length >= 13
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {match.homeTeam} vs {match.awayTeam}
              </h3>
            </div>
          </div>
        ))}

        {matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">No matches found</div>
            <div className="text-sm text-gray-500">
              Please wait while we load the matches
            </div>
          </div>
        )}
      </div>
    </div>
  );
}