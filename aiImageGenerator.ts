// AI Image Generator for Audifyx
import { getOpenAIClient } from './openai';

export interface AIImageOptions {
  prompt: string;
  size?: '1024x1024' | '512x512' | '256x256';
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
}

export interface AIImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class AIImageGenerator {
  
  // Generate cover art based on track info
  async generateCoverArt(trackTitle: string, artistName: string, genre?: string): Promise<AIImageResult> {
    try {
      console.log('🎨 Generating AI cover art for:', trackTitle);
      
      // Create a detailed prompt for music cover art
      const prompt = this.createCoverArtPrompt(trackTitle, artistName, genre);
      
      const result = await this.generateImage({
        prompt,
        size: '1024x1024',
        style: 'vivid',
        quality: 'hd'
      });
      
      return result;
    } catch (error) {
      console.error('Failed to generate cover art:', error);
      return {
        success: false,
        error: 'Failed to generate cover art'
      };
    }
  }
  
  // Generate image with custom prompt
  async generateImage(options: AIImageOptions): Promise<AIImageResult> {
    try {
      console.log('🎨 Generating AI image with prompt:', options.prompt);
      
      // Check if OpenAI is configured
      const openaiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
      if (!openaiKey || openaiKey === 'demo-key') {
        console.log('OpenAI not configured, using placeholder image');
        return this.generatePlaceholderImage(options.prompt);
      }
      
      const client = getOpenAIClient();
    const response = await client.images.generate({
        model: 'dall-e-3',
        prompt: options.prompt,
        size: options.size || '1024x1024',
        style: options.style || 'vivid',
        quality: options.quality || 'hd',
        n: 1,
      });
      
      if (response.data && response.data[0]?.url) {
        console.log('✅ AI image generated successfully');
        return {
          success: true,
          imageUrl: response.data[0].url
        };
      } else {
        throw new Error('No image URL in response');
      }
      
    } catch (error: any) {
      console.error('AI image generation failed:', error);
      
      // Fallback to placeholder
      console.log('Falling back to placeholder image');
      return this.generatePlaceholderImage(options.prompt);
    }
  }

  // Generate placeholder image when AI is not available
  private generatePlaceholderImage(prompt: string): AIImageResult {
    // Generate a unique placeholder based on the prompt
    const hash = this.simpleHash(prompt);
    const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E9'];
    const color = colors[hash % colors.length];
    
    // Create a placeholder image URL with the color
    const placeholderUrl = `https://via.placeholder.com/512x512/${color}/FFFFFF?text=🎵`;
    
    return {
      success: true,
      imageUrl: placeholderUrl
    };
  }

  // Simple hash function for consistent placeholder colors
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  // Create optimized prompt for music cover art
  private createCoverArtPrompt(trackTitle: string, artistName: string, genre?: string): string {
    const basePrompt = `Create a professional music album cover art for the song "${trackTitle}" by ${artistName}.`;
    
    let stylePrompt = '';
    if (genre) {
      const genreStyles = {
        'hip-hop': 'urban, street art style, graffiti elements, bold typography',
        'rap': 'gritty, urban aesthetic, bold colors, street photography style',
        'pop': 'bright, colorful, modern, clean design, vibrant',
        'rock': 'edgy, dark, electric, guitar elements, bold',
        'electronic': 'futuristic, neon, digital art, synthwave aesthetic',
        'r&b': 'smooth, elegant, sophisticated, warm colors',
        'jazz': 'classic, vintage, sophisticated, warm tones',
        'country': 'rustic, americana, vintage, earthy tones',
        'classical': 'elegant, sophisticated, orchestral, timeless',
        'reggae': 'tropical, warm colors, island vibes, relaxed',
        'folk': 'organic, natural, acoustic, earthy',
        'metal': 'dark, powerful, aggressive, heavy imagery'
      };
      
      const lowerGenre = genre.toLowerCase();
      stylePrompt = (genreStyles as any)[lowerGenre] || 'modern, artistic, creative';
    } else {
      stylePrompt = 'modern, artistic, creative, music-themed';
    }
    
    const finalPrompt = `${basePrompt} Style: ${stylePrompt}. High quality, professional album cover design, no text overlays, artistic, visually striking, suitable for music streaming platforms.`;
    
    console.log('Generated prompt:', finalPrompt);
    return finalPrompt;
  }
  
  // Generate multiple cover art options
  async generateMultipleCoverOptions(trackTitle: string, artistName: string, genre?: string): Promise<AIImageResult[]> {
    const variations = [
      'abstract and colorful',
      'minimalist and elegant', 
      'vibrant and energetic'
    ];
    
    const results: AIImageResult[] = [];
    
    for (const variation of variations) {
      try {
        const basePrompt = this.createCoverArtPrompt(trackTitle, artistName, genre);
        const variationPrompt = `${basePrompt} Art style: ${variation}.`;
        
        const result = await this.generateImage({
          prompt: variationPrompt,
          size: '1024x1024',
          style: 'vivid',
          quality: 'standard'
        });
        
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: `Failed to generate ${variation} variation`
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const aiImageGenerator = new AIImageGenerator();