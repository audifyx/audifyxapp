import AsyncStorage from '@react-native-async-storage/async-storage';

export const resetAppData = async () => {
  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All storage keys:', allKeys);
    
    // Clear all app-related storage
    const appKeys = allKeys.filter(key => 
      key.includes('music-storage') || 
      key.includes('users-storage') || 
      key.includes('messages-storage') ||
      key.includes('auth-storage')
    );
    
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
      console.log('Cleared storage keys:', appKeys);
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting app data:', error);
    return false;
  }
};

export const checkAndClearMockUsers = async () => {
  try {
    const usersData = await AsyncStorage.getItem('users-storage');
    if (usersData) {
      const parsed = JSON.parse(usersData);
      
      if (parsed.state?.allUsers) {
        const mockUsernames = ['musicproducer', 'beatmaker_official', 'indie_artist', 'dj_spinner'];
        const hasMockUsers = parsed.state.allUsers.some((user: any) => 
          mockUsernames.includes(user.username) ||
          user.email?.includes('@audifyx.com')
        );
        
        if (hasMockUsers) {
          console.log('Found mock users, clearing users storage...');
          await AsyncStorage.removeItem('users-storage');
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking mock users:', error);
    return false;
  }
};

export const debugStorage = async () => {
  try {
    const musicData = await AsyncStorage.getItem('music-storage');
    if (musicData) {
      const parsed = JSON.parse(musicData);
      console.log('Music storage contents:', parsed);
      
      if (parsed.state?.tracks) {
        console.log('Tracks found:', parsed.state.tracks.length);
        parsed.state.tracks.forEach((track: any, index: number) => {
          console.log(`Track ${index}:`, track.title, 'by', track.artist);
        });
      }
    } else {
      console.log('No music storage found');
    }

    const usersData = await AsyncStorage.getItem('users-storage');
    if (usersData) {
      const parsed = JSON.parse(usersData);
      console.log('Users storage contents:', parsed);
      
      if (parsed.state?.allUsers) {
        console.log('Users found:', parsed.state.allUsers.length);
        parsed.state.allUsers.forEach((user: any, index: number) => {
          console.log(`User ${index}:`, user.username, '(', user.email, ')');
        });
      }
    } else {
      console.log('No users storage found');
    }
  } catch (error) {
    console.error('Error debugging storage:', error);
  }
};