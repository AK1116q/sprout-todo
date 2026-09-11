'use strict';
const $=s=>document.querySelector(s),canvas=$('#plant-canvas'),ctx=canvas.getContext('2d');
let state,bend=1,animation=0,frame=0,busy=false,messageUntil=0,lastCursor='',raf=0,sway=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function say(text,ms=4200){$('#bubble').textContent=text;messageUntil=Date.now()+ms;$('#bubble').classList.add('show');}
function draw(){if(!state)return;const target=state.wilted?1:0;bend=reduced?target:bend+(target-bend)*.15;if(Math.abs(target-bend)<.01)bend=target;sway=reduced?0:Math.sin(frame/18)*.55;PixelArt.flower(ctx,{...state.equipped,bend,sway,frame:frame++,watering:Date.now()<animation});if(!reduced||bend!==target||Date.now()<animation)raf=requestAnimationFrame(draw);else raf=0;}
function render(next){state=next;$('#coins').textContent=String(state.coins);$('#pending').textContent=`+${state.pendingCoins}`;$('#collect').hidden=state.pendingCoins===0;$('#stand').hidden=!state.standDue;$('#footnote').hidden=state.standDue;
 if(state.equipped.can!==lastCursor){const c=document.createElement('canvas');c.width=c.height=32;PixelArt.can(c.getContext('2d'),state.equipped.can);document.body.style.setProperty('--watering-cursor',`url("${c.toDataURL()}") 3 12, pointer`);lastCursor=state.equipped.can;}
 if(Date.now()>messageUntil){$('#bubble').textContent=!state.onboarded?'先设置一下我们的节奏吧':state.waterDue?'我有点渴，你喝水了吗？':state.standDue?'起来走走，回来告诉我吧':'喝水后，点一下给我浇水';$('#bubble').classList.toggle('show',state.waterDue||state.standDue||!state.onboarded);}
 if(!raf)draw();PixelArt.coin($('#coin-canvas').getContext('2d'));
}
$('#plant').addEventListener('click',async()=>{if(busy)return;if(!state.onboarded){await sprout.panel('welcome');return;}busy=true;try{const r=await sprout.act('water');if(!r.ok){say(r.error);return;}animation=Date.now()+1400;render(r.state);say(r.reward?'谢谢你的照顾！金币长出来啦':'咕噜咕噜，我又精神啦！');}catch{say('暂时无法浇水，请再试一次');}finally{busy=false;}});
$('#collect').addEventListener('click',async()=>{const r=await sprout.act('collect');if(r.ok){render(r.state);say(`收好啦，+${r.collected} 枚金币！`);}else say(r.error);});
$('#stand').addEventListener('click',async()=>{const r=await sprout.act('stand');if(r.ok){render(r.state);say('舒展一下，我们再慢慢继续。');}else say(r.error);});
$('#shop').addEventListener('click',()=>sprout.panel('shop'));$('#settings').addEventListener('click',()=>sprout.panel(state.onboarded?'settings':'welcome'));
document.addEventListener('contextmenu',e=>{e.preventDefault();sprout.menu();});
// Only the small visible plant and controls capture clicks; the rest passes through.
document.addEventListener('mousemove',e=>{const hit=!!e.target.closest('[data-interactive]');document.body.classList.toggle('hovered',hit);});
sprout.onState(render);sprout.get().then(render).catch(()=>say('无法载入小花，请重新启动。'));

