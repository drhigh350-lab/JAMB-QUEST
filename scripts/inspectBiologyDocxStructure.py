import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path('/home/ubuntu/upload/JAMBBIOLOGYPASTQUESTION(DR.HIGH).docx')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(source) as archive:
    root = ET.fromstring(archive.read('word/document.xml'))
for index, paragraph in enumerate(root.findall('.//w:body/w:p', ns)[:120], start=1):
    text = ''.join(node.text or '' for node in paragraph.findall('.//w:t', ns)).strip()
    num = paragraph.find('./w:pPr/w:numPr/w:ilvl', ns)
    num_id = paragraph.find('./w:pPr/w:numPr/w:numId', ns)
    if text or num is not None or num_id is not None:
        print(f'{index}: numId={num_id.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val") if num_id is not None else None} ilvl={num.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val") if num is not None else None} text={text[:240]}')
