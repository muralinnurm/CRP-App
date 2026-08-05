import React, { useState, useEffect, useRef } from 'react';
import { X, User, Building, Mail, Phone, Upload, Trash2, CheckCircle, Plus, Image as ImageIcon } from 'lucide-react';
import { Client, ClientStatus } from '../types';
import { resizeImage } from '../lib/imageUtils';
import { ClientAvatar } from './ClientAvatar';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id' | 'created_at'>, editingId?: string) => Promise<void>;
  editingClient?: Client | null;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClient,
}) => {
  const [name, setName] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ClientStatus>('active');
  const [notes, setNotes] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name || '');
      
      // Companies list handling
      const compList = editingClient.companies && editingClient.companies.length > 0
        ? [...editingClient.companies]
        : editingClient.company ? [editingClient.company] : [];
      setCompanies(compList);
      setCompanyInput('');

      setEmail(editingClient.email || '');
      setPhone(editingClient.phone || '');
      setStatus(editingClient.status || 'active');
      setNotes(editingClient.notes || '');
      setAvatarUrl(editingClient.avatar_url || '');
    } else {
      setName('');
      setCompanyInput('');
      setCompanies([]);
      setEmail('');
      setPhone('');
      setStatus('active');
      setNotes('');
      setAvatarUrl('');
    }
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  // Add Company to companies list
  const handleAddCompany = () => {
    const trimmed = companyInput.trim();
    if (trimmed && !companies.includes(trimmed)) {
      setCompanies([...companies, trimmed]);
      setCompanyInput('');
    }
  };

  const handleRemoveCompany = (indexToRemove: number) => {
    setCompanies(companies.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDownCompany = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCompany();
    }
  };

  // Image Upload with 50x50 Pixel Resizing
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsResizingImage(true);

    try {
      // Resize uploaded image to 50x50 pixels canvas
      const resizedDataUrl = await resizeImage(file, 50, 50, 0.85);
      setAvatarUrl(resizedDataUrl);
    } catch (err) {
      console.error('Image resize error:', err);
      alert('Could not process image file. Please try a different image.');
    } finally {
      setIsResizingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Combine current companyInput into companies if typed but not added
    let finalCompanies = [...companies];
    if (companyInput.trim() && !finalCompanies.includes(companyInput.trim())) {
      finalCompanies.push(companyInput.trim());
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          company: finalCompanies[0] || '',
          companies: finalCompanies,
          email: email.trim(),
          phone: phone.trim(),
          status,
          notes: notes.trim(),
          avatar_url: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        },
        editingClient?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <p className="text-xs text-neutral-500">
              Set up a client profile, upload picture, and register multiple companies.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Avatar Upload (Resized to 50x50 px) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Client Profile Picture (Resized to 50x50px)
            </label>
            <div className="flex items-center gap-4 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70">
              <ClientAvatar name={name || 'Client'} avatarUrl={avatarUrl} className="w-12 h-12 text-base" />

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="client-avatar-upload"
                />
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="client-avatar-upload"
                    className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{isResizingImage ? 'Resizing (50x50)...' : 'Upload Picture'}</span>
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
                  Uploaded pictures are automatically cropped and scaled to 50x50 px.
                </p>
              </div>
            </div>
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Client Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
              />
            </div>
          </div>

          {/* Multiple Companies Section */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Associated Companies / Businesses
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyDown={handleKeyDownCompany}
                  placeholder="Type company name and press Enter or Add..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCompany}
                className="px-3 py-2 bg-emerald-900 text-white hover:bg-emerald-950 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* List of Company Chips */}
            {companies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200/60 min-h-[38px] items-center">
                {companies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-emerald-950 text-xs font-semibold rounded-lg border border-emerald-200 shadow-2xs"
                  >
                    <Building className="w-3 h-3 text-emerald-700" />
                    <span>{comp}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCompany(idx)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 italic">
                No companies added yet. You can associate multiple companies with this client.
              </p>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Client Status
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 ${
                  status === 'active'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 ${
                  status === 'inactive'
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-800'
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                <span>Inactive</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Internal Notes / Retainer Preferences
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefers ACH payment on 1st of every month..."
              className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isResizingImage}
              className="px-5 py-2 rounded-xl text-xs font-medium bg-emerald-900 text-white hover:bg-emerald-950 transition-colors shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : editingClient ? 'Update Client' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
