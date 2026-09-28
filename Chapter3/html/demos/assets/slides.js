/* HTML 课件：翻页、分步显示、公式渲染、嵌入交互演示。
   键盘：→ / 空格 / PageDown 下一步；← / PageUp 上一步；Home / End；F 全屏；数字 + 回车跳页；Esc 关闭演示。 */
(function(){
"use strict";
const deck=document.querySelector('.deck');
const slides=[...deck.querySelectorAll('.slide')];
const N=slides.length;
const chapter=deck.dataset.chapter||'',defaultSection=deck.dataset.section||'';

/* ---------- 公式 ---------- */
if(window.renderMathInElement){
  renderMathInElement(deck,{
    delimiters:[{left:'\\[',right:'\\]',display:true},{left:'$$',right:'$$',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],
    macros:{'\\Arg':'\\operatorname{Arg}','\\Ln':'\\operatorname{Ln}','\\abs':'\\left\\lvert #1\\right\\rvert','\\dif':'\\mathop{}\\!\\mathrm{d}','\\wideparen':'\\overgroup{#1}'},
    throwOnError:false
  });
}

/* ---------- 页眉、页码 ---------- */
slides.forEach((s,i)=>{
  const hd=document.createElement('div');hd.className='hd';
  hd.innerHTML=`<div class="bar1"><span>${chapter}</span><span></span></div><div class="bar2">${s.dataset.section||defaultSection||'&nbsp;'}</div>`;
  s.prepend(hd);
  const pn=document.createElement('div');pn.className='pn';pn.textContent=`${(+deck.dataset.offset||0)+i+1} / ${(+deck.dataset.total||0)||N}`;s.appendChild(pn);
});

/* ---------- 内容过多时逐步缩小字号，直到放得下 ---------- */
/* 高度放不下，或者行间公式太宽（超出正文，或压到右侧的式号）都算溢出 */
function overflow(body){
  if(body.scrollHeight>body.clientHeight+1)return true;
  const br=body.getBoundingClientRect();
  for(const d of body.querySelectorAll('.katex-display')){
    const tag=d.querySelector('.tag');let right=-1e9,left=1e9;
    d.querySelectorAll('.base').forEach(b=>{if(b.closest('.tag'))return;const r=b.getBoundingClientRect();if(r.width){right=Math.max(right,r.right);left=Math.min(left,r.left);}});
    if(tag){const t=tag.getBoundingClientRect();if(right>t.left-6)return true;}
    if(right>br.right+1||left<br.left-1)return true;
  }
  return false;
}
function autofit(s){
  const body=s.querySelector('.body');if(!body)return;
  const was=s.style.display;s.style.display='flex';s.style.visibility='hidden';
  body.style.fontSize='';let fs=parseFloat(getComputedStyle(body).fontSize);
  while(overflow(body)&&fs>16){fs-=1;body.style.fontSize=fs+'px';}
  s.style.display=was;s.style.visibility='';
}
function autofitAll(){slides.forEach(autofit);}
autofitAll();
slides.forEach(s=>s.querySelectorAll('img').forEach(im=>{if(!im.complete)im.addEventListener('load',()=>autofit(s));}));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(autofitAll);

/* ---------- 缩放 ---------- */
function fit(){const k=Math.min(innerWidth/1280,innerHeight/720);slides.forEach(s=>s.style.transform=`translate(-50%,-50%) scale(${k})`);}
addEventListener('resize',fit);fit();

/* ---------- 翻页与分步 ---------- */
let cur=0;
const steps=s=>[...s.querySelectorAll('.step')];
function show(i,atEnd){
  cur=Math.max(0,Math.min(N-1,i));
  slides.forEach((s,j)=>s.classList.toggle('on',j===cur));
  steps(slides[cur]).forEach(e=>e.classList.toggle('shown',!!atEnd));
  $cnt.textContent=`${cur+1} / ${N}`;$bar.style.width=((cur+1)/N*100)+'%';
  history.replaceState(null,'','#'+(cur+1));
}
function next(){const hid=steps(slides[cur]).filter(e=>!e.classList.contains('shown'));if(hid.length){hid[0].classList.add('shown');return;}if(cur<N-1)show(cur+1,false);}
function prev(){const vis=steps(slides[cur]).filter(e=>e.classList.contains('shown'));if(vis.length){vis[vis.length-1].classList.remove('shown');return;}if(cur>0)show(cur-1,true);}

/* ---------- 工具条 ---------- */
const tools=document.createElement('div');tools.className='tools';
tools.innerHTML='<button type="button" data-a="first" title="第一页 (Home)">⏮</button><button type="button" data-a="prev" title="上一步 (←)">◀</button><span class="cnt"></span><button type="button" data-a="next" title="下一步 (→)">▶</button><button type="button" data-a="last" title="最后一页 (End)">⏭</button><button type="button" data-a="fs" title="全屏 (F)">⛶ 全屏</button>';
document.body.appendChild(tools);
const $cnt=tools.querySelector('.cnt');
const $bar=document.createElement('div');$bar.className='progress';document.body.appendChild($bar);
function fullscreen(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}catch(_){}}
tools.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.a;e.stopPropagation();
  if(a==='first')show(0,false);else if(a==='prev')prev();else if(a==='next')next();else if(a==='last')show(N-1,true);else if(a==='fs')fullscreen();});
