import React, { useState, useEffect, useRef } from 'react';
import { GameMode } from './types';
import { Battle } from './components/Battle';
import { Gamepad2, Trophy, Star, Zap } from 'lucide-react';

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
          <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center cursor-pointer overflow-hidden intro-cinematic" onClick={handleStartGame}>
              
              {/* Step 0: Copyright */}
              {introStep === 0 && (
                  <div className="text-center font-mono animate-pulse">
                      <p className="mb-4 text-xs sm:text-base">© 2024 POKEAI Corp.</p>
                      <p className="text-xs sm:text-base">Created by GenAI</p>
                  </div>
              )}

              {/* Step 1: Game Freak Style Star */}
              {introStep === 1 && (
                  <div className="relative">
                       <Star className="w-24 h-24 sm:w-48 sm:h-48 text-yellow-400 fill-current animate-spin" />
                       <div className="absolute top-0 left-0 w-full h-full bg-white animate-ping opacity-50"></div>
                  </div>
              )}

              {/* Step 2: Title Screen */}
              {introStep === 2 && (
                  <div className="absolute inset-0 bg-red-700 flex flex-col items-center justify-center">
                        {/* Background Effect */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-red-800 to-black opacity-80"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                             <div className="bg-black/80 p-6 sm:p-12 rounded-xl border-4 border-white text-center shadow-2xl mb-8 transform scale-90 sm:scale-100">
                                 <h1 className="text-4xl sm:text-7xl font-bold text-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] mb-4 tracking-tighter text-glowing">
                                     POKéAI
                                 </h1>
                                 <h2 className="text-lg sm:text-3xl text-red-500 font-bold mb-4 uppercase bg-white px-2">Red Version</h2>
                             </div>
                             
                             <div className="animate-bounce mt-8 cursor-pointer">
                                 <p className="text-white font-bold text-xs sm:text-lg bg-black/50 px-6 py-3 rounded border-2 border-white/50 hover:bg-white hover:text-black transition-colors">
                                     CLICK TO START
                                 </p>
                             </div>
                        </div>

                        {/* Silhouettes */}
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif" className="absolute bottom-5 right-5 w-32 h-32 sm:w-48 sm:h-48 opacity-90 drop-shadow-2xl" />
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif" className="absolute bottom-5 left-5 w-24 h-24 sm:w-32 sm:h-32 opacity-90 scale-x-[-1] drop-shadow-2xl" />
                        <Zap className="absolute top-10 right-10 text-yellow-400 w-12 h-12 animate-pulse" />
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
             <div className="w-full max-w-md bg-red-600 p-2 rounded-xl shadow-2xl border-b-8 border-r-8 border-red-900 animate-slide-in-right">
                <div className="bg-slate-800 rounded-lg p-6 border-4 border-slate-700">
                    <h1 className="text-white text-center text-xl sm:text-2xl font-bold mb-8 tracking-widest text-shadow-sm font-[system-ui]">POKéAI RED</h1>
                    
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => startBattle(false)}
                            className="bg-slate-100 hover:bg-slate-200 border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 p-4 sm:p-6 rounded flex items-center justify-center gap-4 transition"
                        >
                            <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                            <div className="flex flex-col text-left">
                                <span className="text-sm sm:text-lg font-bold uppercase text-slate-900">Start Story Mode</span>
                                <span className="text-[10px] text-slate-500 font-mono">Defeat 8 Gym Leaders</span>
                            </div>
                        </button>

                        {eliteFourUnlocked ? (
                            <button 
                                onClick={() => startBattle(true)}
                                className="bg-yellow-400 hover:bg-yellow-300 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 p-4 sm:p-6 rounded flex items-center justify-center gap-4 transition animate-pulse"
                            >
                                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900" />
                                <span className="text-sm sm:text-lg font-bold uppercase text-slate-900">Elite Four</span>
                            </button>
                        ) : (
                             <div className="p-4 rounded border-2 border-dashed border-slate-600 text-center">
                                 <p className="text-[10px] sm:text-xs text-slate-500 font-mono uppercase">Defeat Story Mode to unlock Elite Four</p>
                             </div>
                        )}
                    </div>

                    <div className="mt-8 text-center text-[10px] text-slate-500 font-mono">
                        v1.5.0 | Story Update
                    </div>
                </div>
             </div>
          </div>
        );
    }
  };

  return renderContent();
}