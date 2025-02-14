# Tools Documentation

This document provides detailed information about each tool available in the decent-sampler-drums MCP server.

## analyze_wav_samples

Analyzes WAV files to detect common issues in drum kit samples.

### Features
- Non-standard WAV header validation
- Metadata consistency checks for multi-mic setups
- Sample rate and bit depth compatibility verification
- Channel configuration validation
- File size and format validation

### Usage
Always use absolute paths when specifying WAV files for analysis.

## configure_drum_controls

Configures global pitch and envelope controls for each drum type.

### Features
- Per-drum pitch controls with customizable ranges
- ADSR envelope settings for natural decay control
- Proper XML structure generation for global drum controls
- Custom curve shape support for attack, decay, and release

### Error Handling
- Validates pitch range values
- Ensures envelope times are positive values
- Verifies curve values are within -100 to 100 range
- Returns detailed error messages for invalid configurations

### Usage
Configure both pitch and envelope parameters for natural-sounding drum control.

## configure_mic_routing

Sets up multi-mic routing with MIDI controls for drum samples.

### Features
- Individual volume controls for each mic position
  * Close mic
  * Overhead Left/Right
  * Room Left/Right
- Auxiliary output routing for DAW mixing
- MIDI CC mappings for mic volumes
- Flexible bus routing for shared effects

### Error Handling
- Validates mic position assignments
- Checks for duplicate MIDI CC assignments
- Ensures valid output routing targets
- Verifies bus indices are unique and valid

### Usage
Ideal for multi-mic drum recordings requiring separate mixing control.

## configure_round_robin

Configures round robin sample playback for a set of samples.

### Features
- Multiple playback modes:
  * round_robin: Sequential playback
  * random: Random selection
  * true_random: No repeat protection
  * always: Single sample playback
- Automatic sequence position validation
- Sample file existence verification

### Error Handling
- Checks if sample files exist
- Validates sequence positions are unique and sequential
- Ensures mode selection is valid
- Returns specific error messages for configuration issues

### Usage
Perfect for creating realistic drum performances with sample variation.

## generate_drum_groups

Generates DecentSampler `<groups>` XML for drum kits.

### Features
- Flexible velocity handling:
  * Simple mode: Natural velocity response
  * Advanced mode: Multiple velocity layers
- Sample path mapping
- Root note assignments
- Optional muting groups with tags
- Configurable global settings

### Error Handling
- Validates all sample paths
- Checks for valid MIDI note numbers
- Ensures velocity layers don't overlap
- Verifies muting group configurations

### Usage
Core tool for creating the main drum kit structure in DecentSampler format.
