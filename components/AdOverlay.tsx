import React, { useEffect, useState } from 'react';
import { X, PlayCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdOverlay: React.FC<AdOverlayProps> = ({ isOpen, onClose }) => {
  const [canClose, setCanClose] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setCanClose(false);
      setTimeLeft(3);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white"
        >
          {/* Fake Ad Content */}
          <div className="w-full h-full relative flex flex-col">
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                Ad
              </div>
              
              {canClose ? (
                <button
                  onClick={onClose}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/40 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              ) : (
                <div className="bg-black/50 px-3 py-1 rounded-full text-sm font-mono">
                  Reward in {timeLeft}s
                </div>
              )}
            </div>

            {/* Fake Video Area */}
            <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
              {/* Simulated Video Background */}
              <div className="absolute inset-0 opacity-30 bg-[url('https://picsum.photos/500/900')] bg-cover bg-center" />
              
              <div className="relative z-10 text-center p-6">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <PlayCircle className="w-12 h-12 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Mega Brand App</h2>
                <p className="text-gray-300 mb-6">Install now to claim your exclusive welcome bonus!</p>
                <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all">
                  INSTALL NOW
                </button>
              </div>
              
              {/* Fake Progress Bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-gray-700 w-full">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-full bg-yellow-500"
                />
              </div>
            </div>

            {/* Bottom Banner */}
            <div className="bg-white text-black p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-sm">Best App 2025</h4>
                <p className="text-xs text-gray-600">4.8 ★ Free Download</p>
              </div>
              <button className="bg-black text-white text-xs font-bold px-4 py-2 rounded">
                GET
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};