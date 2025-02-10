# decent-sampler-drums MCP Server

A Model Context Protocol server for generating DecentSampler drum kit configurations.

This TypeScript-based MCP server provides tools for working with DecentSampler drum kit presets, including WAV file analysis and XML generation.

<a href="https://glama.ai/mcp/servers/phypkuqwcn"><img width="380" height="200" src="https://glama.ai/mcp/servers/phypkuqwcn/badge" alt="Decent-Sampler Drums Server MCP server" /></a>

## Features

### Tools

- `analyze_wav_samples` - Analyze WAV files to validate drum kit samples
  - Validates WAV header formatting
  - Verifies metadata consistency for multi-mic setups
  - Helpful for troubleshooting potential playback issues before preset creation

- `generate_drum_groups` - Generate DecentSampler `<groups>` XML for drum kits
  - Flexible velocity handling:
    * Simple mode: Natural velocity response without explicit layers
    * Advanced mode: Multiple velocity layers with configurable ranges
  - Handles sample path mapping and root note assignments
  - Optional muting groups with tags
  - Configurable global settings

### Prompts

The server includes comprehensive preset building guidelines in `src/prompts/preset_guidelines.ts`. AI assistants should reference these guidelines when helping users create presets, as they provide:
- Complete XML structure specifications
- UI configuration patterns
- Bus routing and effects setup rules
- Sample configuration best practices
- Performance optimization strategies

When using this MCP server to generate presets, AI assistants should always reference the `preset_guidelines` prompt to ensure adherence to Decent Sampler best practices.

## Input Schema

AI assistants should consult the `preset_guidelines` prompt before generating configurations with the schema below. The guidelines contain essential context for creating optimal preset structures.

The `generate_drum_groups` tool accepts a configuration object with the following structure:

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
