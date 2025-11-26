"use client";
import { useState } from "react";
import { professionalsAPI } from "@/lib/api";

export default function TeamManagement({ vendor, professionals, onUpdate }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", display_name: "" });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(null);

  // Add null checks to prevent rendering issues
  if (!vendor || !professionals) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="text-center py-8 text-neutral-600">Loading team...</div>
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await professionalsAPI.inviteProfessional(inviteForm);
      alert(`Invite sent to ${inviteForm.email}!`);
      setShowInviteModal(false);
      setInviteForm({ email: "", display_name: "" });
      onUpdate();
    } catch (error) {
      if (error.response?.status === 403) {
        alert("Upgrade to PRO to add team members!");
      } else {
        alert(error.response?.data?.detail || "Failed to send invite");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (professionalId, professionalName) => {
    if (
      !confirm(
        `Are you sure you want to remove ${professionalName} from your team?`
      )
    ) {
      return;
    }

    try {
      await professionalsAPI.deleteProfessional(professionalId);
      alert("Professional removed successfully");
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to remove professional");
    }
  };

  const handleUpdateColor = async (professionalId, newColor) => {
    try {
      await professionalsAPI.updateProfessional(professionalId, {
        calendar_color: newColor,
      });
      onUpdate();
    } catch (error) {
      alert("Failed to update color");
    }
  };

  const handleAvatarUpload = async (professionalId, file) => {
    if (!file) return;

    setUploadingAvatar(professionalId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await professionalsAPI.uploadAvatar(professionalId, formData);
      onUpdate();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-serif text-neutral-900">
            Team Management
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {professionals.length} professional
            {professionals.length !== 1 ? "s" : ""}
            {vendor.is_pro &&
              ` (${
                vendor.pro_employee_limit - (professionals.length - 1)
              } slots remaining)`}
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          disabled={
            !vendor.is_pro || (vendor.is_pro && !vendor.can_add_professional)
          }
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            vendor.is_pro && vendor.can_add_professional
              ? "bg-neutral-900 text-white hover:bg-neutral-800"
              : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
          }`}
        >
          {!vendor.is_pro
            ? "🔒 Invite Professional (PRO)"
            : "+ Invite Professional"}
        </button>
      </div>

      {/* Professionals list */}
      <div className="space-y-3">
        {professionals.map((prof) => (
          <div
            key={prof.id}
            className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
          >
            {/* Avatar with upload */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium overflow-hidden">
                {prof.avatar_url ? (
                  <img
                    src={prof.avatar_url}
                    alt={prof.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  prof.display_name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Upload Spinner Overlay */}
              {uploadingAvatar === prof.id && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}

              {/* Camera Icon Button - Only show when NOT uploading */}
              {uploadingAvatar !== prof.id && (
                <label className="absolute bottom-0 right-0 bg-neutral-900 text-white p-1 rounded-full cursor-pointer hover:bg-neutral-800">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleAvatarUpload(prof.id, e.target.files?.[0])
                    }
                    className="hidden"
                    disabled={uploadingAvatar === prof.id}
                  />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {prof.display_name}
                </span>
                {prof.is_owner && (
                  <span className="px-2 py-0.5 bg-[#F5F0EB] text-[#8B7355] text-xs rounded-full font-medium">
                    Owner
                  </span>
                )}
              </div>
              {prof.specialty && (
                <div className="text-sm text-neutral-600">{prof.specialty}</div>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600">
                <span>⭐ {prof.rating.toFixed(1)}</span>
                <span>•</span>
                <span>{prof.total_bookings} bookings</span>
              </div>
            </div>

            {/* Calendar color */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={prof.calendar_color}
                onChange={(e) => handleUpdateColor(prof.id, e.target.value)}
                className="w-10 h-10 rounded border border-neutral-200 cursor-pointer"
                title="Calendar color"
              />
            </div>

            {/* Actions */}
            {!prof.is_owner && (
              <button
                onClick={() => handleDelete(prof.id, prof.display_name)}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-serif text-neutral-900 mb-4">
              Invite Professional
            </h3>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#B8A188] focus:border-transparent"
                  placeholder="professional@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.display_name}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      display_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#B8A188] focus:border-transparent"
                  placeholder="e.g., Sarah Smith"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#B8A188] text-white rounded-lg hover:bg-[#A89178] transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
