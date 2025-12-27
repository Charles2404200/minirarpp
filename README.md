# MiniRARpp

Simple file compression/decompression tool with easy-to-use interface.

## What is it?

MiniRARpp is a desktop application for compressing and decompressing ZIP files. Main features:
- Compress files with multiple compression levels
- Decompress ZIP files
- Job queue management (run multiple tasks simultaneously)
- Pause/resume operations
- File tree selection (WinRAR-style)

## How to run?

```bash
# Install dependencies
npm install

# Build Rust backend
cd src-tauri
cargo build

# Run development
cd ..
npm run tauri dev
```

## How to use?

1. **Compress files**: Click "Compress"  select files/folders  choose compression level  select output path  click "Start"
2. **Decompress**: Click "Extract"  select ZIP file  choose destination folder  click "Extract"
3. **Pause**: In the job queue, click "Pause" button to pause a running operation
4. **Select files**: Click the tree icon to select specific files instead of the entire folder
