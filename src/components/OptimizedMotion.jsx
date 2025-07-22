import React, { useMemo, useRef, useEffect } from 'react';
import { motion, useReducedMotion, useInView, useAnimation } from 'framer-motion';
import { usePerformance } from '@/hooks/usePerformance';

/**
 * Optimized motion component that adapts animations based on device capabilities
 */
const OptimizedMotion = ({
  children,
  variants,
  initial = 'initial',
  animate = 'animate',
  exit = 'exit',
  transition,
  viewport = { once: true, margin: '0px 0px -100px 0px' },
  enableInView = true,
  enablePerformanceOptimization = true,
  fallbackComponent: FallbackComponent,
  ...props
}) => {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, viewport);
  const controls = useAnimation();
  
  const {
    shouldReduceAnimations,
    deviceCapabilities,
    animationSettings
  } = usePerformance();

  // Determine if animations should be disabled
  const shouldDisableAnimations = useMemo(() => {
    return prefersReducedMotion || 
           (enablePerformanceOptimization && shouldReduceAnimations) ||
           deviceCapabilities.isLowEnd;
  }, [prefersReducedMotion, enablePerformanceOptimization, shouldReduceAnimations, deviceCapabilities.isLowEnd]);

  // Optimize variants based on device capabilities
  const optimizedVariants = useMemo(() => {
    if (shouldDisableAnimations || !variants) {
      return {
        initial: {},
        animate: {},
        exit: {}
      };
    }

    const optimizeVariant = (variant) => {
      if (!variant || typeof variant !== 'object') return variant;

      const optimized = { ...variant };

      // Reduce animation complexity on low-end devices
      if (deviceCapabilities.isLowEnd) {
        // Remove expensive properties
        delete optimized.filter;
        delete optimized.backdropFilter;
        delete optimized.boxShadow;
        
        // Simplify transforms
        if (optimized.scale && Array.isArray(optimized.scale)) {
          optimized.scale = optimized.scale[optimized.scale.length - 1];
        }
        if (optimized.rotate && Array.isArray(optimized.rotate)) {
          optimized.rotate = optimized.rotate[optimized.rotate.length - 1];
        }
      }

      // Adjust transition based on performance settings
      if (optimized.transition) {
        optimized.transition = {
          ...optimized.transition,
          duration: optimized.transition.duration * animationSettings.durationMultiplier,
          ease: animationSettings.preferredEasing
        };
      }

      return optimized;
    };

    return {
      initial: optimizeVariant(variants.initial),
      animate: optimizeVariant(variants.animate),
      exit: optimizeVariant(variants.exit),
      hover: optimizeVariant(variants.hover),
      tap: optimizeVariant(variants.tap),
      focus: optimizeVariant(variants.focus)
    };
  }, [variants, shouldDisableAnimations, deviceCapabilities.isLowEnd, animationSettings]);

  // Optimize transition
  const optimizedTransition = useMemo(() => {
    if (shouldDisableAnimations) {
      return { duration: 0 };
    }

    const baseTransition = transition || {};
    
    return {
      ...baseTransition,
      duration: (baseTransition.duration || 0.3) * animationSettings.durationMultiplier,
      ease: animationSettings.preferredEasing,
      // Use GPU acceleration when possible
      type: deviceCapabilities.supportsGPU ? (baseTransition.type || 'tween') : 'tween'
    };
  }, [transition, shouldDisableAnimations, animationSettings, deviceCapabilities.supportsGPU]);

  // Handle in-view animations
  useEffect(() => {
    if (!enableInView) return;

    if (isInView && !shouldDisableAnimations) {
      controls.start(animate);
    }
  }, [isInView, enableInView, shouldDisableAnimations, animate, controls]);

  // Fallback for when animations are disabled
  if (shouldDisableAnimations) {
    if (FallbackComponent) {
      return <FallbackComponent ref={ref} {...props}>{children}</FallbackComponent>;
    }
    
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    );
  }

  const motionProps = {
    ref,
    variants: optimizedVariants,
    initial,
    animate: enableInView ? controls : animate,
    exit,
    transition: optimizedTransition,
    ...props
  };

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
};

/**
 * Optimized motion component for text animations
 */
export const OptimizedMotionText = ({
  text,
  className,
  staggerChildren = 0.1,
  ...props
}) => {
  const { shouldReduceAnimations } = usePerformance();
  const prefersReducedMotion = useReducedMotion();

  const shouldDisableStagger = shouldReduceAnimations || prefersReducedMotion;

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: shouldDisableStagger ? 0 : staggerChildren,
        delayChildren: shouldDisableStagger ? 0 : 0.1
      }
    }
  };

  const childVariants = {
    initial: { opacity: 0, y: shouldDisableStagger ? 0 : 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldDisableStagger ? 0 : 0.5
      }
    }
  };

  if (shouldDisableStagger) {
    return <div className={className}>{text}</div>;
  }

  return (
    <OptimizedMotion
      variants={containerVariants}
      className={className}
      {...props}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </OptimizedMotion>
  );
};

/**
 * Optimized motion component for list animations
 */
export const OptimizedMotionList = ({
  children,
  staggerChildren = 0.1,
  ...props
}) => {
  const { shouldReduceAnimations } = usePerformance();
  const prefersReducedMotion = useReducedMotion();

  const shouldDisableStagger = shouldReduceAnimations || prefersReducedMotion;

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: shouldDisableStagger ? 0 : staggerChildren
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: shouldDisableStagger ? 0 : 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldDisableStagger ? 0 : 0.5
      }
    }
  };

  return (
    <OptimizedMotion
      variants={containerVariants}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </OptimizedMotion>
  );
};

/**
 * Hook for creating performance-optimized animation variants
 */
export const useOptimizedVariants = (baseVariants) => {
  const { deviceCapabilities, animationSettings } = usePerformance();
  const prefersReducedMotion = useReducedMotion();

  return useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: {},
        animate: {},
        exit: {}
      };
    }

    const optimizeVariant = (variant) => {
      if (!variant || typeof variant !== 'object') return variant;

      const optimized = { ...variant };

      // Apply performance optimizations
      if (deviceCapabilities.isLowEnd) {
        // Remove expensive properties
        delete optimized.filter;
        delete optimized.backdropFilter;
        delete optimized.boxShadow;
        
        // Simplify complex animations
        if (optimized.scale && Array.isArray(optimized.scale)) {
          optimized.scale = optimized.scale[optimized.scale.length - 1];
        }
      }

      // Adjust timing
      if (optimized.transition) {
        optimized.transition = {
          ...optimized.transition,
          duration: (optimized.transition.duration || 0.3) * animationSettings.durationMultiplier
        };
      }

      return optimized;
    };

    return Object.keys(baseVariants).reduce((acc, key) => {
      acc[key] = optimizeVariant(baseVariants[key]);
      return acc;
    }, {});
  }, [baseVariants, deviceCapabilities, animationSettings, prefersReducedMotion]);
};

/**
 * Performance-aware scroll-triggered animations
 */
export const OptimizedScrollMotion = ({
  children,
  offset = ['start end', 'end start'],
  ...props
}) => {
  const { shouldReduceAnimations } = usePerformance();
  const ref = useRef(null);

  if (shouldReduceAnimations) {
    return <div ref={ref} {...props}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default OptimizedMotion;