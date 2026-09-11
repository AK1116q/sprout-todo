'use strict';
const CATALOG = [
 {id:'pot-clay',type:'pot',name:'陶土盆',price:0,color:'#bf7855',detail:'暖暖的，像刚晒过太阳。'},
 {id:'pot-cloud',type:'pot',name:'云朵盆',price:10,color:'#c8dfdd',detail:'把一小片天空放在桌边。'},
 {id:'pot-berry',type:'pot',name:'莓果盆',price:15,color:'#b980a0',detail:'带一点甜甜的莓果色。'},
 {id:'pot-night',type:'pot',name:'星夜盆',price:20,color:'#586387',detail:'安静的小宇宙。'},
 {id:'can-mint',type:'can',name:'薄荷壶',price:0,color:'#75a89a',detail:'给小花的一口清凉。'},
 {id:'can-honey',type:'can',name:'蜂蜜壶',price:10,color:'#d6a753',detail:'把平凡的日子浇得金灿灿。'},
 {id:'can-rose',type:'can',name:'玫瑰壶',price:15,color:'#d18e9f',detail:'小小的粉色心情。'},
 {id:'can-sky',type:'can',name:'晴空壶',price:20,color:'#84accb',detail:'像晴天一样轻盈。'},
 {id:'flower-daisy',type:'flower',name:'小雏菊',price:0,color:'#fff3d1',detail:'一朵认真陪伴你的小花。'},
 {id:'flower-tulip',type:'flower',name:'郁金香',price:15,color:'#e899ab',detail:'温柔，也有向上的力量。'},
 {id:'flower-sun',type:'flower',name:'向日葵',price:0,color:'#f1c052',detail:'今天也向着光生长。'},
 {id:'flower-lavender',type:'flower',name:'薰衣草',price:25,color:'#a393d0',detail:'给忙碌的一天一点宁静。'}
];
const initialEquipment={pot:'pot-clay',can:'can-mint',flower:'flower-sun'};
const clone=s=>JSON.parse(JSON.stringify(s));
function initial(now=Date.now()){return{version:1,onboarded:false,settings:{waterMinutes:30,standMinutes:50,waterEnabled:true,standEnabled:true,notifications:true},coins:0,pendingCoins:0,waterings:0,rewardProgress:0,owned:Object.values(initialEquipment),equipped:{...initialEquipment},lastWaterAt:null,nextWaterAt:now,nextStandAt:now+50*60000,waterNotified:false,standNotified:false,standCount:0};}
function validate(s){
 if(!s||s.version!==1||typeof s.onboarded!=='boolean')throw new Error('存档版本不正确');
 for(const n of ['coins','pendingCoins','waterings','rewardProgress','standCount'])if(!Number.isSafeInteger(s[n])||s[n]<0)throw new Error('存档数值不正确');
 if(s.rewardProgress>2)throw new Error('奖励进度不正确');
 validateSettings(s.settings);
 if(!Array.isArray(s.owned)||s.owned.some(id=>!CATALOG.some(i=>i.id===id))||new Set(s.owned).size!==s.owned.length)throw new Error('收藏数据不正确');
 for(const type of ['pot','can','flower'])if(!s.owned.includes(s.equipped?.[type])||!CATALOG.some(i=>i.id===s.equipped[type]&&i.type===type))throw new Error('装扮数据不正确');
 for(const n of ['nextWaterAt','nextStandAt'])if(!Number.isFinite(s[n]))throw new Error('提醒时间不正确');
 if(s.lastWaterAt!==null&&!Number.isFinite(s.lastWaterAt))throw new Error('浇水时间不正确');
 if(typeof s.waterNotified!=='boolean'||typeof s.standNotified!=='boolean')throw new Error('提醒状态不正确');return s;
}
function validateSettings(v){if(!v)throw new Error('设置缺失');for(const k of ['waterMinutes','standMinutes'])if(!Number.isInteger(v[k])||v[k]<1||v[k]>180)throw new Error('提醒间隔需要在 1–180 分钟之间');for(const k of ['waterEnabled','standEnabled','notifications'])if(typeof v[k]!=='boolean')throw new Error('设置格式不正确');}
function apply(s,action,payload={},now=Date.now()){
 const next=clone(s);let result={};
 switch(action){
  case 'settings':{validateSettings(payload);const first=!next.onboarded;for(const [type,key] of [['Water','water'],['Stand','stand']]){if(first||next.settings[`${key}Minutes`]!==payload[`${key}Minutes`]||next.settings[`${key}Enabled`]!==payload[`${key}Enabled`]){next[`next${type}At`]=now+payload[`${key}Minutes`]*60000;next[`${key}Notified`]=false;}}next.settings={waterMinutes:payload.waterMinutes,standMinutes:payload.standMinutes,waterEnabled:payload.waterEnabled,standEnabled:payload.standEnabled,notifications:payload.notifications};next.onboarded=true;break;}
  case 'water':{if(!next.onboarded)throw new Error('先设置一下提醒时间吧');if(next.lastWaterAt!==null&&now-next.lastWaterAt<3000)throw new Error('小花正在喝水，等一下下');next.lastWaterAt=now;next.nextWaterAt=now+next.settings.waterMinutes*60000;next.waterNotified=false;next.waterings++;next.rewardProgress++;if(next.rewardProgress===3){next.rewardProgress=0;next.pendingCoins+=5;result.reward=5;}break;}
  case 'stand':{next.nextStandAt=now+next.settings.standMinutes*60000;next.standNotified=false;next.standCount++;break;}
  case 'collect':{if(next.pendingCoins===0)throw new Error('每浇水 3 次，小花会送你 5 枚金币');result.collected=next.pendingCoins;next.coins+=next.pendingCoins;next.pendingCoins=0;break;}
  case 'buy':{const item=CATALOG.find(i=>i.id===payload.id);if(!item)throw new Error('没有找到这件装扮');if(!next.owned.includes(item.id)){if(next.coins<item.price)throw new Error('金币还不够，慢慢来');next.coins-=item.price;next.owned.push(item.id);}next.equipped[item.type]=item.id;result.item=item.name;break;}
  case 'tick':{result.due=[];if(next.onboarded)for(const [type,key] of [['Water','water'],['Stand','stand']])if(next.settings[`${key}Enabled`]&&now>=next[`next${type}At`]&&!next[`${key}Notified`]){next[`${key}Notified`]=true;result.due.push(key);}break;}
  default:throw new Error('未知操作');
 }
 validate(next);return{state:next,result};
}
function view(s,now=Date.now()){return{...clone(s),catalog:CATALOG,now,wilted:s.lastWaterAt===null||(s.settings.waterEnabled&&now>=s.nextWaterAt),waterDue:s.onboarded&&s.settings.waterEnabled&&now>=s.nextWaterAt,standDue:s.onboarded&&s.settings.standEnabled&&now>=s.nextStandAt};}
module.exports={CATALOG,initial,validate,apply,view};

