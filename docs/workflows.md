# Workflow Documentation

This document provides detailed workflow examples for using the decent-sampler-drums MCP server tools to create and configure drum sample presets.

## Workflow Example

```mermaid
graph TB
    Start[Start here] --> CreateSamples[Create and name samples<br/>according to convention]
    CreateSamples --> AttachPrompt[Attach either basic or advanced<br/>prompt to the chat]
    AttachPrompt --> Decision{Basic or Advanced?}
    Decision --> Tools["Optional Tools & Features"]
    
    subgraph "Optional Tools & Features"
        direction TB
        Analysis[WAV Analysis Tool<br/>Check for sample issues]
        RoundRobin[Round Robin Tool<br/>Configure playback variations]
        Controls[Drum Controls Tool<br/>Set pitch & envelope]
        MicRouting[Mic Routing Tool<br/>Configure outputs & volumes]
    end
    
    Tools --> GenerateGroups[Generate groups<br/>including configured settings]
    GenerateGroups --> UpdatePreset[Either update existing<br/>preset file or write new<br/>preset file]
    UpdatePreset --> PresetFile[.dspreset file]
    PresetFile --> TestFile[Open and test file in<br/>Decent Sampler]
    
    style Start fill:#f9f,stroke:#333
    style PresetFile fill:#fff,stroke:#333
    style TestFile fill:#dfd
    style Decision fill:#f8f8f8,stroke:#333
```

### Basic Workflow Steps

1. **Sample Preparation**
   - Create drum samples following naming conventions
   - Organize samples in a dedicated directory

2. **Initial Setup**
   - Start a conversation with Claude
   - Attach your sample files or provide their location

3. **Available Tools**
   Each of these tools can be used as needed, in any order:
   
   - **WAV Analysis Tool**
     - Check sample compatibility
     - Validate formats and metadata
     - Identify potential issues

   - **Round Robin Tool**
     - Configure playback variations
     - Set up sequential or random playback
     - Manage multiple sample variations

   - **Drum Controls Tool**
     - Add pitch adjustment controls
     - Configure ADSR envelopes
     - Set up control ranges

   - **Mic Routing Tool**
     - Configure multiple mic positions
     - Set up output routing
     - Add volume controls

4. **Preset Generation**
   - Generate groups with your configured settings
   - Create or update the .dspreset file
   - Test in Decent Sampler by double clicking to open or using the preset browser in the app.
   - Test in Decent Sampler by double clicking to open or using the preset browser in the app.
