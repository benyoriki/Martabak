'use strict';
/* Storage adapter (localStorage). Ganti isi Repo dengan Firebase kelak tanpa mengubah UI. */
const SCHEMA=1,K='mb1_',$=s=>document.querySelector(s);
const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const today=()=>new Date().toLocaleDateString('sv',{timeZone:'Asia/Jakarta'});
const fmt=t=>new Date(t).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const FB='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#3b2314"/><text x="200" y="185" font-size="120" text-anchor="middle">🥞</text></svg>');
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),a[k]);else if(a[k]!=null&&a[k]!==false)e.setAttribute(k,a[k])}c.flat().forEach(x=>e.append(x));return e};
const mkP=(i,n,c,d,p,pr,best)=>({id:'P'+i,name:n,cat:c,desc:d,price:p,promo:pr,promoEnd:pr?'2026-12-31':'',img:'',on:true,best,stock:true,order:i});
const DEF={products:[mkP(1,'Martabak Cokelat Keju','Manis','Meses cokelat & keju melimpah',28000,25000,true),mkP(2,'Martabak Keju Susu','Manis','Keju parut dan susu kental manis',25000,0,false),mkP(3,'Martabak Kacang Cokelat','Manis','Kacang sangrai dan cokelat',22000,0,false),mkP(4,'Martabak Nutella','Manis','Olesan hazelnut cokelat',30000,0,true),mkP(5,'Martabak Telur Spesial','Asin','Telur bebek, daun bawang, bumbu rempah',30000,0,true),mkP(6,'Martabak Telur Ayam','Asin','Telur ayam gurih',28000,0,false),mkP(7,'Martabak Daging','Asin','Isi daging cincang berbumbu',32000,0,false),mkP(8,'Martabak Mix Spesial','Spesial','Manis dan asin dalam satu loyang',35000,0,true)],
settings:{name:'Martabak Mas Bejo',name2:'Mas Bejo',tagline:'Manisnya Bikin Nagih!',wa:'628988995637',address:'Pujasera (alamat demo)',hours:'17.00 - 00.00',open:17,close:24,maps:'https://www.google.com/maps/search/?api=1&query=Pujasera',about:'Martabak Mas Bejo menyajikan martabak manis dan asin dengan pilihan topping lengkap, dibuat saat kamu pesan. (Teks demo, bisa diubah admin.)',promoTitle:'PROMO SPESIAL MAS BEJO',promoText:'Cek menu bertanda promo. (Data demo)',qris:'qris.png',heroImg:'hero.jpg'},orders:[],messages:[]};
const Repo={
 get(n){try{const v=JSON.parse(localStorage.getItem(K+n));if(v!=null)return n==='settings'?(m=>{['qris','heroImg'].forEach(k=>{if(!m[k])m[k]=DEF.settings[k]});return m})({...DEF.settings,...v}):v}catch(e){}return structuredClone(DEF[n]??{})},
 save(n,v){try{localStorage.setItem(K+n,JSON.stringify(v));localStorage.setItem(K+'schema',SCHEMA);return true}catch(e){alert('Penyimpanan penuh. Kecilkan ukuran foto.');return false}},
 put(n,item){const l=this.get(n),i=l.findIndex(x=>x.id===item.id);i<0?l.push(item):l[i]=item;return this.save(n,l)},
 del(n,id){return this.save(n,this.get(n).filter(x=>x.id!==id))},
 reset(){Object.keys(localStorage).filter(k=>k.startsWith(K)&&k!==K+'theme').forEach(k=>localStorage.removeItem(k))}};
