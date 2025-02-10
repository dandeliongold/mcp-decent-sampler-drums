import { isDrumPitchConfig, isDrumEnvelopeConfig } from './drum-controls.js';

import { MicBusConfig, DrumMicConfig, configureMicBuses, generateSampleBusRouting, validateMicRouting } from './mic-routing.js';

export interface DrumKitConfig {
  globalSettings: {
    velocityLayers?: {
      low: number,
      high: number,
      name: string
    }[],
    roundRobin?: {
      mode: "round_robin" | "random" | "true_random" | "always",
      length?: number  // Optional: for explicit sequence length
    },
    drumControls?: {
      [drumName: string]: {
        pitch?: {
          default: number,  // Default pitch in semitones (0 = no change)
          min?: number,     // Minimum pitch adjustment (e.g. -12 semitones)
          max?: number      // Maximum pitch adjustment (e.g. +12 semitones)
        },
        envelope?: {
          attack: number,   // Attack time in seconds
          decay: number,    // Decay time in seconds
          sustain: number,  // Sustain level (0-1)
          release: number,  // Release time in seconds
          attackCurve?: number,  // -100 to 100, Default: -100 (logarithmic)
          decayCurve?: number,   // -100 to 100, Default: 100 (exponential)
          releaseCurve?: number  // -100 to 100, Default: 100 (exponential)
        }
      }
    },
    micBuses?: MicBusConfig[],  // Configuration for mic routing and volumes
  },
  drumPieces: {
    name: string,
    rootNote: number,
    samples: {
      path: string,
      volume?: string,
      seqPosition?: number,  // Position in round robin sequence
      seqMode?: "round_robin" | "random" | "true_random" | "always",
      seqLength?: number,
      micConfig?: DrumMicConfig  // Configuration for mic routing
    }[],
    seqMode?: "round_robin" | "random" | "true_random" | "always",
    seqLength?: number,
    seqPosition?: number,
    muting?: {
      tags: string[],
      silencedByTags: string[]
    }
  }[]
}

export function generateGroupsXml(config: DrumKitConfig): string {
  const { globalSettings, drumPieces } = config;
  
  // Generate buses XML if mic routing is configured
  const busesXml = globalSettings.micBuses ? 
    configureMicBuses(globalSettings.micBuses) : '';
  
  // Add round robin attributes to top-level groups if configured
  const roundRobinAttrs = globalSettings.roundRobin
    ? ` seqMode="${globalSettings.roundRobin.mode}"${
        globalSettings.roundRobin.length 
          ? ` seqLength="${globalSettings.roundRobin.length}"`
          : ''
      }`
    : '';

  const groups: string[] = [];

  for (const piece of drumPieces) {
    // Combine muting and round robin attributes for group
    let groupAttrs = piece.muting 
      ? ` tags="${piece.muting.tags.join(',')}" silencedByTags="${piece.muting.silencedByTags.join(',')}" silencingMode="fast"`
      : '';
    
    // Add group-level round robin settings if present
    if (piece.seqMode) {
      groupAttrs += ` seqMode="${piece.seqMode}"`;
    }
    if (piece.seqLength) {
      groupAttrs += ` seqLength="${piece.seqLength}"`;
    }
    if (piece.seqPosition) {
      groupAttrs += ` seqPosition="${piece.seqPosition}"`;
    }

    // Add drum controls if configured
    const drumControls = globalSettings.drumControls?.[piece.name];
    let envelopeAttrs = '';
    let pitchControl = '';
    
    if (drumControls) {
      // Add envelope attributes if configured
      if (drumControls.envelope) {
        const env = drumControls.envelope;
        envelopeAttrs = ` attack="${env.attack}" decay="${env.decay}" sustain="${env.sustain}" release="${env.release}"`;
        if (env.attackCurve !== undefined) envelopeAttrs += ` attackCurve="${env.attackCurve}"`;
        if (env.decayCurve !== undefined) envelopeAttrs += ` decayCurve="${env.decayCurve}"`;
        if (env.releaseCurve !== undefined) envelopeAttrs += ` releaseCurve="${env.releaseCurve}"`;
      }
      
      // Add pitch control if configured
      if (drumControls.pitch) {
        const pitch = drumControls.pitch;
        groupAttrs += ` tuning="${pitch.default}"`;
        pitchControl = `      <control type="pitch" name="${piece.name} Pitch" default="${pitch.default}"` +
          (pitch.min !== undefined ? ` minimum="${pitch.min}"` : '') +
          (pitch.max !== undefined ? ` maximum="${pitch.max}"` : '') +
          `>\n        <binding type="general" level="group" position="0" parameter="groupTuning" />\n      </control>\n`;
      }
    }

    const sampleElements: string[] = [];
    
    for (const sample of piece.samples) {
      const volumeAttr = sample.volume ? ` volume="${sample.volume}"` : '';
      let velocityAttrs = '';
      if (globalSettings.velocityLayers) {
        const layerIndex = piece.samples.indexOf(sample);
        if (layerIndex < globalSettings.velocityLayers.length) {
          const layer = globalSettings.velocityLayers[layerIndex];
          velocityAttrs = ` loVel="${layer.low}" hiVel="${layer.high}"`;
        }
      }
      
      // Add sample-level round robin settings
      let sampleRRAttrs = '';
      if (sample.seqMode) {
        sampleRRAttrs += ` seqMode="${sample.seqMode}"`;
      }
      if (sample.seqLength) {
        sampleRRAttrs += ` seqLength="${sample.seqLength}"`;
      }
      if (sample.seqPosition) {
        sampleRRAttrs += ` seqPosition="${sample.seqPosition}"`;
      }

      // Generate sample element with bus routing if configured
      const sampleXml = sample.micConfig ? 
        generateSampleBusRouting(sample.path, sample.micConfig.busIndex, sample.micConfig.volume) :
        `      <sample path="${sample.path}"${volumeAttr} rootNote="${piece.rootNote}" ` +
        `loNote="${piece.rootNote}" hiNote="${piece.rootNote}"${velocityAttrs}${sampleRRAttrs} />`;
      
      sampleElements.push(sampleXml);
    }

    groups.push(
      `  <group name="${piece.name}" ampVelTrack="1"${groupAttrs}${envelopeAttrs}>\n` +
      (pitchControl ? pitchControl : '') +
      `${sampleElements.join('\n')}\n` +
      `  </group>`
    );
  }

  // Combine buses and groups XML
  const xml = [];
  if (busesXml) xml.push(busesXml);
  xml.push(`<groups${roundRobinAttrs}>\n${groups.join('\n\n')}\n</groups>`);
  
  return xml.join('\n\n');
}

