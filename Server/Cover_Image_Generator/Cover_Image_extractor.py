from pdf2image import convert_from_bytes
from pypdf import PdfWriter, PdfReader
import io
import argparse
import zipfile
import os
import xml.etree.ElementTree as ET
import mimetypes
from ebooklib import epub
from PIL import Image, ImageDraw, ImageFont
import textwrap


# Set up command-line argument parser
parser = argparse.ArgumentParser(
    description='Extract cover photo from PDF, EPUB, or TXT file.')
parser.add_argument('input_files',
                    type=str,
                    nargs='+',
                    help='PDF/EPUB/TXT file names to extract cover photos or render text covers from')
parser.add_argument('--type',
                    type=str,
                    choices=['pdf', 'epub', 'txt'],
                    required=False,
                    help='Optional file type hint: pdf, epub, or txt')
args = parser.parse_args()


# Get rootfile path from container.xml in EPUB.
def _get_rootfile_path(zipf: zipfile.ZipFile) -> str:
    """Return path to the package document (OPF) from container.xml."""
    try:
        container = zipf.read('META-INF/container.xml')
    except KeyError:
        raise ValueError('Invalid EPUB: missing META-INF/container.xml')
    root = ET.fromstring(container)
    # container.xml typically uses no namespace for rootfiles/rootfile
    rootfile = root.find('.//{*}rootfile')
    if rootfile is None:
        # Try without namespace
        rootfile = root.find('.//rootfile')
    if rootfile is None or 'full-path' not in rootfile.attrib:
        raise ValueError('Invalid EPUB: could not find rootfile in container.xml')
    return rootfile.attrib['full-path']


# Helper to handle XML namespaces
def _ns_tag(tag: str, ns: str):
    return f'{{{ns}}}{tag}' if ns else tag

# Parse OPF data to find cover image href.
def _find_cover_href(opf_data: bytes, rootfile_dir: str) -> str | None:
    """Parse OPF data and return the href of the cover image if found.

    Strategy (in order):
    - Look for <meta name="cover" content="cover-id"/> and find manifest item with that id
    - Look for manifest item with properties containing 'cover-image' (EPUB3)
    - Look for manifest image items with 'cover' in the id or href
    - Fallback to the first image/* item in the manifest
    """
    tree = ET.fromstring(opf_data)
    # detect namespace (if any)
    ns = ''
    if tree.tag.startswith('{'):
        ns = tree.tag.split('}')[0].strip('{')

    # Build manifest map: id -> (href, media-type, properties)
    manifest = {}
    for item in tree.findall('.//' + _ns_tag('manifest', ns) + '/' + _ns_tag('item', ns)):
        iid = item.attrib.get('id')
        href = item.attrib.get('href')
        mtype = item.attrib.get('media-type', '')
        props = item.attrib.get('properties', '')
        if iid and href:
            manifest[iid] = (href, mtype, props)

    # 1) <meta name="cover" content="id"/>
    for meta in tree.findall('.//' + _ns_tag('metadata', ns) + '/' + _ns_tag('meta', ns)):
        if meta.attrib.get('name', '').lower() == 'cover':
            cover_id = meta.attrib.get('content')
            if cover_id and cover_id in manifest:
                return os.path.normpath(os.path.join(rootfile_dir, manifest[cover_id][0]))

    # 2) manifest item with properties containing 'cover-image'
    for iid, (href, mtype, props) in manifest.items():
        if 'cover-image' in props:
            return os.path.normpath(os.path.join(rootfile_dir, href))

    # 3) look for 'cover' in id or href
    for iid, (href, mtype, props) in manifest.items():
        if mtype.startswith('image/') and ('cover' in (iid or '').lower() or 'cover' in href.lower()):
            return os.path.normpath(os.path.join(rootfile_dir, href))

    # 4) first image/*
    for iid, (href, mtype, props) in manifest.items():
        if mtype.startswith('image/'):
            return os.path.normpath(os.path.join(rootfile_dir, href))

    return None