const pimg=p=>p.img||({P1:'manis.jpg',P2:'manis2.jpg',P3:'manis3.jpg',P4:'manis4.jpg',P5:'asin.jpg',P6:'asin2.jpg',P7:'asin3.jpg',P8:'hero.jpg'}[p.id]||({Manis:'manis.jpg',Asin:'asin.jpg'}[p.cat]||'hero.jpg'));
function toast(t){const e=h('div',{class:'toast'},t);document.body.append(e);setTimeout(()=>e.remove(),1800)}
const price=p=>p.promo>0&&p.promo<p.price&&p.promoEnd>=today()?p.promo:p.price;
const waLink=(num,m)=>`https://wa.me/${num}?text=${encodeURIComponent(m)}`;
function theme(){const t=localStorage.getItem(K+'theme')||'dark';document.documentElement.dataset.theme=t;const b=$('#themeBtn');b&&b.addEventListener('click',()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem(K+'theme',n)})}
theme();
function pwa(){let dp=window.__dp||null,card=null;const btns=()=>document.querySelectorAll('.inst'),st=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
 if(st){btns().forEach(b=>b.hidden=true);return}
 btns().forEach(b=>b.hidden=false);
 const ua=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(ua),and=/Android/.test(ua),inapp=/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|; wv\)/.test(ua);
 const steps=inapp?['Ketuk menu ⋮ di pojok layar','Pilih "Buka di Chrome" atau "Buka di browser"','Lalu ketuk Pasang Aplikasi lagi']:ios?['Ketuk tombol Bagikan di Safari','Pilih "Tambah ke Layar Utama"','Ketuk Tambah']:and?['Ketuk menu ⋮ di Chrome','Pilih "Instal aplikasi" atau "Tambahkan ke layar utama"','Ketuk Instal']:['Buka di Chrome atau Edge','Klik ikon instal di ujung kanan bilah alamat','Klik Instal'];
 const hideCard=()=>{if(card){card.remove();card=null}};
 const guide=()=>{let d=$('#pwaD');if(!d){d=h('dialog',{id:'pwaD'});document.body.append(d)}d.replaceChildren(h('button',{class:'x',onclick:()=>d.close(),'aria-label':'Tutup'},'✕'),h('img',{class:'pl',src:'logo.png',width:72,height:72,alt:''}),h('h3',{},'Pasang Aplikasi'),h('ol',{class:'pst'},steps.map(s=>h('li',{},s))),h('p',{class:'info'},'Jika muncul "Tidak dapat membuka aplikasi" atau tombol tidak bereaksi: hapus ikon aplikasi lama dari layar utama, muat ulang halaman, lalu pasang lagi.'),h('button',{class:'btn gold',onclick:()=>d.close()},'Mengerti'));d.showModal()};
 const go=async()=>{if(!dp){guide();return}try{dp.prompt();const r=await dp.userChoice;if(r.outcome==='accepted')btns().forEach(b=>b.hidden=true)}catch(e){guide()}dp=null;window.__dp=null;hideCard()};
 btns().forEach(b=>b.onclick=go);
 const offer=()=>{if(card||!dp||+localStorage.getItem(K+'pwaNo')>Date.now())return;setTimeout(()=>{if(card||!dp)return;const adm=document.body.dataset.page==='admin';card=h('div',{class:'pwa'},h('img',{src:'logo.png',width:56,height:56,alt:''}),h('div',{},h('b',{},adm?'Pasang Admin Mas Bejo':'Pasang Aplikasi Mas Bejo'),h('small',{},'Buka lebih cepat dari layar utama, tampil layar penuh.')),h('button',{class:'btn gold sm',onclick:go},'Pasang'),h('button',{class:'pwx',onclick:()=>{localStorage.setItem(K+'pwaNo',Date.now()+3*864e5);hideCard()},'aria-label':'Nanti'},'✕'));document.body.append(card)},3600)};
 addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;window.__dp=e;offer()});
 addEventListener('appinstalled',()=>{btns().forEach(b=>b.hidden=true);hideCard()});
 offer()}
