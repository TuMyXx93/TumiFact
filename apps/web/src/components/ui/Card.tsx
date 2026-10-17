import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl ${className}`}
    >
      {children}
    </section>
  );
}
