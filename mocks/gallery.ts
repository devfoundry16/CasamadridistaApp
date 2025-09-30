export interface GalleryImage {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'match' | 'training' | 'stadium' | 'celebration';
  date: string;
}

export const galleryImages: GalleryImage[] = [
  {
    id: '1',
    title: 'El Clásico Victory Celebration',
    description: 'Players celebrate after securing victory in El Clásico',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
    category: 'celebration',
    date: '2025-09-28',
  },
  {
    id: '2',
    title: 'Santiago Bernabéu at Night',
    description: 'The iconic stadium illuminated under the night sky',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    category: 'stadium',
    date: '2025-09-27',
  },
  {
    id: '3',
    title: 'Training Session at Valdebebas',
    description: 'Squad preparing for upcoming fixtures',
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
    category: 'training',
    date: '2025-09-26',
  },
  {
    id: '4',
    title: 'Match Day Action',
    description: 'Intense moments from the latest La Liga match',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
    category: 'match',
    date: '2025-09-25',
  },
  {
    id: '5',
    title: 'Champions League Night',
    description: 'The atmosphere during a Champions League fixture',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    category: 'match',
    date: '2025-09-24',
  },
  {
    id: '6',
    title: 'Team Celebration',
    description: 'Squad celebrating a historic victory',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
    category: 'celebration',
    date: '2025-09-23',
  },
  {
    id: '7',
    title: 'Pre-Match Warm Up',
    description: 'Players warming up before kickoff',
    image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
    category: 'training',
    date: '2025-09-22',
  },
  {
    id: '8',
    title: 'Stadium Panorama',
    description: 'Breathtaking view of the Santiago Bernabéu',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
    category: 'stadium',
    date: '2025-09-21',
  },
  {
    id: '9',
    title: 'Goal Celebration',
    description: 'Pure joy after scoring a crucial goal',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80',
    category: 'celebration',
    date: '2025-09-20',
  },
  {
    id: '10',
    title: 'Tactical Training',
    description: 'Coach working with players on tactics',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
    category: 'training',
    date: '2025-09-19',
  },
  {
    id: '11',
    title: 'Match Intensity',
    description: 'High-intensity action during the match',
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80',
    category: 'match',
    date: '2025-09-18',
  },
  {
    id: '12',
    title: 'Trophy Presentation',
    description: 'Team receiving their latest trophy',
    image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80',
    category: 'celebration',
    date: '2025-09-17',
  },
];

export const galleryCategories = [
  { id: 'all', name: 'All Photos', icon: 'images' },
  { id: 'match', name: 'Matches', icon: 'trophy' },
  { id: 'training', name: 'Training', icon: 'dumbbell' },
  { id: 'stadium', name: 'Stadium', icon: 'building' },
  { id: 'celebration', name: 'Celebrations', icon: 'party-popper' },
] as const;
