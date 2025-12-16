import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceChatProps {
  onBack: () => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ onBack }) => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Disconnected");
  
  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Clean up function
  const cleanup = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setActive(false);
    setStatus("Disconnected");
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const startSession = async () => {
    try {
        setStatus("Connecting...");
        
        // Initialize Audio Contexts
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        inputContextRef.current = new AudioContext({sampleRate: 16000});
        outputContextRef.current = new AudioContext({sampleRate: 24000});
        nextStartTimeRef.current = 0;

        // Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Connect Live API
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }, // Deep voice like Oak
                },
                systemInstruction: 'You are Professor Oak from the world of Pokemon. You are knowledgeable, encouraging, and speak about Pokemon as if they are real creatures. Keep responses concise.',
            },
            callbacks: {
                onopen: () => {
                    setStatus("Connected to Oak");
                    setActive(true);

                    // Setup Input Stream Processing
                    if (!inputContextRef.current) return;
                    
                    const source = inputContextRef.current.createMediaStreamSource(stream);
                    sourceNodeRef.current = source;
                    
                    const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
                    processorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputContextRef.current.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const audioStr = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioStr && outputContextRef.current) {
                        const ctx = outputContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        
                        const bytes = base64ToUint8Array(audioStr);
                        const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
                        
                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(ctx.destination);
                        
                        source.addEventListener('ended', () => {
                            sourcesRef.current.delete(source);
                        });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += buffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onclose: () => {
                    setStatus("Connection Closed");
                    setActive(false);
                },
                onerror: (err) => {
                    console.error(err);
                    setStatus("Error occurred");
                }
            }
        });

    } catch (e) {
        console.error(e);
        setStatus("Failed to start audio");
    }
  };

  const toggleSession = () => {
    if (active) {
        cleanup();
    } else {
        startSession();
    }
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-6 border-4 border-slate-600 flex flex-col items-center">
         <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-2 border-blue-300">
            <Volume2 className={`w-12 h-12 text-blue-600 ${active ? 'animate-pulse' : ''}`} />
         </div>
         
         <h2 className="text-lg font-bold uppercase mb-2">Professor Oak Comms</h2>
         <p className="text-xs text-slate-500 mb-6 font-mono">{status}</p>

         <button 
            onClick={toggleSession}
            className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 mb-4 transition-colors ${active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
         >
            {active ? <><MicOff /> End Call</> : <><Mic /> Call Professor</>}
         </button>

         <button onClick={onBack} className="text-xs text-slate-400 underline hover:text-slate-600">
            Back to Menu
         </button>
      </div>
    </div>
  );
};