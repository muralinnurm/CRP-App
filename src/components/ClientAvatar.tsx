import React, { useState } from 'react';

interface ClientAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export const ClientAvatar: React.FC<ClientAvatarProps> = ({
  name,
  avatarUrl,
  className = 'w-10 h-10 text-xs',
}) => {
  const [hasError, setHasError] = useState(false);

  // If custom avatarUrl fails or is missing, fall back to UI Avatars generated image
  const defaultFallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'Client'
  )}&background=064e3b&color=ffffff&bold=true`;

  const src = avatarUrl && !hasError ? avatarUrl : defaultFallbackUrl;

  return (
    <div className={`rounded-full bg-emerald-900 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden border border-emerald-700/60 shadow-2xs ${className}`}>
      <img
        src={src}
        alt={name || 'Client Avatar'}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
