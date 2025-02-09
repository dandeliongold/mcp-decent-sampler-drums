# decent-sampler-drums MCP Server

A Model Context Protocol server for generating DecentSampler drum kit configurations.

This TypeScript-based MCP server provides a tool for generating the `<groups>` XML section of DecentSampler presets, specifically designed for drum kits. It handles velocity layers, sample mapping, and muting groups.

## Features

### Tools
- `generate_drum_groups` - Generate DecentSampler `<groups>` XML for drum kits
  - Supports multiple velocity layers with configurable ranges
  - Handles sample path mapping and root note assignments
  - Optional muting groups with tags
  - Configurable global settings (volume, velocity tracking, trigger modes)

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
      volume?: string            // Optional per-sample volume
    }[],
    muting?: {                   // Optional muting group configuration
      tags: string[],            // Tags for this group
      silencedByTags: string[]   // Tags that silence this group
    }
  }[]
}
```

## Example Usage

```typescript
const config = {
  globalSettings: {
    volume: "-3dB",
    ampVelTrack: 0.7,
    trigger: "attack",
    velocityLayers: [
      { low: 0, high: 63, name: "p" },
      { low: 64, high: 127, name: "f" }
    ]
  },
  drumPieces: [
    {
      name: "Kick",
      rootNote: 36,
      samples: [
        { path: "samples/kick_p.wav" },
        { path: "samples/kick_f.wav", volume: "+1dB" }
      ]
    },
    {
      name: "OpenHiHat",
      rootNote: 46,
      samples: [
        { path: "samples/hh_open_p.wav" },
        { path: "samples/hh_open_f.wav" }
      ],
      muting: {
        tags: ["open_hh"],
        silencedByTags: ["closed_hh"]
      }
    }
  ]
}
```

This will generate DecentSampler XML like:

```xml
<groups>
  <group name="Kick" volume="-3dB" ampVelTrack="0.7" tuning="0.0" trigger="attack">
    <sample path="samples/kick_p.wav" rootNote="36" loNote="36" hiNote="36" loVel="0" hiVel="63" />
    <sample path="samples/kick_f.wav" volume="+1dB" rootNote="36" loNote="36" hiNote="36" loVel="64" hiVel="127" />
  </group>

  <group name="OpenHiHat" volume="-3dB" ampVelTrack="0.7" tuning="0.0" trigger="attack" tags="open_hh" silencedByTags="closed_hh" silencingMode="fast">
    <sample path="samples/hh_open_p.wav" rootNote="46" loNote="46" hiNote="46" loVel="0" hiVel="63" />
    <sample path="samples/hh_open_f.wav" rootNote="46" loNote="46" hiNote="46" loVel="64" hiVel="127" />
  </group>
</groups>
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