let hideT=0;addEventListener('mousemove',()=>{document.body.classList.add('show-tools');clearTimeout(hideT);hideT=setTimeout(()=>document.body.classList.remove('show-tools'),1800);});

/* ---------- 交互演示覆盖层 ---------- */
const ov=document.createElement('div');ov.className='overlay';ov.hidden=true;
ov.innerHTML='<div class="obar"><span class="ot"></span><button type="button">✕ 返回幻灯片（Esc）</button></div><iframe title="交互演示"></iframe>';
document.body.appendChild(ov);
const ifr=ov.querySelector('iframe');
function openDemo(src,title){ov.querySelector('.ot').textContent=title||'交互演示';ifr.src=src;ov.hidden=false;setTimeout(()=>{try{ifr.focus();}catch(_){}} ,300);}
function closeDemo(){ov.hidden=true;ifr.src='about:blank';}
ov.querySelector('button').addEventListener('click',closeDemo);
addEventListener('message',e=>{if(e.data==='close-demo')closeDemo();});
deck.addEventListener('click',e=>{
  const g=e.target.closest('[data-goto-section]');
  if(g){e.preventDefault();e.stopPropagation();const k=g.dataset.gotoSection;const i=slides.findIndex(s=>(s.dataset.section||'').split(' ')[0]===k);if(i>=0)show(i,false);return;}
  const b=e.target.closest('[data-demo]');
  if(b){e.stopPropagation();openDemo(b.dataset.demo,b.dataset.title||b.textContent.trim());return;}
  if(e.target.closest('a,button,input,select,textarea'))return;
  next();
});

/* ---------- 键盘 ---------- */
let typed='';
addEventListener('keydown',e=>{
  if(!ov.hidden){if(e.key==='Escape'){e.preventDefault();closeDemo();}return;}
  if(e.target.closest&&e.target.closest('input,select,textarea'))return;
  const k=e.key;
  if(/^\d$/.test(k)){typed+=k;return;}
  if(k==='Enter'&&typed){show(+typed-1,false);typed='';return;}
  typed='';
  if(['ArrowRight','PageDown',' ','ArrowDown','n'].includes(k)){e.preventDefault();next();}
  else if(['ArrowLeft','PageUp','ArrowUp','Backspace','p'].includes(k)){e.preventDefault();prev();}
  else if(k==='Home'){show(0,false);}
  else if(k==='End'){show(N-1,true);}
  else if(k==='f'||k==='F'){fullscreen();}
});

const h=parseInt(location.hash.slice(1),10);
show(isFinite(h)?h-1:0,/[?&]all/.test(location.search));   // ?all：打开时显示该页全部分步内容
})();
