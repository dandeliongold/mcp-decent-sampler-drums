# Workflow Documentation

This document provides detailed workflow examples for using the decent-sampler-drums MCP server tools to create and configure drum sample presets.

## Basic Workflow Example

```mermaid
graph TB
    Start[Start here] --> CreateSamples[Create and name samples<br/>according to convention]
    CreateSamples --> AttachPrompt[Attach either basic or advanced<br/>prompt to the chat]
    
    subgraph "Claude Desktop Interface"
        AttachPrompt --> Decision{Basic or Advanced?}
        Decision --> |Basic Mode| BasicAnalysis[If asked or inferred,<br/>analyze the sample WAV<br/>files to detect any issues]
        Decision --> |Advanced Mode| RoundRobin[If round robin is detected,<br/>generate round robin<br/>settings]
        RoundRobin --> Controls[If pitch/envelope controls<br/>are needed, generate<br/>drum controls]
        Controls --> MicRouting[If mic routing, volume,<br/>etc. settings are needed,<br/>generate mic settings]
    end
    
    BasicAnalysis --> GenerateGroups[Generate groups<br/>including all the optional<br/>settings]
    MicRouting --> GenerateGroups
    
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
   - Create drum samples
   - Organize samples in a dedicated directory

2. **Initial Setup**
   - Choose between Basic and Advanced mode based on requirements
   - Basic mode: Simple sample mapping with minimal configuration
   - Advanced mode: Access to extended features

3. **Sample Analysis (Optional)**
   ```typescript
   // Example WAV analysis
   {
     "paths": [
       "C:/Samples/kick/kick_close.wav",
       "C:/Samples/kick/kick_oh.wav"
     ]
   }
   ```

4. **Group Generation**
   - Configure sample mappings
   - Set up velocity layers if needed
   - Generate XML structure

5. **Preset Creation**
   - Write new preset file or update existing
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

### Advanced Configuration Examples

1. **Round Robin Setup**
   ```typescript
   {
     "directory": "C:/Samples/snare",
     "mode": "round_robin",
     "length": 3,
     "samples": [
       {
         "path": "snare_hit_1.wav",
         "seqPosition": 1
       },
       {
         "path": "snare_hit_2.wav",
         "seqPosition": 2
       },
       {
         "path": "snare_hit_3.wav",
         "seqPosition": 3
       }
     ]
   }
   ```

2. **Drum Controls Configuration**
   ```typescript
   {
     "drumControls": {
       "snare": {
         "pitch": {
           "default": 0,
           "min": -12,
           "max": 12
         },
         "envelope": {
           "attack": 0.001,
           "decay": 0.5,
           "sustain": 0,
           "release": 0.1,
           "attackCurve": -100,
           "decayCurve": 100
         }
       }
     }
   }
   ```
