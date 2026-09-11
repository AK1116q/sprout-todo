/* Hand-authored pixel sprites, drawn on a 64 × 64 grid. No network assets. */
(function(root){
 const palette={ink:'#3d5038',stem:'#5b8553',light:'#8dad64'};
 function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
 function line(c,x0,y0,x1,y1,color,width=2){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;for(;;){box(c,x0,y0,width,width,color);if(x0===x1&&y0===y1)break;const e=2*err;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}}}
 function pot(c,id='pot-clay',x=22,y=42){const colors={'pot-clay':['#b76b48','#d39164','#e8ae80'],'pot-cloud':['#9cbfc2','#cee3de','#f0f4df'],'pot-berry':['#9d6584','#c58ba5','#e5b4c4'],'pot-night':['#3f4b70','#626e92','#8d99b6']},p=colors[id]||colors['pot-clay'];box(c,x,y,21,4,palette.ink);box(c,x+1,y+1,19,2,p[2]);box(c,x+2,y+4,17,13,palette.ink);box(c,x+3,y+4,15,11,p[1]);box(c,x+3,y+4,3,10,p[2]);box(c,x+15,y+4,3,11,p[0]);box(c,x+5,y+15,11,2,palette.ink);box(c,x+7,y+7,2,2,palette.ink);box(c,x+13,y+7,2,2,palette.ink);box(c,x+10,y+10,2,1,palette.ink);if(id==='pot-night'){box(c,x+4,y+6,1,2,'#f8d67d');box(c,x+3,y+7,3,1,'#f8d67d');}if(id==='pot-cloud'){box(c,x+5,y+12,4,1,'#edf4ec');box(c,x+6,y+11,2,1,'#edf4ec');}}
 function bloom(c,x,y,type,wilt){const edge=wilt?'#a19566':'#e9dca7',white=wilt?'#d8c795':'#fff9dc';
 if(type==='flower-tulip'){box(c,x-6,y-7,3,9,wilt?'#b17d82':'#ce728c');box(c,x+3,y-7,3,9,wilt?'#b17d82':'#ce728c');box(c,x-3,y-5,6,10,wilt?'#c58d8c':'#e99dac');box(c,x-4,y-3,8,6,wilt?'#b78380':'#e9a2ac');box(c,x-3,y+5,6,2,palette.stem);box(c,x-4,y-4,2,6,wilt?'#d2a394':'#ffd0cc');
 }else if(type==='flower-lavender'){for(let n=0;n<4;n++){const yy=y-n*3;box(c,x-(n%2?3:1),yy,4,3,wilt?'#9b8b9d':'#9d8bc3');box(c,x-(n%2?2:0),yy,2,1,wilt?'#b2a1b1':'#c9bde7');}box(c,x,y-13,2,2,wilt?'#a99aac':'#b1a0d8');
 }else{const sun=type==='flower-sun',p=sun?(wilt?'#bea365':'#f0be48'):white;box(c,x-3,y-9,7,7,edge);box(c,x-3,y+3,7,7,edge);box(c,x-9,y-3,7,7,edge);box(c,x+3,y-3,7,7,edge);box(c,x-2,y-8,5,6,p);box(c,x-2,y+3,5,6,p);box(c,x-8,y-2,6,5,p);box(c,x+3,y-2,6,5,p);if(sun){box(c,x-6,y-6,4,4,p);box(c,x+3,y-6,4,4,p);box(c,x-6,y+3,4,4,p);box(c,x+3,y+3,4,4,p);}box(c,x-3,y-3,7,7,sun?'#8a643d':'#d2a846');box(c,x-2,y-2,5,5,sun?'#b18440':'#f1ce63');box(c,x-1,y-1,2,2,sun?'#dbac4f':'#ffe59b');if(sun&&!wilt){box(c,x-2,y-1,1,2,'#3e4b2e');box(c,x+2,y-1,1,2,'#3e4b2e');box(c,x-1,y+2,3,1,'#3e4b2e');}}
 }
 function flower(c,{pot:potId='pot-clay',flower:type='flower-daisy',bend=0,sway=0,frame=0,watering=false}={}){
 c.clearRect(0,0,64,64);box(c,19,60,28,2,'#31412e24');box(c,23,61,20,1,'#31412e16');const x=32+Math.round(13*bend+sway),y=16+Math.round(15*bend),midX=32+Math.round(3*bend+sway/2),midY=29;
 line(c,32,43,midX,midY,palette.ink,3);line(c,midX,midY,x,y,palette.ink,3);line(c,33,42,midX+1,midY,palette.stem,1);line(c,midX+1,midY,x+1,y,palette.light,1);
 const leafY=31+Math.round(bend*6);line(c,32,leafY+5,24,leafY,palette.stem,3);box(c,22,leafY-1,6,3,bend>.5?'#929d63':'#8cac64');box(c,24,leafY+2,5,2,palette.stem);line(c,34,37,40,34+Math.round(bend*3),palette.stem,3);box(c,39,32+Math.round(bend*4),6,3,bend>.5?'#929d63':'#8cac64');
 bloom(c,x,y,type,bend>.6);pot(c,potId);
 if(watering){for(let n=0;n<5;n++){const dy=(frame*2+n*9)%32;box(c,24+n*4,8+dy,1,3,'#8ac1cf');box(c,24+n*4,8+dy,1,1,'#d5f0e8');}if(frame%8<4){box(c,14,28,1,5,'#e8c668');box(c,12,30,5,1,'#e8c668');box(c,49,17,1,5,'#e8c668');box(c,47,19,5,1,'#e8c668');}}
 }
 function can(c,id='can-mint',size=32){c.clearRect(0,0,size,size);const color={'can-mint':'#78a99c','can-honey':'#d4a557','can-rose':'#d59baa','can-sky':'#8ab7d1'}[id]||'#78a99c';box(c,9,13,13,12,palette.ink);box(c,10,14,11,10,color);box(c,11,15,3,8,'#ffffff55');box(c,12,10,8,3,palette.ink);box(c,14,8,4,2,palette.ink);box(c,22,14,5,3,palette.ink);box(c,25,15,3,8,palette.ink);box(c,22,22,5,3,palette.ink);line(c,9,19,4,12,palette.ink,4);line(c,9,18,5,12,color,2);box(c,2,10,6,3,palette.ink);box(c,1,9,2,4,color);box(c,2,15,1,3,'#8bc9d3');box(c,5,17,1,3,'#8bc9d3');}
 function coin(c,frame=0){c.clearRect(0,0,32,32);box(c,10,3,12,26,'#926437');box(c,5,8,22,16,'#926437');box(c,8,5,16,22,'#e2b24f');box(c,6,9,20,14,'#e2b24f');box(c,10,7,12,18,'#f8d679');box(c,14,9,4,14,'#c2913e');box(c,13,10,2,3,'#ffecad');if(frame%8<4){box(c,25,2,2,6,'#fff0b7');box(c,23,4,6,2,'#fff0b7');}}
 const api={flower,pot,can,coin};if(typeof module==='object'&&module.exports)module.exports=api;else root.PixelArt=api;
})(typeof window==='undefined'?globalThis:window);

