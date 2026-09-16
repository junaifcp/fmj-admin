import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, Award, MapPin } from "lucide-react";
import type { CandidateProfile } from "@/types/pipeline";

interface ProfileSectionsProps {
  profile?: CandidateProfile | null;
  resumeData?: any;
}

export const ProfileSections: React.FC<ProfileSectionsProps> = ({
  profile,
  resumeData,
}) => {
  // Extract data from resumeData if profile is not available
  const skills =
    profile?.skills ||
    (resumeData?.skills || []).map((s: any) => ({
      _id: typeof s === "string" ? s : s?._id || s?.name || String(s),
      name: typeof s === "string" ? s : s?.name || s?.skill || String(s),
      proficiency: typeof s === "object" ? s?.proficiency : undefined,
    }));

  const education =
    profile?.education ||
    (resumeData?.education || []).map((edu: any) => ({
      degree: edu.degree || edu.degreeName || "",
      institution: edu.institution || edu.school || edu.university || "",
      field: edu.field || edu.fieldOfStudy || edu.major || "",
      startDate: edu.startDate || edu.start_date || "",
      endDate: edu.endDate || edu.end_date || edu.graduationDate || "",
      description: edu.description || edu.summary || "",
    }));

  const experience =
    profile?.experience ||
    (resumeData?.workExperience || resumeData?.experience || []).map(
      (exp: any) => ({
        role: exp.role || exp.title || exp.position || "",
        company: exp.company || exp.employer || exp.organization || "",
        startDate: exp.startDate || exp.start_date || "",
        endDate: exp.endDate || exp.end_date || (exp.current ? "Present" : ""),
        description: exp.description || exp.summary || "",
        responsibilities: exp.responsibilities || exp.duties || [],
        achievements: exp.achievements || [],
      })
    );

  return (
    <div className="space-y-4">
      {/* Skills */}
      {skills && skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill._id || index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Badge variant="outline" className="px-3 py-1">
                    {skill.name}
                    {skill.proficiency && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({skill.proficiency}%)
                      </span>
                    )}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-l-4 border-l-primary pl-4"
                >
                  <h4 className="font-semibold">{edu.degree}</h4>
                  <p className="text-sm text-muted-foreground">
                    {edu.institution}
                  </p>
                  {edu.field && (
                    <p className="text-sm text-muted-foreground">{edu.field}</p>
                  )}
                  {edu.startDate && edu.endDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {edu.startDate} - {edu.endDate}
                    </p>
                  )}
                  {edu.description && (
                    <p className="text-sm mt-2 whitespace-pre-line">
                      {edu.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-l-4 border-l-primary pl-4"
                >
                  <h4 className="font-semibold">{exp.role}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  {exp.startDate && exp.endDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {exp.startDate} - {exp.endDate || "Present"}
                    </p>
                  )}
                  {exp.description && (
                    <p className="text-sm mt-2 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.responsibilities.map((resp, respIndex) => (
                        <li
                          key={respIndex}
                          className="text-sm text-muted-foreground"
                        >
                          • {resp}
                        </li>
                      ))}
                    </ul>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Achievements:
                      </p>
                      <ul className="space-y-1">
                        {exp.achievements.map((ach, achIndex) => (
                          <li
                            key={achIndex}
                            className="text-sm text-muted-foreground"
                          >
                            • {ach}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