# Extract cover images from EPUB as PNG.
def extract_epub_cover(input_file: str) -> None:
    print(f"Extracting cover photo from {input_file}...")
    # Try EbookLib first for robustness
    try:
        book = epub.read_epub(input_file)
        cover_item = None

        # Collect image items
        try:
            items = list(book.get_items())
        except Exception:
            items = []

        image_items = [it for it in items if getattr(it, 'media_type', '').startswith('image/')]

        # Prefer items with 'cover' in id or file name
        for it in image_items:
            iid = getattr(it, 'id', '') or (getattr(it, 'get_id', lambda: '')() if hasattr(it, 'get_id') else '')
            fname = getattr(it, 'file_name', None) or (getattr(it, 'get_name', lambda: None)() if hasattr(it, 'get_name') else None) or ''
            if 'cover' in str(iid).lower() or 'cover' in str(fname).lower():
                cover_item = it
                break

        # Fallback to first image
        if cover_item is None and image_items:
            cover_item = image_items[0]

        if cover_item is not None:
            # get bytes
            try:
                data = cover_item.get_content()
            except Exception:
                data = getattr(cover_item, 'content', None) or getattr(cover_item, 'raw', None)

            if data is None:
                raise ValueError('Could not read image bytes from EbookLib item')

            # Convert whatever image bytes we have to PNG for consistency
            try:
                img = Image.open(io.BytesIO(data))
                # Ensure mode is compatible with PNG
                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGBA')
                output_file = os.path.splitext(input_file)[0] + '.png'
                img.save(output_file, format='PNG')
                print(f"Done, your cover photo has been saved as {output_file}")
                return
            except Exception as e:
                # If PIL can't open/convert, fall back to writing raw bytes with original extension
                name = getattr(cover_item, 'file_name', None) or (getattr(cover_item, 'get_name', lambda: None)() if hasattr(cover_item, 'get_name') else None) or getattr(cover_item, 'id', 'cover')
                ext = os.path.splitext(name)[1]
                if not ext:
                    ext = mimetypes.guess_extension(getattr(cover_item, 'media_type', '')) or '.img'
                output_file = os.path.splitext(input_file)[0] + ext
                with open(output_file, 'wb') as out:
                    out.write(data)
                print(f"Done, your cover photo has been saved as {output_file} (raw bytes)")
                return
    except Exception as e:
        # EbookLib failed; fall back to stdlib parsing
        # print a short debug message then try fallback
        print(f'EbookLib extraction failed, falling back to zip parsing: {e}')

    # Fallback: use zip/OPF parsing
    try:
        with zipfile.ZipFile(input_file, 'r') as z:
            rootfile_path = _get_rootfile_path(z)
            rootfile_dir = os.path.dirname(rootfile_path)
            opf_data = z.read(rootfile_path)

            cover_href = _find_cover_href(opf_data, rootfile_dir)
            if not cover_href:
                print('Cover image not found in EPUB manifest.')
                return

            # Normalize path inside zip (OPF hrefs are relative)
            cover_href = cover_href.replace('\\', '/')
            try:
                image_data = z.read(cover_href)
            except KeyError:
                # Sometimes href is given without the root path; try basename
                image_data = None
                for name in z.namelist():
                    if name.lower().endswith(os.path.basename(cover_href).lower()):
                        image_data = z.read(name)
                        cover_href = name
                        break
                if image_data is None:
                    print(f'Could not read cover image {cover_href} from EPUB.')
                    return

            # Try to open image bytes with PIL and save as PNG for consistency
            try:
                img = Image.open(io.BytesIO(image_data))
                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGBA')
                output_file = os.path.splitext(input_file)[0] + '.png'
                img.save(output_file, format='PNG')
                print(f"Done, your cover photo has been saved as {output_file}")
            except Exception as e:
                # fallback: write raw bytes with original extension
                ext = os.path.splitext(cover_href)[1]
                if not ext:
                    mtype = mimetypes.guess_type(cover_href)[0]
                    ext = mimetypes.guess_extension(mtype) or '.img'
                output_file = os.path.splitext(input_file)[0] + ext
                with open(output_file, 'wb') as out:
                    out.write(image_data)
                print(f"Done, your cover photo has been saved as {output_file} (raw bytes)")
    except Exception as e:
        print(f'Error extracting EPUB cover from {input_file}: {e}')


