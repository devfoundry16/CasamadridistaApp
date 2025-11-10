export type PositionCode =
  | "GK"
  | "RB"
  | "CB"
  | "LB"
  | "DMF"
  | "CM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST";

export interface Player {
  id: string;
  name: string;
  position: PositionCode;
  number: number;
  imageUrl?: string;
}

export interface PositionSlot {
  position: PositionCode;
  x: number;
  y: number;
}

export type FormationType =
  | "4-3-3"
  | "4-4-2"
  | "3-5-2"
  | "4-2-3-1"
  | "5-3-2"
  | "4-1-4-1"
  | "3-4-3"
  | "4-5-1";

export const FORMATIONS: Record<FormationType, PositionSlot[]> = {
  "4-3-3": [
    { position: "GK", x: 50, y: 85 },
    { position: "LB", x: 10, y: 65 },
    { position: "CB", x: 36.3, y: 65 },
    { position: "CB", x: 62.6, y: 65 },
    { position: "RB", x: 90, y: 65 },
    { position: "CM", x: 15, y: 40 },
    { position: "CM", x: 50, y: 40 },
    { position: "CM", x: 85, y: 40 },
    { position: "LW", x: 20, y: 10 },
    { position: "ST", x: 50, y: 10 },
    { position: "RW", x: 80, y: 10 },
  ],
  "4-4-2": [
    { position: "GK", x: 50, y: 85 },
    { position: "LB", x: 10, y: 65 },
    { position: "CB", x: 36.3, y: 65 },
    { position: "CB", x: 62.6, y: 65 },
    { position: "RB", x: 90, y: 65 },
    { position: "LW", x: 10, y: 40 },
    { position: "CM", x: 36.3, y: 40 },
    { position: "CM", x: 62.6, y: 40 },
    { position: "RW", x: 90, y: 40 },
    { position: "ST", x: 35, y: 15 },
    { position: "ST", x: 65, y: 15 },
  ],
  "3-5-2": [
    { position: "GK", x: 50, y: 85 },
    { position: "CB", x: 15, y: 65 },
    { position: "CB", x: 50, y: 65 },
    { position: "CB", x: 85, y: 65 },
    { position: "LB", x: 10, y: 45 },
    { position: "CM", x: 30, y: 40 },
    { position: "CM", x: 50, y: 40 },
    { position: "CM", x: 70, y: 40 },
    { position: "RB", x: 90, y: 45 },
    { position: "ST", x: 35, y: 15 },
    { position: "ST", x: 65, y: 15 },
  ],
  "4-2-3-1": [
    { position: "GK", x: 50, y: 85 },
    { position: "LB", x: 10, y: 65 },
    { position: "CB", x: 36.3, y: 65 },
    { position: "CB", x: 62.6, y: 65 },
    { position: "RB", x: 90, y: 65 },
    { position: "DMF", x: 35, y: 46 },
    { position: "DMF", x: 65, y: 46 },
    { position: "LW", x: 20, y: 26 },
    { position: "CAM", x: 50, y: 26 },
    { position: "RW", x: 80, y: 26 },
    { position: "ST", x: 50, y: 6 },
  ],
  "5-3-2": [
    { position: "GK", x: 50, y: 85 },
    { position: "LB", x: 10, y: 61 },
    { position: "CB", x: 30, y: 61 },
    { position: "CB", x: 50, y: 61 },
    { position: "CB", x: 70, y: 61 },
    { position: "RB", x: 90, y: 61 },
    { position: "CM", x: 15, y: 40 },
    { position: "CM", x: 50, y: 40 },
    { position: "CM", x: 85, y: 40 },
    { position: "ST", x: 35, y: 15 },
    { position: "ST", x: 65, y: 15 },
  ],
  "4-1-4-1": [
    { position: "GK", x: 50, y: 85 },
    { position: "LB", x: 10, y: 65 },
    { position: "CB", x: 36.3, y: 65 },
    { position: "CB", x: 62.6, y: 65 },
    { position: "RB", x: 90, y: 65 },
    { position: "DMF", x: 50, y: 47 },
    { position: "LW", x: 10, y: 30 },
    { position: "CM", x: 36.3, y: 30 },
    { position: "CM", x: 62.6, y: 30 },
    { position: "RW", x: 90, y: 30 },
    { position: "ST", x: 50, y: 8 },
  ],
  "3-4-3": [
    { position: "GK", x: 50, y: 85 },
    { position: "CB", x: 15, y: 65 },
    { position: "CB", x: 50, y: 65 },
    { position: "CB", x: 85, y: 65 },
    { position: "LB", x: 10, y: 40 },
    { position: "CM", x: 36.3, y: 40 },
    { position: "CM", x: 62.6, y: 40 },
    { position: "RB", x: 90, y: 40 },
    { position: "LW", x: 15, y: 10 },
    { position: "ST", x: 50, y: 10 },
    { position: "RW", x: 85, y: 10 },
  ],
  "4-5-1": [
    { position: "GK", x: 50, y: 85 },
    { position: "LB", x: 10, y: 65 },
    { position: "CB", x: 36.3, y: 65 },
    { position: "CB", x: 62.6, y: 65 },
    { position: "RB", x: 90, y: 65 },
    { position: "LW", x: 10, y: 37 },
    { position: "CM", x: 30, y: 37 },
    { position: "CM", x: 50, y: 38 },
    { position: "CM", x: 70, y: 37 },
    { position: "RW", x: 90, y: 37 },
    { position: "ST", x: 50, y: 8 },
  ],
};
