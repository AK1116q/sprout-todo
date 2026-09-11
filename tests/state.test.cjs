const test=require('node:test');
const assert=require('node:assert/strict');
const {initial,validate,apply,view,report,CATALOG}=require('../app/state.cjs');

const now=Date.UTC(2026,0,1);
function configured(){return apply(initial(now),'settings',{waterMinutes:30,waterEnabled:true,notifications:false},now).state;}
function promptAndWater(s,at,responseDelay=2000){
  s=apply(s,'tick',{},at).state;
  return apply(s,'water',{},at+responseDelay).state;
}

test('首次设置只建立喝水提醒，未浇水时花朵低头',()=>{
  let s=initial(now);
  assert.equal(view(s,now).wilted,true);
  assert.equal(view(s,now).waterDue,false);
  s=apply(s,'settings',{waterMinutes:30,waterEnabled:true,notifications:false},now).state;
  assert.equal(s.nextWaterAt,now+30*60000);
  assert.equal(s.onboarded,true);
  assert.equal('standMinutes' in s.settings,false);
});

test('每次提醒只允许浇水一次，浇水后必须等下一次提醒',()=>{
  let s=configured(), due=now+30*60000;
  s=apply(s,'tick',{},due).state;
  assert.deepEqual(s.waterPrompts.map(p=>p.clickedAt),[null]);
  s=apply(s,'water',{},due+2000).state;
  assert.equal(s.waterings,1);
  assert.equal(s.waterPrompts[0].responseMs,2000);
  assert.equal(view(s,due+2000).wilted,false);
  assert.throws(()=>apply(s,'water',{},due+3000),/这次已经浇过了/);
  assert.equal(view(s,due+30*60000+2000).wilted,true);
});

test('每浇水三次产生五枚待领取金币，领取后不可重复领取',()=>{
  let s=configured();
  for(let i=1;i<=3;i++)s=promptAndWater(s,now+i*30*60000,1000);
  assert.equal(s.pendingCoins,5);
  assert.equal(s.coins,0);
  assert.equal(s.rewardProgress,0);
  s=apply(s,'collect',{},now+100).state;
  assert.equal(s.coins,5);
  assert.equal(s.pendingCoins,0);
  assert.throws(()=>apply(s,'collect',{},now+200),/每浇水 3 次/);
});

test('喝水报告记录提醒次数、回应时长和五分钟内回应率',()=>{
  let s=configured();
  s=promptAndWater(s,now+30*60000,2000);
  s=promptAndWater(s,now+60*60000+2000,7*60000);
  const r=report(s);
  assert.equal(r.promptCount,2);
  assert.equal(r.answeredCount,2);
  assert.equal(r.averageResponseSeconds,211);
  assert.equal(r.withinFiveMinutesRate,50);
});

test('修改提醒间隔会重置下一次提醒，不会产生久坐设置',()=>{
  let s=configured();
  s=apply(s,'settings',{waterMinutes:15,waterEnabled:true,notifications:false},now+1000).state;
  assert.equal(s.nextWaterAt,now+1000+15*60000);
  assert.deepEqual(Object.keys(s.settings).sort(),['notifications','waterEnabled','waterMinutes']);
});

test('购买和装备仍然按分类工作并校验余额',()=>{
  let s=configured();
  assert.throws(()=>apply(s,'buy',{id:'pot-cloud'},now),/金币还不够/);
  s.coins=20;validate(s);
  s=apply(s,'buy',{id:'pot-cloud'},now).state;
  assert.equal(s.equipped.pot,'pot-cloud');
  assert.equal(s.coins,10);
  s=apply(s,'buy',{id:'can-honey'},now).state;
  assert.equal(s.equipped.can,'can-honey');
});

test('旧存档会移除久坐字段并保留喝水记录',()=>{
  const old=initial(now);
  old.settings.standMinutes=50;old.settings.standEnabled=true;old.nextStandAt=now+1;old.standNotified=true;old.standCount=2;
  const migrated=validate(old);
  assert.equal('standMinutes' in migrated.settings,false);
  assert.equal('standEnabled' in migrated.settings,false);
  assert.equal('nextStandAt' in migrated,false);
  assert.equal(migrated.waterPrompts.length,0);
});

test('存档校验目录和装备关系',()=>{
  const s=configured();
  assert.doesNotThrow(()=>validate(s));
  assert.throws(()=>validate({...s,coins:-1}));
  assert.throws(()=>validate({...s,equipped:{...s.equipped,pot:'can-mint'}}));
  assert.equal(CATALOG.length,12);
  assert.equal(new Set(CATALOG.map(x=>x.id)).size,12);
});

