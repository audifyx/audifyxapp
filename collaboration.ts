import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseDatabase, CollaborationProject as DbProject, ProjectApplication as DbApplication } from '../api/supabaseDatabase';

export interface CollaborationProject {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  type: string;
  genre: string;
  skillsNeeded: string[];
  budget: string;
  deadline: string;
  isUrgent: boolean;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  applicants: ProjectApplication[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  applicantId: string;
  message: string;
  portfolio?: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date;
}

interface CollaborationState {
  projects: CollaborationProject[];
  applications: ProjectApplication[];
  version: number;
  
  // Project management
  createProject: (project: Omit<CollaborationProject, 'id' | 'applicants' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<CollaborationProject>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectById: (projectId: string) => CollaborationProject | undefined;
  getProjectsByCreator: (creatorId: string) => CollaborationProject[];
  
  // Application management
  applyToProject: (application: Omit<ProjectApplication, 'id' | 'appliedAt'>) => Promise<string>;
  updateApplication: (applicationId: string, status: ProjectApplication['status']) => Promise<void>;
  getApplicationsForProject: (projectId: string) => ProjectApplication[];
  getUserApplications: (userId: string) => ProjectApplication[];
  
  // Database sync
  syncFromDatabase: () => Promise<void>;
  
  // Utility functions
  getFilteredProjects: (filters: {
    type?: string;
    genre?: string;
    skills?: string[];
    search?: string;
  }) => CollaborationProject[];
}

const CURRENT_COLLABORATION_VERSION = 1;

export const useCollaborationStore = create<CollaborationState>()(
  persist(
    (set, get) => ({
      projects: [],
      applications: [],
      version: CURRENT_COLLABORATION_VERSION,

      createProject: async (projectData) => {
        try {
          // Create project in database
          const dbProject = await supabaseDatabase.createProject({
            id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: projectData.title,
            description: projectData.description,
            creator_id: projectData.creatorId,
            status: 'open',
            genre: projectData.genre,
            skills_needed: projectData.skillsNeeded,
            deadline: projectData.deadline
          });

          if (!dbProject) {
            throw new Error('Failed to create project in database');
          }

          // Convert to local format
          const newProject: CollaborationProject = {
            id: dbProject.id,
            title: dbProject.title,
            description: dbProject.description,
            creatorId: dbProject.creator_id,
            type: projectData.type,
            genre: dbProject.genre,
            skillsNeeded: dbProject.skills_needed,
            budget: projectData.budget,
            deadline: dbProject.deadline || '',
            isUrgent: projectData.isUrgent,
            status: dbProject.status as any,
            applicants: [],
            createdAt: new Date(dbProject.created_at),
            updatedAt: new Date(dbProject.updated_at)
          };

          set(state => ({
            projects: [...state.projects, newProject]
          }));

          return newProject.id;
        } catch (error) {
          console.error('Failed to create project in database:', error);
          
          // Fallback to local-only
          const newProject: CollaborationProject = {
            ...projectData,
            id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            applicants: [],
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set(state => ({
            projects: [...state.projects, newProject]
          }));

          return newProject.id;
        }
      },

      updateProject: async (projectId, updates) => {
        set(state => ({
          projects: state.projects.map(project =>
            project.id === projectId
              ? { ...project, ...updates, updatedAt: new Date() }
              : project
          )
        }));
      },

      deleteProject: async (projectId) => {
        set(state => ({
          projects: state.projects.filter(project => project.id !== projectId),
          applications: state.applications.filter(app => app.projectId !== projectId)
        }));
      },

      getProjectById: (projectId) => {
        const { projects } = get();
        return projects.find(project => project.id === projectId);
      },

      getProjectsByCreator: (creatorId) => {
        const { projects } = get();
        return projects.filter(project => project.creatorId === creatorId);
      },

      applyToProject: async (applicationData) => {
        try {
          // For Supabase, we'll need to implement applyToProject method
          const dbApplication = {
            id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            projectId: applicationData.projectId,
            applicantId: applicationData.applicantId,
            message: applicationData.message,
            status: 'pending' as const,
            createdAt: new Date().toISOString()
          };

          // Convert to local format
          const newApplication: ProjectApplication = {
            id: dbApplication.id,
            projectId: dbApplication.projectId,
            applicantId: dbApplication.applicantId,
            message: dbApplication.message,
            portfolio: applicationData.portfolio,
            status: dbApplication.status,
            appliedAt: new Date(dbApplication.createdAt)
          };

          set(state => ({
            applications: [...state.applications, newApplication]
          }));

          return newApplication.id;
        } catch (error) {
          console.error('Failed to apply to project in database:', error);
          
          // Fallback to local-only
          const newApplication: ProjectApplication = {
            ...applicationData,
            id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            appliedAt: new Date(),
          };

          set(state => ({
            applications: [...state.applications, newApplication]
          }));

          return newApplication.id;
        }
      },

      updateApplication: async (applicationId, status) => {
        set(state => ({
          applications: state.applications.map(app =>
            app.id === applicationId
              ? { ...app, status }
              : app
          )
        }));
      },

      getApplicationsForProject: (projectId) => {
        const { applications } = get();
        return applications.filter(app => app.projectId === projectId);
      },

      getUserApplications: (userId) => {
        const { applications } = get();
        return applications.filter(app => app.applicantId === userId);
      },

      getFilteredProjects: (filters) => {
        const { projects } = get();
        
        return projects.filter(project => {
          // Type filter
          if (filters.type && project.type !== filters.type) {
            return false;
          }

          // Genre filter
          if (filters.genre && project.genre !== filters.genre) {
            return false;
          }

          // Skills filter
          if (filters.skills && filters.skills.length > 0) {
            const hasMatchingSkill = filters.skills.some(skill =>
              project.skillsNeeded.includes(skill)
            );
            if (!hasMatchingSkill) {
              return false;
            }
          }

          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const titleMatch = project.title.toLowerCase().includes(searchLower);
            const descriptionMatch = project.description.toLowerCase().includes(searchLower);
            const genreMatch = project.genre.toLowerCase().includes(searchLower);
            
            if (!titleMatch && !descriptionMatch && !genreMatch) {
              return false;
            }
          }

          return true;
        }).sort((a, b) => {
          // Sort by urgent first, then by creation date
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      },

      syncFromDatabase: async () => {
        try {
          console.log('Collaboration Store: Syncing from database...');
          
          // Get all projects from database
          const dbProjects = await supabaseDatabase.getAllProjects();
          console.log('Collaboration Store: Found', dbProjects.length, 'projects in database');
          
          // Convert to local format
          const projects: CollaborationProject[] = dbProjects.map(dbProject => ({
            id: dbProject.id,
            title: dbProject.title,
            description: dbProject.description,
            creatorId: dbProject.creator_id,
            type: 'collaboration', // Default type
            genre: dbProject.genre,
            skillsNeeded: dbProject.skills_needed,
            budget: '', // Default budget
            deadline: dbProject.deadline || '',
            isUrgent: false, // Default value
            status: dbProject.status as any,
            applicants: [],
            createdAt: new Date(dbProject.created_at),
            updatedAt: new Date(dbProject.updated_at)
          }));

          // Flatten applications from all projects
          const applications: ProjectApplication[] = projects.flatMap(project => project.applicants);
          
          // Update local state
          set({
            projects,
            applications
          });
          
          console.log('Collaboration Store: Successfully synced from database');
        } catch (error) {
          console.error('Collaboration Store: Failed to sync from database:', error);
        }
      },
    }),
    {
      name: 'collaboration-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: CURRENT_COLLABORATION_VERSION,
      migrate: (persistedState: any, version: number) => {
        if (version !== CURRENT_COLLABORATION_VERSION) {
          return {
            projects: [],
            applications: [],
            version: CURRENT_COLLABORATION_VERSION
          };
        }
        return persistedState;
      }
    }
  )
);