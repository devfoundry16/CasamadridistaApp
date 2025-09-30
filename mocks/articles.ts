export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'match-report' | 'player-interview' | 'news' | 'analysis';
  image: string;
  date: string;
  author: string;
  readTime: string;
}

export const articles: Article[] = [
  {
    id: '1',
    title: 'Real Madrid Secures Victory in El Clásico',
    excerpt: 'A thrilling match at Santiago Bernabéu sees Los Blancos triumph over Barcelona with a stunning performance.',
    content: 'Real Madrid delivered a masterclass performance at the Santiago Bernabéu, securing a decisive victory over Barcelona in one of the most anticipated El Clásico matches of the season. The team showcased exceptional skill, determination, and tactical brilliance throughout the 90 minutes.\n\nThe match began with high intensity as both teams fought for control. Real Madrid\'s midfield dominated possession, creating numerous scoring opportunities. The breakthrough came in the 23rd minute when a brilliant counter-attack led to the opening goal.\n\nThe second half saw even more excitement as Real Madrid extended their lead with two more goals, demonstrating why they remain one of the world\'s elite football clubs. The fans at the Bernabéu created an electric atmosphere, supporting their team throughout the match.\n\nThis victory strengthens Real Madrid\'s position at the top of La Liga and sends a strong message to their rivals. The team\'s performance was praised by fans and analysts alike, highlighting the squad\'s depth and quality.',
    category: 'match-report',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80',
    date: '2025-09-28',
    author: 'Casa Madridista',
    readTime: '5 min read',
  },
  {
    id: '2',
    title: 'Exclusive: Interview with Rising Star',
    excerpt: 'We sit down with Real Madrid\'s newest sensation to discuss his journey, ambitions, and life at the club.',
    content: 'In an exclusive interview, we had the privilege of speaking with one of Real Madrid\'s most promising young talents. The player shared insights into his journey from the academy to the first team, his experiences training with world-class players, and his aspirations for the future.\n\n"Playing for Real Madrid has always been my dream," he told us. "Every day I step onto the training ground at Valdebebas, I remind myself of how fortunate I am to wear this shirt."\n\nThe young star spoke about the influence of his teammates and coaches, particularly praising the club\'s commitment to developing young talent. He also discussed the pressure and expectations that come with playing for one of the world\'s biggest clubs.\n\nWhen asked about his goals for the season, he remained humble but ambitious: "I want to contribute to the team\'s success in every way possible. Whether that\'s scoring goals, creating chances, or working hard defensively, I\'m ready to do whatever the team needs."\n\nThe interview concluded with his message to the fans: "The support from Madridistas around the world is incredible. We feel it in every match, and it drives us to give our best every single day."',
    category: 'player-interview',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
    date: '2025-09-27',
    author: 'Casa Madridista',
    readTime: '7 min read',
  },
  {
    id: '3',
    title: 'Champions League Draw: Tough Opponents Await',
    excerpt: 'Real Madrid faces challenging fixtures in the Champions League knockout stages as the draw reveals exciting matchups.',
    content: 'The Champions League draw has been completed, and Real Madrid has been paired with formidable opponents for the knockout stages. The draw, held at UEFA headquarters, has set up what promises to be an exciting series of matches.\n\nReal Madrid, as one of Europe\'s most successful clubs in the competition, will face this challenge with confidence. The team has a rich history in the Champions League, having won the trophy a record number of times.\n\nClub officials and fans have expressed excitement about the upcoming fixtures. The matches will test the squad\'s depth and quality against some of Europe\'s best teams. Real Madrid\'s experience in high-pressure situations will be crucial.\n\nThe coaching staff is already preparing tactical plans for the upcoming matches. Training sessions will focus on analyzing opponents and fine-tuning strategies. The team\'s recent form suggests they are well-prepared for the challenges ahead.\n\nMadridistas around the world are eagerly anticipating these matches, which promise to deliver the drama and excitement that the Champions League is known for.',
    category: 'news',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    date: '2025-09-26',
    author: 'Casa Madridista',
    readTime: '4 min read',
  },
  {
    id: '4',
    title: 'Tactical Analysis: The Evolution of Real Madrid\'s Play Style',
    excerpt: 'A deep dive into how Real Madrid has adapted their tactics this season to dominate both domestically and in Europe.',
    content: 'Real Madrid\'s tactical evolution this season has been remarkable. The team has shown incredible flexibility, adapting their style of play to different opponents while maintaining their core identity.\n\nThe coaching staff has implemented a more fluid system that allows players to interchange positions seamlessly. This has created problems for opposing defenses, who struggle to track the movement of Real Madrid\'s attackers.\n\nDefensively, the team has become more compact and organized. The midfield provides excellent protection for the defense, while also being ready to launch quick counter-attacks. This balance between defense and attack has been key to the team\'s success.\n\nThe use of width has also been a notable feature. The full-backs push high up the pitch, providing additional attacking options and stretching opposing defenses. This creates space in central areas for the creative players to exploit.\n\nSet pieces have become another weapon in Real Madrid\'s arsenal. The team has scored numerous goals from corners and free-kicks, thanks to well-rehearsed routines and the aerial prowess of several players.\n\nLooking ahead, this tactical flexibility will be crucial as Real Madrid competes on multiple fronts. The ability to adapt to different situations and opponents is what separates good teams from great ones.',
    category: 'analysis',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    date: '2025-09-25',
    author: 'Casa Madridista',
    readTime: '8 min read',
  },
  {
    id: '5',
    title: 'Training Ground Report: Squad Prepares for Crucial Week',
    excerpt: 'Behind the scenes at Valdebebas as Real Madrid prepares for important upcoming fixtures.',
    content: 'The atmosphere at Real Madrid\'s training facility in Valdebebas has been intense this week as the squad prepares for crucial upcoming matches. The coaching staff has organized focused training sessions designed to keep players sharp and ready.\n\nMorning sessions have focused on tactical work, with the team practicing specific game situations and set pieces. The attention to detail has been impressive, with coaches working closely with individual players to refine their positioning and decision-making.\n\nAfternoon sessions have been more physical, with emphasis on maintaining fitness levels and preventing injuries. The medical staff has been working closely with players to ensure everyone is in optimal condition.\n\nThe squad\'s mood has been positive and focused. Players understand the importance of the upcoming matches and are determined to deliver strong performances. Team unity has been evident in training, with senior players mentoring younger squad members.\n\nRecovery and nutrition have also been key focuses. The club\'s sports science team has implemented personalized recovery programs for each player, ensuring they are physically and mentally prepared for the challenges ahead.',
    category: 'news',
    image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
    date: '2025-09-24',
    author: 'Casa Madridista',
    readTime: '5 min read',
  },
  {
    id: '6',
    title: 'Historic Victory: Real Madrid Breaks Club Record',
    excerpt: 'Los Blancos achieve a remarkable milestone with their latest victory, setting a new club record.',
    content: 'Real Madrid has etched another chapter in their illustrious history by breaking a long-standing club record. The achievement came during their latest match, where the team displayed the quality and determination that has made them one of football\'s greatest institutions.\n\nThe record-breaking moment was celebrated by players, staff, and fans alike. It represents not just a statistical achievement, but a testament to the club\'s consistent excellence and winning mentality.\n\nClub president spoke about the achievement: "This record is a reflection of the hard work, dedication, and talent within our club. It\'s a proud moment for everyone associated with Real Madrid."\n\nThe players who contributed to this historic achievement were quick to credit the team\'s collective effort. "Records like this are won by the entire squad, not individuals," said one player. "Everyone has played their part."\n\nThis milestone adds to Real Madrid\'s already impressive list of achievements and records. It serves as motivation for the team to continue pushing boundaries and setting new standards of excellence.\n\nFans around the world have been celebrating the achievement on social media, sharing their pride in the club and excitement for what the future holds.',
    category: 'news',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
    date: '2025-09-23',
    author: 'Casa Madridista',
    readTime: '6 min read',
  },
];

export const categories = [
  { id: 'all', name: 'All News', icon: 'newspaper' },
  { id: 'match-report', name: 'Match Reports', icon: 'trophy' },
  { id: 'player-interview', name: 'Interviews', icon: 'mic' },
  { id: 'news', name: 'Club News', icon: 'bell' },
  { id: 'analysis', name: 'Analysis', icon: 'bar-chart' },
] as const;
