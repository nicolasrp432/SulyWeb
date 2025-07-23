import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/**
 * Optimized preloader component with performance considerations
 */
const Preloader = ({ 
  onComplete, 
  minDisplayTime = 1500,
  maxDisplayTime = 3000,
  showProgress = true,
  customLogo,
  backgroundColor = 'bg-gradient-to-br from-pink-50 to-rose-50'
}) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    let progressInterval;
    let minTimeTimeout;
    let maxTimeTimeout;

    // Simulate loading progress
    const startProgress = () => {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsComplete(true);
            return 100;
          }
          
          // Simulate realistic loading curve
          const increment = Math.random() * 15 + 5;
          return Math.min(prev + increment, 100);
        });
      }, 100);
    };

    // Ensure minimum display time
    minTimeTimeout = setTimeout(() => {
      if (isComplete) {
        setShouldHide(true);
      }
    }, minDisplayTime);

    // Force completion after maximum time
    maxTimeTimeout = setTimeout(() => {
      setProgress(100);
      setIsComplete(true);
      setShouldHide(true);
    }, maxDisplayTime);

    startProgress();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(minTimeTimeout);
      clearTimeout(maxTimeTimeout);
    };
  }, [minDisplayTime, maxDisplayTime]);

  // Handle completion when both conditions are met
  useEffect(() => {
    if (isComplete && progress >= 100) {
      const timer = setTimeout(() => {
        setShouldHide(true);
      }, minDisplayTime);
      
      return () => clearTimeout(timer);
    }
  }, [isComplete, progress, minDisplayTime]);

  // Call onComplete when hiding
  useEffect(() => {
    if (shouldHide) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500); // Allow exit animation to complete
      
      return () => clearTimeout(timer);
    }
  }, [shouldHide, onComplete]);

  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${progress}%`,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const containerVariants = {
    initial: { opacity: 1 },
    exit: { 
      opacity: 0,
      scale: 1.1,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${backgroundColor}`}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-20 h-20 bg-pink-300/20 rounded-full blur-xl"
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-40 right-20 w-32 h-32 bg-rose-300/20 rounded-full blur-xl"
              animate={{
                y: [0, 20, 0],
                x: [0, -15, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className="absolute bottom-40 left-20 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"
              animate={{
                y: [0, -15, 0],
                x: [0, 20, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 text-center">
            {/* Logo */}
            <motion.div
              variants={logoVariants}
              initial="initial"
              animate={["animate", "pulse"]}
              className="mb-8"
            >
              {customLogo ? (
                customLogo
              ) : (
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                </div>
              )}
            </motion.div>

            {/* Brand name */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2"
            >
              Suly Pretty Nails
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-gray-600 mb-8"
            >
              Cargando tu experiencia de belleza...
            </motion.p>

            {/* Progress bar */}
            {showProgress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="w-64 mx-auto"
              >
                <div className="relative">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      variants={progressVariants}
                      initial="initial"
                      animate="animate"
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full relative"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </motion.div>
                  </div>
                  
                  {/* Progress percentage */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center mt-3 text-sm text-gray-500"
                  >
                    {Math.round(progress)}%
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex justify-center space-x-1 mt-6"
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2 h-2 bg-pink-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Lightweight preloader for faster initial loads
export const SimplePreloader = ({ onComplete, duration = 1000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-white flex items-center justify-center"
    >
      <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
    </motion.div>
  );
};

export default Preloader;