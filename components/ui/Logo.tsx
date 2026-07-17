import Image from 'next/image';

/**
 * The Island to Infinity brand logo.
 * Source lives at /public/images/logo.png (transparent PNG).
 * `size` is the rendered square size in px; pass a wrapper for chips/backgrounds.
 */
export default function Logo({
  size = 40,
  className = '',
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/images/logo.png"
      alt="Island to Infinity logo"
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