# Render first lines of TXT file into PNG image.
def extract_txt_cover(input_file: str, max_lines: int = 20, max_chars: int = 2000) -> None:
    """Render a TXT file's first few lines into a PNG image and save it next to the TXT.

    - max_lines: maximum number of lines to read from the TXT file
    - max_chars: maximum number of characters to include (truncates with ellipsis)
    """
    print(f"Creating text cover image from {input_file}...")
    try:
        with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = []
            for _ in range(max_lines):
                line = f.readline()
                if not line:
                    break
                lines.append(line.rstrip('\n'))

        if not lines:
            print('TXT file is empty; no cover created.')
            return

        text = '\n'.join(lines)
        if len(text) > max_chars:
            text = text[:max_chars].rstrip() + '...'

        # Choose image size and font
        font = ImageFont.load_default()
        # Base width; will wrap text to fit
        width = 1200
        margin = 40

        # Estimate characters per line based on font metrics
        # Use a temporary draw to measure text size (compatible across Pillow versions)
        temp_img = Image.new('RGB', (1, 1))
        temp_draw = ImageDraw.Draw(temp_img)
        try:
            avg_char_w, char_h = temp_draw.textsize('A', font=font)
        except AttributeError:
            # Pillow >=8: use textbbox
            bbox = temp_draw.textbbox((0, 0), 'A', font=font)
            avg_char_w = bbox[2] - bbox[0]
            char_h = bbox[3] - bbox[1]
        avg_char_w = avg_char_w or 7
        chars_per_line = max(40, (width - 2 * margin) // avg_char_w)

        wrapped = textwrap.fill(text, width=chars_per_line)
        lines = wrapped.splitlines()

        line_height = char_h + 6
        height = margin * 2 + line_height * max(1, len(lines))

        img = Image.new('RGBA', (width, height), 'white')
        draw = ImageDraw.Draw(img)

        y = margin
        for line in lines:
            draw.text((margin, y), line, fill='black', font=font)
            y += line_height

        output_file = os.path.splitext(input_file)[0] + '.png'
        img.save(output_file)
        print(f"Done, your text cover has been saved as {output_file}")
    except Exception as e:
        print(f'Error creating TXT cover from {input_file}: {e}')


# Loop over input files
for input_file in args.input_files:
    ext = os.path.splitext(input_file)[1].lower()
    if ext == '.pdf':
        print(f"Extracting cover photo from {input_file}...")

        # Open input PDF file and extract first page
        pdf_reader = PdfReader(input_file)
        first_page = pdf_reader.pages[0]

        # Create output PDF writer and add first page
        pdf_writer = PdfWriter()
        pdf_writer.add_page(first_page)

        # Write output PDF data to memory buffer
        buffer = io.BytesIO()
        pdf_writer.write(buffer)

        # Convert output PDF data to image and save as PNG file
        images = convert_from_bytes(buffer.getvalue())
        output_file = os.path.splitext(input_file)[0] + ".png"
        images[0].save(output_file)

        # Print the output path to stdout so callers can consume it if needed
        try:
            print(output_file)
        except Exception:
            pass

        # Print confirmation message
        print(f"Done, your cover photo has been saved as {output_file}")

        # Close memory buffer
        buffer.close()
    elif ext == '.epub':
        extract_epub_cover(input_file)
    elif ext == '.txt':
        extract_txt_cover(input_file)
    else:
        print(f'Unsupported file type for {input_file}; supported: .pdf, .epub')
