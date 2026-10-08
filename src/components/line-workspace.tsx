'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,Send,MessageCircle,Search,FileText} from 'lucide-react';
import {useStore} from './store';
import {Button,PageHeader,Modal} from './ui';
import {uid,money,sum,product} from '@/lib/domain';
import {Navigate} from './orders';
export default function LineWorkspace({go,entity='',filter=''}:{go:Navigate;entity?:string;filter?:string}) {
 const {s,change,role}=useStore();
 const linked=s.orders.find(o=>o.id===entity);
 const [cid,setCid]=useState(linked?.cid||filter||s.customers[0]?.id||'');
 const [mode,setMode]=useState<'customer'|'store'>('customer');
 const [room,setRoom]=useState(true);const [draft,setDraft]=useState('');
 const [receipt,setReceipt]=useState('');const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(linked?.cid||filter){setCid(linked?.cid||filter);setRoom(true)}},[entity,filter,linked?.cid]);
 const person=s.customers.find(c=>c.id===cid);
 const orders=s.orders.filter(o=>o.cid===cid&&!['รอยืนยัน','ยกเลิก'].includes(o.status));
 const messages=(s.lineMessages||[]).filter(m=>m.cid===cid).slice().sort((a,b)=>a.time.localeCompare(b.time));
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'})},[cid,messages.length,mode]);
 const send=(text=draft)=>{if(!text.trim())return;if(change('บันทึกข้อความในแชตจำลองแล้ว',state=>{(state.lineMessages||(state.lineMessages=[])).push({id:uid('LINE'),key:uid('CHAT'),cid,text:text.trim(),source:cid,route:'crm',time:new Date().toISOString(),sender:mode==='customer'?person?.name||'ลูกค้า':role,direction:mode==='customer'?'customer':'store'});})){setDraft('')}};
 const doc=s.orders.find(o=>o.id===receipt);
 return <><PageHeader title="LINE จำลอง" description="ลองใช้งานแชตฝั่งลูกค้าและร้าน ข้อมูลเชื่อมกับคำสั่งซื้อในต้นแบบ ไม่มีการส่งไปยัง LINE จริง"/>
 <div className="sim-controls"><label>ทดลองเป็นลูกค้า <select value={cid} onChange={e=>{setCid(e.target.value);setDraft('');setRoom(true)}}>{s.customers.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><div className="sim-switch"><button className={mode==='customer'?'active':''} onClick={()=>setMode('customer')}>มุมมองลูกค้า</button><button className={mode==='store'?'active':''} onClick={()=>setMode('store')}>มุมมองร้าน</button></div></div>
 <div className={'sim-app '+(room?'sim-room-open':'')}><aside className="sim-sidebar"><header><strong>LINE</strong><MessageCircle size={24}/></header><h2>แชต</h2><div className="sim-search"><Search size={16}/> แชตของ {person?.name}</div><button className="sim-contact" onClick={()=>setRoom(true)}><img src="/sasawat-logo.png" alt=""/><span><b>{mode==='customer'?'ศาศวัต ห้องเย็น':person?.name}</b><small>{messages.at(-1)?.text||'แจ้งคำสั่งซื้อและใบเสร็จจากร้าน'}</small></span><span className="sim-dot"/></button><p className="sim-help">สร้างหรือเปลี่ยนสถานะคำสั่งซื้อในระบบ แล้วกลับมาดูข้อความแจ้งลูกค้าในแชตนี้ได้</p>{mode==='store'&&<Button small onClick={()=>go('orders')}>ไปจัดการคำสั่งซื้อ</Button>}</aside>
 <section className="sim-room"><header className="sim-room-header"><button aria-label="กลับไปรายชื่อแชต" onClick={()=>setRoom(false)}><ChevronLeft/></button><img src="/sasawat-logo.png" alt=""/><div><b>{mode==='customer'?'ศาศวัต ห้องเย็น':person?.name}</b><small>{mode==='customer'?'บัญชีร้านค้า · แชตจำลอง':'แชตกับลูกค้า · จำลอง'}</small></div></header>
 <div className="sim-chat"><div className="sim-date">ข้อความตัวอย่างจากข้อมูลในระบบ</div><div className={'sim-message '+(mode==='store'?'own':'')}><div className="sim-bubble">สวัสดีค่ะ ยินดีต้อนรับสู่ศาศวัต ห้องเย็น สอบถามสินค้าและติดตามคำสั่งซื้อผ่านแชตนี้ได้เลยค่ะ</div></div>
 {orders.map(o=><div className={'sim-message '+(mode==='store'?'own':'')} key={o.id}><article className="sim-order"><div className="sim-order-heading">ยืนยันคำสั่งซื้อ</div><b>{o.id}</b>{o.items.map((i,n)=><p key={n}>{product(s,i.pid).name}<span>{i.qty} {product(s,i.pid).unit}</span></p>)}<div className="sim-total">ยอดสุทธิ <b>฿{money(sum(o))}</b></div><div className="sim-status">{o.status==='เสร็จสิ้น'?'ส่งมอบสินค้าแล้ว':o.status==='พร้อมส่ง'?(o.address?'จัดสินค้าครบ รอจัดส่ง':'พร้อมรับสินค้าที่ร้าน'):o.status==='กำลังจัดส่ง'?'สินค้ากำลังจัดส่ง': 'ร้านกำลังเตรียมสินค้า'}</div><small>{o.address?'จัดส่ง: '+o.address:'รับสินค้าที่ศาศวัต ห้องเย็น'}</small>{o.receipt&&<button className="sim-receipt" onClick={()=>setReceipt(o.id)}><FileText size={20}/><span>ได้รับชำระเงินแล้ว ฿{money(o.receipt.amount)}<small>ใบเสร็จ {o.receipt.number} · แตะเพื่อดู</small></span></button>}{mode==='store'&&<button className="sim-source" onClick={()=>go('orders','',o.id)}>เปิดคำสั่งซื้อในระบบ</button>}</article></div>)}
 {messages.map(m=><div key={m.id} className={'sim-message '+(((m.direction==='customer')===(mode==='customer'))?'own':'')}><div className="sim-bubble">{m.text}</div><small>{new Date(m.time).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})} · ส่งแล้ว</small></div>)}<div ref={end}/></div>
 <div className="sim-quick">{(mode==='customer'?['รับทราบค่ะ','ขอสอบถามสินค้า','จะเข้ารับสินค้าวันนี้']:['สวัสดีค่ะ ยินดีให้บริการค่ะ','ขอตรวจสอบรายการให้สักครู่นะคะ']).map(t=><button key={t} onClick={()=>send(t)}>{t}</button>)}</div><form className="sim-compose" onSubmit={e=>{e.preventDefault();send()}}><input aria-label="ข้อความแชต" placeholder={mode==='customer'?'ส่งข้อความถึงร้าน…':'ตอบกลับลูกค้า…'} value={draft} onChange={e=>setDraft(e.target.value)}/><button disabled={!draft.trim()} aria-label="ส่งข้อความ"><Send size={22}/></button></form></section></div>
 {doc?.receipt&&<Modal title="ใบเสร็จรับเงิน" onClose={()=>setReceipt('')}><div className="sim-document"><img src="/sasawat-logo.png" alt="ศาศวัต ห้องเย็น"/><h3>ใบเสร็จรับเงิน</h3><p>{doc.receipt.number}</p><p>ลูกค้า: {person?.name}<br/>คำสั่งซื้อ: {doc.id}</p>{doc.items.map((i,n)=><p key={n}>{product(s,i.pid).name} × {i.qty}<b>฿{money(i.price*i.qty)}</b></p>)}<p>ส่วนลด <b>฿{money(doc.discount)}</b></p><hr/><p>รับชำระแล้ว <b>฿{money(doc.receipt.amount)}</b></p><p>วิธีชำระ: {doc.receipt.method}</p><small>เอกสารจำลองสำหรับทดลองใช้งาน</small></div></Modal>}
 </>;
}
