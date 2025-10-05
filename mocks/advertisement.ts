export interface StrengthStat {
  icon: string;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

export interface SquadPlayer {
  id: string;
  name: string;
  photo: string;
}

export interface CompanyHead {
  name: string;
  title: string;
  photo: string;
  quote: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  role: string;
  photo: string;
}

export const strengthStats: StrengthStat[] = [
  {
    icon: "users",
    value: 7000,
    suffix: "+",
    label: "United Madridista",
    color: "#FFD700",
  },
  {
    icon: "gift",
    value: 500,
    suffix: "+",
    label: "Prize in Total",
    color: "#FFD700",
  },
  {
    icon: "calendar",
    value: 100,
    suffix: "%",
    label: "Daily update",
    color: "#FFD700",
  },
  {
    icon: "heart",
    value: 1,
    suffix: "",
    label: "Madridista Family",
    color: "#FFD700",
  },
];

export const squadPlayers: SquadPlayer[] = [
  {
    id: "1",
    name: "Xabi Alonso",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Xabo-Alonso-1536x1536.jpg",
  },
  {
    id: "2",
    name: "Jude Bellingham",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Bellingham-1536x1536.jpg",
  },
  {
    id: "3",
    name: "Dean Huijsen",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Dean-Huijsen-1536x1536.jpg",
  },
  {
    id: "4",
    name: "Eduardo Camavinga",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Eduardo-Camavinga-1536x1536.jpg",
  },
  {
    id: "5",
    name: "Fran García",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Fran-Garcia-1536x1536.jpg",
  },
  {
    id: "6",
    name: "Dani Carvajal",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Dani-Carvajal-1536x1536.jpg",
  },
  {
    id: "7",
    name: "Antonio Rüdiger",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Rodiguer-1536x1536.jpg",
  },
  {
    id: "8",
    name: "Aurélien Tchouaméni",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Aurelien-Tchouameni-1536x1536.jpg",
  },
  {
    id: "9",
    name: "Andriy Lunin",
    photo: "https://casamadridista.com/wp-content/uploads/2025/05/IMG_3087.jpg",
  },
  {
    id: "10",
    name: "Vinicius Junior",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/05/Vinicius-Jr--1536x1536.jpg",
  },
  {
    id: "11",
    name: "Federico Valverde",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/05/IMG_3079-1536x1536.jpg",
  },
  {
    id: "12",
    name: "Brahim Díaz",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/05/ibrahim-diaz-1536x1536.jpg",
  },
  {
    id: "13",
    name: "Víctor Muñoz Villanueva",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/05/Victor-Munoz-Villanueva-1536x1536.jpg",
  },
  {
    id: "14",
    name: "Arda Güler",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/05/Arda-guler-1536x1536.jpg",
  },
  {
    id: "15",
    name: "Gonzalo García",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/07/Gonzalo-Garcia-1536x1536.jpg",
  },
];

export const quotes: Quote[] = [
  {
    id: "1",
    text: "بدأت فكرة تجمعات لمشاهدة مباريات ريال مدريد مع الأصدقاء في حاراتنا الصغيرة عام 2014، وتحولت هذه التجمعات مع الوقت إلى أسلوب حياة حقيقي لنا كمدريديستا. في 2017، أصبحت هذه التجمعات رابطة رسمية، وفي 2021 كرّمنا ريال مدريد عبر موقعه الرسمي كواحدة من أكبر الروابط في العالم. آمنّا بأنفسنا ووصلنا إلى ما نحن عليه اليوم، وأنا مؤمن أن كل عضو في تجمّع  بيت المدريديستا سيكون  شريك  لتحقيق نجاحات غير مسبوقة لمجتمع المدريديستا حول العالم.",
    author: "Ali Fayad",
    role: "Peña Beirut president",
    photo: "https://casamadridista.com/wp-content/uploads/2025/08/IMG_3689.jpg",
  },
  {
    id: "2",
    text: "في كل مدينة، هناك مشجع يعيش حبه للنادي بصمت، يفرح عند الهدف ويشعر بالحزن عند الخسارة، لكنه لا يتوقف أبدًا عن دعم فريقه. بيت المدريديستا هو المكان الذي يجمع هؤلاء المشجعين، ليكون شغفهم قوة موحدة، وأحلامهم مسارًا نحو تجربة جماعية لا تنسى	",
    author: "Mohammed Al-Chalabi",
    role: "Peña Germany president",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/08/IMG_0878.webp",
  },
  {
    id: "3",
    text: "كل نجاح يبدأ بفكرة بسيطة، وكل مجتمع عظيم يبدأ بأعضاء يؤمنون ببعضهم. بيت المدريديستا هو مثال حي على ذلك, أشخاص متحدون بالشغف والعمل الجماعي، يثبتون أن قوة المجتمع تفوق أي تحدٍ، وأن الأحلام الكبيرة تتحقق عندما نكون معًا.",
    author: "Fadi Farah",
    role: "President Syria Fan Club",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/09/541035607_1704781420211471_4852917584578947202_n.png",
  },
  {
    id: "4",
    text: "ان تكون مدريديستا يعني القمة و المجد. ريال مدريد هو الإنتماء و الوفاء و الفرح في الفوز و الفخر في كل المناسبات. ريال مدريد هو كرة القدم",
    author: "Emad Rmaity",
    role: "Content Creator",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/08/0931f50c-5b4f-48f2-bec8-c55137f703b6.jpg",
  },
  {
    id: "5",
    text: "بيت المدريديستا ليس مجرد رابطة، إنه مستقبل نكتبه معًا. كل عضو يساهم بشغفه، كل لحظة تُشكل جزءًا من الرحلة",
    author: "Amer Nuseibeh",
    role: "Content Creator",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/08/39C4C4BC-19D6-4D14-B82A-961C233189E0.jpg",
  },
  {
    id: "6",
    text: "كل مشاركة، كل نقاش، وكل لحظة حب للنادي تصنع مجتمعًا لا يُنسى.",
    author: "Mohammed Dean",
    role: "Content Creator",
    photo:
      "https://casamadridista.com/wp-content/uploads/2025/08/FADEE1C2-0A06-440E-B7C5-900ECEA7633E.jpg",
  },
  {
    id: "7",
    text: "كونك مدريديستا يعني حمل قيم التميز والالتزام، والاعتزاز بتاريخ لا يُضاهى في عالم كرة القدم",
    author: "Mahmoud Daoud",
    role: "Content Creator",
    photo: "https://casamadridista.com/wp-content/uploads/2025/08/IMG_5217.jpg",
  },
];
