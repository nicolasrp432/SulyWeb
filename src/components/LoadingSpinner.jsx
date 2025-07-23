import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente de loading optimizado con diferentes variantes
 */
const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  className,
  text,
  fullScreen = false,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'border-pink-500 border-t-transparent',
    secondary: 'border-gray-300 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  const spinner = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      fullScreen && 'min-h-screen',
      className
    )}>
      <div 
        className={cn(
          'border-2 rounded-full animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
        {...props}
      />
      {text && (
        <p className={cn(
          'text-sm font-medium',
          variant === 'white' ? 'text-white' : 'text-gray-600'
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Skeleton loader para contenido
 */
export const SkeletonLoader = ({ className, ...props }) => {
  return (
    <div 
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
      {...props}
    />
  );
};

/**
 * Skeleton para tarjetas de servicios
 */
export const ServiceCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <SkeletonLoader className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <SkeletonLoader className="h-6 w-3/4" />
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between items-center">
        <SkeletonLoader className="h-6 w-20" />
        <SkeletonLoader className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
};

/**
 * Skeleton para galería
 */
export const GallerySkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLoader 
          key={index}
          className="aspect-square rounded-lg" 
        />
      ))}
    </div>
  );
};

/**
 * Loading con texto personalizable
 */
export const LoadingWithText = ({ 
  text = 'Cargando...', 
  subtext,
  className 
}) => {
  return (
    <div className={cn('text-center py-12', className)}>
      <LoadingSpinner size="lg" className="mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{text}</h3>
      {subtext && (
        <p className="text-gray-600">{subtext}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;