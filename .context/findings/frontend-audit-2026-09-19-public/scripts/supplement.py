import pathlib,json,re,hashlib,subprocess
root=pathlib.Path.cwd();out=pathlib.Path(__file__).resolve().parent.parent/'data'
assets=[]
for base in ['public','src']:
 for p in pathlib.Path(base).rglob('*'):
  if p.is_file() and p.suffix.lower() in ['.svg','.png','.jpg','.jpeg','.webp','.gif','.woff','.woff2','.ttf']:
   assets.append({'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(out/'assets.json').write_text(json.dumps(assets,indent=2))
styles=[]
for p in [pathlib.Path('src/index.css'),pathlib.Path('tailwind.config.js'),pathlib.Path('tailwind.config.ts'),pathlib.Path('src/lib/sizing.ts'),pathlib.Path('src/store/useThemeStore.ts')]:
 if p.exists():styles.append({'file':str(p),'source':p.read_text()})
(out/'design-foundations.json').write_text(json.dumps(styles,indent=2))
tests=[]
for p in list(pathlib.Path('src').rglob('*test*'))+list(pathlib.Path('e2e').rglob('*.spec.ts')):
 if p.is_file() and p.suffix in ['.ts','.tsx']:tests.append({'file':str(p),'cases':re.findall(r'(?:it|test)\(\s*[\'"`]([^\'"`]+)',p.read_text())})
(out/'existing-tests.json').write_text(json.dumps(tests,indent=2))
(out/'provenance.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'target':'https://admin.flexprice.io','date':'2026-09-19','browser':'Installed Playwright Chromium, headless, 1440x1000 baseline','productionCommit':'unknown; source/live equivalence not assumed','capturePolicy':'Screenshots and rendered UI text; network field shapes only, no tokens or response values.'},indent=2))
