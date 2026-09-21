import { createClient } from "@libsql/client";
import crypto from "node:crypto";

const db = createClient({ url: "file:data/chaside.db" });
await db.execute("PRAGMA foreign_keys=ON");

// ensure tables exist by calling init logic minimal – assume initDb already run via previous, else create
await db.execute(`CREATE TABLE IF NOT EXISTS estudiantes (id TEXT PRIMARY KEY, nombre_estudiante TEXT NOT NULL, nombre_padre TEXT, correo_estudiante TEXT, correo_padre TEXT, cedula_estudiante TEXT, cedula_representante TEXT, created_at INTEGER DEFAULT (unixepoch()))`);
await db.execute(`CREATE TABLE IF NOT EXISTS chaside_resultados (id TEXT PRIMARY KEY, estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE, fecha_unix INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1, top_interes TEXT NOT NULL, segundo_interes TEXT, top_aptitud TEXT NOT NULL, intereses_json TEXT NOT NULL, aptitudes_json TEXT NOT NULL, respuestas_json TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()))`);
await db.execute(`CREATE TABLE IF NOT EXISTS personalidad_resultados (id TEXT PRIMARY KEY, estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE, fecha_unix INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1, tipo TEXT NOT NULL, dimensiones_json TEXT NOT NULL, percentages_json TEXT NOT NULL, respuestas_json TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()))`);
await db.execute(`CREATE TABLE IF NOT EXISTS kuder_resultados (id TEXT PRIMARY KEY, estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE, fecha_unix INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1, top TEXT NOT NULL, ranking_json TEXT NOT NULL, scores_json TEXT NOT NULL, respuestas_json TEXT NOT NULL, verificacion TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()))`);

// clear previous seed (keep users)
await db.execute("DELETE FROM chaside_resultados");
await db.execute("DELETE FROM personalidad_resultados");
await db.execute("DELETE FROM kuder_resultados");
await db.execute("DELETE FROM estudiantes");
console.log("cleared");

