import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  const getInitials = (str: string) => {
    if (!str) return 'C';
    const clean = str.trim();
    if (!clean) return 'C';
    const words = clean.split(/\s+/);
    if (words.length === 1) {
      return clean.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const showImage = Boolean(avatarUrl && avatarUrl.trim() && !hasError);

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden border border-emerald-700/50 shadow-2xs select-none ${className}`}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name || 'Client Avatar'}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="leading-none text-center">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};

