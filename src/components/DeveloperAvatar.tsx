/**
 * DeveloperAvatar Component (Radix UI Primitive)
 * 
 * Accessible avatar profile component built with @radix-ui/react-avatar.
 * Features automatic image loading fallback to stylized initials ("JB").
 * 
 * @component
 */

import React, { useState } from 'react';
import * as Avatar from '@radix-ui/react-avatar';

interface DeveloperAvatarProps {
  src?: string;
  alt?: string;
  fallbackText?: string;
}

export const DeveloperAvatar: React.FC<DeveloperAvatarProps> = ({
  src = '/avatar.jpg',
  alt = 'Jacob Brook profile',
  fallbackText = 'JB',
}) => {
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    if (imageSrc === '/avatar.jpg') {
      setImageSrc('/avatar.jpg.jpg');
    }
  };

  return (
    <Avatar.Root className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full border border-paper-border dark:border-carbon-border shadow-sm">
      <Avatar.Image
        className="h-full w-full object-cover"
        src={imageSrc}
        alt={alt}
        onError={handleError}
      />
      <Avatar.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-paper-accent/15 dark:bg-carbon-accent/15 font-serif font-bold text-paper-accent dark:text-carbon-accent text-lg select-none"
        delayMs={600}
      >
        {fallbackText}
      </Avatar.Fallback>
    </Avatar.Root>
  );
};

export default DeveloperAvatar;
