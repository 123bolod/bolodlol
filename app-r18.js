// app-r18.js (no-design-change): robust delegation + trending(4) + slider fix
(function(){
  if (window.__R18_EXTERNAL__) return; window.__R18_EXTERNAL__ = true;
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const $ = (s, r=document)=>r.querySelector(s);

  window.products = Array.isArray(window.products) ? window.products : (Array.isArray(window.DEFAULT_PRODUCTS)? window.DEFAULT_PRODUCTS.slice() : []);
  window.likeCounts = (typeof window.likeCounts==='object' && window.likeCounts) || {};
  window.dislikeCounts = (typeof window.dislikeCounts==='object' && window.dislikeCounts) || {};

  function isDemo(p){
    try{
      const n = String((p && (p.name||p.title))||'').toLowerCase();
      if(n.includes('demo') || n.includes('sample')) return true;
      const img = String(p && p.image || '');
      if(!img) return true;
      if(/^data:/i.test(img) && img.length < 500) return true;
    }catch(_){}
    return false;
  }
  function getLiveProducts(){
    const list = Array.isArray(window.products) ? window.products.slice() : [];
    const nonDemo = list.filter(p => !isDemo(p));
    return nonDemo.length ? nonDemo : list;
  }
  function trending4(list){
    const L = Array.isArray(list)? list.slice() : [];
    const lc = window.likeCounts || {}, dc = window.dislikeCounts || {};
    L.sort(function(a,b){
      const la = lc[String(a && a.id)] || 0, lb = lc[String(b && b.id)] || 0;
      if(lb !== la) return lb - la;
      const da = dc[String(a && a.id)] || 0, db = dc[String(b && b.id)] || 0;
      if(da !== db) return da - db;
      const ta = Number(a && a.createdAt) || 0, tb = Number(b && b.id) || 0;
      return tb - ta;
    });
    return L.slice(0,4);
  }

  function safeGoto(id){
    try{
      $$('.page').forEach(p=>p.classList.remove('active'));
      (document.getElementById(id)||document.getElementById('home')||document.body).classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(_){}
  }
  // nav
  document.addEventListener('click', function(e){
    const a = e.target.closest('.nav .nav-link,[data-go]');
    if(!a) return;
    const href = a.getAttribute('href')||'';
    const id = (a.getAttribute('data-go')||'') || (href.startsWith('#')? href.slice(1): '');
    if(id){ e.preventDefault(); safeGoto(id); }
  }, true);

  // top 4
  window.renderTopThree = function(){
    try{
      const el = document.getElementById('topThree'); if(!el) return;
      el.innerHTML='';
      trending4(getLiveProducts()).forEach(item=>{
        const card=document.createElement('div'); card.className='small-card'; card.dataset.id=item.id;
        const img=document.createElement('img'); img.src=item.image||''; img.alt=item.name||''; card.appendChild(img);
        card.addEventListener('click', ()=>{ if(window.viewProduct) window.viewProduct(item); });
        el.appendChild(card);
      });
    }catch(_){}
  };

  // slider
  window.initSlider = function(){
    try{
      const wrap = document.getElementById('sliderWrap');
      const slides = document.getElementById('slides');
      const dots = document.getElementById('slideDots');
      if(!wrap || !slides || !dots) return;
      slides.innerHTML=''; dots.innerHTML='';
      const list = getLiveProducts();
      if(!list.length){ wrap.style.display='none'; dots.style.display='none'; return; }
      wrap.style.display='flex'; dots.style.display='flex';
      const max = Math.min(list.length, 12); let current=0, timer=null;
      for(let i=0;i<max;i++){
        const it=list[i];
        const div=document.createElement('div'); div.className='slide'; div.dataset.id = it.id;
        const img=document.createElement('img'); img.src=it.image; img.alt=it.name; div.appendChild(img);
        div.addEventListener('click', ()=>{ if(window.viewProduct) window.viewProduct(it); });
        slides.appendChild(div);
        const dot=document.createElement('div'); dot.className='dot'+(i===0?' active':''); dot.addEventListener('click', ()=>{ current=i; update(); reset(); }); dots.appendChild(dot);
      }
      function update(){ slides.style.transform='translateX(-'+(current*100)+'%)'; Array.from(dots.children).forEach((d,ix)=>d.classList.toggle('active', ix===current)); }
      function reset(){ if(timer) clearInterval(timer); timer=setInterval(()=>{ current=(current+1)%max; update(); }, 3000); }
      update(); reset();
    }catch(_){}
  };

  // delegation for buttons
  function findById(id){
    const arr = Array.isArray(window.products)? window.products : []; id=String(id);
    for(let i=0;i<arr.length;i++){ if(String(arr[i].id)===id) return arr[i]; }
    return null;
  }
  function rerender(){
    try{ if(window.updateProductsUI) window.updateProductsUI(); }catch(_){}
    try{ if(window.renderProducts) window.renderProducts(window.currentPageHome||1); }catch(_){}
    try{ if(window.renderProductsFull) window.renderProductsFull(window.currentPageFull||1); }catch(_){}
    try{ if(window.renderTopThree) window.renderTopThree(); }catch(_){}
    try{ if(window.initSlider) window.initSlider(); }catch(_){}
  }
  document.addEventListener('click', function(e){
    const el = e.target.closest('[data-action], .pill, button');
    if(!el) return;
    let act = el.getAttribute('data-action')||'';
    const label = (el.textContent||'').toLowerCase();
    if(!act){
      if(label.includes('like')) act='like';
      else if(label.includes('dislike')) act='dislike';
      else if(label.includes('add to cart')) act='add-cart';
      else if(label.includes('edit')) act='edit';
      else if(label.includes('delete')) act='delete';
      else if(label.includes('view')) act='view';
      else if(label.includes('share')) act='share';
    }
    const id = el.getAttribute('data-id') || (el.closest('[data-id]') && el.closest('[data-id]').getAttribute('data-id'));
    const item = id ? findById(id) : null;
    if(act==='like' && id){ e.preventDefault(); window.setVote ? window.setVote(id,'like') : (window.likeCounts[id]=(window.likeCounts[id]||0)+1); rerender(); }
    else if(act==='dislike' && id){ e.preventDefault(); window.setVote ? window.setVote(id,'dislike') : (window.dislikeCounts[id]=(window.dislikeCounts[id]||0)+1); rerender(); }
    else if(act==='view' && item){ e.preventDefault(); if(window.viewProduct) window.viewProduct(item); }
    else if(act==='edit' && id){ e.preventDefault(); if(window.editProduct) window.editProduct(Number(id)); }
    else if(act==='delete' && id){ e.preventDefault(); if(window.deleteProduct) window.deleteProduct(Number(id)); }
    else if(act==='add-cart' && item){ e.preventDefault(); if(window.addToCart) window.addToCart(item); }
  }, true);

  // initial
  document.addEventListener('DOMContentLoaded', function(){
    try{ window.renderTopThree(); }catch(_){}
    try{ window.initSlider(); }catch(_){}
  });
})();