/* 第 2 章演示共用：函数库、数值偏导、C–R 残差、热图、等值线（marching squares）。依赖 plane.js。 */
(function(){
"use strict";
const {C,PI,TAU}=CF;
const exp=z=>{const e=Math.exp(z.x);return{x:e*Math.cos(z.y),y:e*Math.sin(z.y)};};
const sin=z=>({x:Math.sin(z.x)*Math.cosh(z.y),y:Math.cos(z.x)*Math.sinh(z.y)});
const cos=z=>({x:Math.cos(z.x)*Math.cosh(z.y),y:-Math.sin(z.x)*Math.sinh(z.y)});
const cube=z=>C.mul(C.sq(z),z);

/* an：是否（在定义域内）解析；d：导数（解析时）；note：说明 */
const F={
  z2:{label:'z²',f:C.sq,d:z=>C.scale(z,2),an:true,u:'x² − y²',v:'2xy'},
  z3:{label:'z³',f:cube,d:z=>C.scale(C.sq(z),3),an:true,u:'x³ − 3xy²',v:'3x²y − y³'},
  inv:{label:'1/z',f:C.inv,d:z=>C.scale(C.inv(C.sq(z)),-1),an:true,u:'x/(x² + y²)',v:'−y/(x² + y²)'},
  exp:{label:'eᶻ',f:exp,d:exp,an:true,u:'eˣ cos y',v:'eˣ sin y'},
  sin:{label:'sin z',f:sin,d:cos,an:true,u:'sin x cosh y',v:'cos x sinh y'},
  lin:{label:'2x + yi',f:z=>({x:2*z.x,y:z.y}),an:false,u:'2x',v:'y'},
  conj:{label:'z̄',f:C.conj,an:false,u:'x',v:'−y'},
  abs2:{label:'|z|²',f:z=>({x:z.x*z.x+z.y*z.y,y:0}),an:false,u:'x² + y²',v:'0'},
  zre:{label:'z Re z',f:z=>({x:z.x*z.x,y:z.x*z.y}),an:false,u:'x²',v:'xy'},
  conj2:{label:'z̄²',f:z=>C.sq(C.conj(z)),an:false,u:'x² − y²',v:'−2xy'},
  xy2:{label:'x² + iy²',f:z=>({x:z.x*z.x,y:z.y*z.y}),an:false,u:'x²',v:'y²'},
};

function jac(f,z,h){
  h=h||1e-5;
  const a=f({x:z.x+h,y:z.y}),b=f({x:z.x-h,y:z.y}),c=f({x:z.x,y:z.y+h}),d=f({x:z.x,y:z.y-h});
  return{ux:(a.x-b.x)/(2*h),vx:(a.y-b.y)/(2*h),uy:(c.x-d.x)/(2*h),vy:(c.y-d.y)/(2*h)};
}
function crResidual(f,z){const J=jac(f,z);return Math.abs(J.ux-J.vy)+Math.abs(J.uy+J.vx);}

/* 颜色 */
const cc=document.createElement('canvas').getContext('2d');
function rgb(col){cc.fillStyle='#000';cc.fillStyle=col;const s=cc.fillStyle;if(s[0]==='#')return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];const m=s.match(/[\d.]+/g);return[+m[0],+m[1],+m[2]];}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

/* 热图：colorAt(p) 返回 [r,g,b]；按 sc 像素一格采样到离屏画布 */
function heat(P,colorAt,sc){
  sc=sc||3;const w=Math.ceil(P.W/sc),h=Math.ceil(P.H/sc),off=document.createElement('canvas');off.width=w;off.height=h;
  const g=off.getContext('2d'),img=g.createImageData(w,h),d=img.data;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const c=colorAt(P.toW((i+.5)*sc,(j+.5)*sc));const o=(j*w+i)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}
  g.putImageData(img,0,0);return off;
}
function blit(P,off){const c=P.ctx;c.save();c.imageSmoothingEnabled=true;c.drawImage(off,0,0,P.W,P.H);c.restore();}

