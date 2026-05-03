import { motion } from 'motion/react';
import { ReactNode, useState } from 'react';
import { cn } from './ui/utils';

interface RevealCardProps {
  frontContent: ReactNode;
  backContent: ReactNode;
  className?: string;
}

export function RevealCard({ frontContent, backContent, className }: RevealCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white shadow-sm cursor-pointer h-full",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Front Content */}
      <div className="relative z-10 p-6">
        {frontContent}
      </div>

      {/* Back Content with Mask Transition */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-700 p-6 flex items-center justify-center"
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={{
          clipPath: isHovered ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <div className="text-white w-full">
          {backContent}
        </div>
      </motion.div>
    </motion.div>
  );
}
