import React, { useState, useEffect } from 'react';
import { Mail, Save, RefreshCw, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  reply_to: string | null;
  use_ssl: boolean;
}

export function EmailConfig() {
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    reply_to: '',
    use_ssl: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_config')
        .select('*')
        .single();

      if (fetchError) {
        if (fetchError.code !== 'PGRST116') { // Not found error
          throw fetchError;
        }
      } else if (data) {
        setConfig({
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          smtp_user: data.smtp_user,
          smtp_password: '', // Don't show stored password
          from_email: data.from_email,
          from_name: data.from_name,
          reply_to: data.reply_to,
          use_ssl: data.smtp_port === 465
        });
      }
    } catch (err) {
      console.error('Error fetching email config:', err);
      setError('Failed to load email configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateConfig = () => {
    if (!config.smtp_host.trim()) {
      throw new Error('SMTP Server Address is required');
    }
    if (!config.smtp_port || config.smtp_port < 1 || config.smtp_port > 65535) {
      throw new Error('Invalid SMTP Port');
    }
    if (!config.smtp_user.trim()) {
      throw new Error('SMTP Username is required');
    }
    if (!config.from_email.trim()) {
      throw new Error('From Email Address is required');
    }
    if (!config.from_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid From Email Address format');
    }
    if (config.reply_to && !config.reply_to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid Reply-to Email Address format');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      validateConfig();

      const configData = {
        id: '00000000-0000-0000-0000-000000000000',
        smtp_host: config.smtp_host,
        smtp_port: config.use_ssl ? 465 : 587,
        smtp_user: config.smtp_user,
        from_email: config.from_email,
        from_name: config.from_name,
        reply_to: config.reply_to || null,
        updated_at: new Date().toISOString()
      };

      // Only include password if it was changed
      if (config.smtp_password) {
        configData['smtp_password'] = config.smtp_password;
      }

      const { error: upsertError } = await supabase
        .from('email_config')
        .upsert(configData);

      if (upsertError) throw upsertError;

      setSuccess('Email configuration saved successfully');
      await fetchConfig(); // Refresh the form
    } catch (err) {
      console.error('Error saving email config:', err);
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      validateConfig();

      const { error: testError } = await supabase
        .rpc('test_email_connection', {
          test_host: config.smtp_host,
          test_port: config.use_ssl ? 465 : 587,
          test_user: config.smtp_user,
          test_password: config.smtp_password || null
        });

      if (testError) throw testError;

      setSuccess('Email connection test successful');
    } catch (err) {
      console.error('Error testing email connection:', err);
      setError(`Connection test failed: ${(err as Error).message}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Mail className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-bold">Email Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Server Address
            </label>
            <input
              type="text"
              id="smtp_host"
              value={config.smtp_host}
              onChange={(e) => setConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="smtp.example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Port
            </label>
            <input
              type="number"
              id="smtp_port"
              value={config.use_ssl ? 465 : 587}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              disabled
            />
          </div>

          <div>
            <label htmlFor="smtp_user" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Username
            </label>
            <input
              type="text"
              id="smtp_user"
              value={config.smtp_user}
              onChange={(e) => setConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="username@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="smtp_password"
                value={config.smtp_password}
                onChange={(e) => setConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave blank to keep existing password"
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="from_email" className="block text-sm font-medium text-gray-700 mb-1">
              From Email Address
            </label>
            <input
              type="email"
              id="from_email"
              value={config.from_email}
              onChange={(e) => setConfig(prev => ({ ...prev, from_email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="noreply@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="from_name" className="block text-sm font-medium text-gray-700 mb-1">
              From Name
            </label>
            <input
              type="text"
              id="from_name"
              value={config.from_name}
              onChange={(e) => setConfig(prev => ({ ...prev, from_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Stryktipset"
              required
            />
          </div>

          <div>
            <label htmlFor="reply_to" className="block text-sm font-medium text-gray-700 mb-1">
              Reply-to Address
            </label>
            <input
              type="email"
              id="reply_to"
              value={config.reply_to || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, reply_to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="support@example.com"
            />
          </div>

          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.use_ssl}
                onChange={(e) => setConfig(prev => ({ ...prev, use_ssl: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">Enable SSL/TLS</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
            {success}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            type="submit"
            disabled={saving || testing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}