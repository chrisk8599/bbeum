'use client';
import { useState, useEffect } from 'react';
import { servicesAPI, categoriesAPI } from '@/lib/api';
import ImageUpload from './ImageUpload';

export default function ServicesManagement({ services, onUpdate, isPro }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newServiceId, setNewServiceId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // NEW: Category filter
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    category_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      category_id: '',
    });
    setIsCreating(false);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      category_id: service.category_id?.toString() || '',
    });
    setEditingId(service.id);
    setIsCreating(false);
    setNewServiceId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      if (editingId) {
        await servicesAPI.updateService(editingId, data);
        await onUpdate();
        resetForm();
      } else {
        const newService = await servicesAPI.createService(data);
        setNewServiceId(newService.id);
        setIsCreating(false);
        setFormData({
          name: '',
          description: '',
          price: '',
          duration_minutes: '',
          category_id: '',
        });
        await onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await servicesAPI.deleteService(id);
      await onUpdate();
      if (newServiceId === id) {
        setNewServiceId(null);
      }
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  const handleToggleActive = async (service) => {
    try {
      await servicesAPI.updateService(service.id, { is_active: !service.is_active });
      await onUpdate();
    } catch (err) {
      alert('Failed to update service');
    }
  };

  const getCategoryDisplay = (service) => {
    if (!service.category) return null;
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F0EB] text-[#8B7355] rounded-full text-sm font-medium">
        {service.category.name}
      </span>
    );
  };

  // NEW: Get unique categories from services
  const availableCategories = ['all', ...new Set(
    services
      .filter(s => s.category && s.category.name)
      .map(s => s.category.name)
  )];

  // NEW: Filter services by selected category
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category?.name === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-3xl font-serif text-neutral-900">Your Services</h3>
        {!isCreating && !editingId && !newServiceId && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-[#B8A188] text-white rounded-xl hover:bg-[#A89178] transition font-medium shadow-md"
          >
            + Add Service
          </button>
        )}
      </div>

      {/* NEW: Category Filter Tabs */}
      {!isCreating && !editingId && services.length > 0 && availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-neutral-200">
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {category === 'all' ? 'All Services' : category}
              <span className="ml-2 text-xs opacity-75">
                ({category === 'all' ? services.length : services.filter(s => s.category?.name === category).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="bg-[#F5F0EB] p-8 rounded-xl border border-[#E5DDD5] mb-6">
          <h4 className="text-xl font-semibold mb-6 text-neutral-900">
            Add New Service
          </h4>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Gel Manicure"
                className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe what's included in this service..."
                className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="50.00"
                  className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  required
                  placeholder="60"
                  className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#B8A188] text-white rounded-lg hover:bg-[#A89178] disabled:bg-neutral-400 transition font-medium"
              >
                {loading ? 'Saving...' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-neutral-600 hover:text-neutral-900 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-16 text-center border border-[#E5DDD5]">
          <div className="text-6xl mb-4">💅</div>
          <p className="text-neutral-600 text-lg">No services yet. Add your first service to get started!</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-16 text-center border border-[#E5DDD5]">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-neutral-600 text-lg">No services in this category</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            Show All Services
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredServices.map((service) => (
            <div key={service.id}>
              {/* Service Card */}
              <div
                className={`bg-white/90 backdrop-blur-sm rounded-xl p-8 border transition-all ${
                  service.is_active 
                    ? 'border-[#E5DDD5] hover:border-[#B8A188]' 
                    : 'border-neutral-300 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <h4 className="text-2xl font-serif text-neutral-900">{service.name}</h4>
                      {getCategoryDisplay(service)}
                      {!service.is_active && (
                        <span className="bg-neutral-200 text-neutral-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                          INACTIVE
                        </span>
                      )}
                      {newServiceId === service.id && (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                          ✨ Add images below!
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-600 mb-4 text-lg leading-relaxed">
                      {service.description || 'No description'}
                    </p>
                    <div className="flex gap-8 text-base">
                      <div>
                        <span className="text-neutral-500">Price:</span>{' '}
                        <span className="font-semibold text-neutral-900">${service.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Duration:</span>{' '}
                        <span className="font-semibold text-neutral-900">{service.duration_minutes} min</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Images:</span>{' '}
                        <span className="font-semibold text-neutral-900">
                          {service.images?.length || 0}
                          {!isPro && ' / 3'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 ml-6">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className="px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 border border-[#E5DDD5] rounded-lg hover:border-[#B8A188] transition font-medium"
                    >
                      {service.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-4 py-2.5 text-sm bg-[#B8A188] text-white rounded-lg hover:bg-[#A89178] transition font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="px-4 py-2.5 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:border-red-400 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Display Images when NOT editing */}
                {editingId !== service.id && newServiceId !== service.id && service.images && service.images.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#E5DDD5]">
                    <h5 className="text-sm font-semibold text-neutral-700 mb-3">Service Images</h5>
                    <div className="flex gap-3 flex-wrap">
                      {service.images.map((img) => (
                        <div key={img.id} className="relative w-24 h-24">
                          <img 
                            src={img.image_url}
                            alt="" 
                            className="w-full h-full object-cover rounded-lg border border-[#E5DDD5] shadow-sm" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Form - Shows BELOW the service card */}
              {editingId === service.id && (
                <div className="bg-[#F5F0EB] p-8 rounded-xl border border-[#E5DDD5] mt-4">
                  <h4 className="text-xl font-semibold mb-6 text-neutral-900">
                    Edit Service Details
                  </h4>

                  {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., Gel Manicure"
                        className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                      >
                        <option value="">No category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Describe what's included in this service..."
                        className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          placeholder="50.00"
                          className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Duration (minutes) *
                        </label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={formData.duration_minutes}
                          onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                          required
                          placeholder="60"
                          className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-[#B8A188] text-white rounded-lg hover:bg-[#A89178] disabled:bg-neutral-400 transition font-medium"
                      >
                        {loading ? 'Saving...' : 'Update Service'}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 text-neutral-600 hover:text-neutral-900 transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>

                  {/* Image Management */}
                  <div className="mt-8 pt-8 border-t border-[#D4C4B0]">
                    <div className="flex items-center justify-between mb-6">
                      <h5 className="text-lg font-semibold text-neutral-900">
                        Manage Service Images
                      </h5>
                    </div>
                    <ImageUpload
                      serviceId={service.id}
                      images={service.images || []}
                      onUpdate={onUpdate}
                      isPro={isPro}
                    />
                  </div>
                </div>
              )}

              {/* Image Upload for newly created service */}
              {newServiceId === service.id && (
                <div className="bg-green-50 p-8 rounded-xl border-2 border-green-200 mt-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h5 className="text-lg font-semibold text-neutral-900 mb-1">
                        ✨ Service Created! Now Add Images
                      </h5>
                      <p className="text-sm text-neutral-600">
                        Upload photos to showcase your work
                      </p>
                    </div>
                    <button
                      onClick={() => setNewServiceId(null)}
                      className="px-4 py-2 text-sm bg-white text-neutral-700 hover:text-neutral-900 border border-green-300 rounded-lg transition font-medium"
                    >
                      Done Adding Images
                    </button>
                  </div>
                  <ImageUpload
                    serviceId={service.id}
                    images={service.images || []}
                    onUpdate={onUpdate}
                    isPro={isPro}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}