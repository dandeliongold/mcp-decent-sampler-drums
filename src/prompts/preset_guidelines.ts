// @ts-nocheck
export const PRESET_PROMPT = `
When creating Decent Sampler drum presets, follow these guidelines:

For complete documentation, visit:
https://decentsampler-developers-guide.readthedocs.io/en/stable/

IMPORTANT: All Decent Sampler preset files MUST use the .dspreset file extension.

1. Basic Structure:
<?xml version="1.0" encoding="UTF-8"?>
<DecentSampler minVersion="1.0.0">
    <ui>
        <!-- UI elements first -->
        <keyboard>
            <!-- Optional: Color-code drum mapping -->
            <color loNote="36" hiNote="38" color="FF2C365E" /> <!-- Kicks/Snares -->
            <color loNote="42" hiNote="44" color="FF6D9DC5" /> <!-- Hi-hats -->
        </keyboard>
    </ui>
    <buses>
        <!-- Define routing and effects buses -->
        <bus busVolume="0.5" output1Target="MAIN_OUTPUT" output2Target="AUX_STEREO_OUTPUT_1">
            <effects>
                <!-- Bus-level effects -->
            </effects>
        </bus>
    </buses>
    <groups>
        <!-- Groups after UI -->
    </groups>
    <effects>
        <!-- Global effects last -->
    </effects>
</DecentSampler>

2. Group Organization:
- Place all samples for a drum piece in a single group to prevent voice conflicts
  * Same drum piece (e.g., all kick mics)
  * Same articulation
  * Different velocity layers or round robins
- Implement voice muting with tags:
  * Add tags to identify samples: tags="hihat"
  * Add silencedByTags to mute others: silencedByTags="hihat"
  * Use silencingMode="fast" for immediate muting (hi-hats)
  * Use silencingMode="normal" for release phase (cymbals)
- Implement round robins using seqMode="round_robin" or "random"

3. Sample Configuration:
- Velocity layers are optional:
  * If omitted: Samples respond to all velocities naturally
  * If specified: Use loVel/hiVel for velocity ranges (e.g., soft=1-42, medium=43-85, hard=86-127)
- Follow standard MIDI mapping:
  * Kick = 36
  * Snare = 38
  * Hi-hat Closed = 42
  * Hi-hat Open = 46
  * etc.
- Include all mic positions in the same group, example:
  <group>
    <sample path="Samples/Kick_Close.wav" rootNote="36" />
    <sample path="Samples/Kick_OH_L.wav" rootNote="36" />
    <sample path="Samples/Kick_OH_R.wav" rootNote="36" />
    <sample path="Samples/Kick_Room.wav" rootNote="36" />
  </group>

4. Multi-mic Setup:
- Two ways to route audio:
  1. Direct routing using outputXTarget attributes:
     <group output1Target="MAIN_OUTPUT" output2Target="AUX_STEREO_OUTPUT_1">
  2. Bus routing for shared effects:
     <group output1Target="MAIN_OUTPUT" output2Target="BUS_1">
- Configure proper output routing:
  * MAIN_OUTPUT for primary mix
  * BUS_1 through BUS_16 for effect processing
  * AUX_STEREO_OUTPUT_1 through 16 for separate mic control
- Set appropriate volume balancing:
  * Use output1Volume through output8Volume (0.0-1.0)
  * Use busVolume for overall bus level

5. Effects Guidelines:
- Group-level effects (per-voice processing only):
  * Lowpass filter
  * Hipass filter
  * Bandpass filter
  * Gain
  * Chorus
- Global-level effects (shared processing):
  * Reverb
  * Delay
  * Convolution (high CPU usage)
- Effect Parameter Binding:
  * Always use FX_ prefix for effect parameters (e.g., FX_REVERB_WET_LEVEL)
  * Include position attribute in bindings to target specific effects
  * Place effect parameters as direct attributes, not in a <parameters> element
  Example:
  <ui>
    <labeled-knob label="Reverb Amount" type="float" minValue="0" maxValue="1">
      <binding type="effect" level="instrument" position="0" parameter="FX_REVERB_WET_LEVEL" />
    </labeled-knob>
  </ui>
  <effects>
    <effect type="reverb" wetLevel="0.2" roomSize="0.3" damping="0.3" />
  </effects>
- Common Effect Parameters:
  * Reverb: FX_REVERB_WET_LEVEL, FX_REVERB_ROOM_SIZE
  * Delay: FX_DELAY_TIME, FX_DELAY_FEEDBACK
  * Filter: FX_FILTER_FREQUENCY, FX_FILTER_RESONANCE
- Apply effects strategically:
  * Use bus effects for shared processing
  * Consider CPU impact of convolution effects
  * Delay and reverb cannot work as group-level effects

6. Performance Optimization:
- Set appropriate playbackMode for samples:
  * memory
  * disk_streaming
  * auto (default)
- Optimize voice usage:
  * Group related samples together
  * Use proper voice muting
  * Consider CPU impact of effects

7. Using MCP Tools for Preset Creation:

The analyze_wav_samples tool is available for analyzing WAV files to get metadata and sample information if needed.

Step 1: Structure Your Configuration
- Organize samples by drum piece
- Include all mic positions in each configuration
- Velocity layers are optional depending on your needs:

Example with velocity layers:
{
  "globalSettings": {
    "velocityLayers": [
      { "low": 1, "high": 54, "name": "soft" },
      { "low": 55, "high": 94, "name": "medium" }
    ]
  },
  "drumPieces": [{
    "name": "Kick",
    "rootNote": 36,
    "samples": [
      // Soft velocity, all mics
      { 
        "path": "C:/path/to/samples/Kick_Close_Soft.wav"
      },
      { 
        "path": "C:/path/to/samples/Kick_OH_Soft.wav"
      }
    ]
  }]
}

Example without velocity layers (simpler configuration):
{
  "globalSettings": {
  },
  "drumPieces": [{
    "name": "Kick",
    "rootNote": 36,
    "samples": [
      // All mic positions
      { 
        "path": "C:/path/to/samples/Kick_Close.wav"
      },
      { 
        "path": "C:/path/to/samples/Kick_OH.wav"
      }
    ]
  }]
}

Choose your approach based on your needs:
- Use velocity layers when you have multiple dynamic levels recorded separately
- Omit velocity layers when:
  * You have single-dynamic samples that should respond naturally to velocity
  * You want a simpler configuration
  * You prefer to control dynamics purely through velocity-to-amplitude tracking

Step 2: Generate Groups
- Pass your complete configuration to generate_drum_groups
- Verify the generated XML includes:
  * Proper velocity layer mapping
  * Correct mic position organization

8. Troubleshooting Sample Issues:

Before creating your preset, we recommend that you use analyze_wav_samples to verify sample compatibility:
- Verify WAV headers are properly formatted
- Ensure metadata is consistent across all samples in your kit

Example workflow:
1. Analyze all samples for a drum piece:
   analyze_wav_samples(['kick_close.wav', 'kick_oh.wav', 'kick_room.wav'])
2. Compare the analysis results to verify consistency
3. Address any issues before creating the preset`
