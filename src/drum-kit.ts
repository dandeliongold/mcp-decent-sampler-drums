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
      seqPosition?: number  // Position in round robin sequence
    }[],
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
    const mutingAttrs = piece.muting 
      ? ` tags="${piece.muting.tags.join(',')}" silencedByTags="${piece.muting.silencedByTags.join(',')}" silencingMode="fast"`
      : '';

    // Group samples by sequence position if round robin is enabled
    const samplesBySeqPosition = new Map<number, typeof piece.samples>();
    
    if (globalSettings.roundRobin && globalSettings.roundRobin.mode !== 'always') {
      // Initialize map with empty arrays for each position
      const maxSeqPosition = Math.max(...piece.samples
        .map(s => s.seqPosition || 1)
      );
      for (let i = 1; i <= maxSeqPosition; i++) {
        samplesBySeqPosition.set(i, []);
      }
      
      // Group samples by their sequence position
      for (const sample of piece.samples) {
        const seqPos = sample.seqPosition || 1;
        const samples = samplesBySeqPosition.get(seqPos) || [];
        samples.push(sample);
        samplesBySeqPosition.set(seqPos, samples);
      }

      // Generate a group for each sequence position
      for (const [seqPos, samples] of samplesBySeqPosition) {
        const sampleElements: string[] = [];
        
        for (const sample of samples) {
          const volumeAttr = sample.volume ? ` volume="${sample.volume}"` : '';
          let velocityAttrs = '';
          if (globalSettings.velocityLayers) {
            const layerIndex = piece.samples.indexOf(sample);
            if (layerIndex < globalSettings.velocityLayers.length) {
              const layer = globalSettings.velocityLayers[layerIndex];
              velocityAttrs = ` loVel="${layer.low}" hiVel="${layer.high}"`;
            }
          }
          
          sampleElements.push(
            `      <sample path="${sample.path}"${volumeAttr} rootNote="${piece.rootNote}" ` +
            `loNote="${piece.rootNote}" hiNote="${piece.rootNote}"${velocityAttrs} />`
          );
        }

        groups.push(
          `  <group name="${piece.name}" seqPosition="${seqPos}" ampVelTrack="1" tuning="0.0"${mutingAttrs}>\n` +
          `${sampleElements.join('\n')}\n` +
          `  </group>`
        );
      }
    } else {
      // If round robin is disabled, keep original behavior
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
        
        sampleElements.push(
          `      <sample path="${sample.path}"${volumeAttr} rootNote="${piece.rootNote}" ` +
          `loNote="${piece.rootNote}" hiNote="${piece.rootNote}"${velocityAttrs} />`
        );
      }

      groups.push(
        `  <group name="${piece.name}" ampVelTrack="1" tuning="0.0"${mutingAttrs}>\n` +
        `${sampleElements.join('\n')}\n` +
        `  </group>`
      );
    }
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
    piece.samples.every(sample => 
      sample &&
      typeof sample === 'object' &&
      typeof sample.path === 'string' &&
      (sample.seqPosition === undefined || typeof sample.seqPosition === 'number')
    )
  );
}
