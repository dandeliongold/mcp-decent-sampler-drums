# decent-sampler-drums MCP Server

A Model Context Protocol server for generating DecentSampler drum kit configurations.

This TypeScript-based MCP server provides tools for working with DecentSampler drum kit presets, including WAV file analysis and XML generation.

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

### Prompts

The server includes comprehensive preset building guidelines available in `src/prompts/preset_guidelines.ts`. These guidelines cover:
- Complete XML structure and organization
- UI configuration
- Bus routing and effects setup
- Sample configuration best practices
- Performance optimization tips

For detailed preset creation guidance, refer to the guidelines in the prompts directory.

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
