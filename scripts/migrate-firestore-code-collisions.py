#!/usr/bin/env python3
"""Atomically move Firestore institution docs whose canonical IDs collide with different base-pool institutions.

Dry run by default. --apply performs one Firestore commit containing create+delete pairs and counter updates.
Uses optimistic updateTime preconditions and never touches point records.
"""
import argparse, json, re, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

PROJECT='xkong-bd-map'
ROOT=f'projects/{PROJECT}/databases/(default)/documents'
API=f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents:commit'
CANON=re.compile(r'^([A-Z]+\d{2})(\d{6})$')

def encode(v):
    if v is None:return {'nullValue':None}
    if isinstance(v,bool):return {'booleanValue':v}
    if isinstance(v,int):return {'integerValue':str(v)}
    if isinstance(v,float):return {'doubleValue':v}
    if isinstance(v,str):return {'stringValue':v}
    if isinstance(v,list):return {'arrayValue':{'values':[encode(x) for x in v]}}
    if isinstance(v,dict):return {'mapValue':{'fields':{k:encode(x) for k,x in v.items()}}}
    return {'stringValue':str(v)}

def norm(x):return re.sub(r'[\s\W_]+','',str(x or '').lower())
def is_point(x):return x.get('entryKind')=='point' or x.get('status')=='点位'

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--backup',required=True);ap.add_argument('--base',default='tcm-base-clinics.json');ap.add_argument('--out',required=True);ap.add_argument('--apply',action='store_true');a=ap.parse_args()
    places=json.loads(Path(a.backup).read_text());base=json.loads(Path(a.base).read_text());out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
    by={x['id']:x for x in base};occupied=set(by)|{x['_doc_id'] for x in places};maxima=defaultdict(int)
    for i in occupied:
        m=CANON.fullmatch(i)
        if m:maxima[m.group(1)]=max(maxima[m.group(1)],int(m.group(2)))
    collisions=[]
    for x in places:
        old=x['_doc_id']; b=by.get(old)
        if not b or is_point(x):continue
        if norm(x.get('name'))==norm(b.get('name')) and norm(x.get('address'))==norm(b.get('address')):continue
        m=CANON.fullmatch(old)
        if not m:continue
        prefix=m.group(1)
        while True:
            maxima[prefix]+=1;new=prefix+str(maxima[prefix]).zfill(6)
            if new not in occupied:occupied.add(new);break
        data={k:v for k,v in x.items() if not k.startswith('_')};data.update(id=new,previousCanonicalId=old,canonicalCollisionMigratedAt=datetime.now(timezone.utc).isoformat().replace('+00:00','Z'))
        collisions.append({'source':old,'target':new,'record':data,'updateTime':x['_updateTime'],'name':x.get('name'),'address':x.get('address'),'base_name':b.get('name'),'base_address':b.get('address')})
    writes=[]
    for x in collisions:
        writes += [{'update':{'name':f'{ROOT}/places/{x["target"]}','fields':{k:encode(v) for k,v in x['record'].items()}},'currentDocument':{'exists':False}}, {'delete':f'{ROOT}/places/{x["source"]}','currentDocument':{'updateTime':x['updateTime']}}]
    now=datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
    collision_prefixes=set()
    for item in collisions:
        match=CANON.fullmatch(item['target'])
        if not match:
            raise ValueError(f'无效目标机构代码: {item["target"]}')
        collision_prefixes.add(match.group(1))
    for prefix in sorted(collision_prefixes):
        writes.append({'update':{'name':f'{ROOT}/institutionCodeCounters/{prefix}','fields':{'value':encode(maxima[prefix]),'primary_l2_code':encode(prefix[:-2]+'-'+prefix[-2:]),'updatedAt':encode(now),'initializedBy':encode('collision-migration')}}})
    public=[{k:v for k,v in x.items() if k not in ('record','updateTime')} for x in collisions]
    (out/'collision-plan.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n');(out/'commit-payload.json').write_text(json.dumps({'writes':writes},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'collisions':len(collisions),'writes':len(writes),'apply':a.apply,'mapping':public},ensure_ascii=False,indent=2))
    if a.apply and writes:
        req=urllib.request.Request(API,data=json.dumps({'writes':writes}).encode(),headers={'Content-Type':'application/json'},method='POST')
        with urllib.request.urlopen(req,timeout=120) as r:result=json.load(r)
        (out/'commit-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'commitTime':result.get('commitTime'),'writeResults':len(result.get('writeResults',[]))},ensure_ascii=False))
if __name__=='__main__':main()
