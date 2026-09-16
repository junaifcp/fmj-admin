import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import PosterCanvas from "./PosterCanvas";
import type { TemplateId, PosterData } from "@/types/poster";

interface PosterTemplateCardProps {
  templateId: TemplateId;
  name: string;
  description: string;
  data: PosterData;
  onDownload: (templateId: TemplateId) => void;
  isGenerating: boolean;
}

const PosterTemplateCard: React.FC<PosterTemplateCardProps> = ({
  templateId,
  name,
  description,
  data,
  onDownload,
  isGenerating,
}) => {
  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 hover:-translate-y-1">
      <div className="bg-gradient-to-br from-muted/50 to-muted/20 p-6 flex items-center justify-center border-b-2 border-border/50 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 rounded-xl overflow-hidden shadow-xl">
          <PosterCanvas templateId={templateId} data={data} size="preview" />
        </div>
      </div>
      <CardContent className="p-6 bg-gradient-to-br from-card to-muted/20">
        <h3 className="font-bold text-xl mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{description}</p>
        <Button
          onClick={() => onDownload(templateId)}
          disabled={isGenerating}
          className="w-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Download Poster
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PosterTemplateCard;
