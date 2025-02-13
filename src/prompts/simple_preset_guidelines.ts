// @ts-nocheck
export const SIMPLE_PRESET_PROMPT = `
When creating simple Decent Sampler drum presets, follow these guidelines:

IMPORTANT: Use the generate_drum_groups tool with the basic configuration option to create simple, lightweight presets. Do not include:
- Any UI controls (knobs, sliders, buttons) - the UI should only contain keyboard colors
- Any effects (reverb, delay, etc.)
- Any routing elements (buses, extra effects sections)
- Any other advanced features unless explicitly requested

1. Using the generate_drum_groups Tool:
The recommended way to create simple presets is using the generate_drum_groups tool with a basic configuration. This ensures proper structure and avoids advanced features:

Example configuration:
{
  "globalSettings": {
    // Optional: Configure velocity layers if needed
    "velocityLayers": [
      { "low": 0, "high": 63, "name": "soft" },
      { "high": 127, "low": 64, "name": "hard" }
    ]
  },
  "drumPieces": [
    {
      "name": "Kick",
      "rootNote": 36,
      "samples": [
        { "path": "Samples/Kick.wav" }
        // For velocity layers:
        // { "path": "Samples/Kick_Soft.wav" }
        // { "path": "Samples/Kick_Hard.wav" }
      ]
    }
  ]
}

The basic configuration:
- Requires only essential fields: name, rootNote, and sample paths
- Optionally supports velocity layers through globalSettings
- Automatically excludes advanced features like round robin, mic routing, and muting groups

2. Understanding the Generated Structure:
The tool will generate a properly formatted preset with this basic structure. Note that the UI section should ONLY contain the keyboard element with optional color coding - no other UI controls should be added:
<?xml version="1.0" encoding="UTF-8"?>
<DecentSampler minVersion="1.0.0">
    <ui>
        <!-- Minimal UI elements -->
        <keyboard>
            <!-- Optional: Color-code drum mapping for visual clarity -->
            <color loNote="36" hiNote="38" color="FF2C365E" /> <!-- e.g., Kick/Snare -->
            <color loNote="42" hiNote="44" color="FF6D9DC5" /> <!-- e.g., Hi-hats -->
        </keyboard>
    </ui>
    <groups>
        <!-- Group all samples for a drum piece in a single group -->
        <group>
            <sample path="Samples/Kick.wav" rootNote="36" />
            <!-- Add additional samples as needed -->
        </group>
    </groups>
</DecentSampler>

2. Group Organization and Sample Configuration:
- Place all samples for a single drum piece (or mic position) in one group to avoid voice conflicts.
- Use standard MIDI mappings (e.g., Kick = 36, Snare = 38, Hi-hat Closed = 42, etc.).
- Omit velocity layers if not required. Without explicit velocity ranges, samples will respond uniformly to all velocities.

3. Keep It Simple:
- Do not add any <buses> or <effects> sections unless you are creating a more advanced preset.
- Focus on a minimal setup that maps samples to the correct root notes and provides a basic user interface.

This simplified format ensures that presets remain straightforward, reducing potential CPU overhead and avoiding unnecessary complexity. For advanced configurations or when additional processing is needed, refer to the full Decent Sampler documentation.
`;
