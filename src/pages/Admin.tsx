import React, { useState, useEffect } from 'react';
import { Construction, Save, RefreshCw, AlertCircle, CheckCircle2, Clock, Database, AlertTriangle } from 'lucide-react';
import { EmailConfig } from '../components/EmailConfig';
import { MatchManagement } from './Admin/MatchManagement';
import { InviteUsers } from '../components/InviteUsers';
import { supabase } from '../lib/supabase';
import { withRetry } from '../lib/retry';
import { handleError } from '../lib/errorHandler';
import { getCurrentDraw, syncDraw } from '../lib/api/draws';
import { validateApiUrl } from '../lib/validation';

interface SyncError {
  timestamp: string;
  errorCode: string;
  message: string;
  source: string;
  destination: string;
  transactionId: string;
  affectedRecords: number;
  systemState: {
    apiUrl: string;
    lastSync: string | null;
    authenticated: boolean;
    adminUser: boolean;
  };
  context: Record<string, any>;
}

interface SyncStats {
  added: number;
  updated: number;
  drawStatus: 'created' | 'exists';
  unchanged: number;
  errors: number;
  errorLog?: SyncError;
}

interface ApiMatch {
  id: string;
  home_team: string;
  away_team: string;
  match_time: string;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  home_form?: string;
  away_form?: string;
  head_to_head?: string;
  updated_at: string;
}

function isValidMatch(match: any): match is ApiMatch {
  return (
    typeof match === 'object' &&
    match !== null &&
    typeof match.id === 'string' &&
    typeof match.home_team === 'string' &&
    typeof match.away_team === 'string' &&
    typeof match.match_time === 'string' &&
    typeof match.home_odds === 'number' &&
    typeof match.draw_odds === 'number' &&
    typeof match.away_odds === 'number' &&
    typeof match.updated_at === 'string' &&
    (!match.home_form || typeof match.home_form === 'string') &&
    (!match.away_form || typeof match.away_form === 'string') &&
    (!match.head_to_head || typeof match.head_to_head === 'string')
  );
}

