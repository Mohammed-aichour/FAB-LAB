import test from 'node:test';
import assert from 'node:assert/strict';
import { transcribeAudio } from '../src/services/audio-transcription.service.js';

test('la transcription audio envoie un fichier contrôlé et retourne le texte', async () => {
  const previousKey=process.env.OPENAI_API_KEY;
  const previousModel=process.env.OPENAI_TRANSCRIPTION_MODEL;
  process.env.OPENAI_API_KEY='test-key';
  delete process.env.OPENAI_TRANSCRIPTION_MODEL;
  try {
    const fakeFetch=async (_url: string | URL | Request, init?: RequestInit) => {
      assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer test-key');
      const form=init?.body as FormData;
      assert.equal(form.get('model'),'gpt-4o-mini-transcribe');
      assert.equal(form.get('language'),'fr');
      const file=form.get('file') as File;
      assert.equal(file.type,'audio/webm');
      assert.equal(file.name,'demande-vocale.webm');
      return new Response(JSON.stringify({text:'État de la CNC 01'}),{status:200,headers:{'Content-Type':'application/json'}});
    };
    const result=await transcribeAudio(new Uint8Array([1,2,3]),'audio/webm;codecs=opus',fakeFetch as typeof fetch);
    assert.equal(result,'État de la CNC 01');
  } finally {
    if(previousKey===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=previousKey;
    if(previousModel===undefined) delete process.env.OPENAI_TRANSCRIPTION_MODEL; else process.env.OPENAI_TRANSCRIPTION_MODEL=previousModel;
  }
});

test('la transcription refuse un format audio non autorisé', async () => {
  const previousKey=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY='test-key';
  try {
    await assert.rejects(transcribeAudio(new Uint8Array([1]),'application/octet-stream'),/Format audio non pris en charge/);
  } finally {
    if(previousKey===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=previousKey;
  }
});
