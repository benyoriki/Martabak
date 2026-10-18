'use strict';
/* Storage adapter (localStorage). Ganti isi Repo dengan Firebase kelak tanpa mengubah UI. */
const SCHEMA=1,K='mb1_',$=s=>document.querySelector(s);
const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const today=()=>new Date().toLocaleDateString('sv',{timeZone:'Asia/Jakarta'});
const fmt=t=>new Date(t).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const FB='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#3b2314"/><text x="200" y="185" font-size="120" text-anchor="middle">🥞</text></svg>');
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),a[k]);else e.setAttribute(k,a[k])}c.flat().forEach(x=>e.append(x));return e};
const mkP=(i,n,c,d,p,pr,best)=>({id:'P'+i,name:n,cat:c,desc:d,price:p,promo:pr,promoEnd:pr?'2026-12-31':'',img:'',on:true,best,stock:true,order:i});
const DEF={products:[mkP(1,'Martabak Cokelat Keju','Manis','Meses cokelat & keju melimpah',28000,25000,true),mkP(2,'Martabak Keju Susu','Manis','Keju parut dan susu kental manis',25000,0,false),mkP(3,'Martabak Kacang Cokelat','Manis','Kacang sangrai dan cokelat',22000,0,false),mkP(4,'Martabak Nutella','Manis','Olesan hazelnut cokelat',30000,0,true),mkP(5,'Martabak Telur Spesial','Asin','Telur bebek, daun bawang, bumbu rempah',30000,0,true),mkP(6,'Martabak Telur Ayam','Asin','Telur ayam gurih',28000,0,false),mkP(7,'Martabak Daging','Asin','Isi daging cincang berbumbu',32000,0,false),mkP(8,'Martabak Mix Spesial','Spesial','Manis dan asin dalam satu loyang',35000,0,true)],
settings:{name:'Martabak Mas Bejo',name2:'Mas Bejo',tagline:'Manisnya Bikin Nagih!',wa:'628988995637',address:'Pujasera (alamat demo)',hours:'17.00 - 00.00',open:17,close:24,maps:'https://www.google.com/maps/search/?api=1&query=Pujasera',about:'Martabak Mas Bejo menyajikan martabak manis dan asin dengan pilihan topping lengkap, dibuat saat kamu pesan. (Teks demo, bisa diubah admin.)',promoTitle:'PROMO SPESIAL MAS BEJO',promoText:'Cek menu bertanda promo. (Data demo)',qris:'',heroImg:''},orders:[],messages:[]};
const Repo={
 get(n){try{const v=JSON.parse(localStorage.getItem(K+n));if(v!=null)return n==='settings'?{...DEF.settings,...v}:v}catch(e){}return structuredClone(DEF[n]??{})},
 save(n,v){try{localStorage.setItem(K+n,JSON.stringify(v));localStorage.setItem(K+'schema',SCHEMA);return true}catch(e){alert('Penyimpanan penuh. Kecilkan ukuran foto.');return false}},
 put(n,item){const l=this.get(n),i=l.findIndex(x=>x.id===item.id);i<0?l.push(item):l[i]=item;return this.save(n,l)},
 del(n,id){return this.save(n,this.get(n).filter(x=>x.id!==id))},
 reset(){Object.keys(localStorage).filter(k=>k.startsWith(K)&&k!==K+'theme').forEach(k=>localStorage.removeItem(k))}};
