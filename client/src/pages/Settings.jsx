import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Store, Save, Globe, MessageCircle, Key, Shield,
  AlertCircle, Copy, CheckCircle, ExternalLink, Upload, RefreshCw,
} from 'lucide-react';
import { settingsApi, webhookApi } from '../lib/api';

const currencies = ['USD', 'EUR', 'GBP', 'MXN', 'COP', 'ARS'];

function maskValue(val, show = 4) {
  if (!val) return '—';
  if (val.length <= show * 2) return val;
  return val.slice(0, show) + '••••••••' + val.slice(-show);
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  const { data: webhookStatus } = useQuery({
    queryKey: ['webhook-status'],
    queryFn: webhookApi.getStatus,
  });

  const settings = settingsData?.data || settingsData || {};
  const store = settings.store || {};
  const whatsapp = settings.whatsapp || {};
  const openai = settings.openai || {};
  const social = settings.social || {};
  const webhook = webhookStatus?.data || webhookStatus || {};

  const [form, setForm] = useState(null);

  if (!form && !isLoading && settings.store) {
    setForm({
      store: {
        name: store.name || '',
        phone: store.phone || '',
        email: store.email || '',
        address: store.address || '',
        city: store.city || '',
        country: store.country || '',
        businessHours: store.businessHours || '',
        about: store.about || '',
        currency: store.currency || 'USD',
        taxPercentage: store.taxPercentage ?? 0,
      },
      social: {
        facebook: social.facebook || '',
        instagram: social.instagram || '',
        tiktok: social.tiktok || '',
        website: social.website || '',
      },
    });
  }

  const currentForm = form || {
    store: {
      name: '', phone: '', email: '', address: '', city: '', country: '',
      businessHours: '', about: '', currency: 'USD', taxPercentage: 0,
    },
    social: {
      facebook: '', instagram: '', tiktok: '', website: '',
    },
  };

  function updateStoreField(field, value) {
    setForm((prev) => ({
      ...prev,
      store: { ...prev.store, [field]: value },
    }));
  }

  function updateSocialField(field, value) {
    setForm((prev) => ({
      ...prev,
      social: { ...prev.social, [field]: value },
    }));
  }

  const saveStoreMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      toast.success('Store settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    },
  });

  const saveSocialMutation = useMutation({
    mutationFn: (data) => settingsApi.update({ social: data }),
    onSuccess: () => {
      toast.success('Social media links saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save social links');
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      toast.success('Logo uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to upload logo');
    },
  });

  const testMessageMutation = useMutation({
    mutationFn: (phone) => webhookApi.test(phone),
    onSuccess: () => {
      toast.success('Test message sent successfully');
      setTestPhone('');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to send test message');
    },
  });

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSaveStore(e) {
    e.preventDefault();
    saveStoreMutation.mutate({ store: currentForm.store });
  }

  function handleSaveSocial(e) {
    e.preventDefault();
    saveSocialMutation.mutate(currentForm.social);
  }

  function handleUploadLogo() {
    if (!logoFile) {
      toast.error('Please select a logo file first');
      return;
    }
    uploadLogoMutation.mutate(logoFile);
  }

  function handleCopyWebhook() {
    const url = webhook.webhookUrl || webhook.webhook_url || '';
    if (!url) {
      toast.error('No webhook URL available');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Webhook URL copied');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  }

  function handleTestConnection(e) {
    e.preventDefault();
    if (!testPhone || testPhone.trim().length < 8) {
      toast.error('Enter a valid phone number');
      return;
    }
    testMessageMutation.mutate(testPhone.trim());
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const whatsappConfigured = !!(whatsapp.phoneNumberId || whatsapp.phone_number_id || whatsapp.check || whatsapp.accessToken);
  const webhookConnected = webhook.connected || webhook.status === 'connected';
  const logoUrl = store.logo || store.logoUrl || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your store configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 p-5 border-b border-gray-50">
            <Store className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">Store Information</h2>
          </div>
          <form onSubmit={handleSaveStore} className="p-5 space-y-4">
            <div>
              <label className="label">Logo</label>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {(logoPreview || logoUrl) ? (
                    <img
                      src={logoPreview || logoUrl}
                      alt="Store logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="input text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={!logoFile || uploadLogoMutation.isPending}
                    className="btn-primary text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Store Name</label>
                <input
                  type="text"
                  value={currentForm.store.name}
                  onChange={(e) => updateStoreField('name', e.target.value)}
                  className="input"
                  placeholder="My Store"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="text"
                  value={currentForm.store.phone}
                  onChange={(e) => updateStoreField('phone', e.target.value)}
                  className="input"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={currentForm.store.email}
                onChange={(e) => updateStoreField('email', e.target.value)}
                className="input"
                placeholder="store@example.com"
              />
            </div>

            <div>
              <label className="label">Address</label>
              <input
                type="text"
                value={currentForm.store.address}
                onChange={(e) => updateStoreField('address', e.target.value)}
                className="input"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={currentForm.store.city}
                  onChange={(e) => updateStoreField('city', e.target.value)}
                  className="input"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  type="text"
                  value={currentForm.store.country}
                  onChange={(e) => updateStoreField('country', e.target.value)}
                  className="input"
                  placeholder="Country"
                />
              </div>
            </div>

            <div>
              <label className="label">Business Hours</label>
              <input
                type="text"
                value={currentForm.store.businessHours}
                onChange={(e) => updateStoreField('businessHours', e.target.value)}
                className="input"
                placeholder="Mon-Fri 9AM-6PM"
              />
            </div>

            <div>
              <label className="label">About</label>
              <textarea
                value={currentForm.store.about}
                onChange={(e) => updateStoreField('about', e.target.value)}
                className="input min-h-[80px]"
                placeholder="Brief description of your store"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <select
                  value={currentForm.store.currency}
                  onChange={(e) => updateStoreField('currency', e.target.value)}
                  className="input"
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tax Percentage</label>
                <input
                  type="number"
                  value={currentForm.store.taxPercentage}
                  onChange={(e) => updateStoreField('taxPercentage', parseFloat(e.target.value) || 0)}
                  className="input"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-50">
              <button
                type="submit"
                disabled={saveStoreMutation.isPending}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {saveStoreMutation.isPending ? 'Saving...' : 'Save Store Settings'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">WhatsApp Configuration</h2>
              <span className={whatsappConfigured ? 'badge-success' : 'badge-gray'}>
                {whatsappConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number ID</label>
                  <p className="input bg-gray-50 text-sm text-gray-600">
                    {maskValue(whatsapp.phoneNumberId || whatsapp.phone_number_id, 4)}
                  </p>
                </div>
                <div>
                  <label className="label">Business Account ID</label>
                  <p className="input bg-gray-50 text-sm text-gray-600">
                    {whatsapp.businessAccountId || whatsapp.business_account_id || '—'}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Verify Token</label>
                <p className="input bg-gray-50 text-sm text-gray-600 font-mono">
                  {maskValue(whatsapp.verifyToken || whatsapp.verify_token, 4)}
                </p>
              </div>

              <div>
                <label className="label">Access Token</label>
                <p className="input bg-gray-50 text-sm text-gray-600 font-mono">
                  {maskValue(whatsapp.accessToken || whatsapp.access_token, 6)}
                </p>
              </div>

              <div>
                <label className="label">Graph API Version</label>
                <p className="input bg-gray-50 text-sm text-gray-600">
                  {whatsapp.graphApiVersion || whatsapp.graph_api_version || '—'}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-50 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0">Webhook URL</label>
                    <span className={webhookConnected ? 'badge-success' : 'badge-gray'}>
                      {webhookConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <p className="input bg-gray-50 text-xs text-gray-600 font-mono truncate flex-1">
                      {webhook.webhookUrl || webhook.webhook_url || '—'}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="btn-ghost flex-shrink-0"
                      title="Copy webhook URL"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <label className="label">Test WhatsApp Connection</label>
                  <form onSubmit={handleTestConnection} className="flex gap-2">
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="input flex-1"
                      placeholder="+521234567890"
                    />
                    <button
                      type="submit"
                      disabled={testMessageMutation.isPending}
                      className="btn-primary flex-shrink-0"
                    >
                      {testMessageMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Test
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <Shield className="w-5 h-5 text-violet-600" />
              <h2 className="text-base font-semibold text-gray-900">OpenAI Configuration</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Model</label>
                <p className="input bg-gray-50 text-sm text-gray-600">
                  {openai.model || 'gpt-4o-mini'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Temperature</label>
                  <p className="input bg-gray-50 text-sm text-gray-600">
                    {openai.temperature ?? '0.7'}
                  </p>
                </div>
                <div>
                  <label className="label">Max Tokens</label>
                  <p className="input bg-gray-50 text-sm text-gray-600">
                    {openai.maxTokens || openai.max_tokens || '1024'}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Conversation Memory Size</label>
                <p className="input bg-gray-50 text-sm text-gray-600">
                  {openai.memorySize || openai.memory_size || openai.conversationMemory || '10'} messages
                </p>
              </div>

              <div>
                <label className="label">API Key</label>
                <p className="input bg-gray-50 text-sm text-gray-600 font-mono">
                  {openai.apiKeySet || openai.api_key_set ? '••••••••••••••••••••' : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  API key is stored in environment variables
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <button type="button" className="btn-ghost">
                  <Key className="w-4 h-4" />
                  Test AI Connection
                </button>
                <button type="button" className="btn-primary">
                  <Save className="w-4 h-4" />
                  Save AI Settings
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 p-5 border-b border-gray-50">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Social Media</h2>
            </div>
            <form onSubmit={handleSaveSocial} className="p-5 space-y-4">
              <div>
                <label className="label">Facebook URL</label>
                <input
                  type="url"
                  value={currentForm.social.facebook}
                  onChange={(e) => updateSocialField('facebook', e.target.value)}
                  className="input"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="label">Instagram URL</label>
                <input
                  type="url"
                  value={currentForm.social.instagram}
                  onChange={(e) => updateSocialField('instagram', e.target.value)}
                  className="input"
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>
              <div>
                <label className="label">TikTok URL</label>
                <input
                  type="url"
                  value={currentForm.social.tiktok}
                  onChange={(e) => updateSocialField('tiktok', e.target.value)}
                  className="input"
                  placeholder="https://tiktok.com/@yourhandle"
                />
              </div>
              <div>
                <label className="label">Website URL</label>
                <input
                  type="url"
                  value={currentForm.social.website}
                  onChange={(e) => updateSocialField('website', e.target.value)}
                  className="input"
                  placeholder="https://yourstore.com"
                />
              </div>

              <div className="pt-2 border-t border-gray-50">
                <button
                  type="submit"
                  disabled={saveSocialMutation.isPending}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4" />
                  {saveSocialMutation.isPending ? 'Saving...' : 'Save Social Links'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
