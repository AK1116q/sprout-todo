const {spawn}=require('node:child_process');
const electron=require('electron');
const child=spawn(electron,['.'],{stdio:'inherit',env:{...process.env,SPROUT_DEV:'1'}});
child.on('exit',(code,signal)=>process.exit(code??(signal?1:0)));
process.on('SIGINT',()=>child.kill('SIGINT'));

