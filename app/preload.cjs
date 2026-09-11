const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sprout',Object.freeze({
 get:()=>ipcRenderer.invoke('sprout:get'),
 act:(action,payload)=>ipcRenderer.invoke('sprout:act',action,payload),
 panel:page=>ipcRenderer.invoke('sprout:panel',page),
 closePanel:()=>ipcRenderer.send('sprout:close-panel'),
 menu:()=>ipcRenderer.send('sprout:menu'),
 onState:callback=>{const listener=(_event,state)=>callback(state);ipcRenderer.on('sprout:state',listener);return()=>ipcRenderer.removeListener('sprout:state',listener);},
 onPage:callback=>{const listener=(_event,page)=>callback(page);ipcRenderer.on('sprout:page',listener);return()=>ipcRenderer.removeListener('sprout:page',listener);}
}));

