'use client';
import { useState } from 'react';
import { servicesAPI } from '@/lib/api';
import ImageUpload from './ImageUpload';
export default function ServicesManagement({ services, onUpdate, isPro }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
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
    });
    setEditingId(service.id);
    setIsCreating(false);
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
      };

      if (editingId) {
        await servicesAPI.update(editingId, data);
      } else {
        await servicesAPI.create(data);
      }

      await onUpdate();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await servicesAPI.delete(id);
      await onUpdate();
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  const handleToggleActive = async (service) => {
    try {
      await servicesAPI.update(service.id, { is_active: !service.is_active });
      await onUpdate();
    } catch (err) {
      alert('Failed to update service');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-neutral-900">Your Services</h3>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition"
          >
            + Add Service
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-primary-50 p-6 rounded-xl border border-primary-200">
          <h4 className="text-lg font-semibold mb-4 text-neutral-900">
            {editingId ? 'Edit Service' : 'Add New Service'}
          </h4>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Gel Manicure"
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe what's included in this service..."
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-400 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
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
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-400 bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 transition"
              >
                {loading ? 'Saving...' : editingId ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 text-neutral-600 hover:text-neutral-900 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-primary-200">
          <div className="text-5xl mb-3">💅</div>
          <p className="text-neutral-600">No services yet. Add your first service to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl p-6 border ${
                service.is_active ? 'border-primary-200' : 'border-neutral-300 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-bold text-neutral-900">{service.name}</h4>
                    {!service.is_active && (
                      <span className="bg-neutral-200 text-neutral-700 text-xs font-semibold px-2 py-1 rounded">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-600 mb-3">{service.description || 'No description'}</p>
                  <div className="flex gap-6 text-sm">
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

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:border-neutral-400 transition"
                  >
                    {service.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:border-neutral-400 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:border-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Image management - show upload UI when editing */}
              {editingId === service.id ? (
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <ImageUpload
                    serviceId={service.id}
                    images={service.images || []}
                    onUpdate={onUpdate}
                    isPro={isPro}
                  />
                </div>
              ) : service.images && service.images.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <div className="flex gap-2 flex-wrap">
                    {service.images.map((img) => (
                      <div key={img.id} className="relative w-20 h-20">
                        <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-lg border border-primary-200" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}