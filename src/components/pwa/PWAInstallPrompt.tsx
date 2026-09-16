import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

interface PWAInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const PWAInstallPrompt = ({ isOpen, onClose }: PWAInstallPromptProps) => {
  const { installApp, isInstallable } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        toast.success("App installed successfully!");
        onClose();
      } else {
        toast.error("Installation cancelled");
      }
    } catch (error) {
      toast.error("Failed to install app");
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Install FitMyJob Resume
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            Install our app for quick access and offline functionality
          </DialogDescription>
        </DialogHeader>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Download className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Get the Best Experience</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Quick access from home screen</li>
                  <li>• Work offline when needed</li>
                  <li>• Faster loading times</li>
                  <li>• Native app-like experience</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Maybe Later
                </Button>
                <Button
                  onClick={handleInstall}
                  disabled={!isInstallable || isInstalling}
                  className="flex-1"
                >
                  {isInstalling ? "Installing..." : "Install App"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          You can always install later from your browser menu
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;
