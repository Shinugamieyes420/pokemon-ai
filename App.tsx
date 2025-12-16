import React, { useState, useEffect, useRef } from 'react';
import { GameMode } from './types';
import { Battle } from './components/Battle';
import { Gamepad2, Trophy, Star } from 'lucide-react';

const INTRO_MUSIC_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/paza-moduless.mp3"; 

export default function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [eliteFourUnlocked, setEliteFourUnlocked] = useState(false);
  const [isEliteFourRun, setIsEliteFourRun] = useState(false);
  
  // Intro State
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0); // 0: Copyright, 1: Star, 2: Title
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check local storage for unlock status
  useEffect(() => {
    if (localStorage.getItem('pokeai_e4_unlocked') === 'true') {
        setEliteFourUnlocked(true);
    }
  }, []);

  useEffect(() => {
      // Intro Animation Sequence
      if (showIntro) {
          const t1 = setTimeout(() => setIntroStep(1), 2500); // Show Copyright for 2.5s
          const t2 = setTimeout(() => setIntroStep(2), 5000); // Show Star for 2.5s
          return () => { clearTimeout(t1); clearTimeout(t2); }
      }
  }, [showIntro]);

  const handleStartGame = () => {
      // User Interaction here ensures audio plays reliably
      if (!audioRef.current) {
          audioRef.current = new Audio(INTRO_MUSIC_URL);
          audioRef.current.volume = 0.3;
          audioRef.current.loop = true;
      }
      audioRef.current.play().catch(console.error);
      
      setShowIntro(false);
  };

  const handleUnlockElite4 = () => {
      setEliteFourUnlocked(true);
      localStorage.setItem('pokeai_e4_unlocked', 'true');
  };

  const startBattle = (e4: boolean) => {
      setIsEliteFourRun(e4);
      setMode(GameMode.BATTLE);
  };

  if (showIntro) {
      return (
          <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center cursor-pointer overflow-hidden" onClick={handleStartGame}>
              
              {/* Step 0: Copyright */}
              {introStep === 0 && (
                  <div className="intro-fade text-center font-mono">
                      <p className="mb-4">© 2024 POKEAI Corp.</p>
                      <p>Created by GenAI</p>
                  </div>
              )}

              {/* Step 1: Game Freak Style Star */}
              {introStep === 1 && (
                  <div className="intro-flash relative">
                       <Star className="w-24 h-24 text-yellow-400 fill-current animate-spin" />
                       <div className="absolute top-0 left-0 w-full h-full bg-white animate-ping opacity-50"></div>
                  </div>
              )}

              {/* Step 2: Title Screen */}
              {introStep === 2 && (
                  <div className="absolute inset-0 bg-red-600 flex flex-col items-center justify-center animate-pulse">
                        <div className="bg-black/80 p-8 rounded-xl border-4 border-white text-center shadow-2xl">
                             <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] mb-4 tracking-tighter">
                                 POKéAI
                             </h1>
                             <h2 className="text-2xl text-red-500 font-bold mb-8 uppercase">Red Version</h2>
                             
                             <div className="animate-bounce mt-8">
                                 <p className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded">PRESS START</p>
                             </div>
                        </div>
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif" className="absolute bottom-10 right-10 w-32 h-32 opacity-80" />
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif" className="absolute bottom-10 left-10 w-24 h-24 opacity-80 scale-x-[-1]" />
                  </div>
              )}
          </div>
      )
  }

  const renderContent = () => {
    switch (mode) {
      case GameMode.BATTLE:
        // Stop menu music when battle starts
        if (audioRef.current) { audioRef.current.pause(); }
        return <Battle onBack={() => {
             setMode(GameMode.MENU);
             if(audioRef.current) audioRef.current.play();
        }} isEliteFour={isEliteFourRun} onComplete={!isEliteFourRun ? handleUnlockElite4 : undefined} />;
      default:
        return (
          <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4">
             <div className="w-full max-w-md bg-red-600 p-2 rounded-xl shadow-2xl border-b-8 border-r-8 border-red-900">
                <div className="bg-slate-800 rounded-lg p-6 border-4 border-slate-700">
                    <h1 className="text-white text-center text-2xl font-bold mb-8 tracking-widest text-shadow-sm font-[system-ui]">POKéAI RED</h1>
                    
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => startBattle(false)}
                            className="bg-slate-100 hover:bg-slate-200 border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 p-6 rounded flex items-center justify-center gap-4 transition"
                        >
                            <Gamepad2 className="w-8 h-8 text-red-600" />
                            <span className="text-lg font-bold uppercase text-slate-900">Story Mode</span>
                        </button>

                        {eliteFourUnlocked ? (
                            <button 
                                onClick={() => startBattle(true)}
                                className="bg-yellow-400 hover:bg-yellow-300 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 p-6 rounded flex items-center justify-center gap-4 transition animate-pulse"
                            >
                                <Trophy className="w-8 h-8 text-slate-900" />
                                <span className="text-lg font-bold uppercase text-slate-900">Elite Four</span>
                            </button>
                        ) : (
                             <div className="p-4 rounded border-2 border-dashed border-slate-600 text-center">
                                 <p className="text-xs text-slate-500 font-mono uppercase">Defeat Story Mode to unlock Elite Four</p>
                             </div>
                        )}
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-500 font-mono">
                        v1.3.0 | 3D Update
                    </div>
                </div>
             </div>
          </div>
        );
    }
  };

  return renderContent();
}