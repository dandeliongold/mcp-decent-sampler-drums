import { DrumKitConfig } from './drum-kit.js';
import * as fs from 'fs';
import * as path from 'path';

export type RoundRobinMode = "round_robin" | "random" | "true_random" | "always";

export interface RoundRobinSettings {
  mode: RoundRobinMode;
  length?: number;  // Optional: DecentSampler can auto-detect
  seqPosition?: number;  // For group-level settings
}

export interface RoundRobinSample {
  path: string;
  seqPosition?: number;  // Optional at sample level if group has seqPosition
  settings?: RoundRobinSettings;  // Optional per-sample settings
}

export interface RoundRobinGroup {
  name: string;
  rootNote?: number;
  settings?: RoundRobinSettings;  // Optional per-group settings
  samples: RoundRobinSample[];
}

export interface RoundRobinConfig {
  mode: RoundRobinMode;
  length?: number;  // Optional: DecentSampler can auto-detect
  groups: RoundRobinGroup[];
}

export function configureRoundRobin(directory: string, config: RoundRobinConfig): DrumKitConfig {
  // If mode is not 'always', ensure seqPosition is provided at some level
  if (config.mode !== 'always') {
    for (const group of config.groups) {
      const hasGroupSeqPos = group.settings?.seqPosition !== undefined;
      
      for (const sample of group.samples) {
        if (!hasGroupSeqPos && !sample.seqPosition && !sample.settings?.seqPosition) {
          throw new Error(
            `Sample ${sample.path} needs a seqPosition when mode is ${config.mode}. ` +
            'Provide it at sample, group, or global level.'
          );
        }
      }
    }
  }

  // If length is provided, validate sequence positions
  if (config.length !== undefined) {
    for (const group of config.groups) {
      for (const sample of group.samples) {
        const seqPos = sample.seqPosition || 
                      sample.settings?.seqPosition || 
                      group.settings?.seqPosition;
        
        if (seqPos !== undefined && (seqPos < 1 || seqPos > config.length)) {
          throw new Error(
            `Invalid sequence position ${seqPos} for sample ${sample.path}. ` +
            `Must be between 1 and ${config.length}`
          );
        }
      }
    }
  }

  // Verify all files exist
  for (const group of config.groups) {
    for (const sample of group.samples) {
      const fullPath = path.join(directory, sample.path);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Sample file not found: ${sample.path}`);
      }
    }
  }

  // Create the drum kit configuration
  return {
    globalSettings: {
      roundRobin: {
        mode: config.mode,
        ...(config.length !== undefined && { length: config.length })
      }
    },
    drumPieces: config.groups.map(group => ({
      name: group.name,
      rootNote: group.rootNote || 60,
      ...(group.settings && {
        seqMode: group.settings.mode,
        ...(group.settings.length !== undefined && { seqLength: group.settings.length }),
        ...(group.settings.seqPosition !== undefined && { seqPosition: group.settings.seqPosition })
      }),
      samples: group.samples.map(sample => ({
        path: sample.path,
        ...(sample.seqPosition !== undefined && { seqPosition: sample.seqPosition }),
        ...(sample.settings && {
          seqMode: sample.settings.mode,
          ...(sample.settings.length !== undefined && { seqLength: sample.settings.length }),
          ...(sample.settings.seqPosition !== undefined && { seqPosition: sample.settings.seqPosition })
        })
      }))
    }))
  };
}