// scoring helpers inline
import { readFileSync } from "node:fs";
// import QUESTIONS data manually for scoring – replicate tables
// CHASIDE tables
const INTERESES_TABLE = {
  C: [1,12,20,53,62,71,77,85,89,98],
  H: [9,19,32,42,47,56,64,70,80,95],
  A: [6,15,26,34,45,58,67,74,83,93],
  S: [8,16,23,33,41,50,57,68,82,92],
  I: [3,14,22,29,35,43,51,61,76,87],
  D: [5,17,28,38,48,60,69,79,88,94],
  E: [2,10,24,30,36,39,49,63,75,90],
};
const APTITUDES_TABLE = {
  C: [2,32,49,80],
  H: [5,14,61,83],
  A: [16,71,73,89],
  S: [23,51,64,91],
  I: [19,25,34,41],
  D: [56,59,68,82],
  E: [10,60,72,90],
};
function calculateChaside(answers){
  const intereses={}, aptitudes={};
  for(const k of Object.keys(INTERESES_TABLE)){ intereses[k]=INTERESES_TABLE[k].filter(id=>answers[id]===true).length; }
  for(const k of Object.keys(APTITUDES_TABLE)){ aptitudes[k]=APTITUDES_TABLE[k].filter(id=>answers[id]===true).length; }
  const order=["C","H","A","S","I","D","E"];
  let top="C", max=-1; for(const k of order){ if(intereses[k]>max){ max=intereses[k]; top=k; } }
  let second=null, max2=-1; for(const k of order){ if(k===top) continue; if(intereses[k]>max2){ max2=intereses[k]; second=k; } }
  // apt top with tie right
  let topA="C", maxA=-1; for(const k of order){ if(aptitudes[k]>maxA){ maxA=aptitudes[k]; topA=k; } else if(aptitudes[k]===maxA && order.indexOf(k)>order.indexOf(topA)) topA=k; }
  return { intereses, aptitudes, topInteres: top, segundoInteres: second, topAptitud: topA };
}
const KUDER_ORDER=["EXT","MEC","CAL","CIE","PER","ART","LIT","MUS","SOC","OFI"];
const KUDER_DIADAS=[
  {a:"EXT",b:"MEC"},{a:"CAL",b:"CIE"},{a:"PER",b:"ART"},{a:"LIT",b:"MUS"},{a:"SOC",b:"OFI"},{a:"EXT",b:"CAL"},{a:"CIE",b:"PER"},{a:"ART",b:"LIT"},{a:"MUS",b:"SOC"},{a:"OFI",b:"MEC"},
  {a:"EXT",b:"CIE"},{a:"PER",b:"LIT"},{a:"MUS",b:"OFI"},{a:"MEC",b:"CAL"},{a:"ART",b:"SOC"},{a:"EXT",b:"PER"},{a:"CAL",b:"ART"},{a:"LIT",b:"SOC"},{a:"MUS",b:"MEC"},{a:"OFI",b:"EXT"},
  {a:"CIE",b:"LIT"},{a:"PER",b:"MUS"},{a:"CAL",b:"SOC"},{a:"MEC",b:"ART"},{a:"EXT",b:"OFI"},{a:"CIE",b:"ART"},{a:"LIT",b:"MUS"},{a:"SOC",b:"MEC"},{a:"CAL",b:"PER"},{a:"EXT",b:"LIT"},
  {a:"CIE",b:"MUS"},{a:"PER",b:"OFI"},{a:"CAL",b:"ART"},{a:"EXT",b:"SOC"},{a:"MEC",b:"CIE"},{a:"PER",b:"ART"},{a:"LIT",b:"OFI"},{a:"MUS",b:"EXT"},{a:"SOC",b:"CAL"},{a:"MEC",b:"LIT"},
  {a:"PER",b:"EXT"},{a:"CIE",b:"OFI"},{a:"ART",b:"SOC"},{a:"MUS",b:"MEC"},{a:"OFI",b:"CAL"},{a:"EXT",b:"CIE"},{a:"PER",b:"ART"},{a:"LIT",b:"MUS"},{a:"SOC",b:"OFI"},{a:"MEC",b:"CAL"},
  {a:"EXT",b:"PER"},{a:"CIE",b:"LIT"},{a:"ART",b:"MUS"},{a:"SOC",b:"OFI"},{a:"MEC",b:"EXT"},{a:"CAL",b:"CIE"},{a:"PER",b:"LIT"},{a:"MUS",b:"OFI"},{a:"ART",b:"SOC"},{a:"MEC",b:"CAL"},
];
function calculateKuder(answers){
  const scores={EXT:0,MEC:0,CAL:0,CIE:0,PER:0,ART:0,LIT:0,MUS:0,SOC:0,OFI:0};
  for(let i=1;i<=60;i++){ const ch=answers[i]; if(!ch) continue; const d=KUDER_DIADAS[i-1]; const area= ch==="a"? d.a: d.b; scores[area]++; }
  const ranking=[...KUDER_ORDER].sort((a,b)=> scores[b]-scores[a] || KUDER_ORDER.indexOf(a)-KUDER_ORDER.indexOf(b));
  return { scores, top: ranking[0], ranking, verificacion:"válido" };
}
function calculatePersonalidad(answers){
  const dims={EI:0,SN:0,TF:0,JP:0};
  // direction mock: use pattern from personalidad.ts: for EI 1, -1 alternating, etc. Simplify random but to get realistic type distribution generate random raw -45..45
  // We'll approximate by randomizing raw directly
  for(let i=1;i<=60;i++){ const v=answers[i]; // -3..3
    // map id to dimension and direction
    let dim="EI", dir=1;
    if(i<=15){ dim="EI"; dir= (i%2===1?1:-1); if([6,14].includes(i)) dir=-1; }
    else if(i<=30){ dim="SN"; dir= (i%2===0?1:-1); }
    else if(i<=45){ dim="TF"; dir= (i%2===1?1:-1); }
    else { dim="JP"; dir= (i%2===0?1:-1); }
    dims[dim]+= v*dir;
  }
  const perc={};
  const letters={};
  for(const d of ["EI","SN","TF","JP"]){ const raw=dims[d]; perc[d]=Math.round(((raw+45)/90)*100); perc[d]=Math.max(0,Math.min(100,perc[d])); letters[d]= d==="EI"? (perc[d]>=50?"E":"I") : d==="SN"? (perc[d]>=50?"S":"N") : d==="TF"? (perc[d]>=50?"T":"F") : (perc[d]>=50?"J":"P"); }
  const type=letters["EI"]+letters["SN"]+letters["TF"]+letters["JP"];
  const dimensions={ EI:{dimension:"EI",raw:dims.EI,max:45,percent:perc["EI"],letter:letters["EI"]}, SN:{dimension:"SN",raw:dims.SN,max:45,percent:perc["SN"],letter:letters["SN"]}, TF:{dimension:"TF",raw:dims.TF,max:45,percent:perc["TF"],letter:letters["TF"]}, JP:{dimension:"JP",raw:dims.JP,max:45,percent:perc["JP"],letter:letters["JP"]} };
  const percentages={ E:dimensions.EI.percent, I:100-dimensions.EI.percent, S:dimensions.SN.percent, N:100-dimensions.SN.percent, T:dimensions.TF.percent, F:100-dimensions.TF.percent, J:dimensions.JP.percent, P:100-dimensions.JP.percent };
  return { type, dimensions, percentages };
}

