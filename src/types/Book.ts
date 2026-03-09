export type Book = {
  id: string;
  title: string;
  authors: string | string[];
  thumbnail: string | null;
  amazon_link: string;
};
