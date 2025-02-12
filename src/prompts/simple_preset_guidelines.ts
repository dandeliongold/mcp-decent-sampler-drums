// @ts-nocheck
export const SIMPLE_PRESET_PROMPT = `
When creating simple Decent Sampler drum presets, follow these guidelines:

IMPORTANT: Do not include any extra effects (reverb, delay, etc.) or routing elements (buses, extra effects sections) unless explicitly requested. The goal is to keep the preset lightweight and easy to manage.

1. Basic Structure:
For simple presets, include only the essential elements: the UI and Groups sections. All preset files must use the .dspreset file extension.
Example:
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
