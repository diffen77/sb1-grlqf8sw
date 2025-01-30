import React from 'react';
import { Trophy, Check, AlertCircle } from 'lucide-react';
import { Match, Selection } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface MatchCardProps {
  match: Match;
  selections: Selection[];
  onSelectionChange: (selections: Selection[]) => void;
  maxDoubleSelections: number;
  currentDoubleSelections: number;
}

export function MatchCard({ 
  match, 
  selections, 
  onSelectionChange,
  maxDoubleSelections,
  currentDoubleSelections
}: MatchCardProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelection = async (newSelection: Selection) => {
    if (!user) {
      setError('Please sign in to make selections');
      return;
    }

    const isSelected = selections.includes(newSelection);
    
    if (isSelected) {
      // Remove the selection
      onSelectionChange(selections.filter(s => s !== newSelection));
    } else {
      // Check if we can add another selection
      if (selections.length === 0) {
        // First selection is always allowed
        onSelectionChange([newSelection]);
      } else if (selections.length === 1) {
        // Second selection is only allowed if we haven't reached the max double selections
        if (currentDoubleSelections < maxDoubleSelections) {
          onSelectionChange([...selections, newSelection]);
        } else {
          setError(`Maximum of ${maxDoubleSelections} matches can have double selections`);
        }
      } else {
        // Can't add more than 2 selections per match
        setError('Maximum of 2 selections per match');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Trophy className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-bold text-lg">#{match.eventNumber}</span>
          <span className="text-sm text-gray-500">
            {new Date(match.datetime).toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold" title={t('homeTeam')}>
              <span className="hidden md:inline">{match.homeTeam}</span>
              <span className="md:hidden">{match.home_team_medium_name || match.homeTeam}</span>
            </h3>
            <h3 className="font-semibold" title={t('awayTeam')}>
              <span className="hidden md:inline">{match.awayTeam}</span>
              <span className="md:hidden">{match.away_team_medium_name || match.awayTeam}</span>
            </h3>
          </div>
          
          <div className="flex gap-2">
            {['1', 'X', '2'].map((label) => (
              <button
                key={label}
                onClick={() => handleSelection(label as Selection)}
                disabled={loading}
                className={`w-20 h-20 rounded-lg flex flex-col items-center justify-center relative
                  ${selections.includes(label as Selection)
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow transition-all'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="font-bold text-lg mb-1">{label}</span>
                {selections.includes(label as Selection) && (
                  <Check className="w-4 h-4 absolute top-1 right-1" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {selections.length > 0 && (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
            Selected: {selections.join(', ')}
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}