function Admin() {
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Clear error and message when component unmounts
  useEffect(() => {
    return () => {
      setError(null);
      setMessage(null);
    };
  }, []);

  useEffect(() => {
    fetchApiConfig();
  }, []);

  const fetchApiConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        setError('Please sign in to access the admin panel');
        setLoading(false);
        return;
      }
      
      // First check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('api_config').select('api_url, last_updated').maybeSingle();

      if (fetchError) throw fetchError;
      if (data) {
        setApiUrl(data.api_url);
        setLastSync(data.last_updated);
      } else {
        setApiUrl('');
        setLastSync(null);
      }
    } catch (err) {
      handleError(err, { context: 'fetchApiConfig' });
      setError('Failed to load API configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        setError('Please sign in to access the admin panel');
        return;
      }
      
      // Check admin status first
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }

      setSaving(true);
      setError(null);
      setMessage(null);

      // Try to get existing config
      const { data: existingConfig, error: configError } = await supabase
        .from('api_config')
        .select('id')
        .single();

      if (configError) throw configError;

      if (existingConfig) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('api_config')
          .update({ api_url: apiUrl, last_updated: new Date().toISOString() })
          .eq('id', existingConfig.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('api_config')
          .insert({ api_url: apiUrl });

        if (insertError) throw insertError;
      }
      
      setMessage('API URL updated successfully');
    } catch (err) {
      handleError(err, { context: 'handleSubmit' });
      setError('Failed to update API configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      if (!apiUrl) {
        setError('Please configure an API URL first');
        return;
      }

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        setError('Please sign in to access the admin panel');
        return;
      }
      
      // Check admin status first
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }

      setSyncing(true);
      setError(null);
      setMessage(null);
      setShowErrorDetails(false);
      setSyncStats(null);

      const transactionId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Fetch matches from external API
      let currentDraw;
      try {
        // Get current draw from API
        currentDraw = await getCurrentDraw(apiUrl);
        
        // Sync draw and matches
        const result = await syncDraw(currentDraw);
        
        setSyncStats({
          added: result.matchesAdded,
          updated: result.matchesUpdated,
          unchanged: 0,
          drawStatus: result.status,
          errors: 0
        });

        setMessage(
          result.status === 'created'
            ? `Draw for week ${currentDraw.weekNumber}/${currentDraw.year} created successfully`
            : `Draw for week ${currentDraw.weekNumber}/${currentDraw.year} already exists`
        );

      // Update last sync time
      if (result.matchesAdded > 0 || result.matchesUpdated > 0) {
        const { data: configData, error: configError } = await supabase
          .from('api_config').select('id').single();

        if (!configError && configData) {
          const { error: syncUpdateError } = await supabase
            .from('api_config')
            .update({ last_updated: new Date().toISOString() })
            .eq('id', configData.id);

          if (syncUpdateError) throw syncUpdateError;
        }
      }
      fetchApiConfig(); // Refresh last sync time
      } catch (err) {
        const errorLog: SyncError = {
          timestamp: new Date().toISOString(),
          errorCode: 'SYNC_FAILURE',
          message: (err as Error).message,
          source: apiUrl,
          destination: 'Supabase',
          transactionId,
          affectedRecords: 0,
          systemState: {
            apiUrl,
            lastSync,
            authenticated: !!session,
            adminUser: true
          },
          context: {
            error: err instanceof Error ? {
              name: err.name,
              message: err.message,
              stack: err.stack
            } : err
          }
        };
        setSyncStats({ added: 0, updated: 0, unchanged: 0, errors: 1, errorLog });
        throw new Error(`API Error: ${(err as Error).message}`);
      }
    } catch (err) {
      handleError(err, { 
        context: 'handleSync',
        apiUrl,
        lastSync 
      });
      setError(`Synchronization failed: ${(err as Error).message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-xl p-8">
        {error === 'Access denied. Admin privileges required.' ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <Construction className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Admin Panel
              </h1>
              <p className="text-lg text-gray-600">
                Configure match data source
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <div className="relative">
                  <input
                  id="apiUrl"
                  type="url"
                  value={apiUrl}
                  onChange={(e) => {
                    setApiUrl(e.target.value);
                    try {
                      validateApiUrl(e.target.value);
                      setApiError(null);
                    } catch (err) {
                      setApiError((err as Error).message);
                    }
                  }}
                  placeholder="https://api.example.com/matches"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    apiError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  />
                  {apiError && (
                    <p className="mt-1 text-sm text-red-600">{apiError}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Last synchronized:</span>
                <span>{lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                  {message}
                </div>
              )}

              {syncStats && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg relative">
                    <h3 className="font-medium text-blue-900 mb-2">Sync Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Added:</span>
                        <span className="font-medium">{syncStats?.added || 0}</span>
                        {syncStats?.drawStatus === 'created' && (
                          <span className="text-green-600 text-xs">(New Draw)</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Updated:</span>
                        <span className="font-medium">{syncStats?.updated || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Unchanged:</span>
                        <span className="font-medium">{syncStats?.unchanged || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">Errors:</span>
                        <span className={`font-medium ${(syncStats?.errors || 0) > 0 ? 'text-red-600' : ''}`}>
                          {syncStats?.errors || 0}
                        </span>
                      </div>
                    </div>
                    {syncStats?.errorLog && (
                      <button
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="absolute top-2 right-2 p-1 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
                      >
                        {showErrorDetails ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>

                  {showErrorDetails && syncStats?.errorLog && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-medium text-red-900 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Error Details
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center text-red-800">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="font-medium mr-2">Timestamp:</span>
                          <span>{new Date(syncStats.errorLog.timestamp).toLocaleString()}</span>
                        </div>
                        
                        <div className="grid gap-3">
                          <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                            <div className="font-medium text-red-900 mb-1">Error Code</div>
                            <div className="font-mono text-red-800">{syncStats.errorLog.errorCode}</div>
                          </div>
                          
                          <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                            <div className="font-medium text-red-900 mb-1">Message</div>
                            <div className="text-red-800 whitespace-pre-wrap">{syncStats.errorLog.message}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                              <div className="font-medium text-red-900 mb-1">Source</div>
                              <div className="text-red-800 break-all">{syncStats.errorLog.source}</div>
                            </div>
                            
                            <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                              <div className="font-medium text-red-900 mb-1">Destination</div>
                              <div className="text-red-800">{syncStats.errorLog.destination}</div>
                            </div>
                          </div>

                          <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                            <div className="font-medium text-red-900 mb-1">Transaction ID</div>
                            <div className="font-mono text-red-800">{syncStats.errorLog.transactionId}</div>
                          </div>

                          <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                            <div className="font-medium text-red-900 mb-1">System State</div>
                            <div className="space-y-2 text-red-800">
                              <div className="flex justify-between">
                                <span>API URL:</span>
                                <span className="break-all">{syncStats.errorLog.systemState.apiUrl}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Last Sync:</span>
                                <span>{syncStats.errorLog.systemState.lastSync || 'Never'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Auth Status:</span>
                                <span>{syncStats.errorLog.systemState.authenticated ? 'Authenticated' : 'Not Authenticated'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Admin Status:</span>
                                <span>{syncStats.errorLog.systemState.adminUser ? 'Admin' : 'Not Admin'}</span>
                              </div>
                            </div>
                          </div>

                          {syncStats.errorLog.context && (
                            <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                              <div className="font-medium text-red-900 mb-1">Additional Context</div>
                              <pre className="text-red-800 text-sm overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(syncStats.errorLog.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing || !apiUrl || loading || !!apiError}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium ${
                    !apiUrl || loading || !!apiError
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Data'}
                </button>
                <button
                  type="submit"
                  disabled={saving || loading || syncing || !!apiError}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save URL'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="inline-flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span>More admin features coming soon</span>
              </div>
            </div>
          </>
        )}
            </div>
          </div>
          
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
              <InviteUsers />
              <EmailConfig />
            </div>
            <MatchManagement />
          </div>
        </div>
      </div>
    </div>
  );
}

export { Admin };