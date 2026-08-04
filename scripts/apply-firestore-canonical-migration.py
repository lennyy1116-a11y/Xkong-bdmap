#!/usr/bin/env python3
import argparse, glob, json, re, urllib.error, urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

PROJECT = 'xkong-bd-map'
ROOT = f'projects/{PROJECT}/databases/(default)/documents'
API = f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents:commit'
CANON = re.compile(r'^([A-Z]+\d{2})(\d{6})$')


def encode(value):
    if value is None:
        return {'nullValue': None}
    if isinstance(value, bool):
        return {'booleanValue': value}
    if isinstance(value, int):
        return {'integerValue': str(value)}
    if isinstance(value, float):
        return {'doubleValue': value}
    if isinstance(value, str):
        return {'stringValue': value}
    if isinstance(value, list):
        return {'arrayValue': {'values': [encode(x) for x in value]}}
    if isinstance(value, dict):
        return {'mapValue': {'fields': {k: encode(v) for k, v in value.items()}}}
    return {'stringValue': str(value)}


def clean_record(record):
    return {k: v for k, v in record.items() if not k.startswith('_')}


TAXONOMY = {
    'MED-01': ('MED', '医疗诊疗', '综合／家庭医生诊所'),
    'TCM-01': ('TCM', '中医与传统医学', '中医综合诊所'),
}


def fallback_l2(record):
    raw = ' '.join(str(record.get(k) or '') for k in ('type', 'primaryCategory', 'secondaryCategory', 'name'))
    return 'MED-01' if ('综合诊所' in raw or '綜合診所' in raw or 'Dr.' in raw) else 'TCM-01'


def complete_fallback_taxonomy(data, l2):
    if all(data.get(k) for k in ('primary_l1_code', 'primary_l1_name', 'primary_l2_code', 'primary_l2_name')):
        return
    if l2 not in TAXONOMY:
        raise ValueError(f'缺少完整分类且不能安全补齐: {l2}')
    l1, l1_name, l2_name = TAXONOMY[l2]
    data.update(primary_l1_code=l1, primary_l1_name=l1_name,
                primary_l2_code=l2, primary_l2_name=l2_name,
                taxonomyVersion='2026-07-30')


def compact_prefix(l2):
    prefix = re.sub(r'[^A-Z0-9]', '', str(l2 or '').upper())
    if not re.fullmatch(r'[A-Z]+\d{2}', prefix):
        raise ValueError(f'无效L2代码: {l2!r}')
    return prefix


def latest(pattern):
    paths = sorted(glob.glob(pattern))
    if not paths:
        raise FileNotFoundError(pattern)
    return Path(paths[-1])


def build(root):
    backup_path = latest(str(root / 'places-backup-*.json'))
    maxima_path = latest(str(root / 'counter-maxima-*.json'))
    places = json.loads(backup_path.read_text())
    maxima = {k: int(v) for k, v in json.loads(maxima_path.read_text()).items()}
    occupied = {x['_doc_id'] for x in places}
    serials = defaultdict(int, maxima)
    allocations = []

    for record in sorted(places, key=lambda x: x['_doc_id']):
        doc_id = record['_doc_id']
        if record.get('entryKind') == 'point' or record.get('status') == '点位' or CANON.fullmatch(doc_id):
            continue
        l2 = record.get('primary_l2_code') or fallback_l2(record)
        prefix = compact_prefix(l2)
        while True:
            serials[prefix] += 1
            target = prefix + str(serials[prefix]).zfill(6)
            if target not in occupied:
                occupied.add(target)
                break
        data = clean_record(record)
        data['id'] = target
        data['entryKind'] = 'institution'
        data['primary_l2_code'] = l2
        complete_fallback_taxonomy(data, l2)
        data['legacyDocumentId'] = doc_id
        data['canonicalMigratedAt'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        allocations.append({'source': doc_id, 'target': target, 'record': data, 'updateTime': record['_updateTime']})

    if len({x['target'] for x in allocations}) != len(allocations):
        raise RuntimeError('目标ID重复')
    return backup_path, allocations, dict(serials)


def commit(root, apply):
    backup_path, allocations, serials = build(root)
    writes = []
    for item in allocations:
        writes.append({
            'update': {
                'name': f'{ROOT}/places/{item["target"]}',
                'fields': {k: encode(v) for k, v in item['record'].items()}
            },
            'currentDocument': {'exists': False}
        })
        writes.append({
            'delete': f'{ROOT}/places/{item["source"]}',
            'currentDocument': {'updateTime': item['updateTime']}
        })
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    for prefix, value in sorted(serials.items()):
        writes.append({
            'update': {
                'name': f'{ROOT}/institutionCodeCounters/{prefix}',
                'fields': {
                    'value': encode(value),
                    'primary_l2_code': encode(prefix[:-2] + '-' + prefix[-2:]),
                    'updatedAt': encode(now),
                    'initializedBy': encode('canonical-id-migration')
                }
            }
        })
    payload = {'writes': writes}
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    payload_path = root / f'commit-payload-{stamp}.json'
    allocation_path = root / f'allocations-{stamp}.json'
    payload_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    allocation_path.write_text(json.dumps([{k: v for k, v in x.items() if k != 'record'} for x in allocations], ensure_ascii=False, indent=2))
    print(json.dumps({
        'backup': str(backup_path), 'allocations': len(allocations), 'writes': len(writes),
        'counterPrefixes': len(serials), 'payload': str(payload_path), 'apply': apply
    }, ensure_ascii=False, indent=2))
    if not allocations:
        print(json.dumps({'status':'noop', 'message':'没有待迁移legacy机构'}, ensure_ascii=False))
        return
    if not apply:
        return
    req = urllib.request.Request(API, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        print(exc.read().decode())
        raise
    result_path = root / f'commit-result-{stamp}.json'
    result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({'commitTime': result.get('commitTime'), 'writeResults': len(result.get('writeResults', [])), 'result': str(result_path)}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='artifacts/firestore-canonical-migration')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    commit(Path(args.root), args.apply)
