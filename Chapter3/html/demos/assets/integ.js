/* 第 3 章演示共用：复函数、沿路径的数值积分、绕数、热图与等值线、导航。依赖 plane.js。 */
(function(){
"use strict";
const {C,PI,TAU}=CF;
const exp=z=>{const e=Math.exp(z.x);return{x:e*Math.cos(z.y),y:e*Math.sin(z.y)};};
const sin=z=>({x:Math.sin(z.x)*Math.cosh(z.y),y:Math.cos(z.x)*Math.sinh(z.y)});
const cos=z=>({x:Math.cos(z.x)*Math.cosh(z.y),y:-Math.sin(z.x)*Math.sinh(z.y)});
const pow=(z,n)=>{let r={x:1,y:0};const b=n<0?C.inv(z):z;for(let k=0;k<Math.abs(n);k++)r=C.mul(r,b);return r;};
const lin=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

/* ---------- 路径：z(t)，t ∈ [0,1] ---------- */
const Path={
  seg:(a,b)=>t=>lin(a,b,t),
  poly:pts=>t=>{const n=pts.length-1,s=Math.min(n-1e-12,Math.max(0,t*n)),k=Math.floor(s);return lin(pts[k],pts[k+1],s-k);},
  circle:(c,r,dir)=>t=>C.add(c,C.polar(r,(dir||1)*TAU*t)),
  quad:(a,m,b)=>t=>{const u=1-t;return{x:u*u*a.x+2*u*t*m.x+t*t*b.x,y:u*u*a.y+2*u*t*m.y+t*t*b.y};},
  /* 闭合的周期三次样条（Catmull–Rom），pts 为控制点 */
  closed:pts=>t=>{const n=pts.length,s=((t%1)+1)%1*n,k=Math.floor(s),u=s-k,P=i=>pts[((i%n)+n)%n];
    const p0=P(k-1),p1=P(k),p2=P(k+1),p3=P(k+2),u2=u*u,u3=u2*u;
    const f=(a,b,c,d)=>0.5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u2+(-a+3*b-3*c+d)*u3);
    return{x:f(p0.x,p1.x,p2.x,p3.x),y:f(p0.y,p1.y,p2.y,p3.y)};}
};
function sample(z,n){const a=[];for(let k=0;k<=n;k++)a.push(z(k/n));return a;}
function length(z,n){n=n||600;let L=0,p=z(0);for(let k=1;k<=n;k++){const q=z(k/n);L+=C.dist(p,q);p=q;}return L;}

/* 数值积分 ∫_C f dz：把路径分成 n 段，每段取中点（复合中点法），遇到奇点返回 null */
function integrate(f,z,n){
  n=n||2000;let s={x:0,y:0},p=z(0);
  for(let k=1;k<=n;k++){const q=z(k/n),m=z((k-.5)/n),v=f(m);if(!isFinite(v.x)||!isFinite(v.y))return null;s=C.add(s,C.mul(v,C.sub(q,p)));p=q;}
  return s;
}
/* 黎曼和：分点 z_k 与取点 ζ_k（mode: 'left' | 'mid' | 'right' | 'rand'） */
function riemann(f,z,n,mode,seed){
  const pts=[],terms=[];let s={x:0,y:0},rnd=seed||1;
  const rand=()=>{rnd=(rnd*16807)%2147483647;return rnd/2147483647;};
  for(let k=0;k<=n;k++)pts.push(z(k/n));
  for(let k=1;k<=n;k++){
    const u=mode==='left'?0:mode==='right'?1:mode==='rand'?rand():.5;
    const zeta=z((k-1+u)/n),dz=C.sub(pts[k],pts[k-1]),v=f(zeta),term=C.mul(v,dz);
    terms.push({zeta,dz,v,term,from:s});s=C.add(s,term);
  }
  return{pts,terms,sum:s};
}
/* 闭曲线（折线点列）绕 a 的圈数 */
function winding(pts,a){
  let w=0;for(let k=0;k<pts.length-1;k++){const p=C.sub(pts[k],a),q=C.sub(pts[k+1],a);w+=Math.atan2(p.x*q.y-p.y*q.x,p.x*q.x+p.y*q.y);}
  return Math.round(w/TAU);
}
/* 点到折线的最短距离 */
function distToPoly(pts,a){
  let d=1e9;for(let k=0;k<pts.length-1;k++){const p=pts[k],q=pts[k+1],vx=q.x-p.x,vy=q.y-p.y,L=vx*vx+vy*vy;
    let t=L?((a.x-p.x)*vx+(a.y-p.y)*vy)/L:0;t=Math.max(0,Math.min(1,t));d=Math.min(d,Math.hypot(p.x+t*vx-a.x,p.y+t*vy-a.y));}
  return d;
}

/* ---------- 显示：以 πi 为单位写复数 ---------- */
function piText(w){
  /* w ≈ (a + b i)·π，a、b 为简单分数或 √2 的倍数时给出精确写法 */
  const a=w.x/PI,b=w.y/PI,nice=v=>{
    if(Math.abs(v)<1e-6)return'0';
    for(const d of[1,2,3,4,6,8,12,16,24,32]){const k=v*d,kr=Math.round(k);if(Math.abs(k-kr)<2e-4*Math.max(1,Math.abs(k)))return(kr<0?'−':'')+Math.abs(kr)+(d>1?'/'+d:'');}
    for(const d of[1,2,4]){const k=v*d/Math.SQRT2,kr=Math.round(k);if(kr&&Math.abs(k-kr)<2e-4)return(kr<0?'−':'')+(Math.abs(kr)===1?'':Math.abs(kr))+'√2'+(d>1?'/'+d:'');}
    return null;};
  const na=nice(a),nb=nice(b);
  if(na!==null&&nb!==null){
    const term=(s,u)=>s==='1'?u:s==='−1'?'−'+u:s+u;
    if(na==='0'&&nb==='0')return'0';
    if(na==='0')return term(nb,'πi');
    if(nb==='0')return term(na,'π');
    return term(na,'π')+(nb.startsWith('−')?' − '+term(nb.slice(1),'πi'):' + '+term(nb,'πi'));
  }
  return null;
}
const r4=v=>CF.trimNum(v,4);
function numText(w){
  const x=Math.abs(w.x)<5e-5?0:w.x,y=Math.abs(w.y)<5e-5?0:w.y;
  if(y===0)return r4(x);if(x===0)return r4(y)+'i';
  return r4(x)+(y<0?' − ':' + ')+r4(Math.abs(y))+'i';
}

/* ---------- 热图、等值线（与第 2 章相同） ---------- */
const cc=document.createElement('canvas').getContext('2d');
function rgb(col){cc.fillStyle='#000';cc.fillStyle=col;const s=cc.fillStyle;if(s[0]==='#')return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];const m=s.match(/[\d.]+/g);return[+m[0],+m[1],+m[2]];}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
function heat(P,colorAt,sc){
  sc=sc||3;const w=Math.ceil(P.W/sc),h=Math.ceil(P.H/sc),off=document.createElement('canvas');off.width=w;off.height=h;
  const g=off.getContext('2d'),img=g.createImageData(w,h),d=img.data;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const c=colorAt(P.toW((i+.5)*sc,(j+.5)*sc));const o=(j*w+i)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;}
  g.putImageData(img,0,0);return off;
}
function blit(P,off){const c=P.ctx;c.save();c.imageSmoothingEnabled=true;c.drawImage(off,0,0,P.W,P.H);c.restore();}
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
function drawContours(P,cs,color,lw,o){
  o=o||{};const c=P.ctx,maxLen=(o.maxLen||0.25)*Math.max(P.bounds().x1-P.bounds().x0,1);
  c.save();c.strokeStyle=color;c.lineWidth=lw||1.5;c.globalAlpha=o.alpha??1;if(o.dash)c.setLineDash(o.dash);
  c.beginPath();
  for(const l of cs)for(const s of l.segs){if(Math.hypot(s[2]-s[0],s[3]-s[1])>maxLen)continue;const A=P.toS({x:s[0],y:s[1]}),B=P.toS({x:s[2],y:s[3]});c.moveTo(A.X,A.Y);c.lineTo(B.X,B.Y);}
  c.stroke();c.restore();
}
/* 奇点标记：空心圆圈 + 叉 */
function singular(P,p,color,label){
  const c=P.ctx,S=P.toS(p);c.save();c.strokeStyle=color;c.lineWidth=2.2;c.fillStyle=P.V.surface;
  c.beginPath();c.arc(S.X,S.Y,7,0,TAU);c.fill();c.stroke();
  c.beginPath();c.moveTo(S.X-4,S.Y-4);c.lineTo(S.X+4,S.Y+4);c.moveTo(S.X+4,S.Y-4);c.lineTo(S.X-4,S.Y+4);c.stroke();c.restore();
  if(label)P.wlabel(p,label,color,{dx:12,dy:-12,align:'left',size:15});
}
/* 沿路径画方向箭头 */
function pathArrows(P,z,color,count,lw){
  count=count||3;for(let k=1;k<=count;k++){const t=(k-.5)/count,a=z(t-0.012),b=z(t+0.012);P.arrow(a,b,color,lw||2.5);}
}

/* 导航栏：页面里放 <nav class="nav" id="nav"></nav> 即可 */
const NAV=[['01-riemann-sum.html','1 黎曼和'],['02-path-dependence.html','2 与路径有关吗'],['03-contour-deform.html','3 闭路变形'],
  ['04-cauchy-formula.html','4 柯西积分公式'],['05-harmonic.html','5 调和函数']];
(function(){const el=document.getElementById('nav');if(!el)return;const here=location.pathname.split('/').pop();
  el.innerHTML='<a href="index.html">← 全部演示</a>'+NAV.map(([h,t])=>`<a href="${h}"${h===here?' aria-current="page"':''}>${t}</a>`).join('');})();

window.CF3={exp,sin,cos,pow,lin,Path,sample,length,integrate,riemann,winding,distToPoly,piText,numText,r4,rgb,mix,heat,blit,contours,drawContours,singular,pathArrows,NAV};
})();
