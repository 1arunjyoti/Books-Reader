# Cover Image Extractor

A lightweight, command-line Python tool for extracting or generating cover images from PDF, EPUB, and TXT files. Designed to be integrated with the BooksReader server for automatic book cover generation.

**Version**: 1.0.0  
**Python**: 3.8+  

---

## Overview

This tool is part of the BooksReader backend and automatically extracts cover images from uploaded book files. It supports multiple formats and generates placeholder covers for files without embedded cover images.

### Supported File Formats

| Format | Method | Output | Library |
|--------|--------|--------|---------|
| **PDF** | Extract first page | `.png` | `pdf2image` + Poppler |
| **EPUB** | Extract embedded cover | `.jpg` / `.png` | `EbookLib` with OPF fallback |
| **TXT** | Render text to image | `.png` | `Pillow` |

---

## Features

### 📖 PDF Cover Extraction
- Converts first page of PDF to PNG image
- Configurable DPI for output quality
- Handles encrypted and compressed PDFs
- Falls back gracefully if extraction fails

### 📚 EPUB Cover Extraction
- Extracts cover from EPUB package structure
- Uses `EbookLib` for primary extraction
- Falls back to OPF/manifest XML parsing
- Preserves original image format (JPG/PNG)
- Supports EPUB2 and EPUB3 formats
- Handles multiple cover location strategies:
  1. `<meta name="cover">` tag in metadata
  2. Manifest items with `cover-image` property (EPUB3)
  3. Manifest items with 'cover' in ID or href
  4. First image in manifest as fallback

### 📄 TXT Cover Generation
- Renders first lines of text file as image
- Automatic text wrapping
- Customizable dimensions (default: 800x600)
- Uses system fonts via Pillow
- Useful for creating placeholder covers

### ⚡ Performance
- Lightweight, single-file tool
- Minimal dependencies
- Batch processing support
- No external API calls

---

## Prerequisites

### Python Environment
- **Python 3.8+**
- `pip` package manager

### System Dependencies

#### Windows
1. **Install Poppler** for PDF processing:
   - Download from: https://github.com/oschwartz10612/poppler-windows/releases/
   - Extract to a directory (e.g., `C:\Program Files\poppler`)
   - Add to system PATH or configure in script

2. **Visual C++ Build Tools** (optional, for some Pillow features):
   - Download from Microsoft if installing from source

#### Linux (Debian/Ubuntu)
```bash
# Install Poppler utilities
sudo apt update
sudo apt install -y poppler-utils

# Install Python development headers (if needed)
sudo apt install -y python3-dev
```

#### macOS
```bash
# Install Poppler via Homebrew
brew install poppler

# Install Python (if not already present)
brew install python3
```

---

## Installation & Setup

### Step 1: Create Python Virtual Environment

```powershell
# Navigate to Cover_Image_Generator directory
cd Cover_Image_Generator

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1

# Linux/macOS:
source .venv/bin/activate
```

### Step 2: Install Python Dependencies

```powershell
# Install from requirements.txt
pip install -r requirements.txt

# Or manually install:
pip install pdf2image==1.16.3 EbookLib==0.20 Pillow==12.0.0 PyPDF2==3.0.1
```

### Step 3: Verify Installation

```powershell
# Test PDF to image conversion
python Cover_Image_extractor.py Test/Python_Handbook.pdf

# Test EPUB extraction
python Cover_Image_extractor.py Test/India.epub

# Test TXT rendering
python Cover_Image_extractor.py Test/Project_plan.txt

# Test multiple files
python Cover_Image_extractor.py Test/Python_Handbook.pdf Test/India.epub "Test/Project_plan.txt"
```

### Step 4: Configure Poppler (Windows)

If Poppler is not in PATH, configure in the script:

```python
# In Cover_Image_extractor.py, add:
from pdf2image import convert_from_bytes
from pdf2image.exceptions import PDFPageCountError
import poppler_path

poppler_path.PATH = r"C:\Program Files\poppler\bin"
```

---

## Usage

### Basic Usage (Single File)

```powershell
# Extract PDF cover
python Cover_Image_extractor.py mybook.pdf

# Extract EPUB cover
python Cover_Image_extractor.py mybook.epub

# Generate TXT cover
python Cover_Image_extractor.py "My notes.txt"
```

### Batch Processing (Multiple Files)

```powershell
# Process multiple files
python Cover_Image_extractor.py book1.pdf book2.epub notes.txt

# Process files with spaces in names (use quotes)
python Cover_Image_extractor.py "Book One.pdf" "Book Two.epub" "My Notes.txt"
```

### With File Type Hint (Optional)

```powershell
# Specify file type explicitly
python Cover_Image_extractor.py --type pdf mybook.pdf

# Supported types: pdf, epub, txt
python Cover_Image_extractor.py --type epub myebook.epub
```

### Output Behavior

Files are saved in the same directory as input with consistent naming:

```
Input: book.pdf          → Output: book.png
Input: ebook.epub        → Output: ebook.jpg (or .png)
Input: notes.txt         → Output: notes.png
```

---

## Directory Structure

```
Cover_Image_Generator/
├── Cover_Image_extractor.py        # Main extraction script (321 lines)
├── requirements.txt                # Python dependencies
├── Test/                           # Test files for validation
│   ├── Python_Handbook.pdf         # Sample PDF
│   ├── India.epub                  # Sample EPUB
│   └── Project_plan.txt            # Sample TXT
```

