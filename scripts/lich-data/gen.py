import json, re, os
# CJK radical-supplement forms the app uses in place of the ordinary characters.
RADICALS=str.maketrans({'⺠':'民','⻁':'虎','⻘':'青','⻤':'鬼'})
def jd(d,m,y):
    a=(14-m)//12; yy=y+4800-a; mm=m+12*a-3
    j=d+(153*mm+2)//5+365*yy+yy//4-yy//100+yy//400-32045
    if j<2299161: j=d+(153*mm+2)//5+365*yy+yy//4-32083
    return j
stars={}; order=[]
table=[[None]*60 for _ in range(12)]
d60={}
def idx(name,desc,good):
    key=(name,good)
    if key not in stars:
        stars[key]=len(order); order.append((name,desc,good))
    return stars[key]
for l in open('all.jsonl'):
    r=json.loads(l)
    J=jd(int(r['Day']),int(r['Month']),int(r['Year'])); k=(J+49)%60; lm=r['VNLunar'][1]
    cell=[sorted(idx(n,v,True) for n,v in r['GoodStars'].items() if n.strip()), sorted(idx(n,v,False) for n,v in r['BadStars'].items() if n.strip())]
    if table[lm-1][k] is None: table[lm-1][k]=cell
    assert table[lm-1][k]==cell
    if k not in d60:
        parts=dict(re.findall(r'(Tài Thần|Hỷ Thần|Hạc Thần):\s*([^.]+)', r['GoodBadDirection']))
        d60[k]={'tai':parts.get('Tài Thần','').strip(),'hy':parts.get('Hỷ Thần','').strip(),'hac':parts.get('Hạc Thần','').strip(),'hanh':r['NguHanh']}
assert all(c is not None for row in table for c in row)
def split(n):
    m=re.match(r'^(.*?)\s*\((.*)\)\s*$', n)
    return (m.group(1).strip(), m.group(2).replace(' ','')) if m else (n.strip(),'')
starlist=[]
for name,desc,good in order:
    vi,han=split(name); import unicodedata; starlist.append({'n':vi[0].upper()+vi[1:],'h':unicodedata.normalize('NFKC',han).translate(RADICALS),'d':desc.strip(),'g':good})
ex=json.load(open('extra.json')); s28=json.load(open('stars28.json'))
napam=[[p for p in (re.sub(r'\s+',' ',x).strip().lstrip('-').strip() for x in t.split(';')) if p] for t in ex['napAm']]
out={'ngocHap':{'stars':starlist,'table':table},'days60':[d60[i] for i in range(60)],'napAm':napam,
     'sao28':[{'name':s['name'],'nen':s['nen'],'kieng':s['kieng'],'ngoaiLe':s['ngoaiLe'].strip(),'tho':s['tho'].strip()} for s in s28],
     'quotes':[re.sub(r'\s+',' ',q).strip() for q in ex['quotes']]}
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','src','data','lich','app-data.json')
os.makedirs(os.path.dirname(p),exist_ok=True)
json.dump(out,open(p,'w'),ensure_ascii=False,separators=(',',':'))
print(len(starlist), os.path.getsize(p))
print(d60[30], sum(1 for v in d60.values() if not v['hac']), napam[30], starlist[:2])
