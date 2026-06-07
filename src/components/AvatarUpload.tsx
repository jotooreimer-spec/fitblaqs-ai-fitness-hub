import { useState, useRef } from "react";
import { Upload, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploadSuccess: (url: string) => void;
  isGerman: boolean;
}

export const AvatarUpload = ({ userId, currentAvatarUrl, onUploadSuccess, isGerman }: AvatarUploadProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Resolve storage paths / legacy URLs to a displayable signed URL
  const { signedUrl, loading: resolving } = useSignedUrl(currentAvatarUrl ?? null);
  const displayUrl = signedUrl;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bitte wähle ein Bild" : "Please select an image",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5242880) { // 5MB
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Bild zu groß (max 5MB)" : "Image too large (max 5MB)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Use signed URL since bucket is private for security
      const { data: signedData, error: signedError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedError) throw signedError;

      const signedUrl = signedData?.signedUrl || '';

      // Store the file path in the database, not the URL
      // This allows regenerating signed URLs when needed
      await supabase
        .from('profiles')
        .update({ avatar_url: `storage:${fileName}` })
        .eq('user_id', userId);

      onUploadSuccess(signedUrl);
      
      toast({
        title: isGerman ? "Erfolg" : "Success",
        description: isGerman ? "Profilbild hochgeladen" : "Profile picture uploaded"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: isGerman ? "Fehler" : "Error",
        description: isGerman ? "Upload fehlgeschlagen" : "Upload failed",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`relative w-32 h-32 rounded-full overflow-hidden cursor-pointer transition-all ${
        isDragging ? 'ring-4 ring-primary scale-105' : 'hover:ring-2 ring-primary/50'
      } ${isUploading ? 'opacity-50' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
        disabled={isUploading}
      />
      
      {displayUrl ? (
        <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
          {resolving ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : (
            <User className="w-16 h-16 text-primary" />
          )}
        </div>
      )}
      
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-white" />
        )}
      </div>
    </div>
  );
};
