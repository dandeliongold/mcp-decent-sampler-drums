// @ts-nocheck
export const PRESET_PROMPT = `
When creating Decent Sampler drum presets, follow these guidelines:

For complete documentation, visit:
https://decentsampler-developers-guide.readthedocs.io/en/stable/

IMPORTANT: Do not add any effects (reverb, delay, etc.) unless explicitly requested. Effects can significantly impact CPU usage and may not be desired in all use cases.

NOTE: This guide focuses on Decent Sampler concepts and best practices. For implementation details and examples, refer to the MCP tool documentation available in the system.

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
- Include all mic positions in the same group, for example:
  <group>
    <sample path="Samples/Kick_Close.wav" rootNote="36" />
    <sample path="Samples/Kick_OH_L.wav" rootNote="36" />
    <sample path="Samples/Kick_OH_R.wav" rootNote="36" />
    <sample path="Samples/Kick_Room.wav" rootNote="36" />
  </group>

4. Multi-mic Setup:
- You can route multiple mics to separate buses to control or process them individually.

IMPORTANT: **Bus volume control**  
- Each bus volume must be bound to parameter="BUS_VOLUME", type="amp", level="bus", and use the correct bus index (0-based).
- If your UI knob uses a dB range (e.g., -96 to 12) but Decent Sampler’s bus volume is linear (0-16), apply linear translation. For example:
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

5. Effects Guidelines:
When effects are specifically requested, follow these guidelines:
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
`
