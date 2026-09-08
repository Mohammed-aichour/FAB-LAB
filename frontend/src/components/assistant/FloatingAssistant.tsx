import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CalendarClock, Check, ChevronDown, CircuitBoard, Copy, Maximize2, Mic, MicOff, Minimize2, PackageSearch, RotateCcw, Send, Sparkles, Wrench, X } from 'lucide-react';
import { api, apiForm } from '../../services/api';
import { flushSync, refreshFromServer } from '../../services/db';

type Action = { id:string; summary:string; expiresAt:string; status:string; oldValue:unknown; newValue:any };
type Message = { role:'user'|'assistant'; content:string; tools?:string[] };
type OrbState = 'idle' | 'thinking' | 'responding' | 'open';
type QuickAction = { label: string; prompt: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const suggestions = [
  { prompt:'Quelles machines sont actuellement en panne ?', label:'État du parc', detail:'Machines indisponibles', icon:Wrench },
  { prompt:'Quels composants sont en stock critique ?', label:'Stocks critiques', detail:'Seuils et ruptures', icon:PackageSearch },
  { prompt:'Quelles maintenances sont prévues cette semaine ?', label:'Planning maintenance', detail:'Prévisions de la semaine', icon:CalendarClock },
];

function quickActionsFor(content: string): QuickAction[] {
  const normalized = content.toLocaleLowerCase('fr-FR');
  if (/stock|composant|pièce|rupture/.test(normalized)) return [
    { label:'Stocks critiques', prompt:'Quels composants sont actuellement en stock critique ?' },
    { label:'Fournisseurs associés', prompt:'Quels fournisseurs sont associés à ces composants ?' },
  ];
  if (/machine|panne|équipement/.test(normalized)) return [
    { label:'Interventions récentes', prompt:'Quelles interventions ont été réalisées récemment sur ces machines ?' },
    { label:'Maintenances prévues', prompt:'Quelles maintenances sont prévues pour ces machines ?' },
  ];
  if (/maintenance|intervention/.test(normalized)) return [
    { label:'Voir les machines', prompt:'Quelles machines sont concernées par ces opérations ?' },
    { label:'Résumé du jour', prompt:'Résume-moi l’état du FabLab aujourd’hui.' },
  ];
  return [{ label:'Résumé du jour', prompt:'Résume-moi l’état du FabLab aujourd’hui.' }];
}

export function formatAssistantText(value: string) {
  let listIndex = 0;
  return value
    .replace(/```[\s\S]*?```/g, block => block.replace(/```[^\n]*\n?/g, '').replace(/```/g, ''))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
    .split('\n')
    .map(line => {
      const clean = line
        .replace(/^\s{0,3}#{1,6}\s*/, '')
        .replace(/^\s*>\s?/, '')
        .replace(/\*\*|__|`/g, '')
        .trimEnd();
      if (/^\s*[-*•]\s+/.test(clean)) {
        listIndex += 1;
        return `${listIndex}. ${clean.replace(/^\s*[-*•]\s+/, '')}`;
      }
      listIndex = 0;
      if (/^\s*\|.*\|\s*$/.test(clean)) return clean.split('|').map(cell => cell.trim()).filter(Boolean).join(' — ');
      return clean;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function FloatingAssistant({ user }: { user: { id: string | number; role: string } }) {
  const [messages,setMessages] = useState<Message[]>([]);
  const [actions,setActions] = useState<Action[]>([]);
  const [conversationId,setConversationId] = useState<string>();
  const [text,setText] = useState('');
  const [busy,setBusy] = useState(false);
  const [responding,setResponding] = useState(false);
  const [open,setOpen] = useState(false);
  const [expanded,setExpanded] = useState(false);
  const [listening,setListening] = useState(false);
  const [transcribing,setTranscribing] = useState(false);
  const [copiedMessage,setCopiedMessage] = useState<number>();
  const [error,setError] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerFrame = useRef<number | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbState: OrbState = busy ? 'thinking' : responding ? 'responding' : open ? 'open' : 'idle';

  useEffect(()=>{
    if(user?.role === 'Superviseur') void api<Action[]>('/assistant/actions').then(setActions).catch(e=>setError(e.message));
  },[user?.id,user?.role]);
  useEffect(()=>{ if(open) end.current?.scrollIntoView({behavior:'smooth',block:'nearest'}); },[messages,busy,open,actions]);
  useEffect(()=>{ if(open) window.setTimeout(()=>input.current?.focus(),180); },[open]);
  useEffect(()=>{
    const close = (event: KeyboardEvent) => { if(event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown',close);
    return ()=>{
      window.removeEventListener('keydown',close);
      if(responseTimer.current) clearTimeout(responseTimer.current);
      if(pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
      if(recordingTimer.current) clearTimeout(recordingTimer.current);
      recognition.current?.stop();
      if(mediaRecorder.current?.state !== 'inactive') mediaRecorder.current?.stop();
      mediaStream.current?.getTracks().forEach(track=>track.stop());
    };
  },[]);
  if(user?.role !== 'Superviseur') return null;

  function markResponse() {
    setResponding(true);
    if(responseTimer.current) clearTimeout(responseTimer.current);
    responseTimer.current=setTimeout(()=>setResponding(false),900);
  }

  function moveAssistantLight(event: ReactPointerEvent<HTMLElement>) {
    if(event.pointerType==='touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const panel=event.currentTarget;
    const bounds=panel.getBoundingClientRect();
    const x=Math.max(0,Math.min(bounds.width,event.clientX-bounds.left));
    const y=Math.max(0,Math.min(bounds.height,event.clientY-bounds.top));
    if(pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current=requestAnimationFrame(()=>{
      panel.style.setProperty('--assistant-pointer-x',`${x}px`);
      panel.style.setProperty('--assistant-pointer-y',`${y}px`);
      panel.style.setProperty('--assistant-shift-x',`${((x/bounds.width)-.5)*10}px`);
      panel.style.setProperty('--assistant-shift-y',`${((y/bounds.height)-.5)*7}px`);
      panel.style.setProperty('--assistant-tilt-x',`${(.5-(y/bounds.height))*.8}deg`);
      panel.style.setProperty('--assistant-tilt-y',`${((x/bounds.width)-.5)*.8}deg`);
    });
  }

  function resetAssistantLight(event: ReactPointerEvent<HTMLElement>) {
    const panel=event.currentTarget;
    panel.style.setProperty('--assistant-pointer-x','50%');
    panel.style.setProperty('--assistant-pointer-y','26%');
    panel.style.setProperty('--assistant-shift-x','0px');
    panel.style.setProperty('--assistant-shift-y','0px');
    panel.style.setProperty('--assistant-tilt-x','0deg');
    panel.style.setProperty('--assistant-tilt-y','0deg');
  }

  function copyMessage(content: string, index: number) {
    const value=formatAssistantText(content);
    const markCopied=()=>{
      setCopiedMessage(index);
      window.setTimeout(()=>setCopiedMessage(current=>current===index ? undefined : current),1600);
    };
    const fallbackCopy=()=>{
      const textarea=document.createElement('textarea');
      textarea.value=value;
      textarea.setAttribute('readonly','');
      textarea.style.cssText='position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(textarea);
      textarea.select();
      const copied=document.execCommand('copy');
      textarea.remove();
      if(!copied) throw new Error('Copie refusée');
    };
    try {
      fallbackCopy();
      markCopied();
    } catch {
      if(navigator.clipboard?.writeText) void navigator.clipboard.writeText(value).then(markCopied).catch(()=>setError('La réponse n’a pas pu être copiée.'));
      else setError('La réponse n’a pas pu être copiée.');
    }
  }

  function stopMediaRecording() {
    if(recordingTimer.current) clearTimeout(recordingTimer.current);
    recordingTimer.current=null;
    if(mediaRecorder.current?.state !== 'inactive') mediaRecorder.current?.stop();
  }

  async function transcribeRecording(blob: Blob) {
    if(!blob.size) { setError('Aucune parole n’a été enregistrée.'); return; }
    setTranscribing(true);
    setError('');
    try {
      const extension=blob.type.includes('mp4')?'mp4':blob.type.includes('ogg')?'ogg':blob.type.includes('mpeg')?'mp3':blob.type.includes('wav')?'wav':'webm';
      const form=new FormData();
      form.append('audio',blob,`demande-vocale.${extension}`);
      const result=await apiForm<{text:string}>('/assistant/transcribe',form);
      if(result.text) setText(current=>`${current}${current ? ' ' : ''}${result.text}`);
      window.setTimeout(()=>input.current?.focus(),0);
    } catch(e) {
      setError(e instanceof Error ? e.message : 'La transcription vocale a échoué.');
    } finally { setTranscribing(false); }
  }

  async function startMediaRecording() {
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return false;
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    mediaStream.current=stream;
    const preferredTypes=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
    const mimeType=preferredTypes.find(type=>MediaRecorder.isTypeSupported(type));
    const recorder=new MediaRecorder(stream,mimeType ? {mimeType} : undefined);
    const chunks: Blob[]=[];
    mediaRecorder.current=recorder;
    recorder.ondataavailable=event=>{ if(event.data.size) chunks.push(event.data); };
    recorder.onerror=()=>{
      setListening(false);
      stream.getTracks().forEach(track=>track.stop());
      setError('L’enregistrement vocal a été interrompu.');
    };
    recorder.onstop=()=>{
      setListening(false);
      mediaRecorder.current=null;
      stream.getTracks().forEach(track=>track.stop());
      mediaStream.current=null;
      void transcribeRecording(new Blob(chunks,{type:recorder.mimeType || mimeType || 'audio/webm'}));
    };
    recorder.start();
    setListening(true);
    recordingTimer.current=setTimeout(stopMediaRecording,30_000);
    return true;
  }

  async function toggleVoice() {
    if(listening) {
      if(recognition.current) recognition.current.stop();
      else stopMediaRecording();
      return;
    }
    if(transcribing) return;
    setError('');
    try {
      if(await startMediaRecording()) return;
    } catch(e) {
      setListening(false);
      mediaStream.current?.getTracks().forEach(track=>track.stop());
      mediaStream.current=null;
      const name=e instanceof DOMException ? e.name : '';
      if(name==='NotAllowedError' || name==='SecurityError') setError('Microphone bloqué. Autorisez-le dans les paramètres du site, puis réessayez.');
      else if(name==='NotFoundError') setError('Aucun microphone n’a été détecté.');
      else setError('Impossible d’ouvrir le microphone. Vérifiez qu’il n’est pas utilisé par une autre application.');
      return;
    }
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if(Recognition) {
      const instance = new Recognition();
      recognition.current = instance;
      instance.lang='fr-FR';
      instance.continuous=false;
      instance.interimResults=false;
      instance.onresult=event=>{
        const transcript=Array.from(event.results).map(result=>result[0]?.transcript || '').join(' ').trim();
        if(transcript) setText(current=>`${current}${current ? ' ' : ''}${transcript}`);
      };
      instance.onerror=event=>setError(event.error==='not-allowed' ? 'Autorisez le microphone pour utiliser la saisie vocale.' : 'La saisie vocale n’a pas pu démarrer.');
      instance.onend=()=>{ setListening(false); recognition.current=null; };
      setListening(true);
      try { instance.start(); } catch { setListening(false); setError('La saisie vocale n’a pas pu démarrer.'); }
      return;
    }
    setError('Ce navigateur ne fournit aucune fonction d’enregistrement vocal. Utilisez Chrome ou Edge.');
  }

  async function send(valueOverride?: string) {
    const value=(valueOverride ?? text).trim(); if(!value || busy) return;
    if (actions.length > 0 && /^(confirmer?|confirm|oui|valider?|d'accord|ok|ex[ée]cute|go)$/i.test(value)) {
      setText('');
      await decide(actions[actions.length - 1], true);
      return;
    }
    if (actions.length > 0 && /^(annuler?|cancel|non|refuser?)$/i.test(value)) {
      setText('');
      await decide(actions[actions.length - 1], false);
      return;
    }
    setBusy(true); setResponding(false); setError(''); setText(''); setOpen(true);
    setMessages(m=>[...m,{role:'user',content:value}]);
    try {
      await flushSync();
      const result=await api('/assistant/chat',{message:value,...(conversationId ? {conversationId} : {})});
      setConversationId(result.conversationId);
      setMessages(m=>[...m,{role:'assistant',content:formatAssistantText(result.message),tools:result.usedTools}]);
      if(result.pendingAction) setActions(a=>[...a,result.pendingAction]);
      markResponse();
    } catch(e) {
      setMessages(m=>m.slice(0,-1));
      setError(e instanceof Error ? e.message : 'La demande n’a pas pu être traitée.');
      setText(value);
    } finally {setBusy(false);}
  }

  async function decide(action:Action,confirm:boolean) {
    setBusy(true); setError('');
    try {
      await flushSync();
      await api(`/assistant/actions/${action.id}/${confirm?'confirm':'cancel'}`,confirm?{confirm:true}:{});
      setActions(a=>a.filter(x=>x.id!==action.id));
      setMessages(m=>[...m,{role:'assistant',content:confirm ? `Action réalisée\n\n${action.summary}` : `Action annulée\n\n${action.summary}`}]);
      if(confirm) {
        await refreshFromServer();
        window.dispatchEvent(new Event('gmao_data_updated'));
      }
      markResponse();
    } catch(e) {setError(e instanceof Error ? e.message : 'L’action n’a pas pu être traitée.');}
    finally {setBusy(false);}
  }

  return <div className="floating-assistant" data-state={orbState}>
    <section id="fablab-assistant-panel" role="dialog" aria-label="Assistant IA du FabLab" aria-hidden={!open}
      onPointerMove={moveAssistantLight} onPointerLeave={resetAssistantLight}
      className={`assistant-panel ${open ? 'assistant-panel-open' : ''} ${expanded ? 'assistant-panel-expanded' : ''}`}>
      <header className="assistant-header">
        <div className="assistant-header-ambient" aria-hidden="true"><span/><span/><span/></div>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="assistant-header-logo"><img src="./Fab.png" alt="" /></div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-white">Assistant FabLab</h2>
              <p className="assistant-connection"><span/>Connecté aux données GMAO</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" aria-label={expanded?'Réduire la taille du panneau':'Agrandir le panneau'} title={expanded?'Mode compact':'Mode agrandi'}
              className="assistant-header-button" onClick={()=>setExpanded(value=>!value)}>{expanded?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button>
            <button type="button" aria-label="Nouvelle conversation" title="Nouvelle conversation" disabled={busy}
              className="assistant-header-button" onClick={()=>{setMessages([]);setConversationId(undefined);setError('');}}><RotateCcw size={16}/></button>
            <button type="button" aria-label="Réduire l’assistant" className="assistant-header-button" onClick={()=>setOpen(false)}><ChevronDown size={18}/></button>
          </div>
        </div>
      </header>

      <div role="log" aria-label="Conversation" aria-live="polite" className="assistant-messages custom-scrollbar">
        {!messages.length && <div className="assistant-welcome">
          <div className="assistant-welcome-icon"><CircuitBoard size={20}/></div>
          <span className="assistant-welcome-kicker">Centre de commande</span>
          <h3>Comment puis-je vous aider ?</h3>
          <div className="assistant-suggestions">{suggestions.map(({prompt,label,detail,icon:Icon})=><button key={prompt} type="button" disabled={busy} onClick={()=>void send(prompt)}>
            <span className="assistant-suggestion-icon"><Icon size={16}/></span>
            <span><strong>{label}</strong><small>{detail}</small></span>
            <ChevronDown className="assistant-suggestion-arrow" size={15}/>
          </button>)}</div>
        </div>}
        {messages.map((message,index)=><article key={index} className={`assistant-message-row ${message.role}`}>
          {message.role==='assistant' && <div className="assistant-mini-logo"><img src="./Fab.png" alt="" /></div>}
          <div className="assistant-message">
            <p className="assistant-message-label">{message.role==='user'?'Vous':'Assistant'}</p>
            <div>{message.role==='assistant' ? formatAssistantText(message.content) : message.content}</div>
            {message.role==='assistant' && !!message.tools?.length && <p className="assistant-verified"><Check size={12}/>Données GMAO vérifiées</p>}
            {message.role==='assistant' && <div className="assistant-response-actions">
              <button type="button" onClick={()=>copyMessage(message.content,index)} aria-label="Copier la réponse">
                {copiedMessage===index?<Check size={12}/>:<Copy size={12}/>} {copiedMessage===index?'Copié':'Copier'}
              </button>
              {index===messages.length-1 && quickActionsFor(message.content).map(action=><button type="button" key={action.label} disabled={busy} onClick={()=>void send(action.prompt)}>{action.label}</button>)}
            </div>}
          </div>
        </article>)}
        {busy && <div className="assistant-thinking" role="status"><span/><span/><span/><p>Analyse des données GMAO…</p></div>}
        <div ref={end}/>
      </div>

      {!!actions.length && <div className="assistant-actions custom-scrollbar">{actions.map(action=><article key={action.id} className="assistant-action-card">
        <div className="flex items-start gap-2"><div className="assistant-action-icon">!</div><div><h3>Confirmation requise</h3><p>{action.summary}</p></div></div>
        {action.newValue?.email && <div className="assistant-email-preview"><p><strong>Destinataire</strong><br/>{action.newValue.email.to || 'Email non renseigné'}</p><p><strong>Objet</strong><br/>{action.newValue.email.subject}</p><p>{formatAssistantText(action.newValue.email.body)}</p><span>Brouillon non envoyé</span></div>}
        <details><summary>Afficher les données avant et après</summary><pre>{JSON.stringify({avant:action.oldValue,apres:action.newValue},null,2)}</pre></details>
        <p className="assistant-expiry">Valable jusqu’à {new Date(action.expiresAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</p>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy || Date.now()>new Date(action.expiresAt).getTime()} onClick={()=>void decide(action,true)} className="assistant-confirm"><Check size={15}/>Confirmer</button><button type="button" disabled={busy} onClick={()=>void decide(action,false)} className="assistant-cancel"><X size={15}/>Annuler</button></div>
      </article>)}</div>}

      <form onSubmit={event=>{event.preventDefault();void send();}} className="assistant-composer">
        {error && <p role="alert" className="assistant-error">{error}</p>}
        <div className="assistant-input-wrap">
          <textarea ref={input} value={text} onChange={event=>setText(event.target.value)} maxLength={5000} rows={1}
            aria-label="Votre demande" placeholder="Demandez quelque chose à la GMAO…"
            onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void send();}}}/>
          <button type="button" className={`assistant-voice ${listening?'active':''} ${transcribing?'transcribing':''}`} disabled={transcribing}
            aria-label={listening?'Arrêter l’écoute':transcribing?'Transcription en cours':'Dicter une demande'} aria-pressed={listening} onClick={()=>void toggleVoice()}>{listening?<MicOff size={16}/>:<Mic size={16}/>}</button>
          <button type="submit" className="assistant-send" aria-label="Envoyer" disabled={busy||!text.trim()}><Send size={17}/></button>
        </div>
        <p className={`assistant-composer-hint ${listening?'listening':''} ${transcribing?'transcribing':''}`}>{listening?'Écoute en cours… cliquez de nouveau pour terminer':transcribing?'Transcription de votre message…':'Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne'}</p>
      </form>
    </section>

    <button type="button" className="assistant-orb" aria-label={open?'Réduire l’assistant IA':'Ouvrir l’assistant IA'}
      aria-expanded={open} aria-controls="fablab-assistant-panel" onClick={()=>setOpen(value=>!value)}>
      <span className="assistant-orb-ring" aria-hidden="true"/>
      <span className="assistant-orb-glow" aria-hidden="true"/>
      <span className="assistant-orb-core"><img src="./Fab.png" alt=""/><Sparkles className="assistant-orb-spark" size={13}/></span>
      {busy && <span className="assistant-orb-particles" aria-hidden="true"><i/><i/><i/></span>}
      <span className="sr-only">{busy?'L’assistant analyse les données':responding?'Une réponse est disponible':''}</span>
    </button>
  </div>;
}
