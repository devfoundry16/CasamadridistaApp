// types/formation.ts
export interface Player {
  id: number;
  name: string;
  number: number;
  position: string;
  image: string;
  x?: number;
  y?: number;
  isOnPitch?: boolean;
  translateX?: any;
  translateY?: any;
}

export interface Position {
  position: string;
  x: number;
  y: number;
}

export interface FormationData {
  [key: string]: Position[];
}

export interface Coach {
  name: string;
  image: string;
}

export interface PitchPlayer extends Player {
  x: number;
  y: number;
  translateX: any;
  translateY: any;
}