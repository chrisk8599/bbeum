'use client';
import { useState } from 'react';
import api from '@/lib/api';

export default function ImageUpload({ serviceId, images = [], onUpdate, isPro }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const maxImages = isPro ? Infinity : 3;
  const canUpload = images.length < maxImages;

  const handleUpload = async (file) => {
    if (!canUpload) {
      alert(`Free tier limited to ${maxImages} images per service. Upgrade to PRO for unlimited images.`);
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/api/services/${serviceId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await onUpdate();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Delete this image?')) return;

    try {
      await api.delete(`/api/services/${serviceId}/images/${imageId}`);
      await onUpdate();
    } catch (error) {
      alert('Failed to delete image');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700">
          Service Images {!isPro && `(${images.length}/${maxImages})`}
        </h4>
        {!isPro && images.length >= maxImages && (
          <span className="text-xs text-neutral-500">
            Upgrade to PRO for unlimited images
          </span>
        )}
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square">
              <img
                src={img.image_url}
                alt=""
                className="w-full h-full object-cover rounded-lg border border-[#E5DDD5]"
              />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 text-sm font-serif"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canUpload && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-[#B8A188] bg-[#F5F0EB]'
              : 'border-[#E5DDD5] hover:border-[#B8A188]'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="pointer-events-none">
            {uploading ? (
              <>
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-neutral-700 font-medium">Uploading...</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">📸</div>
                <p className="text-neutral-700 font-medium mb-1">
                  Click or drag to upload
                </p>
                <p className="text-sm text-neutral-500">
                  PNG, JPG up to 10MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}