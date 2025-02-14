# Input Schemas

This document details the TypeScript interfaces and parameter descriptions for all tool configurations.

## configure_drum_controls

Configuration schema for drum control parameters including pitch and envelope settings.

```typescript
{
  drumControls: {
    [drumName: string]: {
      pitch?: {
        default: number,     // Default pitch in semitones (0 = no change)
        min?: number,        // Optional: Minimum pitch adjustment (e.g. -12)
        max?: number         // Optional: Maximum pitch adjustment (e.g. +12)
      },
      envelope: {
        attack: number,      // Attack time in seconds
        decay: number,       // Decay time in seconds
        sustain: number,     // Sustain level (0-1)
        release: number,     // Release time in seconds
        attackCurve?: number,  // Optional: -100 to 100 (-100 = logarithmic)
        decayCurve?: number,   // Optional: -100 to 100 (100 = exponential)
        releaseCurve?: number  // Optional: -100 to 100 (100 = exponential)
      }
    }
  }
}
```

### Parameter Details

#### Pitch Control
- `default`: Base pitch adjustment in semitones
- `min`: Lower bound for pitch adjustment range
- `max`: Upper bound for pitch adjustment range

#### Envelope Settings
- `attack`: Time from note-on to peak amplitude
- `decay`: Time from peak to sustain level
- `sustain`: Held amplitude level (0-1)
- `release`: Time from note-off to silence
- `*Curve`: Shape of the envelope segment (-100 to 100)

## configure_mic_routing

Configuration schema for multi-microphone routing and control setup.

```typescript
{
  micBuses: [{
    name: string,           // Display name (e.g., 'Close Mic', 'OH L')
    outputTarget: string,   // Output routing (e.g., 'AUX_STEREO_OUTPUT_1')
    volume?: {
      default: number,      // Default volume in dB
      min?: number,         // Optional: Minimum volume in dB (e.g., -96)
      max?: number,         // Optional: Maximum volume in dB (e.g., 12)
      midiCC?: number      // Optional: MIDI CC number for volume control
    }
  }],
  drumPieces: [{
    name: string,
    rootNote: number,
    samples: [{
      path: string,
      micConfig: {
        position: "close" | "overheadLeft" | "overheadRight" | "roomLeft" | "roomRight",
        busIndex: number,
        volume?: number
      }
    }]
  }]
}
```

### Parameter Details

#### Mic Bus Configuration
- `name`: Human-readable identifier for the mic channel
- `outputTarget`: Routing destination for the mic signal
- `volume`: Volume control parameters including MIDI mapping

#### Drum Piece Configuration
- `name`: Identifier for the drum piece
- `rootNote`: MIDI note number for triggering
- `samples`: Array of sample configurations
- `micConfig`: Microphone routing and settings

## configure_round_robin

Configuration schema for round robin playback setup.

```typescript
{
  directory: string,        // Absolute path to samples directory
  mode: "round_robin" | "random" | "true_random" | "always",
  length: number,          // Number of round robin variations
  samples: [{
    path: string,          // Path to sample (relative to directory)
    seqPosition: number    // Position in sequence (1 to length)
  }]
}
```

### Parameter Details

- `directory`: Base path containing all samples
- `mode`: Playback behavior selection
- `length`: Total number of variations
- `samples`: Array of sample definitions with sequence positions

## generate_drum_groups

Configuration schema for drum group generation.

```typescript
{
  globalSettings: {
    velocityLayers?: {           // Optional velocity layer definitions
      low: number,               // Lower velocity bound
      high: number,              // Upper velocity bound
      name: string               // Layer identifier
    }[]                         // Omit for natural velocity response
  },
  drumPieces: {
    name: string,                // Name of the drum piece
    rootNote: number,            // MIDI note number
    samples: {
      path: string,              // Path to sample file
      volume?: string           // Optional per-sample volume
    }[],
    muting?: {                   // Optional muting group configuration
      tags: string[],            // Tags for this group
      silencedByTags: string[]   // Tags that silence this group
    }
  }[]
}
```

### Parameter Details

#### Global Settings
- `velocityLayers`: Optional velocity mapping configuration
  * `low`: Minimum velocity value
  * `high`: Maximum velocity value
  * `name`: Layer identifier

#### Drum Pieces
- `name`: Identifier for the drum piece
- `rootNote`: MIDI trigger note
- `samples`: Sample file configurations
- `muting`: Optional muting group setup

## analyze_wav_samples

Configuration schema for WAV file analysis.

```typescript
{
  paths: string[]  // Array of absolute paths to WAV files
}
```

### Parameter Details

- `paths`: Array of file paths to analyze
  * Must be absolute paths
  * Example: `['C:/Users/username/Documents/Samples/kick.wav']`
