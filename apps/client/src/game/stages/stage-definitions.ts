export interface StageDefinition {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  gridColor: string;
  floorColor: string;
  gridSize: number;
}

export const STAGE_TEMPLATES: Record<string, StageDefinition> = {
  SHADOW_SANCTUARY: {
    id: 'shadow_sanctuary',
    name: 'SHADOW SANCTUARY',
    description: 'A dark, mystical temple with glowing violet aura boundaries.',
    bgColor: '#0d001a',
    gridColor: '#800080',
    floorColor: '#2b0033',
    gridSize: 50
  },
  CYBER_GRID: {
    id: 'cyber_grid',
    name: 'CYBER GRID',
    description: 'A virtual reality training floor painted in neon cyan lines.',
    bgColor: '#00111a',
    gridColor: '#00b3ff',
    floorColor: '#00ffff',
    gridSize: 35
  },
  VOLCANIC_RIFT: {
    id: 'volcanic_rift',
    name: 'VOLCANIC RIFT',
    description: 'A treacherous ash arena bordered by bubbling magma cracks.',
    bgColor: '#1a0500',
    gridColor: '#ff5500',
    floorColor: '#401000',
    gridSize: 45
  }
};
