import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Building, Briefcase, DollarSign, Image, Phone, Save, CheckCircle, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { authService } from '../lib/authService';
import { resizeImage } from '../lib/imageUtils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
}) => {
  const [fullName, setFullName] = useState(currentProfile.fullName || '');
  const [email, setEmail] = useState(currentProfile.email || '');
  const [companyName, setCompanyName] = useState(currentProfile.companyName || '');
  const [jobTitle, setJobTitle] = useState(currentProfile.jobTitle || '');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || '');
  const [currencySymbol, setCurrencySymbol] = useState(currentProfile.currencySymbol || '$');
  const [phone, setPhone] = useState(currentProfile.phone || '');

  const [isResizingImage, setIsResizingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentProfile) {
      setFullName(currentProfile.fullName || '');
      setEmail(currentProfile.email || '');
      setCompanyName(currentProfile.companyName || '');
      setJobTitle(currentProfile.jobTitle || '');
      setAvatarUrl(currentProfile.avatarUrl || '');
      setCurrencySymbol(currentProfile.currencySymbol || '$');
      setPhone(currentProfile.phone || '');
    }
  }, [currentProfile, isOpen]);

  if (!isOpen) return null;

  // Image Upload with Canvas Resizing
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsResizingImage(true);

    try {
      const resizedDataUrl = await resizeImage(file, 100, 100, 0.85);
      setAvatarUrl(resizedDataUrl);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Could not process image file. Please choose a valid image.');
    } finally {
      setIsResizingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name is required');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await authService.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        avatarUrl: avatarUrl.trim(),
        currencySymbol: currencySymbol.trim(),
        phone: phone.trim(),
      });

      setSuccessMsg('Profile updated successfully!');
      onProfileUpdated(updated);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-neutral-200/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-neutral-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white font-bold text-lg flex items-center justify-center border border-emerald-500/30 overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <p className="text-xs text-neutral-400">
                Upload your picture, update personal info & currency settings
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* User Profile Picture Upload */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Profile Picture
            </label>
            <div className="flex items-center gap-4 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70">
              <div className="w-14 h-14 rounded-full bg-emerald-900 text-white font-bold text-lg flex items-center justify-center overflow-hidden border-2 border-emerald-700 shrink-0 shadow-xs">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  fullName.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="user-profile-avatar-upload"
                />
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="user-profile-avatar-upload"
                    className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{isResizingImage ? 'Processing...' : 'Upload New Photo'}</span>
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">
                  Select a photo from your computer. It will be resized and optimized automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Company / Agency Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Morgan Creative Studio"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Job Title / Role
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Lead Designer / Developer"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Preferred Currency Symbol
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 bg-white"
                >
                  <option value="$">$ (USD - US Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="CA$">CA$ (CAD - Canadian Dollar)</option>
                  <option value="A$">A$ (AUD - Australian Dollar)</option>
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="৳">৳ (BDT - Bangladeshi Taka)</option>
                  <option value="¥">¥ (JPY / CNY)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Or Image URL
            </label>
            <div className="relative">
              <Image className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="url"
                value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isResizingImage}
              className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
