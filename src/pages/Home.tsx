import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Receipt } from 'lucide-react';
import { Match, Selection } from '../types';
import { useAuth } from '../hooks/useAuth';
import { MatchCard } from '../components/MatchCard';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../hooks/useTranslation';

const MAX_DOUBLE_SELECTIONS = 4;

function Home() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selections, setSelections] = useState<Record<string, Selection[]>>({});
  const [saving, setSaving] = useState(false);
  const { tCommon, formatDateTime } = useTranslation();

  // Calculate number of matches with double selections
  const currentDoubleSelections = Object.values(selections).filter(s => s.length > 1).length;

  const handlePlaceBet = async () => {
    if (!user || Object.keys(selections).length === 0) return;
    
    try {
      setSaving(true);
      setError(null);

      // Create bet slip
      const { data: betSlip, error: betError } = await supabase
        .from('bet_slips')
        .insert({
          user_id: user.id,
          total_cost: 1, // Basic cost per coupon
          status: 'pending'
        })
        .select('id')
        .single();

      if (betError) throw betError;

      // Create bet selections
      const betSelections = Object.entries(selections).flatMap(([matchId, matchSelections]) => 
        matchSelections.map(selection => ({
          bet_slip_id: betSlip.id,
          match_id: matchId,
          selection: selection,
          odds_at_time: matches.find(m => m.id === matchId)?.odds[
            selection === '1' ? 'home' : selection === 'X' ? 'draw' : 'away'
          ] || 0
        }))
      );

      const { error: selectionsError } = await supabase
        .from('bet_selections')
        .insert(betSelections);

      if (selectionsError) throw selectionsError;

      // Clear selections after successful save
      setSelections({});
      
    } catch (err) {
      console.error('Error saving coupon:', err);
      setError('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  // Fetch existing selections when user or matches change
  useEffect(() => {
    async function fetchSelections() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_selections')
          .select('match_id, selection')
          .eq('user_id', user.id);

        if (error) throw error;
        
        if (data) {
          const selectionMap = data.reduce((acc, { match_id, selection }) => {
            if (!acc[match_id]) {
              acc[match_id] = [];
            }
            if (!acc[match_id].includes(selection)) {
              acc[match_id].push(selection as Selection);
            }
            return acc;
          }, {} as Record<string, Selection[]>);
          setSelections(selectionMap);
        }
      } catch (err) {
        console.error('Error fetching selections:', err);
      }
    }

    fetchSelections();
  }, [user, matches]);

  const handleSelectionChange = async (matchId: string, newSelections: Selection[]) => {
    if (!user) return;

    setError(null);

    setError(null);

    try {
      if (newSelections.length === 0) {
        // Remove selection
        const { error: deleteError } = await supabase
          .from('user_selections')
          .delete()
          .eq('user_id', user.id)
          .eq('match_id', matchId);

        if (deleteError) throw deleteError;
        
        setSelections(prev => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
      } else {
        // Delete all existing selections for this match
        const { error: deleteError } = await supabase
          .from('user_selections')
          .delete()
          .eq('user_id', user.id)
          .eq('match_id', matchId);

        if (deleteError) throw deleteError;
        
        // Insert new selections one by one
        const { error: insertError } = await supabase
          .from('user_selections')
          .insert(newSelections.map(selection => ({
            user_id: user.id,
            match_id: matchId,
            selection
          })));

        if (insertError) {
          throw insertError;
        }

        // Update local state after successful database operation
        setSelections(prev => ({
          ...prev,
          [matchId]: newSelections
        }));
      }
    } catch (err) {
      console.error('Error saving selection:', err);
      setError('Failed to save selection');
      // Revert local state on error
      setSelections(prev => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setError('Database connection not configured. Please click the "Connect to Supabase" button to set up your database.');
        return;
      }

      setError(null);

      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .order('event_number', { ascending: true });

      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        setError('No matches available. Please use the Admin panel to sync match data.');
        setMatches([]);
        return;
      }

      const formattedMatches: Match[] = data.map(match => ({
        id: match.id,
        eventNumber: match.event_number,
        homeTeam: match.home_team,
        home_team_medium_name: match.home_team_medium_name,
        awayTeam: match.away_team,
        away_team_medium_name: match.away_team_medium_name,
        datetime: match.match_time,
        odds: {
          home: match.home_odds,
          draw: match.draw_odds,
          away: match.away_odds
        },
        statistics: {
          homeForm: match.home_form || '',
          awayForm: match.away_form || '',
          headToHead: match.head_to_head || ''
        }
      }));

      setMatches(formattedMatches);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (!loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{tCommon('noMatches')}</h2>
          <p className="text-gray-600 mb-4">{error || tCommon('noMatches')}</p>
          <button
            onClick={fetchMatches}
            className="flex items-center justify-center space-x-2 mx-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{tCommon('refresh')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stryktipset</h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {tCommon('lastUpdated')}: {formatDateTime(lastUpdated)}
          </p>
          <button
            onClick={fetchMatches}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {tCommon('refresh')}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} 
            selections={selections[match.id] || []}
            onSelectionChange={(newSelections) => handleSelectionChange(match.id, newSelections)}
            maxDoubleSelections={MAX_DOUBLE_SELECTIONS}
            currentDoubleSelections={currentDoubleSelections}
          />
        ))}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg transform transition-transform">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handlePlaceBet}
            disabled={Object.keys(selections).length === 0 || saving}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
              flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            {saving ? 'Saving...' : `Place Bet (${Object.values(selections).flat().length} selections)`}
          </button>
        </div>
      </div>
      
      {/* Add padding to prevent content from being hidden behind fixed button */}
      <div className="h-24" />
    </div>
  );
}

export { Home };