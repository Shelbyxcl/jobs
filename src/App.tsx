import React, { useState, useEffect } from 'react';
import { Briefcase, X, Check, Building2, MapPin, Clock, DollarSign, Bookmark, Share2, ArrowLeft, User, Settings, GripVertical, Search } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  imageUrl: string;
  postedDate: string;
}

interface Profile {
  name: string;
  title: string;
  skills: string[];
  experience: string;
  preferredLocations: string[];
  imageUrl: string;
  jobPreferences: {
    minSalary: number;
    maxDistance: number;
    remoteOnly: boolean;
  };
}

interface SearchCriteria {
  id: string;
  label: string;
  active: boolean;
}

const DUMMY_JOBS: Job[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    type: "Permanent",
    salary: "$120,000 - $180,000",
    description: "Looking for an experienced frontend developer with React expertise to join our dynamic team.",
    requirements: [
      "5+ years of React experience",
      "Strong TypeScript skills",
      "Experience with modern CSS frameworks",
      "Understanding of web performance optimization"
    ],
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800",
    postedDate: "2024-03-10",
  },
  {
    id: 2,
    title: "UX Design Intern",
    company: "Design Studio",
    location: "Remote",
    type: "Internship",
    salary: "$30/hour",
    description: "Join our creative team to design beautiful and intuitive user experiences.",
    requirements: [
      "Currently pursuing design degree",
      "Proficiency in Figma",
      "Strong portfolio",
      "Passion for user research"
    ],
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800",
    postedDate: "2024-03-12",
  },
  {
    id: 3,
    title: "Product Manager",
    company: "StartupX",
    location: "New York, NY",
    type: "Fixed-term",
    salary: "$130,000 - $160,000",
    description: "Lead product development and strategy for our growing startup.",
    requirements: [
      "5+ years of product management",
      "Experience in B2B SaaS",
      "Strong analytical skills",
      "Excellent communication"
    ],
    imageUrl: "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=800",
    postedDate: "2024-03-15",
  },
  {
    id: 4,
    title: "DevOps Engineer",
    company: "CloudTech Solutions",
    location: "Remote",
    type: "Permanent",
    salary: "$140,000 - $190,000",
    description: "Join our infrastructure team to build and maintain scalable cloud solutions.",
    requirements: [
      "Strong AWS experience",
      "Kubernetes expertise",
      "CI/CD pipeline management",
      "Infrastructure as Code"
    ],
    imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800",
    postedDate: "2024-03-16",
  },
];

const INITIAL_PROFILE: Profile = {
  name: "Alex Thompson",
  title: "Senior Software Engineer",
  skills: ["React", "TypeScript", "Node.js", "AWS"],
  experience: "8 years",
  preferredLocations: ["San Francisco", "Remote"],
  imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800",
  jobPreferences: {
    minSalary: 120000,
    maxDistance: 50,
    remoteOnly: false,
  },
};

const INITIAL_CRITERIA: SearchCriteria[] = [
  { id: 'permanent', label: 'Permanent', active: true },
  { id: 'fixed-term', label: 'Fixed-term', active: true },
  { id: 'temporary', label: 'Temporary', active: true },
  { id: 'internship', label: 'Internship', active: true },
];

function SortableCriteria({ criteria }: { criteria: SearchCriteria }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: criteria.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm cursor-move"
    >
      <GripVertical className="w-4 h-4 text-gray-400" {...attributes} {...listeners} />
      <span className="text-gray-700">{criteria.label}</span>
    </div>
  );
}

