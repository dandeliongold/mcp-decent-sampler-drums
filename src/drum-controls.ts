import { AdvancedDrumKitConfig } from './advanced-drum-kit.js';

// Type guards for drum control configurations
export function isDrumPitchConfig(obj: unknown): obj is DrumPitchConfig {
  if (!obj || typeof obj !== 'object') return false;
  
  const pitch = obj as Partial<DrumPitchConfig>;
  if (typeof pitch.default !== 'number') return false;
  
  if (pitch.min !== undefined && typeof pitch.min !== 'number') return false;
  if (pitch.max !== undefined && typeof pitch.max !== 'number') return false;
  
  return true;
}

export function isDrumEnvelopeConfig(obj: unknown): obj is DrumEnvelopeConfig {
  if (!obj || typeof obj !== 'object') return false;
  
  const env = obj as Partial<DrumEnvelopeConfig>;
  if (typeof env.attack !== 'number' ||
      typeof env.decay !== 'number' ||
      typeof env.sustain !== 'number' ||
      typeof env.release !== 'number') {
    return false;
  }
  
  if (env.attackCurve !== undefined && typeof env.attackCurve !== 'number') return false;
  if (env.decayCurve !== undefined && typeof env.decayCurve !== 'number') return false;
  if (env.releaseCurve !== undefined && typeof env.releaseCurve !== 'number') return false;
  
  return true;
}

export interface DrumPitchConfig {
  default: number;
  min?: number;
  max?: number;
}

export interface DrumEnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve?: number;
  decayCurve?: number;
  releaseCurve?: number;
}

export interface DrumConfig {
  name: string;
  rootNote: number;  // Required instead of defaulting
  pitch?: DrumPitchConfig;
  envelope?: DrumEnvelopeConfig;
}

export interface DrumControlsConfig {
  drums: DrumConfig[];
}

function validatePitchSettings(drum: DrumConfig): void {
  if (!drum.pitch) return;

  const { default: defaultPitch, min, max } = drum.pitch;

  // Validate min/max if provided
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(
      `Invalid pitch range for drum "${drum.name}": min (${min}) cannot be greater than max (${max})`
    );
  }

  // Validate default is within range
  if (min !== undefined && defaultPitch < min) {
    throw new Error(
      `Invalid default pitch for drum "${drum.name}": ${defaultPitch} is below minimum ${min}`
    );
  }
  if (max !== undefined && defaultPitch > max) {
    throw new Error(
      `Invalid default pitch for drum "${drum.name}": ${defaultPitch} is above maximum ${max}`
    );
  }
}

function validateEnvelopeSettings(drum: DrumConfig): void {
  if (!drum.envelope) return;

  const env = drum.envelope;

  // Validate time values are positive
  if (env.attack < 0) {
    throw new Error(
      `Invalid attack time for drum "${drum.name}": ${env.attack}. Must be >= 0`
    );
  }
  if (env.decay < 0) {
    throw new Error(
      `Invalid decay time for drum "${drum.name}": ${env.decay}. Must be >= 0`
    );
  }
  if (env.release < 0) {
    throw new Error(
      `Invalid release time for drum "${drum.name}": ${env.release}. Must be >= 0`
    );
  }

  // Validate sustain level is between 0 and 1
  if (env.sustain < 0 || env.sustain > 1) {
    throw new Error(
      `Invalid sustain level for drum "${drum.name}": ${env.sustain}. Must be between 0 and 1`
    );
  }

  // Validate curve values if provided
  const validateCurve = (value: number | undefined, name: string) => {
    if (value !== undefined && (value < -100 || value > 100)) {
      throw new Error(
        `Invalid ${name} curve for drum "${drum.name}": ${value}. Must be between -100 and 100`
      );
    }
  };

  validateCurve(env.attackCurve, 'attack');
  validateCurve(env.decayCurve, 'decay');
  validateCurve(env.releaseCurve, 'release');
}

export function configureDrumControls(config: DrumControlsConfig): AdvancedDrumKitConfig {
  // Validate all drum configurations
  for (const drum of config.drums) {
    validatePitchSettings(drum);
    validateEnvelopeSettings(drum);
  }

  // Create the drum kit configuration
  return {
    globalSettings: {
      drumControls: config.drums.reduce((acc, drum) => ({
        ...acc,
        [drum.name]: {
          ...(drum.pitch && { pitch: drum.pitch }),
          ...(drum.envelope && { envelope: drum.envelope })
        }
      }), {})
    },
    drumPieces: config.drums.map(drum => ({
      name: drum.name,
      rootNote: drum.rootNote,
      samples: [] // Let caller provide samples
    }))
  };
}
