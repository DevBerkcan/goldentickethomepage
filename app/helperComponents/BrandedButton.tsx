import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface BrandedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold';
  disabled?: boolean;
  className?: string;
}

export function BrandedButton({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  className = ''
}: BrandedButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-pink to-primary-hotpink hover:from-primary-hotpink hover:to-brand-red',
    secondary: 'bg-gradient-to-r from-secondary-turquoise to-secondary-cyan hover:from-secondary-cyan hover:to-secondary-turquoise',
    gold: 'bg-gradient-to-r from-accent-gold to-accent-orange hover:from-accent-orange hover:to-accent-gold text-black'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        ${variantClasses[variant]}
        text-white font-bold py-4 px-8 rounded-2xl
        shadow-lg transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}