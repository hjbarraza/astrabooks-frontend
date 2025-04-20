import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/lib/wordpress.d";
import { cn } from "@/lib/utils";
import { getFeaturedMediaById, getAuthorById, getCategoryById } from "@/lib/wordpress";

export async function BookCard({ book }: { book: Book }) {
  const media = book.featured_media
    ? await getFeaturedMediaById(book.featured_media)
    : null;
  const author = book.author ? await getAuthorById(book.author) : null;
  const date = new Date(book.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const category = book.categories?.[0]
    ? await getCategoryById(book.categories[0])
    : null;

  return (
    <Link
      href={`/books/${book.slug}`}
      className={cn(
        "border p-4 bg-accent/30 rounded-lg group flex justify-between flex-col not-prose gap-8",
        "hover:bg-accent/75 transition-all"
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="h-48 w-full overflow-hidden relative rounded-md border flex items-center justify-center bg-muted">
          {media?.source_url ? (
            <Image
              className="h-full w-full object-cover"
              src={media.source_url}
              alt={book.title?.rendered || "Book thumbnail"}
              width={400}
              height={200}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground" />
          )}
        </div>
        <div
          dangerouslySetInnerHTML={{
            __html: book.title?.rendered || "Untitled Book",
          }}
          className="text-xl text-primary font-medium group-hover:underline decoration-muted-foreground underline-offset-4 decoration-dotted transition-all"
        />
        <div
          className="text-sm"
          dangerouslySetInnerHTML={{
            __html: book.excerpt?.rendered
              ? `${book.excerpt.rendered.split(" ").slice(0, 12).join(" ").trim()}...`
              : "No excerpt available",
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <hr />
        <div className="flex justify-between items-center text-xs">
          <p>{category?.name || "Uncategorized"}</p>
          <p>{date}</p>
        </div>
      </div>
    </Link>
  );
} 