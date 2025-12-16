import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, Upload, Send } from 'lucide-react';

interface ImageEditorProps {
  onBack: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setResultImage(null);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!image || !prompt) return;
    setLoading(true);

    try {
      // Clean base64 string
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates![0].content.parts) {
        if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            setResultImage(`data:image/png;base64,${base64EncodeString}`);
            foundImage = true;
            break;
        }
      }
      if (!foundImage) {
          alert("No image returned. Try a different prompt.");
      }

    } catch (error) {
      console.error(error);
      alert("Error generating image. Check API key or quotas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg p-6 border-4 border-slate-600">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold uppercase text-slate-800">Rotom Photo Lab</h2>
          <button onClick={onBack} className="text-xs text-red-500 hover:underline">Exit</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] bg-slate-50">
            {image ? (
              <img src={image} alt="Original" className="max-h-48 object-contain" />
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs text-slate-500">Upload Photo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div className="border-2 border-slate-300 rounded-lg p-4 flex items-center justify-center min-h-[200px] bg-slate-50">
             {loading ? (
                <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-500 w-8 h-8 mb-2" />
                    <span className="text-xs animate-pulse">Processing...</span>
                </div>
             ) : resultImage ? (
                <img src={resultImage} alt="Result" className="max-h-48 object-contain" />
             ) : (
                <span className="text-xs text-slate-400">Result will appear here</span>
             )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
            <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Make it look like a sketch"
                className="flex-1 border-2 border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
            />
            <button 
                onClick={handleGenerate}
                disabled={!image || !prompt || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-blue-700 disabled:opacity-50"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};
