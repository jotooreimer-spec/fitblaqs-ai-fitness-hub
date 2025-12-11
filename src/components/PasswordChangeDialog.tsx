import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export const PasswordChangeDialog = ({ open, onOpenChange, userEmail }: PasswordChangeDialogProps) => {
  const { language } = useLanguage();
  const isGerman = language === "de";
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(isGerman ? "Bitte alle Felder ausfüllen" : "Please fill all fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error(isGerman ? "Neues Passwort muss mindestens 8 Zeichen haben" : "New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(isGerman ? "Passwörter stimmen nicht überein" : "Passwords do not match");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error(isGerman ? "Neues Passwort muss anders sein" : "New password must be different");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Verify old password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });

      if (signInError) {
        toast.error(isGerman ? "Altes Passwort stimmt nicht" : "Old password is incorrect");
        setLoading(false);
        return;
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(isGerman ? "Fehler beim Ändern des Passworts" : "Error changing password");
        setLoading(false);
        return;
      }

      toast.success(isGerman ? "Passwort erfolgreich geändert!" : "Password changed successfully!");
      
      // Step 3: Sign out and redirect to login
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore sign out errors
      }

      // Clear storage for clean state
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore storage errors in APK
      }

      handleClose();
      
      // Redirect to login
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);

    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(isGerman ? "Ein Fehler ist aufgetreten" : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {isGerman ? "Passwort ändern" : "Change Password"}
            </span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{isGerman ? "E-Mail" : "Email"}</Label>
            <Input value={userEmail} disabled className="opacity-60" />
          </div>

          <div>
            <Label>{isGerman ? "Altes Passwort" : "Old Password"}</Label>
            <div className="relative">
              <Input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={100}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>{isGerman ? "Neues Passwort" : "New Password"}</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={100}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isGerman ? "Mindestens 8 Zeichen" : "At least 8 characters"}
            </p>
          </div>

          <div>
            <Label>{isGerman ? "Neues Passwort bestätigen" : "Confirm New Password"}</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={100}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading 
                ? (isGerman ? "Wird geändert..." : "Changing...") 
                : (isGerman ? "Passwort ändern" : "Change Password")}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {isGerman 
                ? "Nach der Änderung wirst du ausgeloggt" 
                : "You will be logged out after the change"}
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
