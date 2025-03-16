// @ts-nocheck
export const ADVANCED_PRESET_PROMPT = `
Let's create a Decent Sampler drum kit preset using all of the samples in this folder: C:/Samples

When creating Decent Sampler drum presets, follow these guidelines:

For complete documentation, visit:
https://decentsampler-developers-guide.readthedocs.io/en/stable/

IMPORTANT: Use the MCP tools to generate complex preset configurations. The tools handle proper XML structure and validation while supporting all advanced features.

1. Using MCP Tools:

a) generate_drum_groups - Core preset generation:
Use this with AdvancedDrumKitConfig for complex setups combining multiple features:
{
  "globalSettings": {
    "velocityLayers": [
      { "low": 1, "high": 42, "name": "soft" },
      { "low": 43, "high": 85, "name": "medium" },
      { "low": 86, "high": 127, "name": "hard" }
    ],
    "drumControls": {
      // Added by configure_drum_controls
    },
    "micBuses": [
      // Added by configure_mic_routing
    ]
  },
  "drumPieces": [
    {
      "name": "Kick",
      "rootNote": 36,
      "samples": [
        {
          "path": "C:/Samples/Kick_Close_Soft.wav",
          "micConfig": {
            "position": "close",
            "busIndex": 0
          }
        }
      ],
      "muting": {
        "tags": ["kick"],
        "silencedByTags": []
      }
    }
  ]
}

b) configure_drum_controls - Add ADSR and pitch controls:
{
  "drumControls": {
    "kick": {
      "pitch": {
        "default": 0,
        "min": -12,
        "max": 12
      },
      "envelope": {
        "attack": 0.001,
        "decay": 0.5,
        "sustain": 0,
        "release": 0.1
      }
    }
  }
}

c) configure_round_robin - Set up sample alternation:
{
  "directory": "C:/Samples",
  "mode": "round_robin",
  "length": 3,
  "samples": [
    { "path": "Kick_RR1.wav", "seqPosition": 1 },
    { "path": "Kick_RR2.wav", "seqPosition": 2 },
    { "path": "Kick_RR3.wav", "seqPosition": 3 }
  ]
}

d) configure_mic_routing - Set up multi-mic mixing:
{
  "micBuses": [
    {
      "name": "Close Mic",
      "outputTarget": "MAIN_OUTPUT",
      "volume": { "default": 0, "midiCC": 20 }
    },
    {
      "name": "OH L",
      "outputTarget": "AUX_STEREO_OUTPUT_1",
      "volume": { "default": -3, "midiCC": 21 }
    }
  ]
}

IMPORTANT: 
- Do not add any effects (reverb, delay, etc.) OR ADSR settings unless explicitly requested.
- Effects can significantly impact CPU usage and may not be desired in all use cases.
- Do not add any micBuses or other complex routing unless explicitly requested.

IMPORTANT: All Decent Sampler preset files MUST use the .dspreset file extension.

2. Understanding the Generated Structure:
<?xml version="1.0" encoding="UTF-8"?>
<DecentSampler minVersion="1.0.0">
    <ui>
        <!-- UI elements first -->
        <keyboard>
            <!-- Color-code drum mapping -->
            <color loNote="36" hiNote="38" color="FF2C365E" /> <!-- Kicks/Snares -->
            <color loNote="42" hiNote="44" color="FF6D9DC5" /> <!-- Hi-hats -->
        </keyboard>
    </ui>
    <buses>
        <!-- Define routing and effects buses if requested -->
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

3. Group Organization:
- Place all samples for a drum piece in a single group to prevent voice conflicts
  * Same drum piece (e.g., all kick mics)
  * Same articulation
  * Different velocity layers or round robins
- For voice muting, use the muting property in drumPieces:
  * Add tags array to identify samples (e.g., ["hihat"])
  * Add silencedByTags array to specify which tags mute this piece
  * The generate_drum_groups tool will set appropriate silencingMode
- For round robin setup, use the configure_round_robin tool with desired mode:
  * "round_robin" - Cycle through samples sequentially
  * "random" - Choose samples randomly
  * "true_random" - Allow same sample to play twice
  * "always" - Always play all samples

4. Sample Configuration:
- Velocity layers are optional:
  * If omitted: Samples respond to all velocities naturally
  * If specified: Use loVel/hiVel for velocity ranges (e.g., soft=1-42, medium=43-85, hard=86-127)
- Follow standard MIDI mapping:
  * Kick = 36
  * Snare = 38
  * Hi-hat Closed = 42
  * Hi-hat Open = 46
  * etc.
- If there are too many drum variations to map to standard MIDI mapping, you can use multiple octaves to accomodate different variations
- Include all mic positions in the same group, for example:
  <group>
    <sample path="C:/Samples/Kick_Close.wav" rootNote="36" />
    <sample path="C:/Samples/Kick_OH_L.wav" rootNote="36" />
    <sample path="C:/Samples/Kick_OH_R.wav" rootNote="36" />
    <sample path="C:/Samples/Kick_Room.wav" rootNote="36" />
  </group>

5. Multi-mic Setup:
- If and when mic routing is specifically requested, use the configure_mic_routing tool to:
  * Route each mic position to separate buses
  * Set up volume controls with MIDI CC mapping
  * Configure auxiliary outputs to support mixing mic volumes in the host Digital Audio Workstation (DAW)
- NOTE on file and/or folder naming conventions:
  * Keep in mind that mic positions indicated in the file and/or folder name might include a drum name.  For example: there might be a "kick" mic indicated for multiple drums besides the kick drum.
  * If in doubt, you may assume that the actual name of the drum piece is in the first part of the file name OR you can ask the user for clarification if less than 80% certain.
IMPORTANT: **Bus volume control**  
- Each bus volume must be bound to parameter="BUS_VOLUME", type="amp", level="bus", and use the correct bus index (0-based).
- If your UI knob uses a dB range (e.g., -96 to 12) but Decent Sampler's bus volume is linear (0-16), apply linear translation. For example:
  \`\`\`xml
  <labeled-knob label="Close Mic" type="float" minValue="-96" maxValue="12" value="0">
      <binding
         type="amp"
         level="bus"
         position="0" <!-- bus #0 -->
         parameter="BUS_VOLUME"
         translation="linear"
         translationOutputMin="0"
         translationOutputMax="16" />
  </labeled-knob>
  \`\`\`
- Ensure you route samples to the correct bus outputs (e.g., output1Target="BUS_1") and map each bus to MAIN_OUTPUT or AUX_STEREO_OUTPUT_x as needed.

6. Effects Guidelines:
If and when effects are specifically requested, follow these guidelines:
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

7. UI Optimization
- When configuring colors for keys, only color keys that have samples mapped to them.
- Do not color note ranges unless every key in the range has a sample.
`
