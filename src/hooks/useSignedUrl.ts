import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to resolve storage paths to signed URLs
 * Handles both legacy public URLs and new storage: prefixed paths
 */
export const useSignedUrl = (imageUrl: string | null, expirySeconds = 3600) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveUrl = async () => {
      if (!imageUrl) {
        setSignedUrl(null);
        return;
      }

      // If it's a storage: prefixed path, generate signed URL
      if (imageUrl.startsWith('storage:')) {
        setLoading(true);
        setError(null);
        
        try {
          const filePath = imageUrl.replace('storage:', '');
          const { data, error: signedError } = await supabase.storage
            .from('avatars')
            .createSignedUrl(filePath, expirySeconds);
          
          if (signedError) {
            console.error('Error creating signed URL:', signedError);
            setError(signedError.message);
            setSignedUrl(null);
          } else {
            setSignedUrl(data.signedUrl);
          }
        } catch (err) {
          console.error('Error resolving storage URL:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setSignedUrl(null);
        } finally {
          setLoading(false);
        }
      } else if (imageUrl.includes('supabase.co/storage')) {
        // Legacy public URL - these may not work anymore
        // Try to extract the path and generate a signed URL
        try {
          setLoading(true);
          const urlParts = imageUrl.split('/avatars/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0]; // Remove query params
            const { data, error: signedError } = await supabase.storage
              .from('avatars')
              .createSignedUrl(filePath, expirySeconds);
            
            if (signedError) {
              // Fall back to original URL
              setSignedUrl(imageUrl);
            } else {
              setSignedUrl(data.signedUrl);
            }
          } else {
            setSignedUrl(imageUrl);
          }
        } catch {
          setSignedUrl(imageUrl);
        } finally {
          setLoading(false);
        }
      } else {
        // Regular URL, use as-is
        setSignedUrl(imageUrl);
      }
    };

    resolveUrl();
  }, [imageUrl, expirySeconds]);

  return { signedUrl, loading, error };
};

/**
 * Utility function to resolve a storage path to signed URL (for non-hook contexts)
 */
export const resolveStorageUrl = async (
  imageUrl: string | null, 
  expirySeconds = 3600
): Promise<string | null> => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('storage:')) {
    const filePath = imageUrl.replace('storage:', '');
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, expirySeconds);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  }

  if (imageUrl.includes('supabase.co/storage')) {
    try {
      const urlParts = imageUrl.split('/avatars/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0];
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(filePath, expirySeconds);
        
        if (error) return imageUrl;
        return data.signedUrl;
      }
    } catch {
      return imageUrl;
    }
  }

  return imageUrl;
};
