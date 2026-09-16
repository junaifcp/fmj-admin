import type {
  Pipeline,
  PipelineApplication,
  CandidateProfile,
  ApplicationStatus,
} from "@/types/pipeline";

// Mock Pipelines
export const mockPipelines: Pipeline[] = [
  {
    _id: "pipeline-1",
    jobId: "job-1",
    jobTitle: "Senior Software Engineer",
    companyId: "company-1",
    companyName: "Tech Innovations Inc.",
    recruiterId: "recruiter-1",
    status: "active",
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalApplications: 45,
    shortlisted: 12,
    hired: 2,
    rejected: 25,
    sources: {
      database: true,
      publicLink: true,
      blogs: false,
    },
    publicLink: {
      uniqueId: "abc123xyz",
      url: "https://app.fitmyskill.com/apply/abc123xyz",
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxApplications: 100,
    },
    settings: {
      showAfterHours: 24,
      maxTopCandidates: 5,
      autoMatching: true,
      emailNotifications: true,
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "pipeline-2",
    jobId: "job-2",
    jobTitle: "Product Manager",
    companyId: "company-2",
    companyName: "Digital Solutions Ltd",
    recruiterId: "recruiter-1",
    status: "active",
    startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalApplications: 32,
    shortlisted: 8,
    hired: 1,
    rejected: 18,
    sources: {
      database: true,
      publicLink: false,
      blogs: true,
    },
    blogs: [
      {
        blogId: "blog-1",
        title: "Why Product Management is the Future",
        url: "https://blog.example.com/product-management-future",
        publishedAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        applyLink: "https://app.fitmyskill.com/apply/blog-1",
      },
    ],
    settings: {
      showAfterHours: 24,
      maxTopCandidates: 5,
      autoMatching: true,
      emailNotifications: true,
    },
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "pipeline-3",
    jobId: "job-3",
    jobTitle: "UX Designer",
    companyId: "company-3",
    companyName: "Creative Agency Co.",
    recruiterId: "recruiter-1",
    status: "paused",
    startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    pausedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalApplications: 28,
    shortlisted: 6,
    hired: 0,
    rejected: 15,
    sources: {
      database: true,
      publicLink: true,
      blogs: false,
    },
    settings: {
      showAfterHours: 24,
      maxTopCandidates: 5,
      autoMatching: true,
      emailNotifications: true,
    },
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "pipeline-4",
    jobId: "job-4",
    jobTitle: "Data Scientist",
    companyId: "company-4",
    companyName: "AI Research Labs",
    recruiterId: "recruiter-1",
    status: "completed",
    startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    totalApplications: 67,
    shortlisted: 15,
    hired: 3,
    rejected: 42,
    sources: {
      database: true,
      publicLink: true,
      blogs: true,
    },
    settings: {
      showAfterHours: 24,
      maxTopCandidates: 5,
      autoMatching: true,
      emailNotifications: true,
    },
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "pipeline-5",
    jobId: "job-5",
    jobTitle: "DevOps Engineer",
    companyId: "company-5",
    companyName: "Cloud Infrastructure Inc.",
    recruiterId: "recruiter-1",
    status: "draft",
    totalApplications: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
    sources: {
      database: false,
      publicLink: false,
      blogs: false,
    },
    settings: {
      showAfterHours: 24,
      maxTopCandidates: 5,
      autoMatching: true,
      emailNotifications: true,
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Applications
const candidateNames = [
  "John Smith",
  "Sarah Johnson",
  "Michael Chen",
  "Emily Davis",
  "David Wilson",
  "Jessica Martinez",
  "Robert Taylor",
  "Amanda Brown",
  "James Anderson",
  "Lisa Thomas",
  "Christopher Lee",
  "Michelle White",
  "Daniel Harris",
  "Ashley Martin",
  "Matthew Jackson",
  "Stephanie Garcia",
  "Andrew Rodriguez",
  "Nicole Lewis",
  "Kevin Walker",
  "Rachel Hall",
  "Brian Young",
  "Lauren King",
  "Ryan Wright",
  "Megan Lopez",
  "Justin Hill",
  "Brittany Scott",
  "Brandon Green",
  "Samantha Adams",
  "Tyler Baker",
  "Kayla Nelson",
];

const skills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "Docker",
  "Kubernetes",
  "MongoDB",
  "PostgreSQL",
  "GraphQL",
  "REST API",
  "Microservices",
  "CI/CD",
  "Agile",
  "Scrum",
  "Product Management",
  "UX Design",
  "Figma",
  "Data Analysis",
  "Machine Learning",
  "TensorFlow",
  "PyTorch",
];

function getRandomSkills(count: number = 5): string[] {
  const shuffled = [...skills].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const mockApplications: PipelineApplication[] = [];

// Generate applications for pipeline-1 (Senior Software Engineer)
for (let i = 0; i < 20; i++) {
  const score = getRandomScore(45, 95);
  const statuses: ApplicationStatus[] = [
    "pending",
    "top-candidate",
    "shortlisted",
    "rejected",
    "hired",
  ];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const position = status === "top-candidate" ? (i % 5) + 1 : undefined;

  mockApplications.push({
    _id: `app-${i + 1}`,
    pipelineId: "pipeline-1",
    jobId: "job-1",
    candidateId: `candidate-${i + 1}`,
    candidateName: candidateNames[i % candidateNames.length],
    candidateEmail: `candidate${i + 1}@example.com`,
    candidatePhoto: undefined,
    matchingScore: score,
    matchingDetails: {
      skillsMatch: getRandomScore(70, 100),
      experienceMatch: getRandomScore(60, 100),
      educationMatch: getRandomScore(80, 100),
      locationMatch: getRandomScore(50, 100),
      overallFit: score,
      vectorSimilarity: getRandomScore(75, 95),
      aiAnalysis: {
        summary: `Strong candidate with ${
          score >= 80 ? "excellent" : score >= 60 ? "good" : "moderate"
        } match for the role.`,
        strengths: [
          "Relevant experience in similar technologies",
          "Strong problem-solving skills",
          "Good communication abilities",
        ],
        concerns: score < 70 ? ["May need additional training"] : [],
        recommendation:
          score >= 80 ? "strong" : score >= 60 ? "moderate" : "weak",
      },
    },
    status,
    position,
    isVisible: true,
    appliedAt: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    source: i % 3 === 0 ? "database" : i % 3 === 1 ? "public-link" : "blog",
    sourceDetails: {
      publicLinkId: i % 3 === 1 ? "abc123xyz" : undefined,
      blogId: i % 3 === 2 ? "blog-1" : undefined,
    },
    skills: getRandomSkills(6),
    experience: getRandomScore(2, 10),
    location: ["New York", "San Francisco", "Remote", "Austin", "Seattle"][
      i % 5
    ],
  });
}

// Generate applications for pipeline-2 (Product Manager)
for (let i = 0; i < 15; i++) {
  const score = getRandomScore(50, 92);
  const statuses: ApplicationStatus[] = [
    "pending",
    "top-candidate",
    "shortlisted",
    "rejected",
  ];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const position = status === "top-candidate" ? (i % 5) + 1 : undefined;

  mockApplications.push({
    _id: `app-${i + 21}`,
    pipelineId: "pipeline-2",
    jobId: "job-2",
    candidateId: `candidate-${i + 21}`,
    candidateName: candidateNames[(i + 10) % candidateNames.length],
    candidateEmail: `candidate${i + 21}@example.com`,
    matchingScore: score,
    matchingDetails: {
      skillsMatch: getRandomScore(65, 95),
      experienceMatch: getRandomScore(55, 95),
      educationMatch: getRandomScore(75, 100),
      locationMatch: getRandomScore(60, 100),
      overallFit: score,
      vectorSimilarity: getRandomScore(70, 90),
      aiAnalysis: {
        summary: `Candidate shows ${
          score >= 80 ? "strong" : "moderate"
        } alignment with product management requirements.`,
        strengths: [
          "Experience in product strategy",
          "Strong analytical skills",
          "Good stakeholder management",
        ],
        concerns: score < 70 ? ["Limited experience in tech products"] : [],
        recommendation: score >= 80 ? "strong" : "moderate",
      },
    },
    status,
    position,
    isVisible: true,
    appliedAt: new Date(
      Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
    ).toISOString(),
    source: i % 2 === 0 ? "database" : "blog",
    sourceDetails: {
      blogId: i % 2 === 1 ? "blog-1" : undefined,
    },
    skills: getRandomSkills(5),
    experience: getRandomScore(3, 12),
    location: ["San Francisco", "New York", "Remote", "Boston"][i % 4],
  });
}

// Generate applications for pipeline-3 (UX Designer)
for (let i = 0; i < 12; i++) {
  const score = getRandomScore(55, 88);
  mockApplications.push({
    _id: `app-${i + 36}`,
    pipelineId: "pipeline-3",
    jobId: "job-3",
    candidateId: `candidate-${i + 36}`,
    candidateName: candidateNames[(i + 15) % candidateNames.length],
    candidateEmail: `candidate${i + 36}@example.com`,
    matchingScore: score,
    matchingDetails: {
      skillsMatch: getRandomScore(70, 95),
      experienceMatch: getRandomScore(60, 90),
      educationMatch: getRandomScore(80, 100),
      locationMatch: getRandomScore(55, 100),
      overallFit: score,
      vectorSimilarity: getRandomScore(72, 92),
    },
    status: i < 3 ? "shortlisted" : i < 6 ? "rejected" : "pending",
    isVisible: true,
    appliedAt: new Date(
      Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
    ).toISOString(),
    source: "database",
    skills: getRandomSkills(4),
    experience: getRandomScore(2, 8),
    location: ["Los Angeles", "Remote", "Portland", "Chicago"][i % 4],
  });
}

// Mock Candidate Profiles
export const mockCandidateProfiles: Record<string, CandidateProfile> = {};

mockApplications.forEach((app, index) => {
  if (app.candidateId) {
    mockCandidateProfiles[app.candidateId] = {
      _id: app.candidateId,
      name: app.candidateName,
      email: app.candidateEmail,
      photo: app.candidatePhoto,
      bio: `Experienced professional with ${app.experience} years in the industry. Passionate about technology and innovation.`,
      location: app.location,
      skills: app.skills.map((skill) => ({
        _id: `skill-${index}-${skill}`,
        name: skill,
        level: "intermediate",
        proficiency: getRandomScore(60, 90),
      })),
      education: [
        {
          institution: "University of Technology",
          degree: "Bachelor's Degree",
          field: "Computer Science",
          startDate: "2015-09",
          endDate: "2019-06",
          isPresent: false,
        },
      ],
      experience: [
        {
          company: "Previous Company",
          role: "Software Engineer",
          startDate: "2019-07",
          endDate: "2022-12",
          isPresent: false,
          description: "Worked on various projects",
          responsibilities: [
            "Developed and maintained web applications",
            "Collaborated with cross-functional teams",
          ],
          achievements: ["Improved application performance by 30%"],
        },
      ],
      resumeUrl: `https://example.com/resumes/${app.candidateId}.pdf`,
      linkedInUrl: `https://linkedin.com/in/${app.candidateName
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
    };
  }
});

// Helper functions to get data
export function getPipelineById(id: string): Pipeline | undefined {
  return mockPipelines.find((p) => p._id === id);
}

export function getApplicationsByPipelineId(
  pipelineId: string
): PipelineApplication[] {
  return mockApplications.filter((app) => app.pipelineId === pipelineId);
}

export function getApplicationById(
  id: string
): PipelineApplication | undefined {
  return mockApplications.find((app) => app._id === id);
}

export function getCandidateProfile(
  candidateId: string
): CandidateProfile | undefined {
  return mockCandidateProfiles[candidateId];
}

export function getAllPipelines(): Pipeline[] {
  return mockPipelines;
}

export function getTopCandidates(
  pipelineId: string,
  limit: number = 5
): PipelineApplication[] {
  return getApplicationsByPipelineId(pipelineId)
    .filter((app) => app.status === "top-candidate")
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .slice(0, limit);
}