function App() {
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [animation, setAnimation] = useState<'swipe-left' | 'swipe-right' | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [criteria, setCriteria] = useState<SearchCriteria[]>(INITIAL_CRITERIA);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState(DUMMY_JOBS);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (event.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentJobIndex]);

  useEffect(() => {
    const activeCriteriaTypes = criteria
      .filter(c => c.active)
      .map(c => c.label.toLowerCase());

    const filtered = DUMMY_JOBS.filter(job => {
      const matchesType = activeCriteriaTypes.includes(job.type.toLowerCase());
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSalary = job.salary.includes('Remote') ? true :
                           profile.jobPreferences.remoteOnly ? false : true;
      
      return matchesType && matchesSearch && matchesSalary;
    });

    setFilteredJobs(filtered);
    setCurrentJobIndex(0);
  }, [criteria, searchTerm, profile.jobPreferences]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCriteria((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (filteredJobs.length === 0) return;
    
    setAnimation(direction === 'left' ? 'swipe-left' : 'swipe-right');
    if (direction === 'right') {
      setSavedJobs(prev => new Set([...prev, filteredJobs[currentJobIndex].id]));
    }
    setTimeout(() => {
      setCurrentJobIndex((prev) => (prev + 1) % filteredJobs.length);
      setAnimation(null);
    }, 300);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentJob.title,
        text: `Check out this ${currentJob.title} position at ${currentJob.company}!`,
        url: window.location.href,
      });
    }
  };

  const handleRemoveSaved = (jobId: number) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
  };

  const toggleCriteria = (id: string) => {
    setCriteria(prev =>
      prev.map(c =>
        c.id === id ? { ...c, active: !c.active } : c
      )
    );
  };

  const currentJob = filteredJobs[currentJobIndex];
  const isSaved = currentJob && savedJobs.has(currentJob.id);
  const savedJobsList = DUMMY_JOBS.filter(job => savedJobs.has(job.id));

  const JobCard = ({ job, showActions = false }: { job: Job, showActions?: boolean }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
      <img 
        src={job.imageUrl} 
        alt={job.company}
        className="w-full h-48 object-cover"
      />
      
      <div className="absolute top-4 right-4 flex gap-2">
        {showActions && (
          <>
            <button 
              onClick={handleShare}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              className={`p-2 ${isSaved ? 'bg-purple-100' : 'bg-white/80'} backdrop-blur-sm rounded-full hover:bg-purple-100 transition-colors`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'text-purple-600 fill-purple-600' : 'text-gray-600'}`} />
            </button>
          </>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{job.title}</h2>
          <span className="text-sm text-gray-500">
            Posted {new Date(job.postedDate).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <Building2 className="w-4 h-4 mr-2" />
          <span>{job.company}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{job.location}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <Clock className="w-4 h-4 mr-2" />
          <span>{job.type}</span>
        </div>

        <div className="flex items-center text-gray-600 mb-4">
          <DollarSign className="w-4 h-4 mr-2" />
          <span>{job.salary}</span>
        </div>
        
        <p className="text-gray-600 mb-4">{job.description}</p>

        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">Requirements:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {job.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const ProfileView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={profile.imageUrl}
          alt={profile.name}
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
          <p className="text-gray-600">{profile.title}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Experience</h3>
        <p className="text-gray-600">{profile.experience}</p>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Preferred Locations</h3>
        <div className="flex flex-wrap gap-2">
          {profile.preferredLocations.map((location, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
            >
              {location}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Job Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Salary</label>
            <input
              type="number"
              value={profile.jobPreferences.minSalary}
              onChange={(e) => setProfile({
                ...profile,
                jobPreferences: {
                  ...profile.jobPreferences,
                  minSalary: parseInt(e.target.value)
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Distance (miles)</label>
            <input
              type="number"
              value={profile.jobPreferences.maxDistance}
              onChange={(e) => setProfile({
                ...profile,
                jobPreferences: {
                  ...profile.jobPreferences,
                  maxDistance: parseInt(e.target.value)
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={profile.jobPreferences.remoteOnly}
              onChange={(e) => setProfile({
                ...profile,
                jobPreferences: {
                  ...profile.jobPreferences,
                  remoteOnly: e.target.checked
                }
              })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Remote jobs only
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Criteria</h2>
      <p className="text-gray-600 mb-4">Drag to reorder your preferences:</p>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={criteria}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {criteria.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <SortableCriteria criteria={item} />
                <button
                  onClick={() => toggleCriteria(item.id)}
                  className={`p-2 rounded-lg ${
                    item.active
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {item.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-8">
      <div className="max-w-md mx-auto pt-10 px-4">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Briefcase className="text-purple-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-800 ml-2">JobSwipe</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setShowProfile(true);
                setShowSavedJobs(false);
                setShowSettings(false);
              }}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setShowSettings(true);
                setShowProfile(false);
                setShowSavedJobs(false);
              }}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setShowSavedJobs(!showSavedJobs);
                setShowProfile(false);
                setShowSettings(false);
              }}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              {showSavedJobs ? (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  Back to Jobs
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  {savedJobs.size} saved
                </>
              )}
            </button>
          </div>
        </header>

        {showProfile ? (
          <ProfileView />
        ) : showSettings ? (
          <SettingsView />
        ) : showSavedJobs ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Saved Jobs</h2>
            {savedJobsList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No saved jobs yet. Start swiping to save jobs!
              </div>
            ) : (
              savedJobsList.map(job => (
                <div key={job.id} className="relative">
                  <JobCard job={job} />
                  <button
                    onClick={() => handleRemoveSaved(job.id)}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-red-50 transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {filteredJobs.length > 0 ? (
              <>
                <div className={`relative transition-transform duration-300 
                  ${animation === 'swipe-left' ? 'translate-x-[-100%] rotate-[-5deg]' : ''} 
                  ${animation === 'swipe-right' ? 'translate-x-[100%] rotate-[5deg]' : ''}`}>
                  <JobCard job={currentJob} showActions={true} />
                </div>

                <div className="flex justify-center gap-6 mt-8">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="bg-white p-4 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-8 h-8 text-red-500" />
                  </button>
                  
                  <button
                    onClick={() => handleSwipe('right')}
                    className="bg-white p-4 rounded-full shadow-lg hover:bg-green-50 transition-colors"
                  >
                    <Check className="w-8 h-8 text-green-500" />
                  </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Swipe right to save, left to pass
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No jobs match your current filters. Try adjusting your search criteria.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;