#!/usr/bin/env python3
import argparse, json, re, sys, time, urllib.parse, urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

PROJECT='xkong-bd-map'
BASE=f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents'
CANON=re.compile(r'^[A-Z]+\d{8}$')

def decode(v):
    if 'nullValue' in v: return None
    for k in ('stringValue','booleanValue','integerValue','doubleValue','timestampValue'):
        if k in v:
            x=v[k]
            if k=='integerValue': return int(x)
            return x
    if 'arrayValue' in v: return [decode(x) for x in v['arrayValue'].get('values',[])]
    if 'mapValue' in v: return {k:decode(x) for k,x in v['mapValue'].get('fields',{}).items()}
    return None

def fetch_collection(name):
    out=[]; token=''
    while True:
        q={'pageSize':'1000'}
        if token: q['pageToken']=token
        url=f'{BASE}/{name}?'+urllib.parse.urlencode(q)
        with urllib.request.urlopen(url,timeout=60) as r: obj=json.load(r)
        for d in obj.get('documents',[]):
            out.append({'_doc_id':d['name'].rsplit('/',1)[-1], '_name':d['name'], '_createTime':d.get('createTime'), '_updateTime':d.get('updateTime'), **{k:decode(v) for k,v in d.get('fields',{}).items()}})
        token=obj.get('nextPageToken','')
        if not token: break
    return out

def norm_text(x):
    return re.sub(r'[\s\W_]+','',str(x or '').lower())

def is_point(x):
    return x.get('entryKind')=='point' or x.get('status')=='点位'

def canonical(x):
    for raw in (x.get('_doc_id'),x.get('id'),x.get('sourceBaseId')):
        s=str(raw or '').strip()
        if CANON.fullmatch(s): return s
        if s.startswith('place_') and CANON.fullmatch(s[6:]): return s[6:]
    return ''

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--out',default='artifacts/firestore-canonical-migration')
    args=ap.parse_args()
    root=Path(args.out); root.mkdir(parents=True,exist_ok=True)
    stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    places=fetch_collection('places')
    counters=fetch_collection('institutionCodeCounters')
    base=json.loads(Path('tcm-base-clinics.json').read_text())
    (root/f'places-backup-{stamp}.json').write_text(json.dumps(places,ensure_ascii=False,indent=2))
    (root/f'counters-backup-{stamp}.json').write_text(json.dumps(counters,ensure_ascii=False,indent=2))
    by_id={x['id']:x for x in base}
    by_name_addr=defaultdict(list); by_name=defaultdict(list)
    for x in base:
        by_name_addr[(norm_text(x.get('name')),norm_text(x.get('address')))].append(x)
        by_name[norm_text(x.get('name'))].append(x)
    plan=[]; unresolved=[]; conflicts=[]
    for x in places:
        doc=x['_doc_id']
        if is_point(x):
            plan.append({'doc_id':doc,'action':'keep_point','target_id':doc,'name':x.get('name','')}); continue
        target=canonical(x); method='direct'
        if not target:
            hits=by_name_addr.get((norm_text(x.get('name')),norm_text(x.get('address'))),[])
            if len(hits)==1: target=hits[0]['id']; method='unique_name_address'
            elif len(hits)>1:
                conflicts.append({'doc_id':doc,'reason':'ambiguous_name_address','candidate_ids':[h['id'] for h in hits],'record':x}); continue
            else:
                nh=by_name.get(norm_text(x.get('name')),[])
                if len(nh)==1: target=nh[0]['id']; method='unique_name_only'
                elif len(nh)>1:
                    conflicts.append({'doc_id':doc,'reason':'ambiguous_name','candidate_ids':[h['id'] for h in nh],'record':x}); continue
        if not target:
            unresolved.append(x); continue
        action='keep_canonical' if doc==target else 'migrate'
        plan.append({'doc_id':doc,'action':action,'target_id':target,'method':method,'in_base_pool':target in by_id,'name':x.get('name',''),'sourceBaseId':x.get('sourceBaseId',''),'revision':x.get('revision',0),'deletedAt':x.get('deletedAt')})
    targets=defaultdict(list)
    for p in plan:
        if p['action']=='migrate': targets[p['target_id']].append(p)
    for target, rows in targets.items():
        if len(rows)>1 or any(x['_doc_id']==target for x in places):
            conflicts.append({'reason':'target_collision','target_id':target,'sources':rows,'target_exists':any(x['_doc_id']==target for x in places)})
    maxes=defaultdict(int)
    for x in base:
        prefix=re.sub(r'[^A-Z0-9]','',str(x.get('primary_l2_code','')).upper())
        if x['id'].startswith(prefix): maxes[prefix]=max(maxes[prefix],int(x['id'][len(prefix):]))
    for x in places:
        c=canonical(x)
        m=re.match(r'^([A-Z]+\d{2})(\d{6})$',c)
        if m: maxes[m.group(1)]=max(maxes[m.group(1)],int(m.group(2)))
    report={
      'generatedAt':stamp,'places':len(places),'points':sum(is_point(x) for x in places),
      'institutions':sum(not is_point(x) for x in places),
      'keep_canonical':sum(p['action']=='keep_canonical' for p in plan),
      'migrate':sum(p['action']=='migrate' for p in plan),
      'unresolved':len(unresolved),'conflicts':len(conflicts),
      'methods':dict(Counter(p.get('method') for p in plan if p.get('method'))),
      'counter_prefixes':len(maxes),'counter_maxima':dict(sorted(maxes.items()))
    }
    (root/f'plan-{stamp}.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2))
    (root/f'unresolved-{stamp}.json').write_text(json.dumps(unresolved,ensure_ascii=False,indent=2))
    (root/f'conflicts-{stamp}.json').write_text(json.dumps(conflicts,ensure_ascii=False,indent=2))
    (root/f'counter-maxima-{stamp}.json').write_text(json.dumps(dict(sorted(maxes.items())),ensure_ascii=False,indent=2))
    (root/f'report-{stamp}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
    print('artifact_dir',root.resolve())
if __name__=='__main__': main()
