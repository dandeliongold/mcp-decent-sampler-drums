// Types for mic routing configuration
export interface MicVolumeConfig {
  default: number;     // dB value
  min?: number;        // Optional min dB
  max?: number;        // Optional max dB
  midiCC?: number;     // MIDI CC number for volume control
}

export interface MicBusConfig {
  name: string;          // e.g., "Close Mic", "OH L"
  outputTarget: string;  // e.g., "AUX_STEREO_OUTPUT_1"
  volume?: MicVolumeConfig;
  effects?: any[];       // Placeholder for future effects support
}

export interface DrumMicConfig {
  position: 'close' | 'overheadLeft' | 'overheadRight' | 'roomLeft' | 'roomRight';
  busIndex: number;      // Reference to which bus this mic routes to
  volume?: number;       // Optional per-sample volume adjustment
}

// Type guard for MicBusConfig
export function isMicBusConfig(obj: unknown): obj is MicBusConfig {
  if (!obj || typeof obj !== 'object') return false;
  
  const config = obj as Partial<MicBusConfig>;
  if (typeof config.name !== 'string') return false;
  if (typeof config.outputTarget !== 'string') return false;
  
  if (config.volume !== undefined) {
    if (typeof config.volume !== 'object') return false;
    if (typeof config.volume.default !== 'number') return false;
    if (config.volume.min !== undefined && typeof config.volume.min !== 'number') return false;
    if (config.volume.max !== undefined && typeof config.volume.max !== 'number') return false;
    if (config.volume.midiCC !== undefined && typeof config.volume.midiCC !== 'number') return false;
  }
  
  return true;
}

// Generate XML for bus definitions with MIDI controls
export function configureMicBuses(buses: MicBusConfig[]): string {
  if (!Array.isArray(buses) || !buses.every(isMicBusConfig)) {
    throw new Error('Invalid mic bus configuration');
  }

  const busElements = buses.map((bus, index) => {
    // Generate volume control XML if volume config exists
    const volumeControl = bus.volume ? `
      <control type="float" name="${bus.name} Volume" 
               default="${bus.volume.default}"
               ${bus.volume.min !== undefined ? `minimum="${bus.volume.min}"` : ''}
               ${bus.volume.max !== undefined ? `maximum="${bus.volume.max}"` : ''}
               ${bus.volume.midiCC !== undefined ? `midi_cc="${bus.volume.midiCC}"` : ''}>
        <binding type="bus" level="bus" position="${index}" parameter="volume" />
      </control>` : '';

    // Generate bus XML with optional volume control
    return `    <bus name="${bus.name}" output1Target="${bus.outputTarget}">${volumeControl}
    </bus>`;
  });

  return `  <buses>\n${busElements.join('\n')}\n  </buses>`;
}

// Update sample XML with bus routing
export function generateSampleBusRouting(
  samplePath: string,
  busIndex: number,
  volume?: number
): string {
  const volumeAttr = volume !== undefined ? ` output1Volume="${volume}"` : '';
  return `      <sample path="${samplePath}" output1Target="BUS_${busIndex + 1}"${volumeAttr} />`;
}

// Validate bus configurations (volumes, outputs, etc.)
function validateBusConfigurations(buses: MicBusConfig[]): void {
  // Check for unique output targets
  const outputTargets = new Set<string>();
  buses.forEach(bus => {
    if (outputTargets.has(bus.outputTarget)) {
      throw new Error(
        `Duplicate output target ${bus.outputTarget} for bus ${bus.name}`
      );
    }
    outputTargets.add(bus.outputTarget);
  });

  // Validate volume ranges if specified
  buses.forEach(bus => {
    if (bus.volume) {
      if (bus.volume.min !== undefined && bus.volume.max !== undefined) {
        if (bus.volume.min > bus.volume.max) {
          throw new Error(
            `Invalid volume range for bus ${bus.name}: min (${bus.volume.min}) > max (${bus.volume.max})`
          );
        }
        if (bus.volume.default < bus.volume.min || bus.volume.default > bus.volume.max) {
          throw new Error(
            `Default volume ${bus.volume.default} for bus ${bus.name} outside range [${bus.volume.min}, ${bus.volume.max}]`
          );
        }
      }
    }
  });
}

// Validate mic routing to buses
function validateMicRoutings(buses: MicBusConfig[], mics: DrumMicConfig[]): void {
  mics.forEach(mic => {
    if (mic.busIndex < 0 || mic.busIndex >= buses.length) {
      throw new Error(
        `Invalid bus index ${mic.busIndex} for mic position ${mic.position}`
      );
    }
  });
}

// Main validation function that orchestrates the validation steps
export function validateMicRouting(
  buses: MicBusConfig[],
  mics: DrumMicConfig[]
): void {
  // First validate bus configurations
  validateBusConfigurations(buses);
  
  // Then validate mic routings
  validateMicRoutings(buses, mics);
}
