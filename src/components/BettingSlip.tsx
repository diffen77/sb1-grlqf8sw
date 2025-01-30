import React from 'react';
import { Receipt, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { BetSlip } from '../types';

interface BettingSlipProps {
  betSlip: BetSlip;
  cost: number;
  onRemoveSelection?: (matchId: string) => void;
}

export function BettingSlip({ betSlip, cost, onRemoveSelection }: BettingSlipProps) {
  const { tBet } = useTranslation();
  const totalSelections = Object.values(betSlip).length;

  return (
    <div className={`bg-white rounded-lg shadow-2xl p-6 w-80 border border-blue-200 
      h-[calc(100vh-6rem)] flex flex-col overflow-hidden
      ${totalSelections === 0 ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Receipt className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="font-bold text-xl">Betting Slip</h2>
        </div>
        <span className="text-sm font-medium px-2 py-1 bg-blue-50 rounded-full text-blue-600">
          {totalSelections} selections
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {totalSelections === 0 && (
          <div className="text-center text-gray-500 py-4">
            Select matches to place your bets
          </div>
        )}
        {Object.entries(betSlip).map(([matchId, selection]) => (
          <div key={matchId} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-600">Match {matchId}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium px-2 py-1 bg-white rounded-md shadow-sm border border-gray-100">
                  {tBet(selection)}
                </span>
                {onRemoveSelection && (
                  <button
                    onClick={() => onRemoveSelection(matchId)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-blue-100 pt-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold">Total Cost:</span>
          <span className="font-bold text-xl text-blue-600">${cost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}