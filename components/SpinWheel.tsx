import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface SpinWheelProps {
  onComplete: () => void;
  disabled: boolean;
  cooldown: number;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ onComplete, disabled, cooldown }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  // The wheel has 8 segments. 
  // 360 / 8 = 45 degrees per segment.
  // We want to land on '10'. Let's assume '10' is at the top (0 degrees) initially or specific index.
  // For simplicity, let's visually construct the wheel so '10' is at index 0.
  // 360 deg = 1 full rotation.
  // To land on index 0 (top), rotation should be 360 * N.
  
  const handleSpin = () => {
    if (disabled || isSpinning) return;

    setIsSpinning(true);
    
    // Calculate rotation
    // Spin at least 5 times (1800 deg) + random offset to land on "10"
    // Let's say "10" is the segment at 0 degrees.
    // We add some random variance within the segment to make it look real, 
    // but ensure it stays within the "10" segment bounds.
    
    const segmentAngle = 360 / 8;
    // Target is segment 0 (0 to 45 degrees, adjusted for pointer position)
    // Pointer is usually at top.
    
    const baseSpins = 360 * 8; // 8 full spins
    const targetSegment = 0; // Index for '10'
    const targetAngle = targetSegment * segmentAngle; 
    
    // If the wheel starts at 0, and we rotate it, the value under the top pointer changes.
    // To land on '10', we need the rotation to end such that '10' is at the top.
    // We'll rig it to always visually land on the '10' slice.
    
    // Random jitter within the slice (+/- 15 deg)
    const randomJitter = Math.floor(Math.random() * 30) - 15; 
    const finalRotation = rotation + baseSpins + randomJitter;

    setRotation(finalRotation);

    // Animation duration 3s
    setTimeout(() => {
      setIsSpinning(false);
      onComplete();
    }, 3000);
  };

  const numbers = [10, 5, 0, 2, 10, 1, 5, 0]; 
  // Colors alternating
  const colors = ['#EAB308', '#1E293B', '#EAB308', '#1E293B', '#EAB308', '#1E293B', '#EAB308', '#1E293B'];

  return (
    <div className="relative w-64 h-64 mx-auto my-8">
      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-red-600 drop-shadow-lg"></div>
      </div>

      {/* Wheel */}
      <div 
        className="w-full h-full rounded-full border-4 border-yellow-600 shadow-2xl overflow-hidden relative transition-transform cubic-bezier(0.2, 0.8, 0.2, 1)"
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transitionDuration: isSpinning ? '3s' : '0s'
        }}
      >
        {numbers.map((num, index) => (
          <div
            key={index}
            className="absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left flex items-center justify-center"
            style={{
              backgroundColor: colors[index],
              transform: `rotate(${index * 45}deg) skewY(-45deg)`, // 8 slices logic
            }}
          >
            <span 
              className="absolute text-white font-bold text-lg"
              style={{
                transform: `skewY(45deg) rotate(-22.5deg) translate(40px, 0)`,
              }}
            >
              {num}
            </span>
          </div>
        ))}
      </div>

      {/* Center Cap */}
      <div 
        onClick={handleSpin}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-yellow-500 flex items-center justify-center z-10 shadow-lg ${!disabled && !isSpinning ? 'cursor-pointer active:scale-95' : ''}`}
      >
        <span className="font-black text-slate-900 text-xs">SPIN</span>
      </div>

       {/* Disabled / Cooldown Overlay */}
       {disabled && (
        <div className="absolute inset-0 rounded-full bg-slate-900/90 z-30 flex flex-col items-center justify-center text-white backdrop-blur-sm">
          {cooldown > 0 ? (
             <>
             <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mb-1" />
             <span className="font-mono text-xl">{Math.ceil(cooldown / 1000)}s</span>
         </>
          ) : (
            <div className="text-center">
                <span className="text-red-400 font-bold text-sm block">Limit Reached</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};