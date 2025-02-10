export interface DrumKitConfig {
  globalSettings: {
    velocityLayers?: {
      low: number,
      high: number,
      name: string
    }[]
  },
  drumPieces: {
    name: string,
    rootNote: number,
    samples: {
      path: string,
      volume?: string
    }[],
    muting?: {
      tags: string[],
      silencedByTags: string[]
    }
  }[]
}

export function generateGroupsXml(config: DrumKitConfig): string {
  const { globalSettings, drumPieces } = config;
  const groups: string[] = [];

  for (const piece of drumPieces) {
    const mutingAttrs = piece.muting 
      ? ` tags="${piece.muting.tags.join(',')}" silencedByTags="${piece.muting.silencedByTags.join(',')}" silencingMode="fast"`
      : '';

    const samples: string[] = [];
    
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
      
      samples.push(
        `      <sample path="${sample.path}"${volumeAttr} rootNote="${piece.rootNote}" ` +
        `loNote="${piece.rootNote}" hiNote="${piece.rootNote}"${velocityAttrs} />`
      );
    }

    groups.push(
      `  <group name="${piece.name}" ampVelTrack="1" tuning="0.0"${mutingAttrs}>\n` +
      `${samples.join('\n')}\n` +
      `  </group>`
    );
  }

  return `<groups>\n${groups.join('\n\n')}\n</groups>`;
}

// Type guard function to validate DrumKitConfig
export function isDrumKitConfig(obj: unknown): obj is DrumKitConfig {
  const config = obj as Partial<DrumKitConfig>;
  return (
    !!config.globalSettings &&
    (!config.globalSettings.velocityLayers || (
      Array.isArray(config.globalSettings.velocityLayers) &&
      config.globalSettings.velocityLayers.every(layer => 
        typeof layer.low === 'number' &&
        typeof layer.high === 'number' &&
        typeof layer.name === 'string'
      )
    )) &&
    Array.isArray(config.drumPieces) &&
    config.drumPieces.every(piece => 
      typeof piece.name === 'string' &&
      typeof piece.rootNote === 'number' &&
      Array.isArray(piece.samples) &&
      piece.samples.every(sample => typeof sample.path === 'string')
    )
  );
}
