export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export interface PositionData {
  x: number;
  y: number;
  z: number;
}

export interface OrnamentType {
  type: 'gift' | 'bauble' | 'star';
  color: string;
  weight: number; // 0-1, affects floating speed
  scale: number;
}
