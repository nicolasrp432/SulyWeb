import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// `white` usa la variante con el texto en blanco (para fondos oscuros, p. ej. el footer).
const Logo = ({ white = false }) => {
  return (
    <Link to="/" className="flex items-center space-x-2 group">
        <div className="relative">
             <img  className="h-12 w-auto" alt="Suly Pretty Nails Logo" src={white ? "/logosuly-white.png" : "/logosuly.png"} />
        </div>
    </Link>
  );
};

export default Logo;