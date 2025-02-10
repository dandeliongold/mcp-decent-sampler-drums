import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to write 32-bit integer
function writeInt32(buffer, value, offset) {
    buffer.writeInt32LE(value, offset);
    return offset + 4;
}

// Helper to write 16-bit integer
function writeInt16(buffer, value, offset) {
    buffer.writeInt16LE(value, offset);
    return offset + 2;
}

// Helper to write string
function writeString(buffer, string, offset) {
    buffer.write(string, offset, string.length);
    return offset + string.length;
}

// Create valid WAV file (1 channel, 44.1kHz, 16-bit)
function createValidWav() {
    const sampleRate = 44100;
    const channels = 1;
    const bitsPerSample = 16;
    const dataSize = 1024; // 512 samples of audio data
    const fileSize = 44 + dataSize; // 44 bytes header + data

    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    // RIFF header
    offset = writeString(buffer, 'RIFF', 0);
    offset = writeInt32(buffer, fileSize - 8, offset);
    offset = writeString(buffer, 'WAVE', offset);

    // fmt chunk
    offset = writeString(buffer, 'fmt ', offset);
    offset = writeInt32(buffer, 16, offset); // fmt chunk size
    offset = writeInt16(buffer, 1, offset); // audio format (1 = PCM)
    offset = writeInt16(buffer, channels, offset);
    offset = writeInt32(buffer, sampleRate, offset);
    offset = writeInt32(buffer, sampleRate * channels * bitsPerSample / 8, offset); // byte rate
    offset = writeInt16(buffer, channels * bitsPerSample / 8, offset); // block align
    offset = writeInt16(buffer, bitsPerSample, offset);

    // data chunk
    offset = writeString(buffer, 'data', offset);
    offset = writeInt32(buffer, dataSize, offset);

    // Fill with sine wave data
    for (let i = 0; i < dataSize/2; i++) {
        const value = Math.sin(i * 0.1) * 32767;
        offset = writeInt16(buffer, value, offset);
    }

    fs.writeFileSync(path.join(__dirname, 'valid.wav'), buffer);
}

// Create corrupted WAV with JUNK chunk instead of fmt
function createCorruptedWav() {
    const fileSize = 44;
    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    // RIFF header
    offset = writeString(buffer, 'RIFF', 0);
    offset = writeInt32(buffer, fileSize - 8, offset);
    offset = writeString(buffer, 'WAVE', offset);

    // JUNK chunk instead of fmt
    offset = writeString(buffer, 'JUNK', offset);
    offset = writeInt32(buffer, 28, offset); // chunk size
    offset = writeInt16(buffer, 0, offset); // audio format (invalid)
    
    // Fill rest with zeros
    buffer.fill(0, offset);

    fs.writeFileSync(path.join(__dirname, 'corrupted.wav'), buffer);
}

// Create WAV with invalid format (0)
function createInvalidFormatWav() {
    const fileSize = 44;
    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    // RIFF header
    offset = writeString(buffer, 'RIFF', 0);
    offset = writeInt32(buffer, fileSize - 8, offset);
    offset = writeString(buffer, 'WAVE', offset);

    // fmt chunk with invalid format
    offset = writeString(buffer, 'fmt ', offset);
    offset = writeInt32(buffer, 16, offset);
    offset = writeInt16(buffer, 0, offset); // invalid format (0)
    
    // Fill rest with zeros
    buffer.fill(0, offset);

    fs.writeFileSync(path.join(__dirname, 'invalid_format.wav'), buffer);
}

// Create WAV missing data chunk
function createMissingChunksWav() {
    const fileSize = 44;
    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    // RIFF header
    offset = writeString(buffer, 'RIFF', 0);
    offset = writeInt32(buffer, fileSize - 8, offset);
    offset = writeString(buffer, 'WAVE', offset);

    // fmt chunk only, no data chunk
    offset = writeString(buffer, 'fmt ', offset);
    offset = writeInt32(buffer, 16, offset);
    offset = writeInt16(buffer, 1, offset);
    offset = writeInt16(buffer, 1, offset); // channels
    offset = writeInt32(buffer, 44100, offset); // sample rate
    offset = writeInt32(buffer, 44100 * 2, offset); // byte rate
    offset = writeInt16(buffer, 2, offset); // block align
    offset = writeInt16(buffer, 16, offset); // bits per sample

    fs.writeFileSync(path.join(__dirname, 'missing_chunks.wav'), buffer);
}

// Create WAV with invalid chunk sizes
function createInvalidSizesWav() {
    const buffer = Buffer.alloc(44);
    let offset = 0;

    // RIFF header with invalid size
    offset = writeString(buffer, 'RIFF', 0);
    offset = writeInt32(buffer, 2147483647, offset); // Invalid size (MAX_INT32)
    offset = writeString(buffer, 'WAVE', offset);

    // fmt chunk with invalid size
    offset = writeString(buffer, 'fmt ', offset);
    offset = writeInt32(buffer, 2147483647, offset); // Invalid chunk size (MAX_INT32)
    
    // Fill rest with zeros
    buffer.fill(0, offset);

    fs.writeFileSync(path.join(__dirname, 'invalid_sizes.wav'), buffer);
}

// Generate all test files
createValidWav();
createCorruptedWav();
createInvalidFormatWav();
createMissingChunksWav();
createInvalidSizesWav();

console.log('Generated test WAV files in __tests__/fixtures/');
