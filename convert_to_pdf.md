# How to Convert Test Cases to PDF

## Method 1: Using Online Markdown to PDF Converter (Easiest)

### Option A: Markdown to PDF (Recommended)
1. Visit: https://www.markdowntopdf.com/
2. Upload `BYTECHAT_100_TEST_CASES.md`
3. Click "Convert"
4. Download the PDF

### Option B: Dillinger
1. Visit: https://dillinger.io/
2. Import `BYTECHAT_100_TEST_CASES.md`
3. Click "Export as" → "PDF"
4. Download the PDF

### Option C: Markdown PDF (Chrome Extension)
1. Install "Markdown Viewer" Chrome extension
2. Open `BYTECHAT_100_TEST_CASES.md` in Chrome
3. Right-click → Print → Save as PDF

---

## Method 2: Using VS Code (If you have it)

1. Install "Markdown PDF" extension in VS Code
2. Open `BYTECHAT_100_TEST_CASES.md`
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Markdown PDF: Export (pdf)"
5. Press Enter
6. PDF will be saved in the same folder

---

## Method 3: Using Pandoc (Command Line)

### Install Pandoc
```bash
# Windows (using Chocolatey)
choco install pandoc

# Mac (using Homebrew)
brew install pandoc

# Linux (Ubuntu/Debian)
sudo apt-get install pandoc
```

### Convert to PDF
```bash
pandoc BYTECHAT_100_TEST_CASES.md -o BYTECHAT_100_TEST_CASES.pdf --pdf-engine=wkhtmltopdf
```

Or with better formatting:
```bash
pandoc BYTECHAT_100_TEST_CASES.md -o BYTECHAT_100_TEST_CASES.pdf \
  --pdf-engine=wkhtmltopdf \
  --toc \
  --toc-depth=2 \
  -V geometry:margin=1in \
  -V fontsize=11pt
```

---

## Method 4: Using Node.js (If you have Node installed)

### Install markdown-pdf
```bash
npm install -g markdown-pdf
```

### Convert
```bash
markdown-pdf BYTECHAT_100_TEST_CASES.md
```

---

## Method 5: Using Python (If you have Python installed)

### Install required packages
```bash
pip install markdown2 pdfkit
```

### Create convert.py
```python
import markdown2
import pdfkit

# Read markdown file
with open('BYTECHAT_100_TEST_CASES.md', 'r', encoding='utf-8') as f:
    markdown_text = f.read()

# Convert to HTML
html = markdown2.markdown(markdown_text)

# Add CSS styling
styled_html = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        h3 {{ color: #7f8c8d; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #3498db; color: white; }}
        code {{ background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; }}
        pre {{ background-color: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }}
    </style>
</head>
<body>
    {html}
</body>
</html>
"""

# Convert to PDF
pdfkit.from_string(styled_html, 'BYTECHAT_100_TEST_CASES.pdf')
print("PDF created successfully!")
```

### Run
```bash
python convert.py
```

---

## Recommended: Method 1 (Online Converter)

For the quickest and easiest conversion, I recommend using **Method 1 - Option A** (markdowntopdf.com):

1. Go to https://www.markdowntopdf.com/
2. Click "Choose File" and select `BYTECHAT_100_TEST_CASES.md`
3. Click "Convert to PDF"
4. Download your professionally formatted PDF

This will give you a clean, professional-looking PDF with:
- Proper heading hierarchy
- Table of contents
- Page numbers
- Professional formatting
- All 100 test cases properly organized

---

## Alternative: Print to PDF from Browser

1. Open `BYTECHAT_100_TEST_CASES.md` in any markdown viewer
2. Or paste content into Google Docs
3. Use browser's Print function (Ctrl+P / Cmd+P)
4. Select "Save as PDF" as the printer
5. Adjust margins and settings
6. Save the PDF

---

## Tips for Best PDF Output

- Use landscape orientation for wide tables
- Set margins to 0.5 inches for more content per page
- Enable headers and footers for page numbers
- Use a readable font size (10-12pt)
- Include table of contents for easy navigation

---

## Need Help?

If you encounter any issues with conversion, you can:
1. Copy the markdown content
2. Paste into Google Docs
3. Format as needed
4. Export as PDF from Google Docs

This ensures you get a properly formatted PDF document with all 100 test cases!
