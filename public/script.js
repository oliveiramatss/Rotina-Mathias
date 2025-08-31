let dormiuHora = null;
let editandoId = null;
let mlSelecionado = null;
const API = "http://192.168.1.12:3000/atividades";

// === Funções de exibição ===
function esconderMenus() {
  document.querySelectorAll("#alimentacaoOpcoes, #mamadeiraOpcoes, #comidaOpcoes, #fraldaOpcoes, #sonoOpcoes")
    .forEach(el => el.classList.add("hidden"));
}

// === Funções auxiliares ===
function limparInputs() {
  mlSelecionado = null;
  document.getElementById("mamadeiraHora").value = "";
  document.getElementById("comidaInput").value = "";
  document.getElementById("comidaHora").value = "";
  document.getElementById("fraldaHora").value = "";
}

function gerarDataComHora(horaInput) {
  const hoje = new Date();
  if(!horaInput) return hoje.toLocaleString("pt-BR");
  const [h,m] = horaInput.split(":").map(Number);
  hoje.setHours(h,m,0,0);
  return hoje.toLocaleString("pt-BR");
}

function parseBRDateTime(str){
  const [datePart, timePart] = str.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [h, m, s] = timePart.split(":").map(Number);
  return new Date(year, month-1, day, h, m, s);
}

// === Funções de registro ===
async function salvarAtividade(atividade) {
  await fetch(API, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(atividade) });
  carregarAtividades();
}

