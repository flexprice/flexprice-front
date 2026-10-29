import json,pathlib,collections,html,re
base=pathlib.Path(__file__).resolve().parent.parent; d=base/'data'
load=lambda n:json.loads((d/(n+'.json')).read_text())
routes=load('routes');services=load('services');calls=load('calls');components=load('components')
# Retain all declarations, including duplicate and container routes, instead of silently deduplicating.
lines=['# Route → component → API map','', 'Static dependency reachability, not proof that every call executes on mount. Shared imports, drawers and optional tabs are included. Parent layout queries and permission checks also run. Route registration is read from the TypeScript AST; dynamic feature gates remain conditional.','']
for r in routes:
 lines += [f"## `{r['path']}`",'',f"Registration: `src/core/routes/Routes.tsx:{r['line']}`. Component: `{r.get('componentFile','container/inline')}`. Permission: `{r.get('permission','inherited, public or component-level; inspect route chain')}`.",'',r['element'],'']
 if r['apiCalls']:
  lines+=['| API method | Call site |','|---|---|']+[f"| `{c['service']}.{c['method']}` | `{c['file']}:{c['line']}` |" for c in r['apiCalls']]+['']
(base/'ROUTE-API-MAP.md').write_text('\n'.join(lines))
lines=['# API contracts and request construction','','Source methods are authoritative for this checkout. Generic response types are compile-time contracts; they do not prove runtime validation. Method bodies preserve parameter generation, payload changes and response transformations.','']
for s in services:
 lines += [f"## {pathlib.Path(s['file']).stem}.{s['method']}",'',f"`{s['file']}:{s['line']}`",'',f"Base path: `{s.get('baseUrl')}`. Returns: `{s.get('returnType')}`.",'','Parameters: '+ '; '.join('`'+p+'`' for p in s['parameters']),'','```ts',s['body'],'```','']
(base/'API-CONTRACTS.md').write_text('\n'.join(lines))
lines=['# Components, forms and response-field candidates','','Extracted controls include drawers, modal editors, table renderers and page forms. Property reads are lexical candidates, not a complete data-flow proof. Cross-reference API-CONTRACTS.md, data/contracts.json and live network shapes.','']
for c in components:
 if not c['fields'] and not c['queries'] and not c['propertyReads']:continue
 lines += [f"## {c['file']}",'',f"{c['lines']} lines. Query keys: "+', '.join('`'+q+'`' for q in c['queries']),'','Response/domain field candidates: '+', '.join('`'+q+'`' for q in c['propertyReads']),'']
 for f in c['fields']:lines += [f"- Line {f['line']}: `{f['tag']}`",'','```tsx',f['props'],'```','']
(base/'FORM-COMPONENT-MAP.md').write_text('\n'.join(lines))
print('Generated route, API and form reference documents')
# Normalize generated Markdown so reruns also pass git diff --check.
for name in ['ROUTE-API-MAP.md', 'API-CONTRACTS.md', 'FORM-COMPONENT-MAP.md']:
    output = base / name
    output.write_text('\n'.join(line.rstrip() for line in output.read_text().splitlines()).rstrip() + '\n')
