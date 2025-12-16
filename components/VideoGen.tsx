import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, Upload, Video } from 'lucide-react';

interface VideoGenProps {
  onBack: () => void;
}

export const VideoGen: React.FC<VideoGenProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [keySelected, setKeySelected] = useState(false);

  const checkKey = async () => {
    try {
        const win = window as any;
        if (win.aistudio && await win.aistudio.hasSelectedApiKey()) {
            setKeySelected(true);
        } else {
            if(win.aistudio) {
                await win.aistudio.openSelectKey();
                // Assume success after dialog interaction to avoid race condition
                setKeySelected(true);
            } else {
                alert("AI Studio environment not detected.");
            }
        }
    } catch (e) {
        console.error(e);
        // Fallback for demo purposes if not in actual AI studio environment
        setKeySelected(true); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const generateVideo = async () => {
    if (!image) return;
    setLoading(true);
    setStatus('Initializing Veo Model...');

    try {
        // Must re-instantiate specifically for Veo after key selection
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];

        setStatus('Uploading to Veo...');
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            image: {
                imageBytes: base64Data,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        setStatus('Generating Video (this takes a moment)...');

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
            const downloadLink = operation.response.generatedVideos[0].video.uri;
            // Append API Key for fetch
            const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            
            // Create a blob to display in video tag
            const vidRes = await fetch(fetchUrl);
            const vidBlob = await vidRes.blob();
            setVideoUrl(URL.createObjectURL(vidBlob));
            setStatus('Complete!');
        } else {
            setStatus('Failed to generate video.');
        }

    } catch (error) {
        console.error(error);
        setStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
        setLoading(false);
    }
  };

  if (!keySelected) {
      return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
             <div className="bg-white p-8 rounded-lg text-center max-w-md">
                <Video className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h2 className="text-xl font-bold mb-4">Cinema Mode Required</h2>
                <p className="text-sm text-slate-600 mb-6">
                    To use high-quality Veo video generation, you must select a paid billing project.
                </p>
                <div className="space-y-4">
                    <button 
                        onClick={checkKey}
                        className="w-full bg-purple-600 text-white py-3 rounded font-bold hover:bg-purple-700 transition"
                    >
                        Select Billing Project
                    </button>
                    <button onClick={onBack} className="text-sm text-slate-500 underline">Cancel</button>
                </div>
                <div className="mt-6 text-xs text-slate-400">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline">Read Billing Docs</a>
                </div>
             </div>
        </div>
      )
  }

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg p-6 border-4 border-slate-600">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold uppercase text-slate-800">Veo Cinema</h2>
                <button onClick={onBack} className="text-xs text-red-500 hover:underline">Exit</button>
            </div>

            <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 p-8 rounded text-center">
                    {image ? (
                        <div className="relative inline-block">
                             <img src={image} className="h-40 rounded object-cover" alt="Source" />
                             <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs">X</button>
                        </div>
                    ) : (
                        <label className="cursor-pointer block">
                            <Upload className="mx-auto w-8 h-8 text-slate-400 mb-2"/>
                            <span className="text-sm text-slate-600 font-bold">Upload Source Image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    )}
                </div>

                {loading ? (
                    <div className="bg-slate-100 p-4 rounded text-center border border-slate-200">
                         <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2 text-purple-600" />
                         <p className="text-xs font-mono text-purple-800">{status}</p>
                    </div>
                ) : videoUrl ? (
                    <div className="bg-black rounded overflow-hidden aspect-video relative">
                        <video controls src={videoUrl} className="w-full h-full" autoPlay loop />
                        <a href={videoUrl} download="veo_video.mp4" className="absolute bottom-2 right-2 bg-white/20 hover:bg-white/40 text-white text-xs px-2 py-1 rounded backdrop-blur">Download</a>
                    </div>
                ) : (
                    <button 
                        disabled={!image}
                        onClick={generateVideo}
                        className="w-full bg-purple-600 disabled:bg-slate-300 text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-purple-700 transition"
                    >
                        Generate Video
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};