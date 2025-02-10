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
    }
  },
  drumPieces: {
    name: string,
    rootNote: number,
    samples: {
      path: string,
      volume?: string,
      seqPosition?: number,  // Position in round robin sequence
      seqMode?: "round_robin" | "random" | "true_random" | "always",
      seqLength?: number
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

      sampleElements.push(
        `      <sample path="${sample.path}"${volumeAttr} rootNote="${piece.rootNote}" ` +
        `loNote="${piece.rootNote}" hiNote="${piece.rootNote}"${velocityAttrs}${sampleRRAttrs} />`
      );
    }

    groups.push(
      `  <group name="${piece.name}" ampVelTrack="1" tuning="0.0"${groupAttrs}>\n` +
      `${sampleElements.join('\n')}\n` +
      `  </group>`
    );
  }

  return `<groups${roundRobinAttrs}>\n${groups.join('\n\n')}\n</groups>`;
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
