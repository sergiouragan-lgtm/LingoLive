import { auth } from '../../firebase';

export class WhisperService {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Transcribe an audio Blob to text using the Whisper API endpoint.
   * @param audioBlob The audio Blob to transcribe.
   * @param language The name of the target language (e.g., 'English', 'Portuguese', 'Chinese').
   * @returns The transcribed text.
   */
  public static async transcribe(audioBlob: Blob, language: string): Promise<string> {
    const reader = new FileReader();
    
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Split out the data:audio/... prefix if present
        const cleanBase64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;
        resolve(cleanBase64);
      };
      reader.onerror = (err) => reject(err);
    });

    reader.readAsDataURL(audioBlob);
    const audioBase64 = await base64Promise;

    const headers = await this.getAuthHeaders();
    const response = await fetch('/api/pronunciation/transcribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        audioBase64,
        language,
        mimeType: audioBlob.type || 'audio/webm'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to transcribe audio using Whisper Service');
    }

    const data = await response.json();
    return data.text || '';
  }
}
