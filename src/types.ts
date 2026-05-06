export type Tone = 'professional' | 'witty' | 'urgent';

export interface PostContent {
  platform: 'linkedin' | 'twitter' | 'instagram';
  text: string;
  imagePrompt: string;
  aspectRatio: '1:1' | '16:9';
}

export interface GeneratedPost {
  platform: 'linkedin' | 'twitter' | 'instagram';
  text: string;
  imageUrl: string | null;
}
