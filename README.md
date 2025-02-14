# decent-sampler-drums MCP Server

A Model Context Protocol server for generating DecentSampler drum kit configurations.

This TypeScript-based MCP server provides tools for working with DecentSampler drum kit presets, including WAV file analysis and XML generation.

<a href="https://glama.ai/mcp/servers/phypkuqwcn"><img width="380" height="200" src="https://glama.ai/mcp/servers/phypkuqwcn/badge" alt="Decent-Sampler Drums Server MCP server" /></a>

**Warning:** Creating complex presets may end up exceeding Claude Desktop's maximum message length.  We are still working on streamlining this tool to work around this limitation.  If you are creating simple presets without a lot of mics or other variations, the xml file should be small enough for Claude to write to a file.

## Features

### Tools

- `analyze_wav_samples` - Analyze WAV files to validate drum kit samples
  - Validates WAV header formatting
  - Verifies metadata consistency for multi-mic setups
  - Helpful for troubleshooting potential playback issues before preset creation

- `configure_drum_controls` - Configure global pitch and envelope controls for each drum type
  - Add per-drum pitch controls with customizable ranges
  - Configure ADSR envelope settings for natural decay control
  - Generate proper XML structure for global drum controls
  - Supports custom curve shapes for attack, decay, and release

- `configure_mic_routing` - Set up multi-mic routing with MIDI controls
  - Individual volume controls for each mic position (close, OH L/R, room L/R)
  - Route each mic to its own auxiliary output for DAW mixing
  - MIDI CC mappings for mic volumes
  - Flexible bus routing for shared effects processing

- `configure_round_robin` - Configure round robin sample playback
  - Support for multiple playback modes: round_robin, random, true_random, always
  - Automatic sequence position validation
  - Sample file existence verification
  - Generates proper XML structure for round robin playback

- `generate_drum_groups` - Generate DecentSampler `<groups>` XML for drum kits
  - Flexible velocity handling:
    * Simple mode: Natural velocity response without explicit layers
    * Advanced mode: Multiple velocity layers with configurable ranges
  - Handles sample path mapping and root note assignments
  - Optional muting groups with tags
  - Configurable global settings

### Prompts

When using this MCP server to generate simple presets, you should always reference the `simple_preset_guidelines` prompt.

When using this MCP server to generate more complex presets (including sections such as buses, effects, etc.), you should instead reference the `advanced_preset_guidelines` prompt.  Note that creating complex presets with a large number of samples can still be unstable and may end up exceeding Claude Desktop's maximum message length.

## Resources

### About Decent Sampler

Decent Sampler is a FREE sampling plugin that allows you to play samples in the Decent Sampler format.

### Useful Links

- [Download Decent Sampler Plugin](https://www.decentsamples.com/product/decent-sampler-plugin/)
- [Decent Sampler Developer Resources](https://www.decentsamples.com/decent-sampler-developer-resources/)

### Sample Sources

To create your own drum kits, you'll first need samples. If you don't already have samples ready to go and want to start experimenting, you can start by exploring [FreeSound.org](https://freesound.org/) which is a collaborative database of creative-commons licensed sounds.  

Almost any sound can be used as a drum or percussive instrument.  The goal of this MCP server is to make it easier to set up your own presets, whether you're playing your kitchen utensils into your phone, or recording a full kit in a studio.

## Input Schemas

We recommend referencing either the `simple_preset_guidelines` prompt or the `advanced_preset_guidelines` prompt when generating configurations using the schemas below. These prompts will help ensure you are making the best use of these parameter structures.

### configure_drum_controls

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

### configure_mic_routing

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

### configure_round_robin

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

### generate_drum_groups

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

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On Windows: `%APPDATA%/Claude/claude_desktop_config.json`
On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "decent-sampler-drums": {
      "command": "/path/to/decent-sampler-drums/build/index.js"
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
