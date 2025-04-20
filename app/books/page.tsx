import {
  getAllBooks,
  getAllAuthors,
  getAllTags,
  getAllCategories,
  searchAuthors,
  searchTags,
  searchCategories,
} from "@/lib/wordpress";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Section, Container, Prose } from "@/components/craft";
import { PostCard } from "@/components/posts/post-card";
import { FilterPosts } from "@/components/posts/filter";
import { SearchInput } from "@/components/posts/search-input";
import { BookCard } from "@/components/books/book-card";

import type { Metadata } from "next";
import type { Book } from "@/lib/wordpress.d";

export const metadata: Metadata = {
  title: "Books",
  description: "Browse all our books",
};

export const dynamic = "auto";
export const revalidate = 600;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    author?: string;
    tag?: string;
    category?: string;
    page?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const { author, tag, category, page: pageParam, search } = params;

  // Fetch data based on search parameters
  const [books, authors, tags, categories] = await Promise.all([
    getAllBooks({ author, tag, category, search }),
    search ? searchAuthors(search) : getAllAuthors(),
    search ? searchTags(search) : getAllTags(),
    search ? searchCategories(search) : getAllCategories(),
  ]);

  // Handle pagination
  const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const booksPerPage = 9;
  const totalPages = Math.ceil(books.length / booksPerPage);
  const paginatedBooks = books.slice(
    (page - 1) * booksPerPage,
    page * booksPerPage
  );

  // Create pagination URL helper
  const createPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", newPage.toString());
    if (category) params.set("category", category);
    if (author) params.set("author", author);
    if (tag) params.set("tag", tag);
    if (search) params.set("search", search);
    return `/books${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <Section>
      <Container>
        <div className="space-y-8">
          <Prose>
            <h2>All Books</h2>
            <p className="text-muted-foreground">
              {books.length} {books.length === 1 ? "book" : "books"} found
              {search && " matching your search"}
            </p>
          </Prose>

          <div className="space-y-4">
            <SearchInput defaultValue={search} />

            <FilterPosts
              authors={authors}
              tags={tags}
              categories={categories}
              selectedAuthor={author}
              selectedTag={tag}
              selectedCategory={category}
            />
          </div>

          {paginatedBooks.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {paginatedBooks.map((book: Book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="h-24 w-full border rounded-lg bg-accent/25 flex items-center justify-center">
              <p>No books found</p>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={
                      page <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                    href={createPaginationUrl(page - 1)}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href={createPaginationUrl(page)}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    className={
                      page >= totalPages ? "pointer-events-none opacity-50" : ""
                    }
                    href={createPaginationUrl(page + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </Container>
    </Section>
  );
}
