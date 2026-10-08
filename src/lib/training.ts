import { State, TODAY, uid } from './domain';
export type Course = {id:string; name:string; objective:string; topics:string; material:string; instructor:string; date:string; place:string; role:string; reviewDays:number};
export type Enrollment = {id:string; course:string; user:string; due:string; status:string; attendance:string; score:number|null; note:string; review:string; history:{time:string; user:string; text:string}[]};
export type TrainingData = {courses:Course[]; enrollments:Enrollment[]};
export const trainingStatuses=['ต้องอบรม','นัดหมายแล้ว','รอประเมิน','ผ่าน','ต้องทบทวน'];
export const trainingRole=(role:string)=>role==='พนักงานขาย'?'ฝ่ายขาย':role==='พนักงานคลัง'?'คลังสินค้า':role;
export function trainingData(s:State):TrainingData {
 if(s.trainingData) return s.trainingData;
 const specs=[['รับคำสั่งซื้อและออกใบเสร็จ','ฝ่ายขาย','ตรวจลูกค้า จำนวน ราคา และการรับชำระก่อนออกเอกสาร','รับรายการจากทุกช่องทาง\nตรวจส่วนลดและสต๊อก\nออกใบเสร็จและพิมพ์ซ้ำ'],['รับสินค้าและตรวจหยิบตามล็อต','คลังสินค้า','รับเข้าและจัดสินค้าได้ถูกล็อต ครบจำนวน','ตรวจวันหมดอายุเมื่อรับเข้า\nหยิบตามห้องและล็อตที่แนะนำ\nตรวจทีละล็อตก่อนส่งต่อ'],['ตรวจอุณหภูมิและจัดการเหตุผิดปกติ','ผู้ดูแลห้องเย็น','รับทราบเหตุ ตรวจหาสาเหตุ และบันทึกการแก้ไข','ตรวจช่วงอุณหภูมิ\nรับทราบและบันทึกการแก้ไข\nปิดเหตุเมื่อค่ากลับเป็นปกติ'],['สุขลักษณะและความปลอดภัย','ทุกบทบาท','ปฏิบัติงานกับอาหารแช่แข็งได้อย่างปลอดภัย','ตรวจอุปกรณ์ป้องกันก่อนเข้าห้องเย็น\nแยกสินค้าหมดอายุ\nรายงานเหตุและขอความช่วยเหลือ']];
 const courses=specs.map((x,n)=>({id:'COURSE-'+n,name:x[0],role:x[1],objective:x[2],topics:x[3],material:'',instructor:'ผู้จัดการสาขา',date:TODAY,place:'สาขามุกดาหาร',reviewDays:180}));
 const enrollments=s.users.filter(u=>u.active).flatMap(u=>courses.filter(c=>c.role==='ทุกบทบาท'||c.role===trainingRole(u.role)).map(c=>({id:c.id+'-'+u.id,course:c.id,user:u.id,due:TODAY,status:'ต้องอบรม',attendance:'ยังไม่บันทึก',score:null,note:'',review:'',history:[]})));
 return {courses,enrollments};
}
export function saveResult(s:State,id:string,result:{attendance:string;score:number|null;note:string;reason:string},actor:string){
 const data=s.trainingData || (s.trainingData=trainingData(s)); const e=data.enrollments.find(e=>e.id===id); if(!e)throw Error('ไม่พบรายการอบรม');
 if(!['เข้าอบรม','ขาดอบรม'].includes(result.attendance))throw Error('ระบุการเข้าอบรม');
 if(result.attendance==='เข้าอบรม'&&(result.score===null||!Number.isFinite(result.score)||result.score<0||result.score>100))throw Error('คะแนนต้องอยู่ระหว่าง 0–100');
 if(e.attendance!=='ยังไม่บันทึก'&&!result.reason.trim())throw Error('ระบุเหตุผลที่แก้ไขผลเดิม');
 const c=data.courses.find(c=>c.id===e.course)!; const status=result.attendance==='ขาดอบรม'?'ต้องอบรม':result.score!>=80?'ผ่าน':'ต้องทบทวน';
 e.history.unshift({time:new Date().toISOString(),user:actor,text:`${e.status} → ${status} · ${result.attendance} · คะแนน ${result.score??'-'}${result.reason?' · เหตุผล: '+result.reason:''}`});
 Object.assign(e,{attendance:result.attendance,score:result.attendance==='ขาดอบรม'?null:result.score,note:result.note,status,review:status==='ผ่าน'?new Date(Date.parse(TODAY+'T00:00:00Z')+c.reviewDays*86400000).toISOString().slice(0,10):''});
}
