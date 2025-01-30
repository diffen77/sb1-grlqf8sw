import React, { useState, useEffect } from 'react';
import {
  Table,
  ArrowUpDown,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Settings,
  Grip
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { handleError } from '../../lib/errorHandler';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_time: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  home_form: string | null;
  away_form: string | null;
  head_to_head: string | null;
  display_order: number;
  visible: boolean;
  updated_at: string;
}

interface ColumnConfig {
  field: keyof Match;
  label: string;
  visible: boolean;
}

export function MatchManagement() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Match>('display_order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Match>>({});
  const [filters, setFilters] = useState<Partial<Match>>({});
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { field: 'display_order', label: 'Order', visible: true },
    { field: 'home_team', label: 'Home Team', visible: true },
    { field: 'away_team', label: 'Away Team', visible: true },
    { field: 'match_time', label: 'Match Time', visible: true },
    { field: 'home_odds', label: 'Home Odds', visible: true },
    { field: 'draw_odds', label: 'Draw Odds', visible: true },
    { field: 'away_odds', label: 'Away Odds', visible: true },
    { field: 'home_form', label: 'Home Form', visible: false },
    { field: 'away_form', label: 'Away Form', visible: false },
    { field: 'head_to_head', label: 'Head to Head', visible: false },
    { field: 'visible', label: 'Visible', visible: true },
    { field: 'updated_at', label: 'Last Updated', visible: true }
  ]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (fetchError) throw fetchError;
      setMatches(data || []);
    } catch (err) {
      handleError(err, { context: 'fetchMatches' });
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [sortField, sortDirection]);

  const handleSort = (field: keyof Match) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match.id);
    setEditData(match);
  };

  const handleSave = async () => {
    try {
      if (!editingMatch || !editData) return;

      const { error: updateError } = await supabase
        .from('matches')
        .update(editData)
        .eq('id', editingMatch);

      if (updateError) throw updateError;

      setEditingMatch(null);
      setEditData({});
      await fetchMatches();
    } catch (err) {
      handleError(err, { context: 'handleSave' });
      setError('Failed to update match');
    }
  };

  const handleVisibilityToggle = async (match: Match) => {
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ visible: !match.visible })
        .eq('id', match.id);

      if (updateError) throw updateError;
      await fetchMatches();
    } catch (err) {
      handleError(err, { context: 'handleVisibilityToggle' });
      setError('Failed to update match visibility');
    }
  };

  const handleOrderChange = async (match: Match, newOrder: number) => {
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ display_order: newOrder })
        .eq('id', match.id);

      if (updateError) throw updateError;
      await fetchMatches();
    } catch (err) {
      handleError(err, { context: 'handleOrderChange' });
      setError('Failed to update match order');
    }
  };

  const isMatchClosed = (match: Match) => {
    const regCloseTime = new Date(match.match_time);
    regCloseTime.setHours(regCloseTime.getHours() - 1); // Close 1 hour before match
    return new Date() > regCloseTime;
  };

  const filteredMatches = matches.filter(match => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const matchValue = match[key as keyof Match];
      if (typeof matchValue === 'string') {
        return matchValue.toLowerCase().includes(value.toString().toLowerCase());
      }
      return matchValue === value;
    });
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Table className="w-6 h-6 mr-2" />
            Match Management
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowColumnConfig(!showColumnConfig)}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Filter teams..."
              className="px-3 py-2 border border-gray-300 rounded-lg"
              onChange={e => setFilters(prev => ({ ...prev, home_team: e.target.value }))}
            />
            <button
              onClick={() => setFilters({})}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showColumnConfig && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Visible Columns</h3>
            <div className="grid grid-cols-3 gap-2">
              {columnConfig.map(column => (
                <label key={column.field} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => {
                      setColumnConfig(prev =>
                        prev.map(c =>
                          c.field === column.field ? { ...c, visible: !c.visible } : c
                        )
                      );
                    }}
                    className="rounded border-gray-300"
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columnConfig
                  .filter(column => column.visible)
                  .map(column => (
                    <th
                      key={column.field}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(column.field)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        <ArrowUpDown className="w-4 h-4 ml-1" />
                      </div>
                    </th>
                  ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMatches.map(match => (
                <tr key={match.id} className={isMatchClosed(match) ? 'bg-gray-50' : ''}>
                  {columnConfig
                    .filter(column => column.visible)
                    .map(column => (
                      <td key={column.field} className="px-6 py-4 whitespace-nowrap">
                        {editingMatch === match.id ? (
                          column.field === 'display_order' ? (
                            <input
                              type="number"
                              value={editData[column.field] || ''}
                              onChange={e =>
                                setEditData(prev => ({
                                  ...prev,
                                  [column.field]: parseInt(e.target.value)
                                }))
                              }
                              className="w-20 px-2 py-1 border rounded"
                            />
                          ) : column.field === 'visible' ? (
                            <input
                              type="checkbox"
                              checked={editData[column.field] as boolean}
                              onChange={e =>
                                setEditData(prev => ({
                                  ...prev,
                                  [column.field]: e.target.checked
                                }))
                              }
                              className="rounded border-gray-300"
                            />
                          ) : (
                            <input
                              type={column.field.includes('odds') ? 'number' : 'text'}
                              value={editData[column.field] || ''}
                              onChange={e =>
                                setEditData(prev => ({
                                  ...prev,
                                  [column.field]: e.target.value
                                }))
                              }
                              className="w-full px-2 py-1 border rounded"
                            />
                          )
                        ) : column.field === 'visible' ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              match[column.field]
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {match[column.field] ? 'Visible' : 'Hidden'}
                          </span>
                        ) : (
                          <div className="flex items-center">
                            {column.field === 'display_order' && (
                              <Grip className="w-4 h-4 mr-2 text-gray-400" />
                            )}
                            {match[column.field]}
                          </div>
                        )}
                      </td>
                    ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {editingMatch === match.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMatch(null);
                              setEditData({});
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleVisibilityToggle(match)}
                            className={`${
                              match.visible
                                ? 'text-green-600 hover:text-green-900'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {match.visible ? (
                              <Eye className="w-5 h-5" />
                            ) : (
                              <EyeOff className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(match)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}