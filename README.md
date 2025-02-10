# decent-sampler-drums MCP Server

A Model Context Protocol server for generating DecentSampler drum kit configurations.

This TypeScript-based MCP server provides tools for working with DecentSampler drum kit presets, including WAV file analysis and XML generation. It's specifically designed to help create well-structured presets that avoid common issues like voice conflicts.

<a href="https://glama.ai/mcp/servers/phypkuqwcn"><img width="380" height="200" src="https://glama.ai/mcp/servers/phypkuqwcn/badge" alt="Decent-Sampler Drums Server MCP server" /></a>

## Features

### Tools

- `analyze_wav_samples` - Analyze WAV files to get accurate sample lengths and metadata
  - Returns precise sample lengths for setting end markers
  - Helps prevent looping issues in DecentSampler
  - Provides sample rate, channel count, and bit depth information

- `generate_drum_groups` - Generate DecentSampler `<groups>` XML for drum kits
  - Supports multiple velocity layers with configurable ranges
  - Handles sample path mapping and root note assignments
  - Optional muting groups with tags
  - Configurable global settings (volume, velocity tracking, trigger modes)

## Best Practices

### Preventing Voice Conflicts

1. **Group All Mic Positions Together**
   - Put all samples for a drum piece (e.g., all kick mics) in a single group
   - Include close mics, overheads, and room mics in the same group
   - This prevents voice conflicts and ensures proper sample cutoff

2. **Set Sample Boundaries**
   - Always include start/end markers for every sample
   - Use the analyze_wav_samples tool to get accurate lengths
   - This prevents unintended looping behavior

3. **Organize Velocity Layers**
   - Structure samples by velocity within each group
   - Include all mic positions for each velocity layer

### Example Workflow

1. First, analyze your samples:
```typescript
// Get accurate sample lengths
const analysis = await analyze_wav_samples({
  paths: [
    "samples/Kick_Close_Soft.wav",
    "samples/Kick_Close_Medium.wav",
    "samples/Kick_Close_Hard.wav"
  ]
});
// Returns: [
//   { path: "samples/Kick_Close_Soft.wav", sampleLength: 60645, ... },
//   { path: "samples/Kick_Close_Medium.wav", sampleLength: 70162, ... },
//   { path: "samples/Kick_Close_Hard.wav", sampleLength: 79464, ... }
// ]
```

2. Then use those lengths in your configuration:
```typescript
const config = {
  globalSettings: {
    velocityLayers: [
      { low: 1, high: 54, name: "soft" },
      { low: 55, high: 94, name: "medium" },
      { low: 95, high: 127, name: "hard" }
    ]
  },
  drumPieces: [
    {
      name: "Kick",
      rootNote: 36,
      samples: [
        // All mic positions for soft velocity
        { path: "samples/Kick_Close_Soft.wav", start: 0, end: 60645, volume: "-3dB" },
        { path: "samples/Kick_OH_L_Soft.wav", start: 0, end: 60000, volume: "-6dB" },
        { path: "samples/Kick_OH_R_Soft.wav", start: 0, end: 60000, volume: "-6dB" },
        // All mic positions for medium velocity
        { path: "samples/Kick_Close_Medium.wav", start: 0, end: 70162, volume: "-3dB" },
        { path: "samples/Kick_OH_L_Medium.wav", start: 0, end: 70000, volume: "-6dB" },
        { path: "samples/Kick_OH_R_Medium.wav", start: 0, end: 70000, volume: "-6dB" },
        // All mic positions for hard velocity
        { path: "samples/Kick_Close_Hard.wav", start: 0, end: 79464, volume: "-3dB" },
        { path: "samples/Kick_OH_L_Hard.wav", start: 0, end: 80000, volume: "-6dB" },
        { path: "samples/Kick_OH_R_Hard.wav", start: 0, end: 80000, volume: "-6dB" }
      ]
    }
  ]
}
```

This will generate properly structured DecentSampler XML with:
- All mic positions in a single group
- Accurate sample boundaries to prevent looping
- Balanced volumes across mic positions

## Input Schema

The `generate_drum_groups` tool accepts a configuration object with the following structure:

```typescript
{
  globalSettings: {
    volume?: string,              // Optional global volume adjustment
    ampVelTrack?: number,        // Optional velocity tracking (default: 1)
    trigger?: "attack" | "release" | "first" | "legato", // Optional trigger mode (default: "attack")
    velocityLayers: {            // Required velocity layer definitions
      low: number,               // Lower velocity bound
      high: number,              // Upper velocity bound
      name: string               // Layer identifier
    }[]
  },
  drumPieces: {
    name: string,                // Name of the drum piece
    rootNote: number,            // MIDI note number
    samples: {
      path: string,              // Path to sample file
      volume?: string,           // Optional per-sample volume
      start?: number,            // Optional start marker (default: 0)
      end?: number              // Optional end marker (use analyze_wav_samples to get this)
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
