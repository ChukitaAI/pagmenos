import { Package, Pill } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function ProductImage({ src, alt, className = '', priority = false }: ProductImageProps) {
  if (!src) {
    return (
      <div className={`w-full h-full bg-brand-50 flex items-center justify-center text-brand-400 ${className}`}>
        <Pill className="w-1/2 h-1/2 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={`w-full h-full object-contain ${className}`}
    />
  );
}
