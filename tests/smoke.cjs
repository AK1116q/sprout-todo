const {app,screen}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
process.env.SPROUT_SMOKE_TEST='1';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sprout-smoke-'));app.setPath('userData',temp);
const {initial}=require('../app/state.cjs');let seed=initial();seed.onboarded=true;seed.coins=100;fs.writeFileSync(path.join(temp,'garden.json'),JSON.stringify(seed));
const main=require('../app/main.cjs');const pause=ms=>new Promise(r=>setTimeout(r,ms));const errors=[];
(async()=>{await main.ready;const pet=main.getPet();pet.webContents.on('console-message',(_event,details)=>{if(details.level==='error')errors.push(details.message);});await pause(300);
 assert.equal(pet.isAlwaysOnTop(),true);assert.deepEqual(pet.getSize(),[184,218]);const bounds=pet.getBounds(),area=screen.getPrimaryDisplay().workArea;assert.ok(bounds.x+bounds.width<=area.x+area.width);assert.ok(bounds.y+bounds.height<=area.y+area.height);
 const before=await pet.webContents.executeJavaScript('window.sprout.get()');assert.equal(before.wilted,true);
 await pet.webContents.executeJavaScript('document.querySelector("#plant").click()');await pause(1600);
 const after=await pet.webContents.executeJavaScript('window.sprout.get()');assert.equal(after.waterings,1);assert.equal(after.wilted,false);
 const cursor=await pet.webContents.executeJavaScript('document.body.style.getPropertyValue("--watering-cursor")');assert.ok(cursor.includes('data:image/png'));
 const output=process.env.SPROUT_QA_DIR;if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'pet-healthy.png'),(await pet.webContents.capturePage()).toPNG());}
 main.openPanel('shop');let panel=main.getPanel();await new Promise(r=>panel.webContents.once('did-finish-load',r));await pause(300);
 assert.equal(await panel.webContents.executeJavaScript('document.querySelectorAll(".item").length'),4);
 await panel.webContents.executeJavaScript('document.querySelector("[data-item=pot-cloud]").click()');await pause(200);assert.equal(main.getState().equipped.pot,'pot-cloud');assert.equal(main.getState().coins,90);
 await panel.webContents.executeJavaScript('document.querySelector("[data-type=can]").click();document.querySelector("[data-item=can-honey]").click()');await pause(200);assert.equal(main.getState().equipped.can,'can-honey');assert.equal(main.getState().coins,80);
 await panel.webContents.executeJavaScript('document.querySelector("[data-type=flower]").click();document.querySelector("[data-item=flower-tulip]").click()');await pause(200);assert.equal(main.getState().equipped.flower,'flower-tulip');assert.equal(main.getState().coins,65);
 if(output)fs.writeFileSync(path.join(output,'shop.png'),(await panel.webContents.capturePage()).toPNG());
 main.openPanel('settings');await pause(150);await panel.webContents.executeJavaScript('document.querySelector("#water-minutes").value="15";document.querySelector("#stand-minutes").value="45";document.querySelector("#settings-form").requestSubmit()');await pause(200);assert.equal(main.getState().settings.waterMinutes,15);assert.equal(main.getState().settings.standMinutes,45);
 const saved=JSON.parse(fs.readFileSync(path.join(temp,'garden.json'),'utf8'));assert.equal(saved.equipped.flower,'flower-tulip');assert.equal(saved.coins,65);
 main.openPanel('welcome');panel=main.getPanel();await new Promise(r=>panel.webContents.once('did-finish-load',r));await pause(200);if(output)fs.writeFileSync(path.join(output,'welcome.png'),(await panel.webContents.capturePage()).toPNG());
 assert.deepEqual(errors,[]);console.log('PASS: native transparent pet, corner placement, watering recovery, custom cursor, all shop categories, settings IPC, persistent save.');app.exit(0);
})().catch(error=>{console.error(error);app.exit(1);});

