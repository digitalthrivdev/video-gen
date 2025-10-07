"use client";

import { ImageKitProvider } from '@imagekit/next';
import { config } from '@/lib/config';

interface ImageKitWrapperProps {
  children: React.ReactNode;
}

export function ImageKitWrapper({ children }: ImageKitWrapperProps) {
  const urlEndpoint = config.imagekit.urlEndpoint;
  
  if (!urlEndpoint) {
    console.warn('ImageKit URL endpoint not configured. Image optimization will be disabled.');
    return <>{children}</>;
  }

  return (
    <ImageKitProvider 
      urlEndpoint={urlEndpoint}
      transformationPosition="query"
    >
      {children}
    </ImageKitProvider>
  );
}