const nombres=[
  "Ana Pérez","Carlos Ruiz","María López","José García","Lucía Fernández","Diego Torres","Valentina Morales","Mateo Reyes","Camila Herrera","Sebastián Castro",
  "Isabella Vargas","Santiago Jiménez","Sofía Ortega","Emilia Díaz","Daniel Rojas","Gabriela Silva","Alejandro Mendoza","Victoria Aguilar","Julián Paredes","Martina Salazar",
  "Nicolás Ramos","Renata Flores","Felipe Castillo","Antonella Vega","Tomás Fuentes","Bianca León","Joaquín Benítez","Dana Cruz","Emiliano Campos","Alana Medina",
  "Bruno Navarro","Paula Guerrero","Matías Andrade","Rafaela Ortiz","Andrés Soto","Isidora Peña","Liam Zambrano","Florencia Acosta","Gael Tapia","Julieta Molina",
  "Thiago Sandoval","Aitana Villalba","Benjamín Espinoza","Mía Carrera","Facundo Ríos","Sara Valverde","Dylan Brito","Noa Cevallos","Ian Suárez","Emma Jácome",
  "Leandro Bravo","Catalina Vera","Axel Chiriboga","Amelia Rivadeneira","Gerardo Quintero","Kiara Zambrano","Ezequiel Álvarez","Alessia Ponce","Iker Moncayo","Luciana Hidalgo",
  "Thiago Burbano","Samara Córdova","Yahir Padilla","Domenica Narváez","Elías Alvarado","Christina Solís","Noah Endara","Ariadna Yánez","Lukas Bustamante","Milena Jaramillo",
  "Derek Salazar","Juliana Arteaga","Malik Zamora","Nayeli Rosero","Zahir Villacís","Anahí Murillo","Eithan Calderón","Shayna Gallegos","Mauro Intriago","Elif Cedeño",
  "Abel Carrillo","Ainhoa Palacios","Caleb Maldonado","Naomi Guerrero","Omar Basantes","Lia Borja","Ryann Quishpe","Elaine Toapanta","Jhostin Ramírez","Keyla Oña",
  "Erick Urrutia","Melany Tibán","Justin Pico","Scarlett Haro","Anderson Gaona","Maite Loor","Kevin Arévalo","Débora Coello","Alexis Jurado","Jordy Cañar"
];
const apellidosPadre=["Gómez","Rodríguez","Martínez","López","González","Pérez","Sánchez","Ramírez","Torres","Flores"];
function randomCedula(){ return Array.from({length:10},()=>Math.floor(Math.random()*10)).join(""); }
function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randomFechaUnix(){ const now=Math.floor(Date.now()/1000); const daysAgo=Math.floor(Math.random()*90); const secsAgo=daysAgo*86400+Math.floor(Math.random()*86400); return now-secsAgo; }

const TOTAL=95;
// Distribution
let configs=[];
// 22 full
for(let i=0;i<22;i++) configs.push({c:true,p:true,k:true});
// 30 two tests
for(let i=0;i<10;i++) configs.push({c:true,p:true,k:false});
for(let i=0;i<10;i++) configs.push({c:true,p:false,k:true});
for(let i=0;i<10;i++) configs.push({c:false,p:true,k:true});
// 40 one test
for(let i=0;i<18;i++) configs.push({c:true,p:false,k:false});
for(let i=0;i<12;i++) configs.push({c:false,p:true,k:false});
for(let i=0;i<10;i++) configs.push({c:false,p:false,k:true});
// 3 zero
for(let i=0;i<3;i++) configs.push({c:false,p:false,k:false});
// shuffle configs
for(let i=configs.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [configs[i],configs[j]]=[configs[j],configs[i]]; }

