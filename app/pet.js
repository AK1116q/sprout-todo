'use strict';
const $=s=>document.querySelector(s),canvas=$('#plant-canvas'),ctx=canvas.getContext('2d');
let state,bend=1,animation=0,frame=0,busy=false,messageUntil=0,lastCursor='',raf=0,bob=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function say(text,ms=4200){$('#bubble').textContent=text;messageUntil=Date.now()+ms;$('#bubble').classList.add('show');}
function draw(){if(!state)return;const target=state.wilted?1:0;bend=reduced?target:bend+(target-bend)*.15;if(Math.abs(target-bend)<.01)bend=target;bob=reduced?0:Math.sin(frame/24)*.45;PixelArt.flower(ctx,{...state.equipped,bend,sway:0,bob,frame:frame++,watering:Date.now()<animation});if(!reduced||bend!==target||Date.now()<animation)raf=requestAnimationFrame(draw);else raf=0;}
function render(next){state=next;$('#coins').textContent=String(state.coins);$('#pending').textContent=`+${state.pendingCoins}`;$('#collect').hidden=state.pendingCoins===0;$('#footnote').hidden=false;
 if(state.equipped.can!==lastCursor){const c=document.createElement('canvas');c.width=c.height=32;PixelArt.can(c.getContext('2d'),state.equipped.can);document.body.style.setProperty('--watering-cursor',`url("${c.toDataURL()}") 3 12, pointer`);lastCursor=state.equipped.can;}
 if(Date.now()>messageUntil){$('#bubble').textContent=!state.onboarded?'先设置喝水提醒':state.waterDue?'我有点渴，你喝水了吗？':'这次已经浇过了，等下一次提醒';$('#bubble').classList.toggle('show',state.waterDue||!state.onboarded);}
 if(!raf)draw();PixelArt.coin($('#coin-canvas').getContext('2d'));
}
$('#plant').addEventListener('click',async()=>{if(busy)return;if(!state.onboarded){await sprout.panel('welcome');return;}busy=true;try{const r=await sprout.act('water');if(!r.ok){say(r.error);return;}animation=Date.now()+1400;render(r.state);say(r.reward?'谢谢你的照顾！金币长出来啦':'咕噜咕噜，我又精神啦！');}catch{say('暂时无法浇水，请再试一次');}finally{busy=false;}});
$('#collect').addEventListener('click',async()=>{const r=await sprout.act('collect');if(r.ok){render(r.state);say(`收好啦，+${r.collected} 枚金币！`);}else say(r.error);});
$('#shop').addEventListener('click',()=>sprout.panel('shop'));$('#settings').addEventListener('click',()=>sprout.panel(state.onboarded?'settings':'welcome'));
document.addEventListener('contextmenu',e=>{e.preventDefault();sprout.menu();});
// Keep the two top controls visible so they can be clicked without chasing a hover target.
document.addEventListener('mousemove',e=>{const hit=!!e.target.closest('[data-interactive]');document.body.classList.toggle('hovered',hit);});
sprout.onState(render);sprout.get().then(render).catch(()=>say('无法载入小花，请重新启动。'));

