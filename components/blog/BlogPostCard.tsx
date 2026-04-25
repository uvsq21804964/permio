import Link from 'next/link';

import { BlogImageFigure } from '@/components/blog/BlogImageFigure';
import { formatBlogDate, getBlogUiCopy, type BlogPost } from '@/lib/content/blog';
import type { Locale } from '@/src/lib/i18n';

type BlogPostCardProps = {
  featured?: boolean;
  locale: Locale;
  post: BlogPost;
};

export function BlogPostCard({
  featured = false,
  locale,
  post,
}: BlogPostCardProps) {
  const ui = getBlogUiCopy(locale);

  return (
    <article
      className={`group rounded-[28px] border border-black/10 bg-white/95 shadow-[0_18px_60px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.12)] ${
        featured ? 'p-6 md:p-8' : 'p-5 md:p-6'
      }`}
    >
      <div className="mb-5">
        <BlogImageFigure image={post.coverImage} priority={featured} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
        <span>{post.category}</span>
        <span className="h-1 w-1 rounded-full bg-black/20" />
        <span>{formatBlogDate(locale, post.publishedAt)}</span>
      </div>

      <div className="mt-4 space-y-4">
        <h2
          className={`font-black tracking-[-0.05em] text-black ${
            featured ? 'text-3xl leading-[1.02] md:text-4xl' : 'text-2xl leading-tight'
          }`}
        >
          <Link href={`/${locale}/blog/${post.slug}`} className="focus:outline-none">
            {post.title}
          </Link>
        </h2>

        <p className="max-w-2xl text-sm leading-6 text-black/65 md:text-base">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/10 bg-[#fff7ea] px-3 py-1 text-xs font-medium text-black/60"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-sm text-black/50">{ui.readTime(post.readingMinutes)}</span>
        <Link
          href={`/${locale}/blog/${post.slug}`}
          className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/75 transition group-hover:border-black/20 group-hover:text-black"
        >
          {ui.readArticle}
        </Link>
      </div>
    </article>
  );
}
