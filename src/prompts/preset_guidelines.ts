// @ts-nocheck
export const PRESET_PROMPT = `
When creating Decent Sampler drum presets, follow these guidelines:

For complete documentation, visit:
https://decentsampler-developers-guide.readthedocs.io/en/stable/

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
- Set ampVelTrack for velocity sensitivity

3. Sample Configuration:
- Always specify start/end markers to prevent looping issues
- Use loVel/hiVel for velocity layers (e.g., soft=1-42, medium=43-85, hard=86-127)
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
- Apply effects strategically:
  * Use bus effects for shared processing
  * Consider CPU impact of convolution effects
  * Delay and reverb cannot work as group-level effects

6. Performance Optimization:
- Set appropriate playbackMode for samples:
  * memory
  * disk_streaming
  * auto (default)
- Configure proper trigger modes:
  * attack: normal note-on trigger
  * release: for release samples
  * first: only if no other notes playing
  * legato: only if other notes are playing
- Optimize voice usage:
  * Group related samples together
  * Use proper voice muting
  * Consider CPU impact of effects

7. Using MCP Tools for Preset Creation:

Step 1: Analyze Your Samples
- Always analyze WAV files first to get accurate end markers:
  Example tool usage:

  analyze_wav_samples({
    paths: [
      "C:/path/to/samples/Kick_Close_Soft.wav",
      "C:/path/to/samples/Kick_Close_Medium.wav"
    ]
  })

- Use absolute paths for reliability
- Store the returned sample lengths for use in your groups

Step 2: Structure Your Configuration
- Organize samples by drum piece and velocity layer
- Include all mic positions in each configuration:
  Example configuration:
  
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
          "path": "C:/path/to/samples/Kick_Close_Soft.wav",
          "start": 0,
          "end": 60645  // From analyze_wav_samples
        },
        { 
          "path": "C:/path/to/samples/Kick_OH_Soft.wav",
          "start": 0,
          "end": 58932  // From analyze_wav_samples
        }
      ]
    }]
  }

Step 3: Generate Groups
- Pass your complete configuration to generate_drum_groups
- Verify the generated XML includes:
  * Accurate sample boundaries
  * Proper velocity layer mapping
  * Correct mic position organization`
