'use strict';
const {app,BrowserWindow,ipcMain,screen,Tray,Menu,Notification,nativeImage,powerMonitor,dialog}=require('electron');
const path=require('node:path'),fs=require('node:fs');
const {initial,validate,apply,view}=require('./state.cjs');
let pet,panel,tray,state,savePath,timer,readyResolve;const ready=new Promise(r=>readyResolve=r);
const testing=process.env.SPROUT_SMOKE_TEST==='1';
app.setName('Sprout');app.setAppUserModelId('com.ak1116q.sprout');
function load(){try{state=validate(JSON.parse(fs.readFileSync(savePath,'utf8')));}catch(error){state=initial();if(error.code!=='ENOENT'){const backup=savePath+`.corrupt-${Date.now()}`;try{fs.copyFileSync(savePath,backup);}catch{}if(!testing)dialog.showMessageBox({type:'warning',message:'原存档无法读取，已尝试保留备份。',detail:'小芽会从新花园开始。你可以在系统托盘菜单中打开存档文件夹。'});}}}
function save(next){fs.mkdirSync(path.dirname(savePath),{recursive:true});const temp=savePath+'.tmp';fs.writeFileSync(temp,JSON.stringify(next,null,2),'utf8');fs.renameSync(temp,savePath);state=next;}
function broadcast(){const snapshot=view(state);for(const w of [pet,panel])if(w&&!w.isDestroyed())w.webContents.send('sprout:state',snapshot);}
function action(type,payload){try{const change=apply(state,type,payload);if(JSON.stringify(change.state)!==JSON.stringify(state))save(change.state);broadcast();return{ok:true,...change.result,state:view(state)};}catch(error){return{ok:false,error:error.code?'无法保存进度，请检查磁盘空间和文件夹权限。':error.message};}}
function secure(w){w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());w.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));}
function watchDev(){if(process.env.SPROUT_DEV!=='1')return;let pending;fs.watch(__dirname,{recursive:true},(_event,filename)=>{if(!filename||filename.endsWith('.log'))return;clearTimeout(pending);pending=setTimeout(()=>{for(const w of [pet,panel])if(w&&!w.isDestroyed())w.webContents.reload();},180);});}
function petHome(){const area=screen.getPrimaryDisplay().workArea;pet.setPosition(area.x+area.width-204,area.y+area.height-238);}
function clampPet(){if(!pet||pet.isDestroyed())return;const b=pet.getBounds(),a=screen.getDisplayMatching(b).workArea;pet.setPosition(Math.max(a.x,Math.min(b.x,a.x+a.width-b.width)),Math.max(a.y,Math.min(b.y,a.y+a.height-b.height)));}
function showPet(){if(pet&&!pet.isDestroyed()){pet.showInactive();pet.setAlwaysOnTop(true,'floating');}}
function openPanel(page='settings'){
 if(!['settings','shop','report','welcome'].includes(page))throw new Error('未知面板');
 if(panel&&!panel.isDestroyed()){panel.webContents.send('sprout:page',page);panel.show();panel.focus();return;}
 const area=screen.getDisplayMatching(pet.getBounds()).workArea,b=pet.getBounds(),width=378,height=536;
 const x=page==='welcome'?Math.round(area.x+(area.width-width)/2):Math.max(area.x,Math.min(b.x-width-8,area.x+area.width-width));
 const y=page==='welcome'?Math.round(area.y+(area.height-height)/2):Math.max(area.y,Math.min(b.y+b.height-height,area.y+area.height-height));
 panel=new BrowserWindow({width,height,x,y,show:false,frame:false,resizable:false,maximizable:false,fullscreenable:false,skipTaskbar:true,alwaysOnTop:true,backgroundColor:'#f6f3e9',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 secure(panel);panel.loadFile(path.join(__dirname,'panel.html'),{query:{page}});panel.once('ready-to-show',()=>{if(!testing)panel.show();});panel.on('closed',()=>{panel=null;});
}
function menu(){return Menu.buildFromTemplate([{label:'小芽 · Sprout',enabled:false},{type:'separator'},{label:'显示小芽',click:showPet},{label:'移回屏幕右下角',click:()=>{petHome();showPet();}},{label:'小小商店',click:()=>openPanel('shop')},{label:'提醒设置',click:()=>openPanel('settings')},{label:'喝水报告',click:()=>openPanel('report')},{type:'separator'},{label:'暂时隐藏',click:()=>pet.hide()},{label:'打开存档文件夹',click:()=>require('electron').shell.openPath(app.getPath('userData'))},{label:'退出小芽',click:()=>app.quit()}]);}
function tick(){const result=action('tick');if(!result.ok)return;for(const kind of result.due||[]){showPet();if(kind==='water'&&state.settings.notifications&&Notification.isSupported()&&!testing){const note=new Notification({title:'小芽有点渴了',body:'先喝口水，再点一下小花，给它浇水。',icon:path.join(__dirname,'../assets/icon.svg'),silent:true});note.on('click',showPet);note.show();}}}
function trusted(event){return [pet,panel].some(w=>w&&!w.isDestroyed()&&w.webContents===event.sender);}
function register(){
 ipcMain.handle('sprout:get',e=>{if(!trusted(e))throw new Error('Unknown sender');return view(state);});
 ipcMain.handle('sprout:act',(e,type,payload)=>{if(!trusted(e)||!['settings','water','collect','buy'].includes(type))return{ok:false,error:'操作不可用'};const result=action(type,payload);if(result.ok&&type==='settings'){if(panel&&!panel.isDestroyed())panel.close();showPet();}return result;});
 ipcMain.handle('sprout:panel',(e,page)=>{if(trusted(e))openPanel(page);});
 ipcMain.on('sprout:close-panel',e=>{if(panel&&e.sender===panel.webContents)panel.close();});
 ipcMain.on('sprout:menu',e=>{if(trusted(e))menu().popup({window:pet});});
}
async function boot(){
 savePath=path.join(app.getPath('userData'),'garden.json');load();
 pet=new BrowserWindow({width:184,height:218,show:false,frame:false,transparent:true,hasShadow:false,resizable:false,maximizable:false,minimizable:false,fullscreenable:false,skipTaskbar:true,alwaysOnTop:true,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:true}});
 secure(pet);petHome();pet.setAlwaysOnTop(true,'floating');pet.setIgnoreMouseEvents(false);register();await pet.loadFile(path.join(__dirname,'pet.html'));if(!testing)pet.showInactive();pet.on('moved',clampPet);watchDev();
 const icon=nativeImage.createFromPath(path.join(__dirname,'../assets/icon.svg'));tray=new Tray(icon.resize({width:20,height:20}));tray.setToolTip('小芽 · 喝水后点小花浇水');tray.setContextMenu(menu());tray.on('double-click',showPet);
 screen.on('display-metrics-changed',clampPet);screen.on('display-removed',clampPet);powerMonitor.on('resume',tick);
 timer=setInterval(tick,1000);if(!state.onboarded&&!testing)openPanel('welcome');tick();readyResolve();
}
if(!testing&&!app.requestSingleInstanceLock())app.quit();else{app.on('second-instance',()=>{showPet();if(!state?.onboarded)openPanel('welcome');});app.whenReady().then(boot).catch(error=>{console.error(error);app.exit(1);});}
app.on('window-all-closed',()=>{});app.on('before-quit',()=>{clearInterval(timer);tray?.destroy();});
module.exports={ready,getPet:()=>pet,getPanel:()=>panel,getState:()=>state,action,openPanel};

