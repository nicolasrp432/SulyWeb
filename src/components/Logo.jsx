import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center space-x-2 group">
        <div className="relative">
             <img  className="h-12 w-auto" alt="Suly Pretty Nails Logo" src="/public/logosuly.jpeg" />
        </div>
    </Link>
  );
};

export default Logo;