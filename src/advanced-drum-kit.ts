import { BasicDrumKitConfig, isBasicDrumKitConfig } from './basic-drum-kit.js';
import { 
  RoundRobinMode, 
  VelocityLayer, 
  MutingConfig, 
  RoundRobinConfig 
} from './drum-kit-types.js';
import { MicBusConfig, DrumMicConfig, isMicBusConfig } from './mic-routing.js';
import { 
  DrumPitchConfig, 
  DrumEnvelopeConfig,
  isDrumPitchConfig,
  isDrumEnvelopeConfig
} from './drum-controls.js';

export interface AdvancedSampleConfig {
  path: string;
  volume?: string;
  seqMode?: RoundRobinMode;
  seqLength?: number;
  seqPosition?: number;
  micConfig?: DrumMicConfig;
}

export interface AdvancedDrumPieceConfig {
  name: string;
  rootNote: number;
  seqMode?: RoundRobinMode;
  seqLength?: number;
  seqPosition?: number;
  muting?: MutingConfig;
  samples: AdvancedSampleConfig[];
}

export interface AdvancedDrumKitConfig extends BasicDrumKitConfig {
  globalSettings: BasicDrumKitConfig["globalSettings"] & {
    roundRobin?: RoundRobinConfig;
    drumControls?: {
      [drumName: string]: {
        pitch?: DrumPitchConfig;
        envelope?: DrumEnvelopeConfig;
      };
    };
    micBuses?: MicBusConfig[];
  };
  drumPieces: AdvancedDrumPieceConfig[];
}

// Type guard for AdvancedDrumKitConfig
export function isAdvancedDrumKitConfig(obj: unknown): obj is AdvancedDrumKitConfig {
  // First, ensure it passes basic drum kit validation
  if (!isBasicDrumKitConfig(obj)) return false;

  const config = obj as Partial<AdvancedDrumKitConfig>;
  
  // Ensure globalSettings exists
  if (!config.globalSettings) return false;

  // Validate round robin configuration if present
  if (config.globalSettings.roundRobin) {
    if (typeof config.globalSettings.roundRobin !== 'object') return false;
    if (!['round_robin', 'random', 'true_random', 'always'].includes(config.globalSettings.roundRobin.mode)) {
      return false;
    }
    if (config.globalSettings.roundRobin.length !== undefined && 
        typeof config.globalSettings.roundRobin.length !== 'number') {
      return false;
    }
  }

  // Validate drum controls if present
  if (config.globalSettings.drumControls) {
    if (typeof config.globalSettings.drumControls !== 'object') return false;
    
    for (const drumName in config.globalSettings.drumControls) {
      const drumControl = config.globalSettings.drumControls[drumName];
      
      if (drumControl.pitch !== undefined && !isDrumPitchConfig(drumControl.pitch)) {
        return false;
      }
      
      if (drumControl.envelope !== undefined && !isDrumEnvelopeConfig(drumControl.envelope)) {
        return false;
      }
    }
  }

  // Validate mic buses if present
  if (config.globalSettings.micBuses) {
    if (!Array.isArray(config.globalSettings.micBuses)) return false;
    if (!config.globalSettings.micBuses.every(isMicBusConfig)) return false;
  }

  // Ensure drumPieces exists and is an array
  if (!Array.isArray(config.drumPieces)) return false;

  // Validate advanced drum pieces
  return config.drumPieces.every(piece => {
    // Validate piece name and root note
    if (typeof piece.name !== 'string' || typeof piece.rootNote !== 'number') return false;

    // Validate sequence mode
    if (piece.seqMode !== undefined && 
        !['round_robin', 'random', 'true_random', 'always'].includes(piece.seqMode)) {
      return false;
    }

    // Validate sequence length and position
    if (piece.seqLength !== undefined && typeof piece.seqLength !== 'number') return false;
    if (piece.seqPosition !== undefined && typeof piece.seqPosition !== 'number') return false;

    // Validate muting configuration
    if (piece.muting) {
      if (!Array.isArray(piece.muting.tags) || !Array.isArray(piece.muting.silencedByTags)) {
        return false;
      }
    }

    // Validate advanced sample configurations
    return piece.samples.every(sample => {
      // Validate sample path
      if (typeof sample.path !== 'string') return false;

      // Optional volume validation
      if (sample.volume !== undefined && typeof sample.volume !== 'string') return false;

      // Validate sample-level sequence settings
      if (sample.seqMode !== undefined && 
          !['round_robin', 'random', 'true_random', 'always'].includes(sample.seqMode)) {
        return false;
      }
      if (sample.seqLength !== undefined && typeof sample.seqLength !== 'number') return false;
      if (sample.seqPosition !== undefined && typeof sample.seqPosition !== 'number') return false;

      // Validate mic configuration
      if (sample.micConfig) {
        if (typeof sample.micConfig !== 'object') return false;
        if (!['close', 'overheadLeft', 'overheadRight', 'roomLeft', 'roomRight'].includes(sample.micConfig.position)) {
          return false;
        }
        if (typeof sample.micConfig.busIndex !== 'number') return false;
        if (sample.micConfig.volume !== undefined && typeof sample.micConfig.volume !== 'number') {
          return false;
        }
      }

      return true;
    });
  });
}

// Helper function to create an advanced drum kit configuration
export function createAdvancedDrumKit(config: AdvancedDrumKitConfig): AdvancedDrumKitConfig {
  // Validate the configuration before returning
  if (!isAdvancedDrumKitConfig(config)) {
    throw new Error('Invalid advanced drum kit configuration');
  }
  
  return config;
}
