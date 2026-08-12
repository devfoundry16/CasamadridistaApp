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