---

## How It Works

### PDF Cover Extraction Process

```
PDF File
   ↓
Validate PDF structure
   ↓
Use PyPDF2 to read metadata
   ↓
Convert first page to image using pdf2image + Poppler
   ↓
Optimize image dimensions
   ↓
Save as PNG
   ↓
Output: cover.png
```

### EPUB Cover Extraction Process

```
EPUB File (ZIP archive)
   ↓
Extract META-INF/container.xml
   ↓
Parse OPF manifest location
   ↓
Strategy 1: Check for <meta name="cover"> tag
   ├─ If found → Extract referenced manifest item
   └─ If not found → Try Strategy 2
   ↓
Strategy 2: Look for cover-image property (EPUB3)
   ├─ If found → Extract manifest item
   └─ If not found → Try Strategy 3
   ↓
Strategy 3: Search for 'cover' in manifest ID/href
   ├─ If found → Extract image
   └─ If not found → Use Strategy 4
   ↓
Strategy 4: First image in manifest
   ↓
Extract image from EPUB package
   ↓
Preserve original format (JPG/PNG)
   ↓
Output: cover.jpg or cover.png
```

### TXT Cover Generation Process

```
TXT File
   ↓
Read first N lines
   ↓
Word wrap text to fit image dimensions
   ↓
Create PIL Image (800x600 default)
   ↓
Render text using system font
   ↓
Add styling (colors, padding)
   ↓
Save as PNG
   ↓
Output: cover.png
```

---

## Configuration & Customization

### Adjust PDF DPI (Quality)

```python
# In Cover_Image_extractor.py, find convert_from_bytes():
images = convert_from_bytes(
    pdf_bytes,
    dpi=200  # Increase for higher quality (default: 150)
)
```

**DPI Guidelines**:
- `100` — Low quality, small file size
- `150` — Standard quality (default)
- `200` — High quality, larger file size
- `300+` — Very high quality, may be slow

### Adjust TXT Cover Dimensions

```python
# In Cover_Image_extractor.py, find _render_text_cover():
image = Image.new('RGB', (800, 600), color='white')  # Modify dimensions
```

### Change Output Image Format

```python
# Convert all outputs to PNG:
image.save(f'{base_name}.png', 'PNG')  # Instead of preserving original format
```

---

## Behavior & Caveats

### Current Limitations

| Limitation | Details | Workaround |
|-----------|---------|-----------|
| **SVG Covers** | SVG images not rasterized automatically | Convert SVG to PNG separately |
| **Encrypted PDFs** | Password-protected PDFs may fail | Remove password or handle separately |
| **Large PDFs** | Processing large PDFs can be slow | Use lower DPI or async processing |
| **EPUB Format** | Output format depends on embedded image | Convert after extraction if needed |
| **TXT Styling** | Basic font rendering only | Edit output PNG manually for custom fonts |

### EPUB Cover Extraction Notes

- Prefers `EbookLib` extraction method
- Falls back to manual OPF/manifest parsing
- Preserves original image format from EPUB
- SVG covers are not automatically converted
- Some rare EPUB files may have non-standard cover metadata

### TXT Rendering Notes

- Uses Pillow's default system font (varies by OS)
- Fixed line width (50 characters default)
- Basic text rendering without styling
- Intended for placeholder covers only
- No support for images or special formatting

### Performance Notes

- PDF first page extraction: ~1-5 seconds per file
- EPUB cover extraction: ~0.5-2 seconds per file
- TXT rendering: <0.5 seconds per file
- Batch processing recommended for many files
- No parallelization (sequential processing)

---

## Integration with BooksReader Server

### Server Integration Point

The `Cover_Image_extractor.py` is called by the Express server after file uploads:

```javascript
// In server: routes/upload.routes.js
router.post('/', uploadLimiter, checkJwt, upload.single('file'), uploadController.uploadFile);

// uploadController calls Python script:
const { spawn } = require('child_process');
const python = spawn('python', ['Cover_Image_Generator/Cover_Image_extractor.py', filePath]);
```

### Integration Flow

```
1. Client uploads file
   ↓
2. Server validates file (magic numbers)
   ↓
3. Server uploads to B2 storage
   ↓
4. Server triggers: python Cover_Image_extractor.py <file_path>
   ↓
5. Python script extracts/generates cover
   ↓
6. Cover saved to B2 storage
   ↓
7. Server updates database with cover URL
   ↓
8. Response sent to client with cover URL
```

---

## Future Improvements & Roadmap

### Planned Features

- [ ] CLI flags: `--out-format`, `--out-dir`, `--dpi`, `--quality`, `--jobs`
- [ ] Async batch processing with configurable workers
- [ ] SVG rasterization support (via `cairosvg`)
- [ ] Configurable fonts and styling for TXT covers
- [ ] Logging module with debug output
- [ ] Unit tests with pytest
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Configuration file support (.ini or YAML)
- [ ] REST API wrapper for server integration
- [ ] Memory optimization for large files
- [ ] Parallel processing for batch operations
- [ ] Support for more image formats (WebP, AVIF)
- [ ] Add configuration file support

---

## Notes & Best Practices

### File Naming with Spaces

Always use quotes for file paths containing spaces:

```powershell
# ✓ Correct
python Cover_Image_extractor.py "My Book.pdf"

# ✗ Incorrect
python Cover_Image_extractor.py My Book.pdf  # Treated as two files
```
---