/* 等值线：g(x,y) 的若干水平集，返回 [{level, segs:[[x1,y1,x2,y2],...]}]（世界坐标） */
function contours(P,g,levels,n){
  n=n||150;const b=P.bounds(),nx=n,ny=Math.max(20,Math.round(n*P.H/P.W));
  const dx=(b.x1-b.x0)/nx,dy=(b.y1-b.y0)/ny,V=new Float64Array((nx+1)*(ny+1));
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)V[j*(nx+1)+i]=g(b.x0+i*dx,b.y0+j*dy);
  const out=[];
  for(const L of levels){
    const segs=[];
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      const k=j*(nx+1)+i,v0=V[k]-L,v1=V[k+1]-L,v2=V[k+nx+2]-L,v3=V[k+nx+1]-L;
      if(!isFinite(v0)||!isFinite(v1)||!isFinite(v2)||!isFinite(v3))continue;
      const x=b.x0+i*dx,y=b.y0+j*dy,pts=[];
      const e=(a,c,xa,ya,xc,yc)=>{if((a<0)!==(c<0)){const t=a/(a-c);pts.push([xa+(xc-xa)*t,ya+(yc-ya)*t]);}};
      e(v0,v1,x,y,x+dx,y);e(v1,v2,x+dx,y,x+dx,y+dy);e(v2,v3,x+dx,y+dy,x,y+dy);e(v3,v0,x,y+dy,x,y);
      if(pts.length===2)segs.push([pts[0][0],pts[0][1],pts[1][0],pts[1][1]]);
      else if(pts.length===4){segs.push([pts[0][0],pts[0][1],pts[1][0],pts[1][1]]);segs.push([pts[2][0],pts[2][1],pts[3][0],pts[3][1]]);}
    }
    out.push({level:L,segs});
  }
  return out;
}
/* 画等值线；跳过跨度过大的线段（奇点附近） */
function drawContours(P,cs,color,lw,o){
  o=o||{};const c=P.ctx,maxLen=(o.maxLen||0.25)*Math.max(P.bounds().x1-P.bounds().x0,1);
  c.save();c.strokeStyle=color;c.lineWidth=lw||1.5;c.globalAlpha=o.alpha??1;if(o.dash)c.setLineDash(o.dash);
  c.beginPath();
  for(const l of cs)for(const s of l.segs){if(Math.hypot(s[2]-s[0],s[3]-s[1])>maxLen)continue;const A=P.toS({x:s[0],y:s[1]}),B=P.toS({x:s[2],y:s[3]});c.moveTo(A.X,A.Y);c.lineTo(B.X,B.Y);}
  c.stroke();c.restore();
}
function funcSelect(sel,keys,cur){
  keys.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent='f(z) = '+F[k].label+(F[k].an?'':'（非解析）');sel.appendChild(o);});
  sel.value=cur;
}
/* 导航栏：页面里放 <nav class="nav" id="nav"></nav> 即可 */
const NAV=[['01-difference-quotient.html','1 差商与方向'],['02-local-linear.html','2 伸缩 + 旋转'],['03-cr-heatmap.html','3 C–R 检查'],['04-orthogonal.html','4 正交曲线族'],
  ['05-exp-map.html','5 eᶻ 映射'],['06-log-branches.html','6 Ln z 分支'],['07-sine.html','7 sin z'],['08-power.html','8 aᵇ 多值']];
(function(){const el=document.getElementById('nav');if(!el)return;const here=location.pathname.split('/').pop();
  el.innerHTML='<a href="index.html">← 全部演示</a>'+NAV.map(([h,t])=>`<a href="${h}"${h===here?' aria-current="page"':''}>${t}</a>`).join('');})();
window.CF2={F,exp,sin,cos,cube,jac,crResidual,rgb,mix,heat,blit,contours,drawContours,funcSelect,NAV};
})();
