#!/usr/bin/env python3
"""
Script to add Status column to all test case tables in the markdown file
"""

import re

# Read the file
with open('BYTECHAT_TEST_CASES_TABLE_FORMAT.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match table headers without Status column
header_pattern = r'\| Test Case ID \| Test Case Title \| Priority \| Preconditions \| Test Steps \| Expected Result \|'
header_replacement = r'| Test Case ID | Test Case Title | Priority | Preconditions | Test Steps | Expected Result | Status |'

# Pattern to match separator line without Status column
separator_pattern = r'\|--------------|----------------|----------|---------------|------------|-----------------|'
separator_replacement = r'|--------------|----------------|----------|---------------|------------|-----------------|--------|'

# Pattern to match test case rows that don't end with Status column
# This matches lines that end with | but don't have the Status column
row_pattern = r'(\| TC-\d{3} \|[^\n]+\|)(?!\s*☐ Pass)'
row_replacement = r'\1 ☐ Pass<br>☐ Fail |'

# Apply replacements
content = re.sub(header_pattern, header_replacement, content)
content = re.sub(separator_pattern, separator_replacement, content)
content = re.sub(row_pattern, row_replacement, content)

# Write back to file
with open('BYTECHAT_TEST_CASES_TABLE_FORMAT.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Status column added to all test case tables!")
print("📄 File updated: BYTECHAT_TEST_CASES_TABLE_FORMAT.md")
