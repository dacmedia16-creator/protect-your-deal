import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface AnimatedContentProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedContent = ({ children, delay = 0, className, ...props }: AnimatedContentProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const AnimatedList = ({ children, className, staggerDelay = 0.05 }: AnimatedListProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: { transition: { staggerChildren: staggerDelay } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedItem = ({ children, className }: AnimatedItemProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
    }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

// For stats cards with staggered animation
export const AnimatedStatsGrid = ({ children, className }: AnimatedListProps) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: { transition: { staggerChildren: 0.1 } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const AnimatedStatCard = ({ children, className }: AnimatedItemProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 }
    }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);
