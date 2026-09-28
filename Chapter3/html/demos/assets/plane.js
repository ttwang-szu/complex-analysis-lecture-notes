/* 第 1 章演示共用脚本：复数运算、数值格式化、输入解析、复平面画布与曲线图。 */
(function(){
"use strict";
const PI=Math.PI,TAU=2*PI,EPS=1e-9;

/* 嵌入模式：从 HTML 课件中打开时使用，例如 03-z-squared.html#embed&mode=lines */
const hash=new URLSearchParams(location.hash.replace(/^#/,''));
if(hash.has('embed')){
  document.documentElement.classList.add('embed');
  addEventListener('keydown',e=>{if(e.key==='Escape'){try{parent.postMessage('close-demo','*');}catch(_){}}});
}

/* ---------- 复数 ---------- */
const C={
  of:(x,y)=>({x,y}),
  add:(a,b)=>({x:a.x+b.x,y:a.y+b.y}),
  sub:(a,b)=>({x:a.x-b.x,y:a.y-b.y}),
  scale:(a,k)=>({x:a.x*k,y:a.y*k}),
  mul:(a,b)=>({x:a.x*b.x-a.y*b.y,y:a.x*b.y+a.y*b.x}),
  div:(a,b)=>{const d=b.x*b.x+b.y*b.y;return{x:(a.x*b.x+a.y*b.y)/d,y:(a.y*b.x-a.x*b.y)/d};},
  conj:a=>({x:a.x,y:-a.y}),
  abs:a=>Math.hypot(a.x,a.y),
  arg:a=>{let t=Math.atan2(Math.abs(a.y)<1e-12?0:a.y,a.x);if(t<=-PI+1e-12)t=PI;return t;},
  polar:(r,t)=>({x:r*Math.cos(t),y:r*Math.sin(t)}),
  sq:a=>({x:a.x*a.x-a.y*a.y,y:2*a.x*a.y}),
  inv:a=>{const d=a.x*a.x+a.y*a.y;return{x:a.x/d,y:-a.y/d};},
  dist:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),
  clean:a=>({x:Math.abs(a.x)<1e-12?0:a.x,y:Math.abs(a.y)<1e-12?0:a.y})
};
function principal(t){let r=t-TAU*Math.floor((t+PI)/TAU);if(Math.abs(r+PI)<1e-9)r=PI;return r;}

/* ---------- 格式化 ---------- */
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a;}
function trimNum(x,d=3){let s=x.toFixed(d);if(s.includes('.'))s=s.replace(/\.?0+$/,'');if(s==='-0')s='0';return s.replace('-','−');}
function niceReal(x){
  if(Math.abs(x)<1e-9)return'0';
  const sg=x<0?'−':'',a=Math.abs(x);
  for(let k=1;k<=6;k++){
    const M=(a*k)**2,Mr=Math.round(M);
    if(Mr>0&&Mr<=300&&Math.abs(M-Mr)<1e-7*Math.max(1,M)){
      let out=1,inn=Mr;
      for(let f=2;f*f<=inn;f++){while(inn%(f*f)===0){inn/=f*f;out*=f;}}
      const g=gcd(out,k);out/=g;const den=k/g;
      const num=inn===1?String(out):(out===1?'':out)+'√'+inn;
      return sg+num+(den>1?'/'+den:'');
    }
  }
  return sg+trimNum(a);
}
function nicePi(t){
  if(Math.abs(t)<1e-9)return'0';
  for(const d of[1,2,3,4,5,6,8,9,10,12,15,18,24]){
    const k=t*d/PI,kr=Math.round(k);
    if(Math.abs(k-kr)<1e-7){
      const g=gcd(kr,d),n=kr/g,dd=d/g,an=Math.abs(n);
      return(n<0?'−':'')+(an===1?'':an)+'π'+(dd>1?'/'+dd:'');
    }
  }
  return trimNum(t);
}
const isNicePi=t=>Math.abs(t)<1e-9||/π/.test(nicePi(t));
const angleText=t=>isNicePi(t)?nicePi(t):trimNum(t)+' rad';
const degText=t=>trimNum(t*180/PI,1)+'°';
function cplxText(z){
  const x=Math.abs(z.x)<1e-9?0:z.x,y=Math.abs(z.y)<1e-9?0:z.y;
  if(y===0)return niceReal(x);
  let ys=niceReal(Math.abs(y));
  ys=ys==='1'?'i':(ys.includes('/')?'('+ys+')i':ys+'i');
  if(x===0)return(y<0?'−':'')+ys;
  return niceReal(x)+(y<0?' − ':' + ')+ys;
}
const cplxHTML=z=>cplxText(z).replace(/i$/,'<i>i</i>');
const paren=s=>s.startsWith('−')?'('+s+')':s;

/* ---------- 输入解析：1.5、√3、sqrt(2)/2、−5π/6、pi/4 ---------- */
function parseExpr(src){
  const s=String(src).replace(/−/g,'-').replace(/[×·]/g,'*').trim();
  if(!s)throw 0;
  const toks=s.match(/\d*\.\d+|\d+|[a-zA-Z]+|π|√|[-+*/^()]|\S/g);
  let i=0;const peek=()=>toks[i],next=()=>toks[i++];
  const startsPrimary=t=>t!==undefined&&(/^[\d.]/.test(t)||/^[a-zA-Z]/.test(t)||t==='π'||t==='√'||t==='(');
  function expr(){let v=term();while(peek()==='+'||peek()==='-'){const o=next(),r=term();v=o==='+'?v+r:v-r;}return v;}
  function term(){let v=unary();for(;;){const t=peek();if(t==='*'||t==='/'){next();const r=unary();v=t==='*'?v*r:v/r;}else if(startsPrimary(t)){v*=power();}else break;}return v;}
  function unary(){const t=peek();if(t==='-'){next();return-unary();}if(t==='+'){next();return unary();}return power();}
  function power(){const b=primary();if(peek()==='^'){next();return Math.pow(b,unary());}return b;}
  function primary(){
    const t=next();if(t===undefined)throw 0;
    if(/^[\d.]/.test(t)){const v=parseFloat(t);if(!isFinite(v))throw 0;return v;}
    if(t==='π')return PI;
    if(t==='√')return Math.sqrt(power());
    if(t==='('){const v=expr();if(next()!==')')throw 0;return v;}
    const id=t.toLowerCase();
    if(id==='pi')return PI;
    const F={sqrt:Math.sqrt,sin:Math.sin,cos:Math.cos,tan:Math.tan};
    if(F[id]){if(next()!=='(')throw 0;const v=expr();if(next()!==')')throw 0;return F[id](v);}
    throw 0;
  }
  const v=expr();if(i<toks.length||!isFinite(v))throw 0;return v;
}

/* ---------- 主题 ---------- */
const MATH_FONT='"STIX Two Text","Cambria Math","Times New Roman",serif';
const MONO_FONT='ui-monospace,Consolas,"IBM Plex Mono",monospace';
const SANS_FONT='"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif';
function vars(){
  const cs=getComputedStyle(document.documentElement),g=n=>cs.getPropertyValue(n).trim();
  return{surface:g('--surface'),ink:g('--ink'),muted:g('--muted'),grid:g('--grid'),gridS:g('--grid-strong'),axis:g('--axis'),
    z1:g('--z1'),z2:g('--z2'),w:g('--w'),target:g('--target'),violet:g('--violet'),fill1:g('--fill1'),fill2:g('--fill2'),chip:g('--chip')};
}
const themeCbs=[];
function onTheme(cb){themeCbs.push(cb);}
const fireTheme=()=>themeCbs.forEach(f=>f());
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',fireTheme);
new MutationObserver(fireTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;

/* ---------- 画布基类：尺寸、HiDPI、主题、拖动 ---------- */
class Canvas2D{
  constructor(cv,o={}){
    this.cv=cv;this.ctx=cv.getContext('2d');this.o=o;this.W=0;this.H=0;this.dpr=1;
    this.aspect=o.aspect||1;this.maxVh=o.maxVh||0.8;this.minH=o.minH||260;
    new ResizeObserver(()=>{const w=cv.parentElement.getBoundingClientRect().width;if(Math.abs(w-this.W)>0.5)this.resize();}).observe(cv.parentElement);
    window.addEventListener('resize',()=>this.resize());
    onTheme(()=>this.draw());
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>this.draw());
  }
  resize(){
    const W=this.cv.parentElement.getBoundingClientRect().width;if(!W)return;
    this.W=W;this.H=Math.round(Math.min(W*this.aspect,Math.max(this.minH,window.innerHeight*this.maxVh)));
    this.dpr=window.devicePixelRatio||1;
    this.cv.width=Math.round(W*this.dpr);this.cv.height=Math.round(this.H*this.dpr);this.cv.style.height=this.H+'px';
    this.draw();
  }
  begin(){const c=this.ctx;this.V=vars();c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle=this.V.surface;c.fillRect(0,0,this.W,this.H);return c;}
  label(txt,X,Y,color,font,align,base){
    const c=this.ctx;c.save();c.font=font||('italic 600 16px '+MATH_FONT);c.textAlign=align||'center';c.textBaseline=base||'middle';
    c.lineJoin='round';c.lineWidth=5;c.strokeStyle=this.V.surface;c.strokeText(txt,X,Y);c.fillStyle=color||this.V.ink;c.fillText(txt,X,Y);c.restore();
  }
}

class Plane extends Canvas2D{
  constructor(cv,o={}){
    super(cv,o);
    this.range=o.range||4;this.center=o.center||{x:0,y:0};this.render=o.render||(()=>{});
    this.handles=[];this.drag=null;this.onEmpty=o.onEmpty||null;this.names=o.names||['Re','Im'];
    const pos=e=>{const r=cv.getBoundingClientRect();return{X:e.clientX-r.left,Y:e.clientY-r.top};};
    cv.addEventListener('pointerdown',e=>{
      const{X,Y}=pos(e),pad=e.pointerType==='mouse'?16:28;
      const h=this.hit(X,Y,pad);
      if(h){this.drag=h;h.start&&h.start();cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';e.preventDefault();return;}
      if(this.onEmpty){this.drag={empty:true};cv.setPointerCapture(e.pointerId);this.onEmpty.down&&this.onEmpty.down(this.toW(X,Y),e);e.preventDefault();}
    });
    cv.addEventListener('pointermove',e=>{
      const{X,Y}=pos(e);
      if(this.drag){
        if(this.drag.empty){this.onEmpty.move&&this.onEmpty.move(this.toW(X,Y),e);}
        else this.drag.set(this.clampW(this.toW(X,Y)));
      }else cv.style.cursor=this.hit(X,Y,16)?'grab':(this.onEmpty&&this.onEmpty.cursor||'default');
    });
    const end=()=>{if(!this.drag)return;const d=this.drag;this.drag=null;if(d.empty)this.onEmpty.up&&this.onEmpty.up();else d.end&&d.end();cv.style.cursor='default';};
    cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  }
  hit(X,Y,pad){
    let best=null,bd=1e9;
    for(const h of this.handles){if(h.enabled&&!h.enabled())continue;const P=this.toS(h.get());const d=Math.hypot(P.X-X,P.Y-Y);if(d<bd){bd=d;best=h;}}
    return bd<=pad?best:null;
  }
  addHandle(h){this.handles.push(h);return h;}
  draw(){
    if(!this.W)return;
    this.begin();
    this.ppu=Math.min(this.W,this.H)/(2*this.range+0.8);
    this.cx=this.W/2-this.center.x*this.ppu;this.cy=this.H/2+this.center.y*this.ppu;
    this.render(this);
  }
  toS(p){return{X:this.cx+p.x*this.ppu,Y:this.cy-p.y*this.ppu};}
  toW(X,Y){return{x:(X-this.cx)/this.ppu,y:(this.cy-Y)/this.ppu};}
  bounds(){const a=this.toW(0,this.H),b=this.toW(this.W,0);return{x0:a.x,y0:a.y,x1:b.x,y1:b.y};}
  clampW(p){const b=this.bounds(),m=0.1;return{x:Math.max(b.x0+m,Math.min(b.x1-m,p.x)),y:Math.max(b.y0+m,Math.min(b.y1-m,p.y))};}
  grid(o={}){
    const c=this.ctx,V=this.V,b=this.bounds(),r=this.range;
    const step=o.step||(r<=2?0.5:1),lab=o.labStep||(r<=4?1:(r<=8?2:5));
    c.lineWidth=1;
    for(let x=Math.ceil(b.x0/step)*step;x<=b.x1;x+=step){const X=Math.round(this.cx+x*this.ppu)+.5;c.strokeStyle=Math.abs(x-Math.round(x))<1e-9?V.gridS:V.grid;c.beginPath();c.moveTo(X,0);c.lineTo(X,this.H);c.stroke();}
    for(let y=Math.ceil(b.y0/step)*step;y<=b.y1;y+=step){const Y=Math.round(this.cy-y*this.ppu)+.5;c.strokeStyle=Math.abs(y-Math.round(y))<1e-9?V.gridS:V.grid;c.beginPath();c.moveTo(0,Y);c.lineTo(this.W,Y);c.stroke();}
    c.strokeStyle=V.axis;c.lineWidth=1.5;c.beginPath();c.moveTo(0,this.cy);c.lineTo(this.W,this.cy);c.moveTo(this.cx,0);c.lineTo(this.cx,this.H);c.stroke();
    if(o.labels!==false){
      c.save();c.fillStyle=V.muted;c.font='12px '+MONO_FONT;c.textAlign='center';c.textBaseline='top';
      for(let x=Math.ceil(b.x0/lab)*lab;x<=b.x1;x+=lab){if(Math.abs(x)<1e-9)continue;c.fillText(trimNum(x,2),this.cx+x*this.ppu,this.cy+5);}
      c.textAlign='right';c.textBaseline='middle';
      for(let y=Math.ceil(b.y0/lab)*lab;y<=b.y1;y+=lab){if(Math.abs(y)<1e-9)continue;const t=Math.abs(y-1)<1e-9?'i':Math.abs(y+1)<1e-9?'−i':trimNum(y,2)+'i';c.fillText(t,this.cx-6,this.cy-y*this.ppu);}
      c.textBaseline='top';c.fillText('0',this.cx-5,this.cy+5);
      c.font='italic 15px '+MATH_FONT;c.textAlign='right';c.textBaseline='bottom';c.fillText(this.names[0],this.W-8,this.cy-4);
      c.textAlign='left';c.textBaseline='top';c.fillText(this.names[1],this.cx+8,34);
      c.restore();
    }
    if(o.unit!==false)this.circle({x:0,y:0},1,V.gridS,1.25,[3,5]);
  }
  line(p0,p1,color,lw,dash,alpha){const c=this.ctx,A=this.toS(p0),B=this.toS(p1);c.save();c.globalAlpha=alpha??1;c.strokeStyle=color;c.lineWidth=lw||1.5;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(A.X,A.Y);c.lineTo(B.X,B.Y);c.stroke();c.restore();}
  /* pts 中的 null 表示断开；跨度过大的相邻点也断开（避免无穷远处连线） */
  path(pts,color,lw,o={}){
    const c=this.ctx;c.save();c.globalAlpha=o.alpha??1;c.strokeStyle=color;c.lineWidth=lw||2;c.lineJoin='round';c.lineCap='round';if(o.dash)c.setLineDash(o.dash);
    c.beginPath();let pen=false,prev=null;const jump=o.jump||Math.max(this.W,this.H)*2;
    for(const p of pts){
      if(!p||!isFinite(p.x)||!isFinite(p.y)){pen=false;prev=null;continue;}
      const P=this.toS(p);
      if(pen&&prev&&Math.hypot(P.X-prev.X,P.Y-prev.Y)>jump)pen=false;
      if(Math.abs(P.X)>1e5||Math.abs(P.Y)>1e5){pen=false;prev=null;continue;}
      pen?c.lineTo(P.X,P.Y):c.moveTo(P.X,P.Y);pen=true;prev=P;
    }
    if(o.close)c.closePath();
    if(o.fill){c.fillStyle=o.fill;c.fill();}
    if(lw!==0)c.stroke();c.restore();
  }
  fillPoly(pts,fill){const c=this.ctx;c.save();c.fillStyle=fill;c.beginPath();pts.forEach((p,i)=>{const P=this.toS(p);i?c.lineTo(P.X,P.Y):c.moveTo(P.X,P.Y);});c.closePath();c.fill();c.restore();}
  circle(ctr,r,color,lw,dash,alpha){const c=this.ctx,P=this.toS(ctr);c.save();c.globalAlpha=alpha??1;c.strokeStyle=color;c.lineWidth=lw||1.5;if(dash)c.setLineDash(dash);c.beginPath();c.arc(P.X,P.Y,Math.abs(r)*this.ppu,0,TAU);c.stroke();c.restore();}
  arrow(p0,p1,color,lw,o={}){
    const c=this.ctx,A=this.toS(p0),B=this.toS(p1),dx=B.X-A.X,dy=B.Y-A.Y,L=Math.hypot(dx,dy);
    if(L<1.5)return;
    c.save();c.globalAlpha=o.alpha??1;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=lw||2.5;c.lineCap='round';
    const ux=dx/L,uy=dy/L,h=Math.min(11+(lw||2.5)*1.6,L*0.45);
    if(o.dash)c.setLineDash(o.dash);
    c.beginPath();c.moveTo(A.X,A.Y);o.noHead?c.lineTo(B.X,B.Y):c.lineTo(B.X-ux*h*0.7,B.Y-uy*h*0.7);c.stroke();c.setLineDash([]);
    if(!o.noHead){c.beginPath();c.moveTo(B.X,B.Y);c.lineTo(B.X-ux*h-uy*h*0.42,B.Y-uy*h+ux*h*0.42);c.lineTo(B.X-ux*h+uy*h*0.42,B.Y-uy*h-ux*h*0.42);c.closePath();c.fill();}
    c.restore();
  }
  /* 以 ctr（世界坐标）为圆心、rpx 像素为半径，从角 a0 逆时针（a1>a0）画到 a1 */
  arc(ctr,rpx,a0,a1,color,o={}){
    if(Math.abs(a1-a0)<1e-4||rpx<3)return;
    const c=this.ctx,P=this.toS(ctr);
    c.save();c.globalAlpha=o.alpha??1;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=o.lw||1.75;if(o.dash)c.setLineDash(o.dash);
    c.beginPath();c.arc(P.X,P.Y,rpx,-a0,-a1,a1>a0);c.stroke();c.setLineDash([]);
    if(o.head&&Math.abs(a1-a0)*rpx>14){
      const s=Math.sign(a1-a0),X=P.X+rpx*Math.cos(a1),Y=P.Y-rpx*Math.sin(a1),tx=-Math.sin(a1)*s,ty=-Math.cos(a1)*s,nx=-ty,ny=tx,h=10;
      c.beginPath();c.moveTo(X,Y);c.lineTo(X-tx*h+nx*h*.42,Y-ty*h+ny*h*.42);c.lineTo(X-tx*h-nx*h*.42,Y-ty*h-ny*h*.42);c.closePath();c.fill();
    }
    c.restore();
  }
  dot(p,color,r,ring){
    const c=this.ctx,P=this.toS(p);c.save();
    if(ring){c.beginPath();c.arc(P.X,P.Y,r+5,0,TAU);c.strokeStyle=color;c.globalAlpha=.35;c.lineWidth=2;c.stroke();c.globalAlpha=1;}
    c.beginPath();c.arc(P.X,P.Y,r||6,0,TAU);c.fillStyle=color;c.fill();c.lineWidth=2.5;c.strokeStyle=this.V.surface;c.stroke();c.restore();
  }
  endLabel(p,txt,color,size,dist){
    const P=this.toS(p),L=Math.hypot(p.x,p.y);const ux=L>EPS?p.x/L:0.7,uy=L>EPS?-p.y/L:-0.7,d=dist||20;
    this.label(txt,P.X+ux*d,P.Y+uy*d,color,'italic 600 '+(size||17)+'px '+MATH_FONT);
  }
  wlabel(p,txt,color,o={}){const P=this.toS(p);this.label(txt,P.X+(o.dx||0),P.Y+(o.dy||0),color,o.font||('italic 600 '+(o.size||16)+'px '+MATH_FONT),o.align,o.base);}
}

/* ---------- 简单曲线图（横轴 t，纵轴 y） ---------- */
class Chart extends Canvas2D{
  constructor(cv,o={}){super(cv,Object.assign({aspect:0.42,maxVh:0.35,minH:170},o));this.render=o.render||(()=>{});this.pad=o.pad||{l:52,r:14,t:14,b:30};}
  draw(){if(!this.W)return;this.begin();this.render(this);}
  setScale(x0,x1,y0,y1){this.x0=x0;this.x1=x1;this.y0=y0;this.y1=y1;}
  X(x){const p=this.pad;return p.l+(x-this.x0)/(this.x1-this.x0)*(this.W-p.l-p.r);}
  Y(y){const p=this.pad;return this.H-p.b-(y-this.y0)/(this.y1-this.y0)*(this.H-p.t-p.b);}
  axes(o={}){
    const c=this.ctx,V=this.V,p=this.pad;
    c.save();c.lineWidth=1;c.font='12px '+MONO_FONT;c.fillStyle=V.muted;
    (o.yticks||[]).forEach(t=>{const Y=Math.round(this.Y(t.v))+.5;c.strokeStyle=t.strong?V.gridS:V.grid;c.beginPath();c.moveTo(p.l,Y);c.lineTo(this.W-p.r,Y);c.stroke();c.textAlign='right';c.textBaseline='middle';c.font=(t.math?'15px '+MATH_FONT:'12px '+MONO_FONT);c.fillText(t.t,p.l-6,Y);});
    (o.xticks||[]).forEach(t=>{const X=Math.round(this.X(t.v))+.5;c.strokeStyle=V.grid;c.beginPath();c.moveTo(X,p.t);c.lineTo(X,this.H-p.b);c.stroke();c.textAlign='center';c.textBaseline='top';c.font='12px '+MONO_FONT;c.fillText(t.t,X,this.H-p.b+5);});
    c.strokeStyle=V.axis;c.lineWidth=1.25;c.beginPath();c.moveTo(p.l,p.t);c.lineTo(p.l,this.H-p.b);c.lineTo(this.W-p.r,this.H-p.b);c.stroke();
    if(o.xname){c.font='12.5px '+SANS_FONT;c.textAlign='right';c.textBaseline='bottom';c.fillText(o.xname,this.W-p.r,this.H-p.b-3);}
    c.restore();
  }
  series(pts,color,lw,o={}){
    const c=this.ctx;c.save();c.strokeStyle=color;c.lineWidth=lw||2;c.lineJoin='round';c.globalAlpha=o.alpha??1;if(o.dash)c.setLineDash(o.dash);
    c.beginPath();let pen=false;
    for(const p of pts){if(!p||!isFinite(p.y)){pen=false;continue;}const X=this.X(p.x),Y=this.Y(p.y);pen?c.lineTo(X,Y):c.moveTo(X,Y);pen=true;}
    c.stroke();c.restore();
  }
  hline(y,color,lw,dash,alpha){const c=this.ctx,Y=this.Y(y);c.save();c.globalAlpha=alpha??1;c.strokeStyle=color;c.lineWidth=lw||1;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(this.pad.l,Y);c.lineTo(this.W-this.pad.r,Y);c.stroke();c.restore();}
  pdot(x,y,color,r){const c=this.ctx;c.save();c.beginPath();c.arc(this.X(x),this.Y(y),r||4.5,0,TAU);c.fillStyle=color;c.fill();c.lineWidth=2;c.strokeStyle=this.V.surface;c.stroke();c.restore();}
}

/* ---------- 小工具 ---------- */
const $=s=>document.querySelector(s);
function bindRange(id,fmt,cb){const el=$(id),out=$(id+'-out');const up=()=>{if(out)out.textContent=fmt(+el.value);cb(+el.value);};el.addEventListener('input',up);up();return{el,set(v){el.value=v;up();}};}
function bindSeg(name,cb){document.querySelectorAll('input[name="'+name+'"]').forEach(r=>r.addEventListener('change',()=>{if(r.checked)cb(r.value);}));}
function setSeg(name,v){const r=document.querySelector('input[name="'+name+'"][value="'+v+'"]');if(r)r.checked=true;}
/* 逐帧动画：dur 毫秒，step(t∈[0,1])，done() */
function animate(dur,step,done){
  let raf=0,stopped=false;const t0=performance.now(),D=reduceMotion?1:dur;
  const f=now=>{if(stopped)return;const t=Math.min(1,(now-t0)/D);step(t);if(t<1)raf=requestAnimationFrame(f);else{raf=0;done&&done();}};
  raf=requestAnimationFrame(f);
  return{stop(){stopped=true;if(raf)cancelAnimationFrame(raf);}};
}

window.CF={hash,PI,TAU,EPS,C,principal,gcd,trimNum,niceReal,nicePi,isNicePi,angleText,degText,cplxText,cplxHTML,paren,parseExpr,
  MATH_FONT,MONO_FONT,SANS_FONT,vars,onTheme,reduceMotion,ease,Plane,Chart,$,bindRange,bindSeg,setSeg,animate};
})();
