import Image from 'next/image';

import type { BlogImage } from '@/lib/content/blog';

type BlogImageFigureProps = {
  image: BlogImage;
  priority?: boolean;
};

export function BlogImageFigure({
  image,
  priority = false,
}: BlogImageFigureProps) {
  return (
    <figure className="overflow-hidden rounded-[28px] border border-black/10 bg-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-[16/9] w-full bg-[#fff7ea]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 900px"
          className="object-cover"
        />
      </div>
      {image.caption ? (
        <figcaption className="border-t border-black/10 px-4 py-3 text-sm leading-6 text-black/55 md:px-5">
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
