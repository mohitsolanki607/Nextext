export interface Book {
  id: string;
  title: string;
  author: string;
  status: 'to-read' | 'reading' | 'completed';
  link?: string;
  notes?: string;
}

export interface Semester {
  id: string;
  name: string;
  year: string;
  books: Book[];
}