let inserted=0;
for(let idx=0; idx<TOTAL; idx++){
  const nombre=nombres[idx % nombres.length] + (idx>=nombres.length? ` ${idx}`:"");
  const padre= `Sr. ${randomChoice(apellidosPadre)}`;
  const correoEst= nombre.toLowerCase().replace(/[^a-z]/g,"").slice(0,12)+ Math.floor(Math.random()*100) + "@estudiante.edu.ec";
  const correoPadre= `padre.${nombre.toLowerCase().replace(/[^a-z]/g,"").slice(0,8)}@gmail.com`;
  const cedulaEst= Math.random()<0.7 ? randomCedula() : null;
  const cedulaRepr= Math.random()<0.6 ? randomCedula() : null;
  const id=crypto.randomUUID();
  const created=Math.floor(Date.now()/1000)-Math.floor(Math.random()*90*86400);
  await db.execute({ sql:`INSERT INTO estudiantes (id,nombre_estudiante,nombre_padre,correo_estudiante,correo_padre,cedula_estudiante,cedula_representante,created_at) VALUES (?,?,?,?,?,?,?,?)`, args:[id,nombre,padre,correoEst,correoPadre,cedulaEst,cedulaRepr,created] });
  const cfg=configs[idx];
  if(cfg.c){
    const respuestas={}; for(let q=1;q<=98;q++) respuestas[q]= Math.random()<0.38;
    // ensure at least 5 SÍ
    if(Object.values(respuestas).filter(Boolean).length<5){ for(let i=0;i<5;i++) respuestas[Math.floor(Math.random()*98)+1]=true; }
    const sc=calculateChaside(respuestas);
    const fecha=randomFechaUnix();
    await db.execute({ sql:`INSERT INTO chaside_resultados (id,estudiante_id,fecha_unix,version,top_interes,segundo_interes,top_aptitud,intereses_json,aptitudes_json,respuestas_json) VALUES (?,?,?,?,?,?,?,?,?,?)`, args:[crypto.randomUUID(),id,fecha,1,sc.topInteres,sc.segundoInteres,sc.topAptitud,JSON.stringify(sc.intereses),JSON.stringify(sc.aptitudes),JSON.stringify(respuestas)] });
  }
  if(cfg.p){
    const respuestas={}; for(let q=1;q<=60;q++) respuestas[q]= (Math.floor(Math.random()*7)-3);
    const res=calculatePersonalidad(respuestas);
    const fecha=randomFechaUnix();
    await db.execute({ sql:`INSERT INTO personalidad_resultados (id,estudiante_id,fecha_unix,version,tipo,dimensiones_json,percentages_json,respuestas_json) VALUES (?,?,?,?,?,?,?,?)`, args:[crypto.randomUUID(),id,fecha,1,res.type,JSON.stringify(res.dimensions),JSON.stringify(res.percentages),JSON.stringify(respuestas)] });
  }
  if(cfg.k){
    const respuestas={}; for(let q=1;q<=60;q++) respuestas[q]= Math.random()<0.5 ? "a":"b";
    const res=calculateKuder(respuestas);
    const fecha=randomFechaUnix();
    await db.execute({ sql:`INSERT INTO kuder_resultados (id,estudiante_id,fecha_unix,version,top,ranking_json,scores_json,respuestas_json,verificacion) VALUES (?,?,?,?,?,?,?,?,?)`, args:[crypto.randomUUID(),id,fecha,1,res.top,JSON.stringify(res.ranking),JSON.stringify(res.scores),JSON.stringify(respuestas),res.verificacion] });
  }
  inserted++;
}
console.log(`seeded ${inserted} estudiantes`);
const c1=await db.execute("SELECT COUNT(*) as c FROM estudiantes"); console.log("estudiantes",c1.rows[0]);
const c2=await db.execute("SELECT COUNT(*) as c FROM chaside_resultados"); console.log("chaside",c2.rows[0]);
const c3=await db.execute("SELECT COUNT(*) as c FROM personalidad_resultados"); console.log("personalidad",c3.rows[0]);
const c4=await db.execute("SELECT COUNT(*) as c FROM kuder_resultados"); console.log("kuder",c4.rows[0]);
const overview=await db.execute("SELECT id FROM estudiantes");
console.log("total",overview.rows.length);
