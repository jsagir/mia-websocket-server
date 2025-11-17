#!/bin/bash

# PWS Curriculum Organization Script
# This script helps organize downloaded Google Drive files into the correct structure

set -e

echo "🗂️  PWS Curriculum Organization Script"
echo "======================================"
echo ""

# Check if source directory is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-downloaded-files>"
    echo ""
    echo "Example:"
    echo "  $0 ~/Downloads/PWS-Materials"
    echo ""
    exit 1
fi

SOURCE_DIR="$1"
TARGET_DIR="./curriculum"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Directory '$SOURCE_DIR' not found"
    exit 1
fi

echo "📂 Source: $SOURCE_DIR"
echo "📂 Target: $TARGET_DIR"
echo ""

# Create target directory structure
echo "📁 Creating directory structure..."
mkdir -p "$TARGET_DIR"/{lectures,frameworks,problem_types,tools,examples,docs,books}

# Function to copy file if it exists
copy_if_exists() {
    local src="$1"
    local dest="$2"
    local name="$3"

    if [ -f "$src" ]; then
        cp "$src" "$dest"
        echo "  ✅ Copied: $name"
        return 0
    else
        echo "  ⚠️  Not found: $name"
        return 1
    fi
}

echo ""
echo "📚 Organizing Lecture Files..."
echo "------------------------------"

# Copy lecture files (N01-N10)
copy_if_exists "$SOURCE_DIR/N01_Introduction.pptx" "$TARGET_DIR/lectures/" "N01_Introduction.pptx"
copy_if_exists "$SOURCE_DIR/N02_UnDefined.pptx" "$TARGET_DIR/lectures/" "N02_UnDefined.pptx"
copy_if_exists "$SOURCE_DIR/N03_IllDefined.pptx" "$TARGET_DIR/lectures/" "N03_IllDefined.pptx"
copy_if_exists "$SOURCE_DIR/N04_Wicked Problems.pptx" "$TARGET_DIR/lectures/" "N04_Wicked Problems.pptx"
copy_if_exists "$SOURCE_DIR/N05_Domains.pptx" "$TARGET_DIR/lectures/" "N05_Domains.pptx"
copy_if_exists "$SOURCE_DIR/N06_Portfolio.pptx" "$TARGET_DIR/lectures/" "N06_Portfolio.pptx"
copy_if_exists "$SOURCE_DIR/N07_Well-Defined.pptx" "$TARGET_DIR/lectures/" "N07_Well-Defined.pptx"
copy_if_exists "$SOURCE_DIR/N08_Prior Art.pptx" "$TARGET_DIR/lectures/" "N08_Prior Art.pptx"
copy_if_exists "$SOURCE_DIR/N08b_Technical Plan.pptx" "$TARGET_DIR/lectures/" "N08b_Technical Plan.pptx"
copy_if_exists "$SOURCE_DIR/N09_Term Report.pptx" "$TARGET_DIR/lectures/" "N09_Term Report.pptx"
copy_if_exists "$SOURCE_DIR/N10_January Term.pptx" "$TARGET_DIR/lectures/" "N10_January Term.pptx"
copy_if_exists "$SOURCE_DIR/10_January Term.pptx" "$TARGET_DIR/lectures/" "10_January Term.pptx"
copy_if_exists "$SOURCE_DIR/I&E Lecture Notes Fall.docx" "$TARGET_DIR/lectures/" "I&E Lecture Notes Fall.docx"

echo ""
echo "📖 Organizing Documentation..."
echo "------------------------------"

# Copy documentation files
copy_if_exists "$SOURCE_DIR/PWS_INNOVATION_BOOK.txt" "$TARGET_DIR/docs/" "PWS_INNOVATION_BOOK.txt"
copy_if_exists "$SOURCE_DIR/Extended Research Foun.txt" "$TARGET_DIR/docs/" "Extended Research Foun.txt"
copy_if_exists "$SOURCE_DIR/Syllabouse.pdf" "$TARGET_DIR/docs/" "Syllabouse.pdf"
copy_if_exists "$SOURCE_DIR/README.md" "$TARGET_DIR/docs/" "README.md"
copy_if_exists "$SOURCE_DIR/Lawrence Aronhime ABOUT.txt" "$TARGET_DIR/docs/" "Lawrence Aronhime ABOUT.txt"
copy_if_exists "$SOURCE_DIR/Injest.txt" "$TARGET_DIR/docs/" "Injest.txt"

echo ""
echo "📚 Organizing Reference Books..."
echo "--------------------------------"

# Copy reference books
copy_if_exists "$SOURCE_DIR/A More Beautiful Question.pdf" "$TARGET_DIR/books/" "A More Beautiful Question.pdf"

echo ""
echo "📄 Organizing Markdown Files..."
echo "--------------------------------"

# Copy merged markdown files
for i in {2..7}; do
    copy_if_exists "$SOURCE_DIR/${i}merged_markdown.md" "$TARGET_DIR/docs/" "${i}merged_markdown.md"
done

echo ""
echo "📊 Organizing Research Papers..."
echo "--------------------------------"

# Copy research papers
copy_if_exists "$SOURCE_DIR/Trending to the absurd - agent steps.pdf" "$TARGET_DIR/docs/" "Trending to the absurd - agent steps.pdf"
copy_if_exists "$SOURCE_DIR/mINTO.pdf" "$TARGET_DIR/docs/" "mINTO.pdf"

echo ""
echo "🔍 Looking for additional files..."
echo "----------------------------------"

# Find and report any other files that weren't copied
echo "Files in source directory:"
find "$SOURCE_DIR" -type f -maxdepth 1 | while read file; do
    echo "  - $(basename "$file")"
done

echo ""
echo "✅ Organization Complete!"
echo ""
echo "📁 Summary:"
echo "  Lectures:      $(find "$TARGET_DIR/lectures" -type f | wc -l) files"
echo "  Documentation: $(find "$TARGET_DIR/docs" -type f | wc -l) files"
echo "  Books:         $(find "$TARGET_DIR/books" -type f | wc -l) files"
echo ""
echo "🚀 Next Steps:"
echo "  1. Review organized files: ls -la curriculum/"
echo "  2. Add your Gemini API key: echo 'GEMINI_API_KEY=your-key' >> .env"
echo "  3. Upload to File Search: npm run pws:upload:graphrag"
echo ""
