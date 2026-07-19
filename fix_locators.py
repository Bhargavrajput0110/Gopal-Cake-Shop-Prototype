import re

with open('tests/e2e/e2e.spec.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'page\.locator\(\'h\[1-3\]:has-text\("([^"]+)"\)\'\)', r'page.getByText("\1")', content)

with open('tests/e2e/e2e.spec.ts', 'w', encoding='utf-8') as f:
    f.write(content)
