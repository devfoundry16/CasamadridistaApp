export interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  images: {
    id: number;
    src: string;
    alt: string;
    date_created: Date;
    date_created_gmt: Date;
    date_modified: Date;
    date_modified_gmt: Date;
  }[];
  categories: { id: number; name: string; slug: string }[];
}
