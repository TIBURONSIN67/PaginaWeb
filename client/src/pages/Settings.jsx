import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Store, Save, Globe, MessageCircle, Key, Shield,
  Copy, CheckCircle, ExternalLink, Upload, RefreshCw,
} from 'lucide-react';
import { settingsApi, webhookApi } from '../lib/api';

const currencies = ['USD', 'EUR', 'GBP', 'MXN', 'COP', 'ARS'];

function maskValue(val, show = 4) {
  if (!val) return '\u2014';
  if (val.length <= show * 2) return val;
  return val.slice(0, show) + '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + val.slice(-show);
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
  const webhook = webhookStatus?.data || webhookStatus || {};

  const [form, setForm] = useState(null);

  if (!form && !isLoading && settings.store_name !== undefined) {
    setForm({
      store_name: settings.store_name || '',
      phone: settings.phone || '',
      email: settings.email || '',
      address: settings.address || '',
      city: settings.city || '',
      country: settings.country || '',
      business_hours: settings.business_hours || '',
      about: settings.about || '',
      currency: settings.currency || 'USD',
      tax_percentage: settings.tax_percentage ?? 0,
      facebook: settings.facebook || '',
      instagram: settings.instagram || '',
      tiktok: settings.tiktok || '',
      website: settings.website || '',
    });
  }

  const currentForm = form || {
    store_name: '', phone: '', email: '', address: '', city: '', country: '',
    business_hours: '', about: '', currency: 'USD', tax_percentage: 0,
    facebook: '', instagram: '', tiktok: '', website: '',
  };

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const saveStoreMutation = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
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
    saveStoreMutation.mutate(currentForm);
  }

  function handleSaveSocial(e) {
    e.preventDefault();
    saveStoreMutation.mutate({
      facebook: currentForm.facebook,
      instagram: currentForm.instagram,
      tiktok: currentForm.tiktok,
      website: currentForm.website,
    });
  }

  function handleUploadLogo() {
    if (!logoFile) {
      toast.error('Please select a logo file first');
      return;
    }
    uploadLogoMutation.mutate(logoFile);
  }

  function handleCopyWebhook() {
    const url = `${window.location.origin}/api/webhook`;
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

  const whatsappConfigured = !!(webhook.phone_number_id && webhook.access_token_set);
  const webhookConnected = webhook.configured;
  const logoUrl = settings.logo_url || null;

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
                  value={currentForm.store_name}
                  onChange={(e) => updateField('store_name', e.target.value)}
                  className="input"
                  placeholder="My Store"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="text"
                  value={currentForm.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="input"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={currentForm.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="input"
                placeholder="store@example.com"
              />
            </div>

            <div>
              <label className="label">Address</label>
              <input
                type="text"
                value={currentForm.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="input"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={currentForm.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="input"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  type="text"
                  value={currentForm.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="input"
                  placeholder="Country"
                />
              </div>
            </div>

            <div>
              <label className="label">Business Hours</label>
              <input
                type="text"
                value={currentForm.business_hours}
                onChange={(e) => updateField('business_hours', e.target.value)}
                className="input"
                placeholder="Mon-Fri 9AM-6PM"
              />
            </div>

            <div>
              <label className="label">About</label>
              <textarea
                value={currentForm.about}
                onChange={(e) => updateField('about', e.target.value)}
                className="input min-h-[80px]"
                placeholder="Brief description of your store"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <select
                  value={currentForm.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
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
                  value={currentForm.tax_percentage}
                  onChange={(e) => updateField('tax_percentage', parseFloat(e.target.value) || 0)}
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
                    {maskValue(webhook.phone_number_id, 4)}
                  </p>
                </div>
                <div>
                  <label className="label">Graph API Version</label>
                  <p className="input bg-gray-50 text-sm text-gray-600">
                    {webhook.graph_api_version || '\u2014'}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">Verify Token</label>
                <p className="input bg-gray-50 text-sm text-gray-600 font-mono">
                  {webhook.verify_token_set ? 'Set' : 'Not set'}
                </p>
              </div>

              <div>
                <label className="label">Access Token</label>
                <p className="input bg-gray-50 text-sm text-gray-600 font-mono">
                  {webhook.access_token_set ? 'Configured' : 'Not configured'}
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
                      {window.location.origin}/api/webhook
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
              <h2 className="text-base font-semibold text-gray-900">AI Configuration</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">
                AI settings are managed through environment variables (AI_PROVIDER, API keys, model).
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <button type="button" className="btn-ghost">
                  <Key className="w-4 h-4" />
                  Test AI Connection
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
                  value={currentForm.facebook}
                  onChange={(e) => updateField('facebook', e.target.value)}
                  className="input"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="label">Instagram URL</label>
                <input
                  type="url"
                  value={currentForm.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                  className="input"
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>
              <div>
                <label className="label">TikTok URL</label>
                <input
                  type="url"
                  value={currentForm.tiktok}
                  onChange={(e) => updateField('tiktok', e.target.value)}
                  className="input"
                  placeholder="https://tiktok.com/@yourhandle"
                />
              </div>
              <div>
                <label className="label">Website URL</label>
                <input
                  type="url"
                  value={currentForm.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="input"
                  placeholder="https://yourstore.com"
                />
              </div>

              <div className="pt-2 border-t border-gray-50">
                <button
                  type="submit"
                  disabled={saveStoreMutation.isPending}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4" />
                  {saveStoreMutation.isPending ? 'Saving...' : 'Save Social Links'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
