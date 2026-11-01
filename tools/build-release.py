"""Build the standalone sheet and distributable zips from the shared equipment code."""
from pathlib import Path
import json, re, zipfile
MOD = Path(__file__).resolve().parents[1]
ROOT = MOD.parents[1]
page = ROOT / 'fate-gundam.html'
if page.exists():
    html = page.read_text(encoding='utf-8')
else:
    html = (MOD / 'standalone.html').read_text(encoding='utf-8').replace('assets/', 'img/')
bundle = '<style>\n' + (MOD/'styles/equipment.css').read_text(encoding='utf-8') + '\n</style>\n'
for name in ['equipment.js', 'equipment-ui.js', 'equipment-manual.js']:
    bundle += '<script>\n' + (MOD/'scripts'/name).read_text(encoding='utf-8') + '\n</script>\n'
html, count = re.subn(r'<!-- equipment bundle start -->.*?<!-- equipment bundle end -->',
                    lambda _: '<!-- equipment bundle start -->\n'+bundle+'<!-- equipment bundle end -->',html,flags=re.S)
assert count == 1
if page.exists(): page.write_text(html,encoding='utf-8')
(MOD/'standalone.html').write_text(html.replace('img/', 'assets/'),encoding='utf-8')
with zipfile.ZipFile(MOD/'module.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in ['module.json','README.md','CHANGELOG.md']:
        z.write(MOD/f,f)
    for d in ['scripts','styles','assets']:
        for f in (MOD/d).rglob('*'):
            if f.is_file(): z.write(f,f.relative_to(MOD).as_posix())
with zipfile.ZipFile(MOD/'ficha-web.zip','w',zipfile.ZIP_DEFLATED) as z:
    z.write(MOD/'standalone.html','index.html')
    for f in (MOD/'assets').iterdir():
        if f.is_file(): z.write(f,'assets/'+f.name)
print('Built module.zip and ficha-web.zip; version',json.loads((MOD/'module.json').read_text(encoding='utf-8'))['version'])