async function atualizarAtividade(id, atividade) {
  await fetch(`${API}/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(atividade) });
  carregarAtividades();
}

async function excluirAtividade(id) {
  await fetch(`${API}/${id}`, { method:"DELETE" });
  carregarAtividades();
}

// === Mamadeira ===
function selecionarMl(ml){ mlSelecionado = ml; }

async function registrarMamadeiraComHora(){
  const hora = document.getElementById("mamadeiraHora").value;
  if(!mlSelecionado) return alert("Selecione a quantidade!");
  await salvarAtividade({ texto:`Mamadeira (${mlSelecionado} ml)`, data:gerarDataComHora(hora), tipo:"mamadeira", categoria:"Alimentação" });
  limparInputs();
}

async function registrarMamadeiraAgora(){
  if(!mlSelecionado) return alert("Selecione a quantidade!");
  await salvarAtividade({ texto:`Mamadeira (${mlSelecionado} ml)`, data:new Date().toLocaleString("pt-BR"), tipo:"mamadeira", categoria:"Alimentação" });
  limparInputs();
}

// === Comida ===
async function registrarComida(){
  const input = document.getElementById("comidaInput");
  if(!input.value.trim()) return alert("Digite a refeição!");
  const hora = document.getElementById("comidaHora").value;
  await salvarAtividade({ texto:`Comida: ${input.value.trim()}`, data:gerarDataComHora(hora), tipo:"comida", categoria:"Alimentação" });
  limparInputs();
}

async function registrarComidaAgora(){
  const input = document.getElementById("comidaInput");
  if(!input.value.trim()) return alert("Digite a refeição!");
  await salvarAtividade({ texto:`Comida: ${input.value.trim()}`, data:new Date().toLocaleString("pt-BR"), tipo:"comida", categoria:"Alimentação" });
  limparInputs();
}

// === Fralda ===
async function registrarFralda(tipo){
  const hora = document.getElementById("fraldaHora").value;
  await salvarAtividade({ texto:tipo, data:gerarDataComHora(hora), tipo:"fralda", categoria:"Fralda" });
  limparInputs();
}
async function registrarFraldaAgora(tipo){
  await salvarAtividade({ texto:tipo, data:new Date().toLocaleString("pt-BR"), tipo:"fralda", categoria:"Fralda" });
}

// === Sono ===
async function registrarSono(tipo){
  const agora = new Date().toLocaleString("pt-BR");
  const aviso = document.getElementById("sonoAviso");

  if(tipo==="💤 Dormiu"){
    dormiuHora = agora;
    aviso.textContent=`Hora de dormir: ${agora.split(" ")[1]}`;
  }
  else if(tipo==="⏰ Acordou"){
    if(!dormiuHora) return alert("Registre primeiro a hora que dormiu!");
    const dormiu = parseBRDateTime(dormiuHora);
    const acordou = new Date();
    let diffMs = acordou - dormiu;
    if(diffMs < 0) diffMs += 24*60*60*1000;

    const h = Math.floor(diffMs/(1000*60*60));
    const m = Math.floor((diffMs%(1000*60*60))/(1000*60));

    const hStr = String(h).padStart(2,"0");
    const mStr = String(m).padStart(2,"0");

    await salvarAtividade({
      texto:`Dormiu às ${dormiu.toLocaleTimeString('pt-BR')} e acordou às ${acordou.toLocaleTimeString('pt-BR')} — ${hStr}h:${mStr}m`,
      data:agora,
      tipo:"sono",
      categoria:"Sono"
    });

    dormiuHora=null;
    aviso.textContent=`Último sono: ${hStr}h:${mStr}m`;
  }
}

// === Renderização ===
async function carregarAtividades() {
  const res = await fetch(API);
  const atividades = await res.json();
  const div = document.getElementById("atividades");
  div.innerHTML = "";

  const dias = {};
  atividades.forEach(atv => {
    const dataObj = parseBRDateTime(atv.data);
    const diaStr = dataObj.toLocaleDateString("pt-BR");
    if(!dias[diaStr]) dias[diaStr] = [];
    dias[diaStr].push({ ...atv, dataObj });
  });

  const diasOrdenados = Object.keys(dias).sort((a,b) => {
    const [da, ma, aa] = a.split("/").map(Number);
    const [db, mb, ab] = b.split("/").map(Number);
    return new Date(ab, mb-1, db) - new Date(aa, ma-1, da);
  });

  const hojeStr = new Date().toLocaleDateString("pt-BR");

  diasOrdenados.forEach(dia => {
    const diaDiv = document.createElement("div");
    diaDiv.className = "dia";

    const header = document.createElement("div");
    header.className = "dia-header";
    header.textContent = dia;

    const conteudo = document.createElement("div");
    conteudo.className = "dia-conteudo";

    if(dia === hojeStr) conteudo.classList.add("ativo");

    header.onclick = () => {
      document.querySelectorAll(".dia-conteudo").forEach(el => el.classList.remove("ativo"));
      conteudo.classList.add("ativo");
    };

    diaDiv.appendChild(header);

    const categorias = {};
    dias[dia].forEach(atv => {
      if(!categorias[atv.categoria]) categorias[atv.categoria] = [];
      categorias[atv.categoria].push(atv);
    });

    Object.keys(categorias).forEach(cat => {
      const catDiv = document.createElement("div");
      catDiv.className = "categoria";
      const titulo = document.createElement("h3");
      titulo.textContent = cat;
      catDiv.appendChild(titulo);

      categorias[cat]
        .sort((a,b)=> b.dataObj - a.dataObj)
        .forEach(atv => {
          const card = document.createElement("div");
          card.className = "atividade";

          card.innerHTML = `<p><b>${atv.dataObj.toLocaleTimeString("pt-BR")}</b> → ${atv.texto}</p>
                            <button onclick="atualizarAtividadePrompt(${atv.id})">✏️ Editar</button>
                            <button onclick="excluirAtividade(${atv.id})">❌ Excluir</button>`;

          catDiv.appendChild(card);
        });

      conteudo.appendChild(catDiv);
    });

    diaDiv.appendChild(conteudo);
    div.appendChild(diaDiv);
  });
}

// === Auto refresh a cada 2 minutos ===
setInterval(carregarAtividades, 2*60*1000);

// === Botões principais ===
document.getElementById("btnAlimentacao").addEventListener("click",()=>{ esconderMenus(); document.getElementById("alimentacaoOpcoes").classList.remove("hidden"); });
document.getElementById("btnFralda").addEventListener("click",()=>{ esconderMenus(); document.getElementById("fraldaOpcoes").classList.remove("hidden"); });
document.getElementById("btnSono").addEventListener("click",()=>{ esconderMenus(); document.getElementById("sonoOpcoes").classList.remove("hidden"); });

document.getElementById("btnMamadeira").addEventListener("click",()=>{
  document.getElementById("mamadeiraOpcoes").classList.remove("hidden");
  document.getElementById("comidaOpcoes").classList.add("hidden");
  const div=document.querySelector(".quantidades"); 
  div.innerHTML="";
  for(let ml=90; ml<=300; ml+=30){ 
    const btn=document.createElement("button"); 
    btn.textContent=ml+" ml"; 
    btn.addEventListener("click",()=>selecionarMl(ml)); 
    div.appendChild(btn); 
  } 
});

document.getElementById("btnComida").addEventListener("click",()=>{
  document.getElementById("comidaOpcoes").classList.remove("hidden");
  document.getElementById("mamadeiraOpcoes").classList.add("hidden");
});

// Mamadeira
document.getElementById("btnMamadeiraEnviar").addEventListener("click", registrarMamadeiraComHora);
document.getElementById("btnMamadeiraAgora").addEventListener("click", registrarMamadeiraAgora);

// Comida
document.getElementById("btnComidaEnviar").addEventListener("click", registrarComida);
document.getElementById("btnComidaAgora").addEventListener("click", registrarComidaAgora);

// Fralda
document.getElementById("btnXixiEnviar").addEventListener("click", ()=>registrarFralda('💧 Xixi'));
document.getElementById("btnXixiAgora").addEventListener("click", ()=>registrarFraldaAgora('💧 Xixi'));
document.getElementById("btnCocoEnviar").addEventListener("click", ()=>registrarFralda('💩 Cocô'));
document.getElementById("btnCocoAgora").addEventListener("click", ()=>registrarFraldaAgora('💩 Cocô'));
document.getElementById("btnMistoEnviar").addEventListener("click", ()=>registrarFralda('🌀 Misto'));
document.getElementById("btnMistoAgora").addEventListener("click", ()=>registrarFraldaAgora('🌀 Misto'));

// Sono
document.getElementById("btnDormiu").addEventListener("click", ()=>registrarSono('💤 Dormiu'));
document.getElementById("btnAcordou").addEventListener("click", ()=>registrarSono('⏰ Acordou'));

// Inicializa
carregarAtividades();

// === Slideshow de background ===
const backgrounds = [
  "img/foto1.jpg",
  "img/foto2.jpg",
  "img/foto3.jpg"
];

let index = 0;
const body = document.body;

function changeBackground() {
  body.style.backgroundImage = `url('${backgrounds[index]}')`;
  body.style.backgroundRepeat = "no-repeat";
  body.style.backgroundPosition = "center";
  body.style.backgroundSize = "auto";
  index = (index + 1) % backgrounds.length;
}

changeBackground();
setInterval(changeBackground, 100000);