// Type guard function to validate DrumKitConfig
export function isDrumKitConfig(obj: unknown): obj is DrumKitConfig {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const config = obj as Partial<DrumKitConfig>;
  
  // Check if globalSettings exists and is an object
  if (!config.globalSettings || typeof config.globalSettings !== 'object') {
    return false;
  }

  // Check velocity layers if they exist
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

  // Check round robin settings if they exist
  if (config.globalSettings.roundRobin !== undefined) {
    const rr = config.globalSettings.roundRobin;
    if (typeof rr !== 'object' || 
        !['round_robin', 'random', 'true_random', 'always'].includes(rr.mode) ||
        (rr.length !== undefined && typeof rr.length !== 'number')) {
      return false;
    }
  }

  // Check drum controls if they exist
  if (config.globalSettings.drumControls !== undefined) {
    const controls = config.globalSettings.drumControls;
    if (typeof controls !== 'object' || controls === null) {
      return false;
    }

    // Check each drum's controls using type guards
    for (const drumName in controls) {
      const drumControl = controls[drumName];
      
      if (drumControl.pitch !== undefined && !isDrumPitchConfig(drumControl.pitch)) {
        return false;
      }

      if (drumControl.envelope !== undefined && !isDrumEnvelopeConfig(drumControl.envelope)) {
        return false;
      }
    }
  }

  // Check drumPieces array
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

      // Validate optional fields
      if (sample.seqPosition !== undefined && typeof sample.seqPosition !== 'number') {
        return false;
      }
      if (sample.seqMode !== undefined && 
          !['round_robin', 'random', 'true_random', 'always'].includes(sample.seqMode)) {
        return false;
      }
      if (sample.seqLength !== undefined && typeof sample.seqLength !== 'number') {
        return false;
      }
      if (sample.volume !== undefined && typeof sample.volume !== 'string') {
        return false;
      }

      return true;
    }) &&
    // Validate group-level round robin settings
    (piece.seqMode === undefined || 
      ['round_robin', 'random', 'true_random', 'always'].includes(piece.seqMode)) &&
    (piece.seqLength === undefined || typeof piece.seqLength === 'number') &&
    (piece.seqPosition === undefined || typeof piece.seqPosition === 'number')
  );
}