const price=p=>p.promo>0&&p.promo<p.price&&p.promoEnd>=today()?p.promo:p.price;
const waLink=(num,m)=>`https://wa.me/${num}?text=${encodeURIComponent(m)}`;
function theme(){const t=localStorage.getItem(K+'theme')||'dark';document.documentElement.dataset.theme=t;const b=$('#themeBtn');b&&b.addEventListener('click',()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem(K+'theme',n)})}
theme();
if(document.body.dataset.page==='shop')shop();
function shop(){
 const S=Repo.get('settings');
 document.querySelectorAll('[data-s]').forEach(e=>e.textContent=S[e.dataset.s]||'');
 document.querySelectorAll('.wa').forEach(a=>a.href=waLink(S.wa,'Halo '+S.name+', saya ingin memesan.'));
 $('#maps').href=S.maps;$('#heroImg').src=S.heroImg||FB;$('#heroImg').onerror=e=>{e.target.src=FB};
 const hr=+new Date().toLocaleString('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',hour12:false})%24;
 const isOpen=S.open<S.close?hr>=S.open&&hr<S.close:hr>=S.open||hr<S.close;
 $('#status').textContent=isOpen?'● Buka sekarang':'● Tutup';
 $('#burger').onclick=()=>$('#nav').classList.toggle('open');$('#nav').onclick=()=>$('#nav').classList.remove('open');
 let cart=Repo.get('cart');if(Array.isArray(cart))cart={};
 const saveCart=()=>{Repo.save('cart',cart);const n=Object.values(cart).reduce((a,b)=>a+b,0);$('#badge').textContent=n};
 const prods=()=>Repo.get('products').filter(p=>p.on).sort((a,b)=>a.order-b.order);
 let cat='Semua',q='';
 const cats=['Semua','Manis','Asin','Promo','Terlaris'];
 const drawCats=()=>{$('#cats').replaceChildren(...cats.map(c=>h('button',{class:'chip'+(c===cat?' on':''),onclick:()=>{cat=c;drawCats();drawMenu()}},c)))};
 function drawMenu(){const g=$('#grid');g.replaceChildren();
  const list=prods().filter(p=>p.name.toLowerCase().includes(q)&&(cat==='Semua'||(cat==='Promo'?price(p)<p.price:cat==='Terlaris'?p.best:cat==='Asin'?p.cat!=='Manis':p.cat===cat)));
  if(!list.length)g.append(h('p',{},'Menu tidak ditemukan. Coba kata kunci lain.'));
  list.forEach(p=>{const pr=price(p);
   g.append(h('article',{class:'card'},h('img',{src:p.img||FB,alt:p.name,loading:'lazy',width:400,height:300,onerror:e=>{e.target.src=FB}}),
    pr<p.price?h('span',{class:'badge'},'Promo'):p.best?h('span',{class:'badge'},'Terlaris'):'',
    h('div',{},h('b',{},p.name),h('p',{},p.desc),h('span',{class:'price'},rp(pr),' ',pr<p.price?h('s',{},rp(p.price)):''),
     h('button',{class:'btn red',disabled:p.stock?null:'',onclick:()=>{cart[p.id]=(cart[p.id]||0)+1;saveCart();$('#badge').animate([{transform:'scale(1.6)'},{transform:'scale(1)'}],200)}},p.stock?'+ Keranjang':'Habis'))))})}
 $('#q').oninput=e=>{q=e.target.value.toLowerCase().trim();drawMenu()};
 function drawCart(){const box=$('#items');box.replaceChildren();let tot=0;const pm=Object.fromEntries(Repo.get('products').map(p=>[p.id,p]));
  Object.keys(cart).forEach(id=>{const p=pm[id];if(!p){delete cart[id];return}const n=cart[id];tot+=price(p)*n;
   const ch=d=>()=>{cart[id]+=d;if(cart[id]<1)delete cart[id];saveCart();drawCart()};
   box.append(h('div',{class:'li'},h('span',{},p.name,h('br'),h('small',{},rp(price(p)*n))),h('span',{},h('button',{onclick:ch(-1),'aria-label':'Kurangi'},'−'),' '+n+' ',h('button',{onclick:ch(1),'aria-label':'Tambah'},'+'),' ',h('button',{onclick:()=>{delete cart[id];saveCart();drawCart()},'aria-label':'Hapus'},'🗑'))))});
  if(!tot)box.append(h('p',{},'Keranjang kosong. Pilih menu dulu.'));
  $('#total').textContent=rp(tot);$('#co').hidden=!tot;saveCart();return tot}
 $('#cartBtn').onclick=()=>{$('#done').hidden=true;drawCart();$('#cartD').showModal()};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 $('#co').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),pm=Object.fromEntries(Repo.get('products').map(p=>[p.id,p]));
  const items=Object.keys(cart).filter(id=>pm[id]).map(id=>({id,name:pm[id].name,qty:cart[id],price:price(pm[id])}));
  if(!items.length)return;const name=f.get('name').trim(),phone=f.get('phone').trim();
  if(!name||!/^[0-9+ ]{9,16}$/.test(phone)){alert('Isi nama dan nomor HP yang benar.');return}
  const orders=Repo.get('orders'),d=today().replaceAll('-','');
  const no=`MB-${d}-${String(orders.filter(o=>o.no.includes(d)).length+1).padStart(3,'0')}`;
  const pay=f.get('pay');
  const o={id:uid(),no,time:new Date().toISOString(),name,phone,items,total:items.reduce((a,i)=>a+i.price*i.qty,0),pay,payStatus:pay==='QRIS'?'Menunggu Pembayaran':'Belum Dibayar',status:'Baru',note:f.get('note').trim(),demo:true};
  if(!Repo.put('orders',o))return;cart={};saveCart();e.target.reset();showDone(o)};
 function showDone(o){const d=$('#done');d.replaceChildren();$('#co').hidden=true;$('#items').replaceChildren();$('#total').textContent='';
  const msg=`HALO ${S.name.toUpperCase()}\n\nSaya ingin memesan:\n\nNomor Pesanan: ${o.no}\nNama: ${o.name}\nNomor HP: ${o.phone}\n\n${o.items.map((i,n)=>`${n+1}. ${i.name} x${i.qty} — ${rp(i.price*i.qty)}`).join('\n')}\n\nTotal: ${rp(o.total)}\nPembayaran: ${o.pay==='QRIS'?'QRIS':'Bayar di Tempat'}\nCatatan: ${o.note||'-'}\n\nMohon konfirmasi pesanan saya. Terima kasih.`;
  d.append(h('h3',{},'Pesanan dibuat: '+o.no),h('p',{},'Total '+rp(o.total)+' · '+o.pay));
  if(o.pay==='QRIS'){d.append(S.qris?h('img',{class:'qris',src:S.qris,alt:'QRIS'}):h('div',{class:'ph'},'QRIS belum diunggah admin. Hubungi admin via WhatsApp untuk pembayaran.'),
   h('button',{class:'btn red',onclick:e=>{const l=Repo.get('orders'),x=l.find(i=>i.id===o.id);x.payStatus='Menunggu Verifikasi';Repo.save('orders',l);e.target.disabled=true;e.target.textContent='Menunggu verifikasi admin'}},'Saya Sudah Membayar'))}
  else d.append(h('p',{},'Bayar saat pesanan diambil.'));
  d.append(h('p',{},h('small',{},'Tombol di bawah hanya membuka WhatsApp; kamu tetap perlu menekan kirim.')),h('a',{class:'btn green',href:waLink(S.wa,msg),target:'_blank',rel:'noopener'},'Kirim Pesanan ke WhatsApp'));d.hidden=false}
 $('#chatBtn').onclick=()=>{$('#chatOk').hidden=true;$('#chatD').showModal()};
 const chatMsg=f=>`Halo ${S.name}, saya ${f.get('name')} (${f.get('phone')}).\n${f.get('text')}`;
 $('#chatF').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);
  if(Repo.put('messages',{id:uid(),name:f.get('name').trim(),phone:f.get('phone').trim(),text:f.get('text').trim(),time:new Date().toISOString(),status:'Baru'})){e.target.reset();$('#chatOk').textContent='Pesan tersimpan (demo lokal).';$('#chatOk').hidden=false}};
 $('#chatWa').onclick=e=>{const f=new FormData($('#chatF'));e.target.href=waLink(S.wa,chatMsg(f))};
 drawCats();drawMenu();saveCart();
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
}
