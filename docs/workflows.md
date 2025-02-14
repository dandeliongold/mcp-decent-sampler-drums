# Workflow Documentation

This document provides detailed workflow examples for using the decent-sampler-drums MCP server tools to create and configure drum sample presets.

## Workflow Example

```mermaid
graph TB
    Start[Start here] --> CreateSamples[Create and name samples<br/>according to convention]
    CreateSamples --> AttachPrompt[Attach either basic or advanced<br/>prompt to the chat]
    
    subgraph "Claude Desktop Interface"
        AttachPrompt --> Decision{Basic or Advanced?}
        
        subgraph "Optional Tools & Features"
            direction TB
            Analysis[WAV Analysis Tool<br/>Check for sample issues]
            RoundRobin[Round Robin Tool<br/>Configure playback variations]
            Controls[Drum Controls Tool<br/>Set pitch & envelope]
            MicRouting[Mic Routing Tool<br/>Configure outputs & volumes]
        end
        
        Decision --> |Available Tools| Analysis
        Decision --> |Available Tools| RoundRobin
        Decision --> |Available Tools| Controls
        Decision --> |Available Tools| MicRouting
    end
    
    Analysis --> GenerateGroups[Generate groups<br/>including configured settings]
    RoundRobin --> GenerateGroups
    Controls --> GenerateGroups
    MicRouting --> GenerateGroups
    
    GenerateGroups --> UpdatePreset[Either update existing<br/>preset file or write new<br/>preset file]
    UpdatePreset --> PresetFile[.dspreset file]
    PresetFile --> TestFile[Open and test file in<br/>Decent Sampler]
    
    style Start fill:#f9f,stroke:#333
    style PresetFile fill:#fff,stroke:#333
    style TestFile fill:#dfd
    style Decision fill:#f8f8f8,stroke:#333
    
    %% Note about tool flexibility
    classDef note fill:#fff,stroke:#333,stroke-dasharray: 5 5
    Note[These tools can be used in any order<br/>as needed for your preset]
    class Note note
    Note --> Analysis
    Note --> RoundRobin
    Note --> Controls
    Note --> MicRouting
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
   - Test in Decent Sampler

## Advanced Workflow

```mermaid
graph TB
    Start[Start here] --> PrepSamples[Prepare multi-mic<br/>drum samples]
    
    subgraph "Sample Analysis"
        PrepSamples --> Analyze[Analyze WAV files<br/>for compatibility]
        Analyze --> |Issues Found| FixIssues[Fix sample issues]
        Analyze --> |No Issues| ConfigureRR[Configure round<br/>robin groups]
    end
    
    subgraph "Advanced Configuration"
        ConfigureRR --> ConfigControls[Configure drum controls<br/>pitch & envelope]
        ConfigControls --> ConfigMic[Configure mic routing<br/>& volumes]
        ConfigMic --> GenGroups[Generate drum groups<br/>with all settings]
    end
    
    GenGroups --> CreatePreset[Create .dspreset file]
    CreatePreset --> Test[Test in Decent Sampler]
    Test --> |Issues| Analyze
    Test --> |Success| Done[Complete]
    
    style Start fill:#f9f,stroke:#333
    style Done fill:#dfd,stroke:#333
```
