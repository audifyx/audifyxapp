import { Audio } from 'expo-av';

export interface AudioDiagnostic {
  canPlay: boolean;
  error?: string;
  audioMode?: any;
  deviceInfo?: any;
}

export async function runAudioDiagnostics(testUrl?: string): Promise<AudioDiagnostic> {
  const result: AudioDiagnostic = {
    canPlay: false
  };

  try {
    console.log('=== AUDIO DIAGNOSTICS START ===');
    
    // Test 1: Check audio mode setup
    console.log('Testing audio mode setup...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1, // DO_NOT_MIX
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1, // DO_NOT_MIX
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    console.log('✓ Audio mode setup successful');

    // Test 2: Try to create a simple sound
    console.log('Testing basic sound creation...');
    const testAudioUrl = testUrl || 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    
    const { sound } = await Audio.Sound.createAsync(
      { uri: testAudioUrl },
      { 
        shouldPlay: false,
        volume: 0.5,
      }
    );

    console.log('✓ Sound object created successfully');

    // Test 3: Check if sound loaded
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      console.log('✓ Audio loaded successfully');
      console.log('Audio details:', {
        duration: status.durationMillis,
        uri: status.uri
      });
      result.canPlay = true;
    } else {
      console.log('✗ Audio failed to load');
      result.error = 'Audio failed to load';
    }

    // Cleanup
    await sound.unloadAsync();
    console.log('✓ Cleanup completed');

  } catch (error) {
    console.log('✗ Audio diagnostics failed');
    console.error('Diagnostic error:', error);
    result.error = error instanceof Error ? error.message : 'Unknown audio error';
  }

  console.log('=== AUDIO DIAGNOSTICS END ===');
  console.log('Result:', result);
  
  return result;
}

export function getAudioTroubleshootingSteps(diagnostic: AudioDiagnostic): string[] {
  const steps: string[] = [];

  if (!diagnostic.canPlay) {
    steps.push('1. Check device volume and ensure it\'s not muted');
    steps.push('2. Try using wired headphones or different speakers');
    steps.push('3. Restart the app completely');
    
    if (diagnostic.error?.includes('network')) {
      steps.push('4. Check internet connection for streaming audio');
    }
    
    if (diagnostic.error?.includes('format') || diagnostic.error?.includes('codec')) {
      steps.push('4. Try uploading MP3 files instead of other formats');
    }
    
    if (diagnostic.error?.includes('permission')) {
      steps.push('4. Check app permissions in device settings');
    }
    
    steps.push('5. Try uploading a different audio file');
  }

  return steps;
}