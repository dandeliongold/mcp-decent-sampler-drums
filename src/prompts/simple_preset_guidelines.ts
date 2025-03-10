// @ts-nocheck
export const SIMPLE_PRESET_PROMPT = `
Let's create a Decent Sampler drum kit preset using all of the samples in this folder: C:/Samples  

Ensure that you exhaustively list all of the files in the provided directory before proceeding to build out the preset.  

When creating simple Decent Sampler drum presets, follow these guidelines:  

IMPORTANT: Use the generate_drum_groups tool with the basic configuration option to create simple, lightweight presets. 

Do NOT include:
- Any UI controls (knobs, sliders, buttons) - the UI should only contain keyboard colors.
- Any effects (reverb, delay, etc.)
- Any routing elements (buses, extra effects sections)
- Any other advanced features unless explicitly requested

Follow these rules when configuring key colors:
- When configuring colors for keys, only color keys that have samples mapped to them.
- Do not color note ranges unless every key in the range has a sample.

1. Using the generate_drum_groups Tool:
The recommended way to create simple presets is using the generate_drum_groups tool with a basic configuration. This ensures proper structure and avoids advanced features.

The basic configuration requires:
- Essential fields only: name, rootNote, and sample paths
- Optional velocity layers through globalSettings if needed
- Optional round robin configuration if needed and/or specified by the user
- No advanced features like mic routing or muting groups

Refer to the generate_drum_groups tool documentation for configuration examples and schema details.

2. Understanding the Generated Structure:
The tool will generate a properly formatted preset with this basic structure. Note that the UI section should ONLY contain the keyboard element with optional color coding - no other UI controls should be added:
<?xml version="1.0" encoding="UTF-8"?>
<DecentSampler minVersion="1.0.0">
    <ui>
        <!-- Minimal UI elements -->
        <keyboard>
            <!-- Color-code drum mapping for visual clarity -->
            <color loNote="36" hiNote="38" color="FF2C365E" /> <!-- e.g., Kick/Snare -->
            <color loNote="42" hiNote="44" color="FF6D9DC5" /> <!-- e.g., Hi-hats -->
        </keyboard>
    </ui>
    <groups>
        <!-- Group all samples for a drum piece in a single group -->
        <group>
            <sample path="C:/Samples/Kick.wav" rootNote="36" />
            <!-- Add additional samples as needed -->
        </group>
    </groups>
</DecentSampler>

3. Group Organization and Sample Configuration:
- Place all samples for a single drum piece (or mic position) in one group to avoid voice conflicts.
- Use standard MIDI mappings (e.g., Kick = 36, Snare = 38, Hi-hat Closed = 42, etc.).
- You must omit velocity layers if not required or indicated in the sample naming. Without explicit velocity ranges, samples will respond uniformly to all velocities.
- Assign only one sample per key, unless working with velocity-specific versions of the same drum sound.

4. For round robin setup, use the configure_round_robin tool with desired mode:
  * "round_robin" - Cycle through samples sequentially - this is the default unless otherwise specified by the user.
  * "random" - Choose samples randomly
  * "true_random" - Allow same sample to play twice
  * "always" - Always play all samples

5. Keep It Simple:
- Do not add any <buses> or <effects> sections unless you are creating a more advanced preset.
- Focus on a minimal setup that maps samples to notes on the keyboard and provides a basic user interface.
- If multiple microphone positions and/or other complex sets of samples are provided, clarify with the user how to proceed with configuration.

This approach ensures presets remain straightforward, reducing potential CPU overhead and avoiding unnecessary complexity. For advanced configurations or when additional processing is needed, refer to the full Decent Sampler documentation.
`
