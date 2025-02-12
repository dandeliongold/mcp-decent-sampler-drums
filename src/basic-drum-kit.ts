import { VelocityLayer } from './drum-kit-types.js';

export interface BasicDrumKitConfig {
  globalSettings: {
    velocityLayers?: VelocityLayer[];
  };
  drumPieces: {
    name: string;
    rootNote: number;
    samples: {
      path: string;
      volume?: string;
    }[];
  }[];
}

// Type guard for BasicDrumKitConfig
export function isBasicDrumKitConfig(obj: unknown): obj is BasicDrumKitConfig {
  if (!obj || typeof obj !== 'object') return false;

  const config = obj as Partial<BasicDrumKitConfig>;
  
  // Check globalSettings and ensure no advanced features
  if (!config.globalSettings || typeof config.globalSettings !== 'object') {
    return false;
  }

  // Check for advanced features in globalSettings
  const globalSettings = config.globalSettings as any;
  if (
    globalSettings.drumControls !== undefined ||
    globalSettings.roundRobin !== undefined ||
    globalSettings.micBuses !== undefined
  ) {
    return false;
  }

  // Validate velocity layers if they exist
  if (config.globalSettings.velocityLayers !== undefined) {
    if (!Array.isArray(config.globalSettings.velocityLayers)) {
      return false;
    }
    
    if (!config.globalSettings.velocityLayers.every(layer => 
      layer &&
      typeof layer === 'object' &&
      typeof layer.low === 'number' &&
      typeof layer.high === 'number' &&
      typeof layer.name === 'string'
    )) {
      return false;
    }
  }

  // Check drumPieces
  if (!Array.isArray(config.drumPieces)) {
    return false;
  }

  return config.drumPieces.every(piece => 
    piece &&
    typeof piece === 'object' &&
    typeof piece.name === 'string' &&
    typeof piece.rootNote === 'number' &&
    Array.isArray(piece.samples) &&
    piece.samples.every(sample => {
      if (!sample || typeof sample !== 'object' || typeof sample.path !== 'string') {
        return false;
      }

      // Optional volume validation
      if (sample.volume !== undefined && typeof sample.volume !== 'string') {
        return false;
      }

      // Check for advanced sample features
      const sampleObj = sample as any;
      if (
        sampleObj.seqPosition !== undefined ||
        sampleObj.micConfig !== undefined
      ) {
        return false;
      }

      return true;
    }) &&
    // Check for advanced drum piece features
    !(piece as any).muting
  );
}

// Helper function to create a basic drum kit configuration
export function createBasicDrumKit(config: BasicDrumKitConfig): BasicDrumKitConfig {
  // Validate the configuration before returning
  if (!isBasicDrumKitConfig(config)) {
    throw new Error('Invalid basic drum kit configuration');
  }
  
  return config;
}
