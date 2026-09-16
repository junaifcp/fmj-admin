
import { useState } from 'react';

type ExperienceLevel = 'Entry-Level' | 'Mid-Level' | 'Senior-Level';
type ContentType = 'summary' | 'bullet-points';

// This is a simplified version just for demonstration
// In a real app, this would call an actual API
export function useAi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (
    type: ContentType,
    prompt: string,
    experienceLevel?: ExperienceLevel
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let result = '';
      
      if (type === 'summary') {
        result = generateSummary(prompt, experienceLevel || 'Mid-Level');
      } else if (type === 'bullet-points') {
        result = generateBulletPoints(prompt);
      }
      
      return result;
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  // Mock summary generation
  const generateSummary = (position: string, level: ExperienceLevel): string => {
    const summaries = {
      'Entry-Level': `Motivated ${position} professional with foundational knowledge in key areas. Eager to apply academic learning to real-world challenges. Quick learner with strong collaboration skills seeking to grow in a dynamic environment.`,
      'Mid-Level': `Experienced ${position} with 3+ years of proven expertise in implementing solutions. Skilled in balancing technical excellence with business requirements. Demonstrated ability to mentor junior team members while delivering high-quality work.`,
      'Senior-Level': `Seasoned ${position} with 7+ years of extensive experience leading complex projects. Strategic thinker with deep technical knowledge and business acumen. Proven track record of driving innovation and mentoring teams to achieve exceptional results.`
    };
    
    return summaries[level];
  };

  // Mock bullet point generation
  const generateBulletPoints = (description: string): string => {
    const keywords = description.split(' ');
    const actionVerbs = ['Implemented', 'Developed', 'Managed', 'Improved', 'Created', 'Designed'];
    const results = ['resulting in 20% increased efficiency', 'leading to client satisfaction', 'reducing costs by 15%', 'enhancing team productivity'];
    
    const bulletPoints = [];
    for (let i = 0; i < 3; i++) {
      const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
      const result = results[Math.floor(Math.random() * results.length)];
      
      if (keywords.length > i) {
        bulletPoints.push(`${verb} ${keywords[i]} solutions ${result}`);
      }
    }
    
    return bulletPoints.join('\n');
  };

  return {
    generateContent,
    isLoading,
    error
  };
}
