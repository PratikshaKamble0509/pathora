// Run: node pathora.test.js  (loads the scheduler straight from pathora.html with stubbed browser globals)
const fs=require('fs'),assert=require('assert');
const js=fs.readFileSync(__dirname+'/../public/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
function load(d){const ls={d:d||{},getItem:k=>ls.d[k]??null,setItem:(k,v)=>ls.d[k]=v},el={set innerHTML(v){},style:{},setAttribute(){}};
const env={localStorage:ls,document:{querySelector:()=>el,querySelectorAll:()=>[],createElement:()=>el,body:{appendChild(){}},title:''},location:{hash:'#/'},addEventListener(){},scrollTo(){},alert(){},confirm:()=>true,NOBOOT:true};
return{ls,a:new Function(...Object.keys(env),js+';return{S,U,save,C,buildPlan,propose,feas,slots,conf,V,today,add,mon,mm}')(...Object.values(env))}}
function setup(o={},cid='bank'){const{ls,a}=load(),u={pw:'x',profile:{edu:3,stream:'',cs:'No',skills:'',int:[],sec:'Any',loc:'',hpd:2,hpw:10,rest:[0],start:'18:00',...o},goal:null,leaves:[],hist:[]};a.S.users.t=u;a.S.cur='t';
u.goal={cid,target:a.add(a.today(),400),tasks:a.buildPlan(u,{ph:{bank:{'Core skills':'Quantitative aptitude:20|Reasoning:16|English:14|Banking awareness:10','Practice':'Sectional tests:10|Full mock tests:16|Revision:8'}}[cid]})};return{ls,a,u}}
const apply=(a,L,f)=>{const p=a.propose(L,f),u=a.U();u.goal.tasks=p.clone;if(L)u.leaves.push(L);return p};
function limitsOk(a,u){const d={},w={};u.goal.tasks.forEach(t=>{d[t.date]=(d[t.date]||0)+t.h;w[a.mon(t.date)]=(w[a.mon(t.date)]||0)+t.h});
for(const k in d)assert(d[k]<=u.profile.hpd+1e-9,'daily limit '+k);for(const k in w)assert(w[k]<=u.profile.hpw+1e-9,'weekly limit '+k)}
function orderOk(a,u){const sl=a.slots(u.goal.tasks,u,u.leaves);let p=null;for(const t of u.goal.tasks){if(t.done)continue;if(p){assert(t.date>=p.date,'order by date');if(t.date==p.date)assert(sl[t.id][0]>=sl[p.id][1],'order within day')}p=t}}
const T=[];const test=(n,f)=>T.push([n,f]);
test('full-day leave moves tasks off the day, keeps limits/order/rest days',()=>{const{a,u}=setup(),d=u.goal.tasks[0].date,before=u.goal.tasks.length;const p=apply(a,{id:'1',from:d,to:d,r:''});
assert(p.moved.length>0);assert(!u.goal.tasks.some(t=>t.date==d));assert.equal(u.goal.tasks.length,before);limitsOk(a,u);orderOk(a,u);assert(!u.goal.tasks.some(t=>new Date(t.date+'T00:00').getDay()==0));assert(p.newEnd>=p.oldEnd)});
test('completed tasks are never moved or reset',()=>{const{a,u}=setup();u.goal.tasks.slice(0,3).forEach((t,i)=>{t.done=true;t.spent=1.5+i});const snap=JSON.stringify(u.goal.tasks.slice(0,3)),d=u.goal.tasks[4].date;apply(a,{id:'1',from:d,to:a.add(d,3)});assert.equal(JSON.stringify(u.goal.tasks.slice(0,3)),snap)});
test('partial-day leave only moves tasks overlapping the window',()=>{const{a,u}=setup({hpd:4,hpw:20}),d=u.goal.tasks[0].date,on=u.goal.tasks.filter(t=>t.date==d);assert(on.length>=2);
const p=a.propose({id:'p',from:d,to:d,ts:'18:00',te:'19:00'});assert(p.moved.some(m=>m.id==on[0].id));assert(!p.moved.some(m=>m.id==on[0].id&&m.why.includes('falls in')));const uu=a.U();uu.goal.tasks=p.clone;uu.leaves.push({id:'p',from:d,to:d,ts:'18:00',te:'19:00'});
const sl=a.slots(u.goal.tasks,u,u.leaves);u.goal.tasks.filter(t=>t.date==d).forEach(t=>assert(sl[t.id][0]>=19*60||sl[t.id][1]<=18*60,'no overlap'));limitsOk(a,u);orderOk(a,u)});
test('partial leave leaves earlier-day tasks untouched',()=>{const{a,u}=setup({hpd:4,hpw:20}),d=u.goal.tasks[8].date,snap=u.goal.tasks.filter(t=>t.date<d).map(t=>t.id+t.date).join();apply(a,{id:'p',from:d,to:d,ts:'18:00',te:'20:00'});assert.equal(u.goal.tasks.filter(t=>snap.includes(t.id+t.date)).length,snap.split(',').length)});
test('missed session moves later, keeps order, others before it unchanged',()=>{const{a,u}=setup(),id=u.goal.tasks[3].id,o=u.goal.tasks[3].date,b=u.goal.tasks.slice(0,3).map(t=>t.date).join();const p=apply(a,null,[id]);
assert(u.goal.tasks[3].date>o||u.goal.tasks[3].date>=o);assert(p.moved.some(m=>m.id==id&&m.why.includes('missed')));assert.equal(u.goal.tasks.slice(0,3).map(t=>t.date).join(),b);limitsOk(a,u);orderOk(a,u)});
test('overlapping/multiple leave records are all respected; reprocessing is idempotent',()=>{const{a,u}=setup(),d=u.goal.tasks[2].date;apply(a,{id:'a',from:d,to:a.add(d,4)});apply(a,{id:'b',from:a.add(d,2),to:a.add(d,8)});
u.leaves.forEach(l=>assert(!u.goal.tasks.some(t=>t.date>=l.from&&t.date<=l.to)));limitsOk(a,u);orderOk(a,u);const snap=JSON.stringify(u.goal.tasks);const again=a.propose({id:'c',from:d,to:a.add(d,4)});assert.equal(again.moved.length,0);assert.equal(JSON.stringify(u.goal.tasks),snap)});
test('prerequisite order survives heavy disruption',()=>{const{a,u}=setup({hpd:1,hpw:3,rest:[0,6]});for(let i=0;i<4;i++)apply(a,{id:'l'+i,from:u.goal.tasks[i*3].date,to:u.goal.tasks[i*3].date});limitsOk(a,u);orderOk(a,u)});
test('deadline infeasibility is detected',()=>{const{a,u}=setup();u.goal.target=a.add(a.today(),10);const p=a.propose({id:'x',from:a.add(a.today(),1),to:a.add(a.today(),5)});assert(p.newEnd>u.goal.target);assert(p.rem>0);assert(!a.feas(u).ok)});
let f=0;for(const[n,fn]of T){try{fn();console.log('PASS',n)}catch(e){f++;console.log('FAIL',n,'\n  ',e.message.split('\n')[0])}}console.log(f?`${f} failed`:'all passed');process.exit(f?1:0)