pwa();
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
 const saveCart=()=>{Repo.save('cart',cart);const n=Object.values(cart).reduce((a,b)=>a+b,0);$('#badge').textContent=n;const it=items();$('#cartBar').hidden=!n;document.body.classList.toggle('hasCart',n>0);$('#cartTot').textContent=n+' item · '+rp(sum(it))};
 const prods=()=>Repo.get('products').filter(p=>p.on).sort((a,b)=>a.order-b.order);
 let cat='Semua',q='';
 const cats=['Semua','Manis','Asin','Promo','Terlaris'];
 const drawCats=()=>{$('#cats').replaceChildren(...cats.map(c=>h('button',{class:'chip'+(c===cat?' on':''),onclick:()=>{cat=c;drawCats();drawMenu()}},c)))};
 function drawPromo(){const box=$('#promoList');if(!box)return;box.replaceChildren();prods().filter(p=>price(p)<p.price).forEach(p=>box.append(h('div',{class:'pc'},h('b',{},p.name),h('span',{},rp(price(p)),' ',h('s',{},rp(p.price))),h('small',{},'Hemat '+rp(p.price-price(p))+' · s/d '+(p.promoEnd||'-')),h('button',{class:'btn gold sm',onclick:()=>{cart[p.id]=(cart[p.id]||0)+1;saveCart();toast(p.name+' masuk keranjang')}},'+ Keranjang'))))}
 function drawMenu(){const g=$('#grid');g.replaceChildren();
  const list=prods().filter(p=>p.name.toLowerCase().includes(q)&&(cat==='Semua'||(cat==='Promo'?price(p)<p.price:cat==='Terlaris'?p.best:cat==='Asin'?p.cat!=='Manis':p.cat===cat)));
  if(!list.length)g.append(h('p',{},'Menu tidak ditemukan. Coba kata kunci lain.'));
  list.forEach((p,i)=>{const pr=price(p);
   g.append(h('article',{class:'card'},h('img',{src:pimg(p),alt:p.name,loading:i<6?'eager':'lazy',width:400,height:300,onerror:e=>{e.target.src=FB}}),
    pr<p.price?h('span',{class:'badge'},'Promo'):p.best?h('span',{class:'badge'},'Terlaris'):'',
    h('div',{},h('b',{},p.name),h('p',{},p.desc),h('span',{class:'price'},rp(pr),' ',pr<p.price?h('s',{},rp(p.price)):''),
     h('button',{class:'btn red',disabled:p.stock?null:'',onclick:()=>{cart[p.id]=(cart[p.id]||0)+1;saveCart();toast(p.name+' masuk keranjang')}},p.stock?'+ Keranjang':'Habis'))))})}
 $('#q').oninput=e=>{q=e.target.value.toLowerCase().trim();drawMenu()};
 const pm=()=>Object.fromEntries(Repo.get('products').map(p=>[p.id,p]));
 const items=()=>{const m=pm();return Object.keys(cart).filter(id=>m[id]).map(id=>({id,name:m[id].name,qty:cart[id],price:price(m[id])}))};
 const sum=a=>a.reduce((x,i)=>x+i.price*i.qty,0);
 let D={name:'',phone:'',note:'',pay:'QRIS'},last=null;const body=$('#stepBody');
 const nav=(...b)=>h('div',{class:'row'},b),back=n=>h('button',{class:'chip',type:'button',onclick:()=>go(n)},'Kembali');
 function go(n){document.querySelectorAll('#steps li').forEach((li,i)=>{li.className=i+1<n?'ok':i+1===n?'on':''});body.replaceChildren();[null,s1,s2,s3,s4][n](body);$('#cartD').scrollTop=0}
 function s1(b){const it=items();
  it.forEach(i=>{const ch=d=>()=>{cart[i.id]+=d;if(cart[i.id]<1)delete cart[i.id];saveCart();go(1)};
   b.append(h('div',{class:'li'},h('span',{},i.name,h('br'),h('small',{},rp(i.price)+' × '+i.qty+' = '+rp(i.price*i.qty))),h('span',{},h('button',{onclick:ch(-1),'aria-label':'Kurangi'},'−'),' '+i.qty+' ',h('button',{onclick:ch(1),'aria-label':'Tambah'},'+'),' ',h('button',{onclick:()=>{delete cart[i.id];saveCart();go(1)},'aria-label':'Hapus'},'✕'))))});
  if(!it.length)b.append(h('p',{},'Keranjang masih kosong. Pilih menu favoritmu dulu.'));
  const ta=h('textarea',{maxlength:200,placeholder:'Contoh: potong 8 bagian'});ta.value=D.note;ta.oninput=()=>D.note=ta.value;
  b.append(h('p',{class:'tot'},'Total ',h('b',{},rp(sum(it)))),h('label',{},'Catatan (opsional)',ta),nav(h('button',{class:'chip',type:'button',onclick:()=>$('#cartD').close()},'+ Tambah menu'),h('button',{class:'btn red',disabled:it.length?null:'',onclick:()=>go(2)},'Lanjut isi data')))}
 function s2(b){const n=h('input',{required:'',maxlength:60,placeholder:'Nama kamu',autocomplete:'name'}),p=h('input',{type:'tel',required:'',inputmode:'tel',placeholder:'08xxxxxxxxxx',autocomplete:'tel'});n.value=D.name;p.value=D.phone;
  const f=h('form',{},h('label',{},'Nama',n),h('label',{},'Nomor HP / WhatsApp',p),h('p',{class:'info'},'Pengambilan: ambil sendiri di lokasi. Layanan antar belum aktif.'),nav(back(1),h('button',{class:'btn red'},'Lanjut pembayaran')));
  f.onsubmit=e=>{e.preventDefault();const nm=n.value.trim(),ph=p.value.trim();if(nm.length<2){alert('Isi nama minimal 2 huruf.');return}if(!/^(\+62|62|0)8[0-9]{8,12}$/.test(ph.replace(/[\s-]/g,''))){alert('Nomor HP tidak valid. Contoh: 08123456789');return}D.name=nm;D.phone=ph;go(3)};b.append(f)}
 function s3(b){const it=items(),opt=(v,t,d)=>{const r=h('input',{type:'radio',name:'pay',value:v});r.checked=D.pay===v;r.onchange=()=>{D.pay=v;go(3)};return h('label',{class:'opt'+(D.pay===v?' on':'')},r,h('span',{},h('b',{},t),h('br'),h('small',{},d)))};
  b.append(h('p',{class:'info'},D.name+' · '+D.phone),...it.map(i=>h('div',{class:'li'},h('span',{},i.name+' ×'+i.qty),h('b',{},rp(i.price*i.qty)))),h('p',{class:'tot'},'Total ',h('b',{},rp(sum(it)))),
   opt('QRIS','QRIS','Scan dari e-wallet atau m-banking. Admin memverifikasi pembayaran secara manual.'),opt('COD','Bayar di Tempat','Bayar tunai saat pesanan diambil.'),nav(back(2),h('button',{class:'btn red',onclick:place},'Buat Pesanan')))}
 function place(){const it=items();if(!it.length){go(1);return}const d=today().replaceAll('-',''),os=Repo.get('orders');
  const o={id:uid(),no:`MB-${d}-${String(os.filter(x=>x.no.includes(d)).length+1).padStart(3,'0')}`,time:new Date().toISOString(),name:D.name,phone:D.phone,items:it,total:sum(it),pay:D.pay,payStatus:D.pay==='QRIS'?'Menunggu Pembayaran':'Belum Dibayar',status:'Baru',note:D.note.trim(),demo:true};
  if(!Repo.put('orders',o))return;last=o;cart={};D.note='';saveCart();go(4)}
 const msg=o=>`HALO ${S.name.toUpperCase()}\n\nSaya ingin memesan:\n\nNomor Pesanan: ${o.no}\nNama: ${o.name}\nNomor HP: ${o.phone}\n\n${o.items.map((i,n)=>`${n+1}. ${i.name} x${i.qty} — ${rp(i.price*i.qty)}`).join('\n')}\n\nTotal: ${rp(o.total)}\nPembayaran: ${o.pay==='QRIS'?'QRIS':'Bayar di Tempat'}\nCatatan: ${o.note||'-'}\n\nMohon konfirmasi pesanan saya. Terima kasih.`;
 function s4(b){const o=last;b.append(h('div',{class:'okbox'},h('b',{},'Pesanan diterima'),h('span',{},o.no)),h('p',{class:'tot'},'Total ',h('b',{},rp(o.total))));
  if(o.pay==='QRIS')b.append(h('p',{},'Scan QRIS ini, bayar sesuai total, lalu tekan "Saya Sudah Membayar".'),S.qris?h('img',{class:'qris',src:S.qris,alt:'QRIS pembayaran',width:240}):h('div',{class:'ph'},'QRIS belum diunggah admin. Hubungi admin lewat WhatsApp.'),
   h('button',{class:'btn red',onclick:e=>{const l=Repo.get('orders'),x=l.find(i=>i.id===o.id);if(x){x.payStatus='Menunggu Verifikasi';Repo.save('orders',l)}e.target.disabled=true;e.target.textContent='Menunggu verifikasi admin'}},'Saya Sudah Membayar'));
  else b.append(h('p',{class:'info'},'Siapkan pembayaran tunai saat pesanan diambil.'));
  b.append(h('p',{},h('small',{},'Tombol WhatsApp hanya membuka chat berisi teks siap kirim. Tekan kirim di WhatsApp.')),nav(h('a',{class:'btn green',href:waLink(S.wa,msg(o)),target:'_blank',rel:'noopener'},'Kirim Pesanan ke WhatsApp'),h('button',{class:'chip',onclick:()=>{$('#cartD').close();go(1)}},'Selesai')))}
 $('#cartBtn').onclick=()=>{go(last&&!Object.keys(cart).length&&body.dataset.k?4:1);$('#cartD').showModal()};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}));
 const enter=()=>{sessionStorage.setItem('mbAdmin','1');location.href='admin.html'};
 $('#loginBtn').onclick=()=>$('#loginD').showModal();$('#demoBtn').onclick=enter;
 $('#loginF').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);if(f.get('e').trim().toLowerCase()==='admin@masbejo.demo'&&f.get('p')==='admin123')enter();else alert('Email atau password salah. Coba tombol Akun Demo.')};
 setTimeout(()=>{const l=$('#loader');l.classList.add('off');setTimeout(()=>l.remove(),450)},3000);
 $('#chatBtn').onclick=()=>{$('#chatOk').hidden=true;$('#chatD').showModal()};
 const chatMsg=f=>`Halo ${S.name}, saya ${f.get('name')} (${f.get('phone')}).\n${f.get('text')}`;
 $('#chatF').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);
  if(Repo.put('messages',{id:uid(),name:f.get('name').trim(),phone:f.get('phone').trim(),text:f.get('text').trim(),time:new Date().toISOString(),status:'Baru'})){e.target.reset();$('#chatOk').textContent='Pesan tersimpan (demo lokal).';$('#chatOk').hidden=false}};
 $('#chatWa').onclick=e=>{const f=new FormData($('#chatF'));e.target.href=waLink(S.wa,chatMsg(f))};
 $('#cartBar').onclick=()=>$('#cartBtn').click();drawPromo();drawCats();drawMenu();saveCart();
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
}
