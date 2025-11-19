import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Trash2, 
  Eye, 
  MousePointer, 
  BarChart3,
  Upload,
  Link,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Ad {
  id: number;
  title: string;
  image_url: string;
  target_url: string;
  click_count: number;
  view_count: number;
  max_clicks?: number;
  max_views?: number;
  expiry_date?: string;
  status: string;
  created_at: string;
  priority: number;
}

interface Statistics {
  total_ads: number;
  active_ads: number;
  completed_ads: number;
  total_clicks: number;
  total_views: number;
  top_performing: Array<{
    id: number;
    title: string;
    clicks: number;
    views: number;
    ctr: number;
  }>;
}

const AdminAdsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ads' | 'stats' | 'add'>('ads');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    target_url: '',
    max_clicks: '',
    max_views: '',
    duration_hours: '',
    priority: '0',
    image: null as File | null
  });

  // التحقق من الأدمن
  useEffect(() => {
    const ADMIN_IDS = [6213708507, 1437352242];
    if (!user || !ADMIN_IDS.includes(Number(user.id))) {
      navigate('/');
    }
  }, [user, navigate]);

  // جلب البيانات
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // جلب الإعلانات
      const adsResponse = await fetch('https://www.channelsseller.site/api/ads/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (adsResponse.ok) {
        const adsData = await adsResponse.json();
        setAds(adsData.ads || []);
      }

      // جلب الإحصائيات
      const statsResponse = await fetch('https://www.channelsseller.site/api/ads/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.statistics);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // رفع الإعلان
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.image) {
      setError('Please select an image');
      return;
    }

    if (!formData.title || !formData.target_url) {
      setError('Title and target URL are required');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('target_url', formData.target_url);
    formDataToSend.append('image', formData.image);
    
    if (formData.max_clicks) {
      formDataToSend.append('max_clicks', formData.max_clicks);
    }
    if (formData.max_views) {
      formDataToSend.append('max_views', formData.max_views);
    }
    if (formData.duration_hours) {
      formDataToSend.append('duration_hours', formData.duration_hours);
    }
    formDataToSend.append('priority', formData.priority);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('https://www.channelsseller.site/api/ads/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Ad added successfully!');
        setFormData({
          title: '',
          target_url: '',
          max_clicks: '',
          max_views: '',
          duration_hours: '',
          priority: '0',
          image: null
        });
        fetchData(); // إعادة جلب البيانات
        setActiveTab('ads');
      } else {
        setError(data.detail || 'Failed to add ad');
      }
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  };

  // حذف إعلان
  const handleDelete = async (adId: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://www.channelsseller.site/api/ads/${adId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Ad deleted successfully');
        fetchData();
      } else {
        setError('Failed to delete ad');
      }
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  };

  // معالجة الصورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من الحجم (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // التحقق من النوع
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Invalid image format. Use JPEG, PNG, GIF or WebP');
        return;
      }

      setFormData({ ...formData, image: file });
      setError(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ads Management</h1>
          <p className="text-gray-600">Manage banner advertisements</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('ads')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'ads'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Current Ads ({ads.length})
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add New Ad
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Current Ads Tab */}
            {activeTab === 'ads' && (
              <div className="space-y-4">
                {ads.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No ads found</p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add First Ad
                    </button>
                  </div>
                ) : (
                  ads.map((ad) => (
                    <div key={ad.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{ad.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              ad.status === 'active' 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ad.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{ad.view_count} views</span>
                              {ad.max_views && (
                                <span className="text-gray-400">/ {ad.max_views}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointer className="w-4 h-4" />
                              <span>{ad.click_count} clicks</span>
                              {ad.max_clicks && (
                                <span className="text-gray-400">/ {ad.max_clicks}</span>
                              )}
                            </div>
                            {ad.expiry_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>Expires: {new Date(ad.expiry_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>Priority: {ad.priority}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Link className="w-4 h-4 text-gray-400" />
                            <a 
                              href={ad.target_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate max-w-md"
                            >
                              {ad.target_url}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <img 
                            src={`https://www.channelsseller.site${ad.image_url}`}
                            alt={ad.title}
                            className="w-32 h-24 object-cover rounded border border-gray-200"
                          />
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && statistics && (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">Total Ads</p>
                    <p className="text-2xl font-bold text-blue-900">{statistics.total_ads}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-900">{statistics.active_ads}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.completed_ads}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 mb-1">Total Views</p>
                    <p className="text-2xl font-bold text-purple-900">{statistics.total_views}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 mb-1">Total Clicks</p>
                    <p className="text-2xl font-bold text-orange-900">{statistics.total_clicks}</p>
                  </div>
                </div>

                {/* Top Performing Ads */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Top Performing Ads</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ad Title</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Views</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Clicks</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">CTR %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {statistics.top_performing.map((ad) => (
                          <tr key={ad.id} className="hover:bg-white">
                            <td className="px-4 py-3 text-sm">{ad.title}</td>
                            <td className="px-4 py-3 text-sm text-center">{ad.views}</td>
                            <td className="px-4 py-3 text-sm text-center">{ad.clicks}</td>
                            <td className="px-4 py-3 text-sm text-center font-medium">
                              <span className={`px-2 py-1 rounded ${
                                ad.ctr > 5 ? 'bg-green-100 text-green-700' :
                                ad.ctr > 2 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {ad.ctr}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Add New Ad Tab */}
            {activeTab === 'add' && (
              <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter ad title"
                      required
                    />
                  </div>

                  {/* Target URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target URL *
                    </label>
                    <input
                      type="url"
                      value={formData.target_url}
                      onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Image * (Recommended: 2500×470px)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleImageChange}
                              required
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, WebP up to 5MB
                        </p>
                        {formData.image && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ {formData.image.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Max Clicks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Clicks (optional)
                      </label>
                      <input
                        type="number"
                        value={formData.max_clicks}
                        onChange={(e) => setFormData({ ...formData, max_clicks: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Unlimited"
                        min="1"
                      />
                    </div>

                    {/* Max Views */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Views (optional)
                      </label>
                      <input
                        type="number"
                        value={formData.max_views}
                        onChange={(e) => setFormData({ ...formData, max_views: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Unlimited"
                        min="1"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration in Hours (optional)
                      </label>
                      <input
                        type="number"
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Unlimited"
                        min="1"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="0">Normal</option>
                        <option value="1">High</option>
                        <option value="2">Very High</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ads')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Ad
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAdsPage;
