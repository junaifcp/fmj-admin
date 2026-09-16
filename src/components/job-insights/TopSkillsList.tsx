import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { JobInsights } from "@/types/jobInsights";

interface TopSkillsListProps {
  skills: JobInsights["topSkills"];
  onSkillFilter?: (skill: string) => void;
}

export const TopSkillsList = ({
  skills,
  onSkillFilter,
}: TopSkillsListProps) => {
  const maxCount = Math.max(...skills.map((s) => s.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Top Skills in Applications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {skills.map((skill, index) => {
            const percentage =
              maxCount > 0 ? (skill.count / maxCount) * 100 : 0;

            return (
              <div key={skill.skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onSkillFilter?.(skill.skill)}
                  >
                    {skill.skill}
                  </Badge>
                  <span className="text-sm font-medium">{skill.count}</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                    aria-label={`${skill.skill}: ${skill.count} occurrences`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {skills.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>No skill data available yet</p>
            <p className="text-sm">Skills will appear as candidates apply</p>
          </div>
        )}

        {skills.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Show all skills or expand list
                console.log("Show all skills");
              }}
            >
              View All Skills
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
