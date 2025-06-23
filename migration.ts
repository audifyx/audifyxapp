import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './database';

interface LocalAuthData {
  state: {
    user: any;
    isAuthenticated: boolean;
  };
}

interface LocalMusicData {
  state: {
    tracks: any[];
    playlists: any[];
    version: number;
  };
}

interface LocalUsersData {
  state: {
    allUsers: any[];
    followingRelationships: Record<string, string[]>;
    version: number;
  };
}

interface LocalMessagesData {
  state: {
    conversations: any[];
    messages: { [conversationId: string]: any[] };
  };
}

interface LocalCollaborationData {
  state: {
    projects: any[];
    applications: any[];
    version: number;
  };
}

class DataMigrationService {
  async migrateAllLocalData(): Promise<{
    success: boolean;
    migratedData: {
      users: number;
      tracks: number;
      playlists: number;
      conversations: number;
      projects: number;
    };
    errors: string[];
  }> {
    const result = {
      success: true,
      migratedData: {
        users: 0,
        tracks: 0,
        playlists: 0,
        conversations: 0,
        projects: 0
      },
      errors: [] as string[]
    };

    console.log('=== STARTING DATA MIGRATION ===');

    try {
      // First, backup all local data
      const backup = await this.backupLocalData();
      console.log('Local data backed up successfully');

      // Migrate users first (including current user account)
      const usersMigrated = await this.migrateUsers();
      result.migratedData.users = usersMigrated;
      console.log(`Migrated ${usersMigrated} users`);

      // Migrate tracks/posts
      const tracksMigrated = await this.migrateTracks();
      result.migratedData.tracks = tracksMigrated;
      console.log(`Migrated ${tracksMigrated} tracks`);

      // Migrate playlists
      const playlistsMigrated = await this.migratePlaylists();
      result.migratedData.playlists = playlistsMigrated;
      console.log(`Migrated ${playlistsMigrated} playlists`);

      // Migrate conversations/messages
      const conversationsMigrated = await this.migrateMessages();
      result.migratedData.conversations = conversationsMigrated;
      console.log(`Migrated ${conversationsMigrated} conversations`);

      // Migrate collaboration projects
      const projectsMigrated = await this.migrateCollaboration();
      result.migratedData.projects = projectsMigrated;
      console.log(`Migrated ${projectsMigrated} projects`);

      console.log('=== MIGRATION COMPLETED SUCCESSFULLY ===');
      console.log('Migration Summary:', result.migratedData);

    } catch (error) {
      console.error('Migration failed:', error);
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
    }

    return result;
  }

