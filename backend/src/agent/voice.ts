// The text agent remains the single business entry point for future voice adapters.
export interface SpeechToText { transcribe(audio: Uint8Array, mimeType: string): Promise<string> }
export interface TextToSpeech { synthesize(text: string): Promise<Uint8Array> }
// Future ElevenLabs adapter reads ELEVENLABS_API_KEY on the backend only.
// Voice never confirms actions: keep the explicit authenticated confirmation endpoint.
