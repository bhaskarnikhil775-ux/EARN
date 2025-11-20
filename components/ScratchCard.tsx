import React, { useRef, useEffect, useState } from 'react';
import { Trophy, RotateCcw, Loader2 } from 'lucide-react';

interface ScratchCardProps {
  onComplete: () => void;
  prizeValue: number;
  disabled: boolean;
  cooldown: number;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({ onComplete, prizeValue, disabled, cooldown }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedPercent, setScratchedPercent] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas
    const width = canvas.parentElement?.offsetWidth || 300;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Draw overlay
    ctx.fillStyle = '#C0C0C0'; // Silver
    ctx.fillRect(0, 0, width, height);
    
    // Add noise/texture to make it look like scratch foil
    for(let i = 0; i < 500; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#A9A9A9' : '#D3D3D3';
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    // Add text
    ctx.fillStyle = '#555';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Scratch Here!", width / 2, height / 2);

    // Reset state
    setIsRevealed(false);
    setScratchedPercent(0);
  }, [prizeValue, disabled]); // Reset when prize changes or re-enabled (if we were to reset specifically)

  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRevealed || disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsScratching(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Calculate revealed percentage occasionally
    if (Math.random() > 0.5) {
        checkRevealProgress(ctx, canvas.width, canvas.height);
    }
  };

  const checkRevealProgress = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sample pixels to check transparency
    // Optimizing: Only check every 10th pixel to save performance
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let transparentPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4 * 10) { // Check every 10th pixel
      if (data[i + 3] < 128) {
        transparentPixels++;
      }
    }

    // Adjusted for the sampling rate
    const percent = (transparentPixels * 10) / totalPixels;
    setScratchedPercent(percent);

    if (percent > 0.4) { // 40% revealed is enough
      setIsRevealed(true);
      onComplete();
    }
  };

  return (
    <div className="relative w-full max-w-[320px] h-[200px] rounded-xl overflow-hidden shadow-xl mx-auto">
      
      {/* Underlying Reward Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-300 flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-yellow-800 mb-2">You Won!</h3>
        <div className="bg-white p-4 rounded-full shadow-inner mb-2">
          <Trophy className="w-10 h-10 text-yellow-500" />
        </div>
        <span className="text-4xl font-black text-slate-800">{prizeValue}</span>
        <span className="text-sm font-bold text-slate-600">COINS</span>
      </div>

      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 touch-none cursor-crosshair transition-opacity duration-700 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onMouseDown={handleScratch}
        onMouseMove={(e) => isScratching && handleScratch(e)}
        onMouseUp={() => setIsScratching(false)}
        onMouseLeave={() => setIsScratching(false)}
        onTouchStart={handleScratch}
        onTouchMove={handleScratch}
        onTouchEnd={() => setIsScratching(false)}
      />

      {/* Disabled / Cooldown Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          {cooldown > 0 ? (
            <>
                <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-2" />
                <span className="font-mono text-2xl">{Math.ceil(cooldown / 1000)}s</span>
                <span className="text-xs text-gray-400 mt-1">Please wait...</span>
            </>
          ) : (
             <div className="text-center p-4">
                 <span className="text-red-400 font-bold block mb-2">Daily Limit Reached</span>
                 <span className="text-xs text-gray-400">Come back tomorrow!</span>
             </div>
          )}
        </div>
      )}
    </div>
  );
};