  private async backupLocalData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupData: { [key: string]: any } = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          backupData[key] = JSON.parse(value);
        }
      }
      
      // Store backup with timestamp
      const backupKey = `data_backup_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(backupData));
      console.log(`Backup created with key: ${backupKey}`);
    } catch (error) {
      console.error('Failed to backup local data:', error);
      throw error;
    }
  }

  private async migrateUsers(): Promise<number> {
    let migratedCount = 0;
    
    try {
      // Get current user from auth store
      const authData = await AsyncStorage.getItem('auth-storage');
      if (authData) {
        const parsedAuth: LocalAuthData = JSON.parse(authData);
        if (parsedAuth.state?.user && parsedAuth.state.isAuthenticated) {
          const user = parsedAuth.state.user;
          
          console.log('Migrating current user:', user.username);
          
          // Check if user already exists in database
          const existingUser = await databaseService.getUserByEmail(user.email);
          if (!existingUser) {
            await databaseService.createUser({
              username: user.username,
              email: user.email,
              profilePicture: user.profileImage,
              bio: user.bio || '',
              website: user.website || '',
              isVerified: user.isVerified || false,
              paymentMethods: {
                paypal: user.paypalLink,
                cashapp: user.cashAppLink
              }
            });
            migratedCount++;
            console.log('Current user migrated to database');
          } else {
            console.log('Current user already exists in database');
          }
        }
      }

      // Get all users from users store
      const usersData = await AsyncStorage.getItem('users-storage');
      if (usersData) {
        const parsedUsers: LocalUsersData = JSON.parse(usersData);
        if (parsedUsers.state?.allUsers) {
          for (const user of parsedUsers.state.allUsers) {
            try {
              const existingUser = await databaseService.getUserByEmail(user.email);
              if (!existingUser) {
                await databaseService.createUser({
                  username: user.username,
                  email: user.email,
                  profilePicture: user.profileImage,
                  bio: user.bio || '',
                  website: user.website || '',
                  isVerified: user.isVerified || false,
                  paymentMethods: {
                    paypal: user.paypalLink,
                    cashapp: user.cashAppLink
                  }
                });
                migratedCount++;
                console.log(`Migrated user: ${user.username}`);
              }
            } catch (error) {
              console.error(`Failed to migrate user ${user.username}:`, error);
            }
          }

          // Migrate follow relationships
          if (parsedUsers.state.followingRelationships) {
            for (const [followerId, followingIds] of Object.entries(parsedUsers.state.followingRelationships)) {
              for (const followingId of followingIds) {
                try {
                  await databaseService.followUser(followerId, followingId);
                } catch (error) {
                  console.error(`Failed to migrate follow relationship:`, error);
                }
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Failed to migrate users:', error);
    }

    return migratedCount;
  }

  private async migrateTracks(): Promise<number> {
    let migratedCount = 0;
    
    try {
      const musicData = await AsyncStorage.getItem('music-storage');
      if (musicData) {
        const parsedMusic: LocalMusicData = JSON.parse(musicData);
        if (parsedMusic.state?.tracks) {
          for (const track of parsedMusic.state.tracks) {
            try {
              await databaseService.createTrack({
                title: track.title,
                artist: track.artist,
                userId: track.uploadedBy,
                url: track.url,
                imageUrl: track.imageUrl,
                duration: track.duration,
                streamCount: track.streamCount,
                source: track.source
              });
              migratedCount++;
              console.log(`Migrated track: ${track.title} by ${track.artist}`);
            } catch (error) {
              console.error(`Failed to migrate track ${track.title}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to migrate tracks:', error);
    }

    return migratedCount;
  }

  private async migratePlaylists(): Promise<number> {
    let migratedCount = 0;
    
    try {
      const musicData = await AsyncStorage.getItem('music-storage');
      if (musicData) {
        const parsedMusic: LocalMusicData = JSON.parse(musicData);
        if (parsedMusic.state?.playlists) {
          for (const playlist of parsedMusic.state.playlists) {
            try {
              await databaseService.createPlaylist({
                name: playlist.name,
                userId: playlist.userId || 'unknown',
                description: playlist.description || '',
                imageUrl: playlist.imageUrl,
                tracks: playlist.tracks,
                isPublic: playlist.isPublic !== false
              });
              migratedCount++;
              console.log(`Migrated playlist: ${playlist.name}`);
            } catch (error) {
              console.error(`Failed to migrate playlist ${playlist.name}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to migrate playlists:', error);
    }

    return migratedCount;
  }

  private async migrateMessages(): Promise<number> {
    let migratedCount = 0;
    
    try {
      const messagesData = await AsyncStorage.getItem('messages-storage');
      if (messagesData) {
        const parsedMessages: LocalMessagesData = JSON.parse(messagesData);
        if (parsedMessages.state?.conversations) {
          for (const conversation of parsedMessages.state.conversations) {
            try {
              // Create conversation in database
              const dbConversation = await databaseService.createConversation(conversation.participants);
              
              // Migrate messages for this conversation
              const messages = parsedMessages.state.messages[conversation.id] || [];
              for (const message of messages) {
                try {
                  await databaseService.createMessage({
                    conversationId: dbConversation.id,
                    senderId: message.senderId,
                    text: message.text,
                    type: message.type,
                    audioUrl: message.audioUrl,
                    imageUrl: message.imageUrl
                  });
                } catch (error) {
                  console.error(`Failed to migrate message:`, error);
                }
              }
              
              migratedCount++;
              console.log(`Migrated conversation with ${messages.length} messages`);
            } catch (error) {
              console.error(`Failed to migrate conversation:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to migrate messages:', error);
    }

    return migratedCount;
  }

  private async migrateCollaboration(): Promise<number> {
    let migratedCount = 0;
    
    try {
      const collabData = await AsyncStorage.getItem('collaboration-storage');
      if (collabData) {
        const parsedCollab: LocalCollaborationData = JSON.parse(collabData);
        if (parsedCollab.state?.projects) {
          for (const project of parsedCollab.state.projects) {
            try {
              const dbProject = await databaseService.createProject({
                title: project.title,
                description: project.description,
                userId: project.creatorId,
                genre: project.genre,
                skillsNeeded: project.skillsNeeded,
                budget: project.budget,
                deadline: project.deadline,
                status: project.status === 'active' ? 'open' : project.status
              });

              // Migrate applications for this project
              const applications = parsedCollab.state.applications.filter(app => app.projectId === project.id);
              for (const application of applications) {
                try {
                  await databaseService.applyToProject({
                    projectId: dbProject.id,
                    userId: application.applicantId,
                    message: application.message,
                    portfolioUrl: application.portfolio
                  });
                } catch (error) {
                  console.error(`Failed to migrate application:`, error);
                }
              }
              
              migratedCount++;
              console.log(`Migrated project: ${project.title} with ${applications.length} applications`);
            } catch (error) {
              console.error(`Failed to migrate project ${project.title}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to migrate collaboration projects:', error);
    }

    return migratedCount;
  }

  async verifyMigration(): Promise<{
    databaseCounts: {
      users: number;
      tracks: number;
      playlists: number;
      conversations: number;
      projects: number;
    };
    localCounts: {
      users: number;
      tracks: number;
      playlists: number;
      conversations: number;
      projects: number;
    };
  }> {
    console.log('=== VERIFYING MIGRATION ===');

    // Get database counts
    const [dbUsers, dbTracks, dbPlaylists, dbConversations, dbProjects] = await Promise.all([
      databaseService.getAllUsers(),
      databaseService.getAllTracks(),
      databaseService.getAllPlaylists(),
      databaseService.getConversations(''), // Empty string to get error-safe result
      databaseService.getAllProjects()
    ]);

    const databaseCounts = {
      users: dbUsers.length,
      tracks: dbTracks.length,
      playlists: dbPlaylists.length,
      conversations: dbConversations.length,
      projects: dbProjects.length
    };

    // Get local counts
    let localCounts = {
      users: 0,
      tracks: 0,
      playlists: 0,
      conversations: 0,
      projects: 0
    };

    try {
      const [authData, usersData, musicData, messagesData, collabData] = await Promise.all([
        AsyncStorage.getItem('auth-storage'),
        AsyncStorage.getItem('users-storage'),
        AsyncStorage.getItem('music-storage'),
        AsyncStorage.getItem('messages-storage'),
        AsyncStorage.getItem('collaboration-storage')
      ]);

      if (authData) {
        const parsed: LocalAuthData = JSON.parse(authData);
        if (parsed.state?.user) localCounts.users++;
      }

      if (usersData) {
        const parsed: LocalUsersData = JSON.parse(usersData);
        localCounts.users += parsed.state?.allUsers?.length || 0;
      }

      if (musicData) {
        const parsed: LocalMusicData = JSON.parse(musicData);
        localCounts.tracks = parsed.state?.tracks?.length || 0;
        localCounts.playlists = parsed.state?.playlists?.length || 0;
      }

      if (messagesData) {
        const parsed: LocalMessagesData = JSON.parse(messagesData);
        localCounts.conversations = parsed.state?.conversations?.length || 0;
      }

      if (collabData) {
        const parsed: LocalCollaborationData = JSON.parse(collabData);
        localCounts.projects = parsed.state?.projects?.length || 0;
      }

    } catch (error) {
      console.error('Failed to get local counts:', error);
    }

    console.log('Database counts:', databaseCounts);
    console.log('Local counts:', localCounts);
    console.log('=== VERIFICATION COMPLETE ===');

    return { databaseCounts, localCounts };
  }
}

export const dataMigrationService = new DataMigrationService();