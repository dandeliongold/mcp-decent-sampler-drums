import { MicBusConfig, DrumMicConfig } from './mic-routing.js';
import { DrumPitchConfig, DrumEnvelopeConfig } from './drum-controls.js';

// Shared round robin mode types
export type RoundRobinMode = "round_robin" | "random" | "true_random" | "always";

// Velocity Layer Configuration
export interface VelocityLayer {
  low: number;
  high: number;
  name: string;
}

// Muting Configuration
export interface MutingConfig {
  tags: string[];
  silencedByTags: string[];
}

// Round Robin Configuration
export interface RoundRobinConfig {
  mode: RoundRobinMode;
  length?: number;
}

// Utility type for creating type-safe configurations
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
