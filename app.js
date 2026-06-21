// VERSÃO 53

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// TROQUE ESTES DADOS PELOS DADOS DO SEU FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAQszm5MRBszffXrrPxJHlcSoOoLYo5A6g",
  authDomain: "bolao-copa-2026-48fc2.firebaseapp.com",
  projectId: "bolao-copa-2026-48fc2",
  storageBucket: "bolao-copa-2026-48fc2.firebasestorage.app",
  messagingSenderId: "866731236351",
  appId: "1:866731236351:web:0bc6c58d7fd7da8224a5ca"
};

// ===============================
// FOOTBALL-DATA.ORG / COPA DO MUNDO
// ===============================

const FOOTBALL_DATA_TOKEN = "1788502d181a4a8aa6d072dc0d12096d";
const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const FOOTBALL_DATA_COMPETICAO = 2000;
const FOOTBALL_DATA_PROXY = "https://corsproxy.io/?url=";

async function testarFootballDataHoje() {
  try {
    console.log("Testando football-data.org...");

    const dataDeISO = "2026-06-20";
    const dataAteISO = "2026-06-20";

    const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${FOOTBALL_DATA_COMPETICAO}/matches?dateFrom=${dataDeISO}&dateTo=${dataAteISO}`;

const response = await fetch(
  FOOTBALL_DATA_PROXY + encodeURIComponent(url) + `&_=${Date.now()}`,
  {
    headers: {
      "X-Auth-Token": FOOTBALL_DATA_TOKEN
    },
    cache: "no-store"
  }
);

    const data = await response.json();

    console.log("Resposta football-data.org:", data);

    if (!response.ok) {
      alert("Erro na football-data.org. Veja o console.");
      return;
    }

    const jogos = (data.matches || []).map((jogo) => ({
      id: jogo.id,
      data: jogo.utcDate,
      status: jogo.status,
      casa: jogo.homeTeam?.name,
      fora: jogo.awayTeam?.name,
      golsCasa: jogo.score?.fullTime?.home,
      golsFora: jogo.score?.fullTime?.away
    }));

    console.table(jogos);

    alert(`football-data respondeu. Jogos encontrados: ${jogos.length}`);

  } catch (error) {
    console.error("Erro ao testar football-data.org:", error);
    alert("Erro ao testar football-data.org. Veja o console.");
  }
}

window.testarFootballDataHoje = testarFootballDataHoje;

// ===============================
// SINCRONIZAR FOOTBALL-DATA COM FIRESTORE
// ===============================

const MAPA_TIMES_FOOTBALL_DATA = {
  "Mexico": "MÉXICO",
  "South Africa": "ÁFRICA DO SUL",
  "South Korea": "COREIA DO SUL",
  "Czechia": "TCHEQUIA",

  "Canada": "CANADÁ",
  "Bosnia-Herzegovina": "BÓSNIA-HERZEGOVINA",
  "Bosnia and Herzegovina": "BÓSNIA-HERZEGOVINA",
  "Qatar": "QATAR",
  "Switzerland": "SUÍÇA",

  "Brazil": "BRASIL",
  "Haiti": "HAITI",
  "Scotland": "ESCÓCIA",
  "Morocco": "MARROCOS",

  "United States": "ESTADOS UNIDOS",
  "Australia": "AUSTRÁLIA",
  "Turkey": "TURQUIA",
  "Paraguay": "PARAGUAI",

  "Germany": "ALEMANHA",
  "Curaçao": "CURAÇAU",
  "Curacao": "CURAÇAU",
  "Ivory Coast": "COSTA DO MARFIM",
  "Ecuador": "EQUADOR",

  "Netherlands": "HOLANDA",
  "Sweden": "SUÉCIA",
  "Tunisia": "TUNÍSIA",
  "Japan": "JAPÃO",

  "Belgium": "BÉLGICA",
  "Egypt": "EGITO",
  "Iran": "IRÃ",
  "New Zealand": "NOVA ZELÂNDIA",

  "Spain": "ESPANHA",
  "Cape Verde": "CABO VERDE",
  "Saudi Arabia": "ARÁBIA SAUDITA",
  "Uruguay": "URUGUAI",

  "France": "FRANÇA",
  "Senegal": "SENEGAL",
  "Iraq": "IRAQUE",
  "Norway": "NORUEGA",

  "Argentina": "ARGENTINA",
  "Algeria": "ARGÉLIA",
  "Austria": "ÁUSTRIA",
  "Jordan": "JORDÂNIA",

  "Portugal": "PORTUGAL",
  "Congo DR": "CONGO DR",
  "DR Congo": "CONGO DR",
  "Uzbekistan": "UZBEQUISTÃO",
  "Colombia": "COLÔMBIA",

  "England": "INGLATERRA",
  "Croatia": "CROÁCIA",
  "Ghana": "GANA",
  "Panama": "PANAMÁ"
};

function normalizarNomeTime(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function traduzirTimeFootballData(nomeApi) {
  return MAPA_TIMES_FOOTBALL_DATA[nomeApi] || nomeApi;
}

function statusFootballDataParaFirestore(statusApi) {
  if (statusApi === "FINISHED") return "finished";
  if (statusApi === "IN_PLAY" || statusApi === "PAUSED") return "live";
  return "scheduled";
}

function dadosHorarioBrasil(utcDate) {
  const dataUtc = new Date(utcDate);

  // Brasil/Bahia = UTC-3
  const dataBrasil = new Date(dataUtc.getTime() - 3 * 60 * 60 * 1000);

  const ano = dataBrasil.getUTCFullYear();
  const mes = String(dataBrasil.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(dataBrasil.getUTCDate()).padStart(2, "0");
  const hora = String(dataBrasil.getUTCHours()).padStart(2, "0");
  const minuto = String(dataBrasil.getUTCMinutes()).padStart(2, "0");

  return {
    date: `${ano}-${mes}-${dia}`,
    kickoff: `${ano}-${mes}-${dia}T${hora}:${minuto}:00`
  };
}

async function buscarFootballDataPorPeriodo(dataInicioISO, dataFimISO) {
  const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${FOOTBALL_DATA_COMPETICAO}/matches?dateFrom=${dataInicioISO}&dateTo=${dataFimISO}`;

  const response = await fetch(
    FOOTBALL_DATA_PROXY + encodeURIComponent(url) + `&_=${Date.now()}`,
    {
      headers: {
        "X-Auth-Token": FOOTBALL_DATA_TOKEN
      },
      cache: "no-store"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro football-data:", data);
    throw new Error("Erro ao buscar dados na football-data.");
  }

  return data.matches || [];
}

async function sincronizarFootballDataPeriodo(dataInicioISO, dataFimISO) {
  try {
    console.log(`Sincronizando jogos de ${dataInicioISO} até ${dataFimISO}...`);

    const jogosApi = await buscarFootballDataPorPeriodo(dataInicioISO, dataFimISO);

    const snapshot = await getDocs(collection(db, "matches"));
    const jogosFirestore = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }));

    let atualizados = 0;
    let naoEncontrados = [];

    for (const jogoApi of jogosApi) {
      const casaApi = traduzirTimeFootballData(jogoApi.homeTeam?.name);
      const foraApi = traduzirTimeFootballData(jogoApi.awayTeam?.name);
      const horarioBrasil = dadosHorarioBrasil(jogoApi.utcDate);
const dataApi = horarioBrasil.date;
const kickoffApi = horarioBrasil.kickoff;

      const casaNormalizada = normalizarNomeTime(casaApi);
      const foraNormalizada = normalizarNomeTime(foraApi);

  const jogoFirestore = jogosFirestore.find((jogo) => {
  if (jogo.apiMatchId && Number(jogo.apiMatchId) === Number(jogoApi.id)) {
    return true;
  }

  const dataFirestore = jogo.date;

  const dataAnteriorApi = new Date(new Date(jogoApi.utcDate).getTime() - 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const mesmaData =
    dataFirestore === dataApi ||
    dataFirestore === dataAnteriorApi;

  const casaFirestore = normalizarNomeTime(jogo.homeTeam);
  const foraFirestore = normalizarNomeTime(jogo.awayTeam);

  const mesmosTimes =
    casaFirestore === casaNormalizada &&
    foraFirestore === foraNormalizada;

  return mesmaData && mesmosTimes;
});

      if (!jogoFirestore) {
  const novoStatus = statusFootballDataParaFirestore(jogoApi.status);

  const novoJogo = {
    homeTeam: casaApi,
    awayTeam: foraApi,
   date: dataApi,
kickoff: kickoffApi,
    status: novoStatus,
    apiProvider: "football-data",
    apiMatchId: jogoApi.id,
    createdFromApiAt: new Date().toISOString(),
    updatedFromApiAt: new Date().toISOString()
  };

  if (jogoApi.score?.fullTime?.home !== null && jogoApi.score?.fullTime?.home !== undefined) {
    novoJogo.homeScore = Number(jogoApi.score.fullTime.home);
  }

  if (jogoApi.score?.fullTime?.away !== null && jogoApi.score?.fullTime?.away !== undefined) {
    novoJogo.awayScore = Number(jogoApi.score.fullTime.away);
  }

  await addDoc(collection(db, "matches"), novoJogo);

  atualizados++;
  continue;
}

      const novoStatus = statusFootballDataParaFirestore(jogoApi.status);

    const novosDados = {
  homeTeam: casaApi,
  awayTeam: foraApi,
  date: dataApi,
  kickoff: kickoffApi,
  status: novoStatus,
  apiProvider: "football-data",
  apiMatchId: jogoApi.id,
  updatedFromApiAt: new Date().toISOString()
};

      if (jogoApi.score?.fullTime?.home !== null && jogoApi.score?.fullTime?.home !== undefined) {
        novosDados.homeScore = Number(jogoApi.score.fullTime.home);
      }

      if (jogoApi.score?.fullTime?.away !== null && jogoApi.score?.fullTime?.away !== undefined) {
        novosDados.awayScore = Number(jogoApi.score.fullTime.away);
      }

      await updateDoc(doc(db, "matches", jogoFirestore.id), novosDados);

      atualizados++;
    }

    console.log("Jogos atualizados:", atualizados);
    console.table(naoEncontrados);

    alert(`Sincronização concluída. Atualizados: ${atualizados}. Não encontrados: ${naoEncontrados.length}`);

  } catch (error) {
    console.error("Erro ao sincronizar football-data:", error);
    alert("Erro ao sincronizar API com Firestore. Veja o console.");
  }
}

async function sincronizarFootballDataHoje() {
  const hojeISO = new Date().toISOString().slice(0, 10);
  await sincronizarFootballDataPeriodo(hojeISO, hojeISO);
}

window.sincronizarFootballDataHoje = sincronizarFootballDataHoje;
window.sincronizarFootballDataPeriodo = sincronizarFootballDataPeriodo;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioAtual = null;
let dadosUsuarioAtual = null;

let alvoContagem = null;
let alvoContagemAmanha = null;
let intervaloContagem = null;

const loginBox = document.getElementById("loginBox");
const conteudo = document.getElementById("conteudo");
const saudacao = document.getElementById("saudacao");
const btnEntrar = document.getElementById("btnEntrar");
const btnSair = document.getElementById("btnSair");
const loginErro = document.getElementById("loginErro");
const adminBox = document.getElementById("adminBox");

btnEntrar.addEventListener("click", entrar);
btnSair.addEventListener("click", sair);
document.getElementById("btnCadastrarJogo").addEventListener("click", cadastrarJogo);
const btnResultados = document.getElementById("btnResultados");
const btnMeusPalpites = document.getElementById("btnMeusPalpites");

if (btnResultados) {
  btnResultados.addEventListener("click", () => trocarAba("resultados"));
}

if (btnMeusPalpites) {
  btnMeusPalpites.addEventListener("click", () => trocarAba("palpites"));
}
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioAtual = user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      saudacao.innerText = "Usuário não autorizado";
      await signOut(auth);
      return;
    }

    dadosUsuarioAtual = userSnap.data();

    saudacao.innerText = `Olá, ${dadosUsuarioAtual.nome}`;
    loginBox.classList.add("escondido");
    conteudo.classList.remove("escondido");
    btnSair.classList.remove("escondido");

    if (dadosUsuarioAtual.admin === true) {
      adminBox.classList.remove("escondido");
    } else {
      adminBox.classList.add("escondido");
    }

 await carregarTudo();
iniciarContagemEmTempoReal();
iniciarAtualizacaoAutomatica();
  } else {
    usuarioAtual = null;
    dadosUsuarioAtual = null;

    saudacao.innerText = "Faça login para entrar";
    loginBox.classList.remove("escondido");
    conteudo.classList.add("escondido");
    btnSair.classList.add("escondido");
    adminBox.classList.add("escondido");
  }
});

async function entrar() {
  loginErro.innerText = "";

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    console.log("Erro no login:", error.code, error.message);
    loginErro.innerText = `Erro: ${error.code}`;
  }
}
async function sair() {
  await signOut(auth);
}

async function carregarTudo() {
  await carregarPainelTempo();
  await carregarJogosHoje();
  await carregarJogosAmanha();
  await carregarResultadosAnteriores();
  await carregarMeusPalpites();
  await carregarRanking();
}

function formatarDataLocalISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function hojeISO() {
  return formatarDataLocalISO(new Date());
}

function amanhaISO() {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  return formatarDataLocalISO(amanha);
}

function jogoComecou(jogo) {
  return new Date(jogo.kickoff).getTime() <= Date.now();
}

function jogoLiberadoParaPalpite(jogo) {
  if (jogo.status !== "scheduled") return false;

  const agora = Date.now();
  const inicio = new Date(jogo.kickoff).getTime();
  const abre = inicio - 4 * 60 * 60 * 1000;

  return agora >= abre && agora < inicio;
}

function jogoEncerradoAindaFicaHoje(jogo) {
  if (jogo.status !== "finished") return false;

  const agora = Date.now();
  const inicio = new Date(jogo.kickoff).getTime();

  // 2h de jogo + 2h de tolerância = 4h após o kickoff
  const limite = inicio + 4 * 60 * 60 * 1000;

  return agora <= limite;
}

function jogoDeveAparecerHoje(jogo) {
  if (jogo.status === "live") return true;
  if (jogo.status === "finished") return jogoEncerradoAindaFicaHoje(jogo);
  if (jogo.status === "scheduled") return jogoLiberadoParaPalpite(jogo) || jogoComecou(jogo);

  return false;
}

function jogoDeveAparecerAmanha(jogo) {
  return jogo.status === "scheduled" && !jogoLiberadoParaPalpite(jogo) && !jogoComecou(jogo);
}

async function carregarJogosHoje() {
  const jogosHojeDiv = document.getElementById("jogosHoje");
  const statusRodada = document.getElementById("statusRodada");

  jogosHojeDiv.innerHTML = "";

  try {
    const hoje = hojeISO();
    const amanha = amanhaISO();

    const qHoje = query(
      collection(db, "matches"),
      where("date", "in", [hoje, amanha])
    );

    const snap = await getDocs(qHoje);

    const todosJogos = [];
    snap.forEach((docSnap) => {
      todosJogos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    const jogos = todosJogos
      .filter((jogo) => {
        const dataJogo = jogo.date;

        if (dataJogo === hoje) {
          return jogoDeveAparecerHoje(jogo);
        }

        // Jogos de amanhã só entram em "hoje" se já abriram individualmente
        if (dataJogo === amanha) {
          return jogoLiberadoParaPalpite(jogo);
        }

        return false;
      })
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    if (jogos.length === 0) {
      statusRodada.innerText = "Nenhum jogo aberto no momento.";
      return;
    }

    const existeAbertoParaPalpite = jogos.some((jogo) => jogoLiberadoParaPalpite(jogo));

    statusRodada.innerText = existeAbertoParaPalpite
      ? "Rodada aberta para palpites."
      : "Nenhum palpite aberto no momento.";

    for (const jogo of jogos) {
      const podePalpitarEsteJogo = jogoLiberadoParaPalpite(jogo);
      const card = await criarCardJogo(jogo, podePalpitarEsteJogo);
      jogosHojeDiv.appendChild(card);
    }

  } catch (error) {
    console.log("Erro ao carregar jogos de hoje:", error);
    statusRodada.innerText = `Erro ao carregar jogos: ${error.code}`;
  }
}

async function carregarJogosAmanha() {
  const jogosAmanhaDiv = document.getElementById("jogosAmanha");
  jogosAmanhaDiv.innerHTML = "";

  try {
    const q = query(
      collection(db, "matches"),
      where("date", "==", amanhaISO())
    );

    const snap = await getDocs(q);

    const jogos = [];
    snap.forEach((docSnap) => {
      const jogo = {
        id: docSnap.id,
        ...docSnap.data()
      };

      if (jogoDeveAparecerAmanha(jogo)) {
        jogos.push(jogo);
      }
    });

    jogos.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    if (jogos.length === 0) {
      jogosAmanhaDiv.innerHTML = "<p>Nenhum jogo bloqueado para amanhã.</p>";
      alvoContagemAmanha = null;
      return;
    }

    const proximoJogoBloqueado = jogos[0];
    const aberturaProximoJogo = new Date(proximoJogoBloqueado.kickoff).getTime() - 4 * 60 * 60 * 1000;
    const agora = Date.now();

    alvoContagemAmanha = new Date(aberturaProximoJogo);

    const aviso = document.createElement("p");

    if (agora >= aberturaProximoJogo) {
      aviso.innerHTML = `<strong>O próximo jogo já está dentro da janela de abertura.</strong>`;
    } else {
      aviso.innerHTML = `<strong>Próximo jogo abre em <span id="contadorAmanha">${formatarContagem(aberturaProximoJogo - agora)}</span></strong>`;
    }

    jogosAmanhaDiv.appendChild(aviso);

    jogos.forEach((jogo) => {
      const item = document.createElement("div");
      item.className = "jogo-mini";
      item.innerHTML = `
        <span>${formatarHora(jogo.kickoff)}</span>
        <strong>${jogo.homeTeam} x ${jogo.awayTeam}</strong>
        <span class="status-fechado">Bloqueado</span>
      `;

      jogosAmanhaDiv.appendChild(item);
    });
  } catch (error) {
    console.log("Erro ao carregar jogos de amanhã:", error);
    jogosAmanhaDiv.innerHTML = `<p>Erro ao carregar jogos: ${error.code}</p>`;
  }
}

async function criarCardJogo(jogo, rodadaAberta) {
  const div = document.createElement("div");
  div.className = "jogo";

  const palpiteId = `${usuarioAtual.uid}_${jogo.id}`;
  const palpiteRef = doc(db, "predictions", palpiteId);
  const palpiteSnap = await getDoc(palpiteRef);

  let homeGuess = "";
  let awayGuess = "";
  let editCount = 0;
  let jaTemPalpite = false;

  if (palpiteSnap.exists()) {
    const p = palpiteSnap.data();
    homeGuess = p.homeGuess ?? "";
    awayGuess = p.awayGuess ?? "";
    editCount = p.editCount ?? 0;
    jaTemPalpite = true;
  }

  const agora = new Date();
  const horarioJogo = new Date(jogo.kickoff);

  const jogoJaComecou = agora >= horarioJogo;
  const atingiuLimiteAlteracoes = editCount >= 2;

  const estaAoVivo = jogoJaComecou && jogo.status !== "finished";
const placarCasa = jogo.homeScore ?? 0;
const placarFora = jogo.awayScore ?? 0;

  const estaFinalizado = jogo.status === "finished";

if (estaFinalizado) {
  div.classList.add("jogo-finalizado");

  div.innerHTML = `
    <div class="finalizado-topo">
      <span class="badge-finalizado">ENCERRADO</span>
    </div>

    <div class="placar-live">
      <div class="time-live">
        <strong>${jogo.homeTeam}</strong>
      </div>

      <div class="score-live final">
        <span>${placarCasa}</span>
        <small>x</small>
        <span>${placarFora}</span>
      </div>

      <div class="time-live direita">
        <strong>${jogo.awayTeam}</strong>
      </div>
    </div>

    <div class="detalhes-live">
      <p>Resumo do jogo aparecerá aqui quando a API estiver conectada.</p>
    </div>
  `;

  return div;
}

  if (estaAoVivo) {
  div.classList.add("jogo-ao-vivo");

  div.innerHTML = `
    <div class="ao-vivo-topo">
      <div class="ao-vivo-label">
        <span class="bolinha-ao-vivo"></span>
        AO VIVO
      </div>
    </div>

    <div class="placar-live">
      <div class="time-live">
        <strong>${jogo.homeTeam}</strong>
      </div>

      <div class="score-live">
        <span>${placarCasa}</span>
        <small>x</small>
        <span>${placarFora}</span>
      </div>

      <div class="time-live direita">
        <strong>${jogo.awayTeam}</strong>
      </div>
    </div>

    <div class="detalhes-live">
      <p>Eventos do jogo aparecerão aqui quando a API estiver conectada.</p>
    </div>
  `;

  return div;
}
  
  const podePalpitar =
    rodadaAberta &&
    !jogoJaComecou &&
    !atingiuLimiteAlteracoes;

  const alteracoesRestantes = Math.max(0, 2 - editCount);

  let statusPalpite = "";

  if (!rodadaAberta) {
    statusPalpite = "Rodada ainda fechada.";
  } else if (jogoJaComecou) {
    statusPalpite = "Jogo iniciado. Palpite travado.";
  } else if (atingiuLimiteAlteracoes) {
    statusPalpite = "Limite de alterações atingido. Palpite travado.";
  } else if (jaTemPalpite) {
    statusPalpite = `Alterações restantes: ${alteracoesRestantes}`;
  } else {
    statusPalpite = "Você ainda não palpitou.";
  }

  div.innerHTML = `
    <div class="times">
      <span>${jogo.homeTeam}</span>
      <span>x</span>
      <span>${jogo.awayTeam}</span>
    </div>

   <p>${formatarHora(jogo.kickoff)}</p>

${estaAoVivo ? `
  <div class="ao-vivo-label">
    <span class="bolinha-ao-vivo"></span>
    AO VIVO
  </div>
  <div class="placar-atual">
    ${jogo.homeTeam} ${placarCasa} x ${placarFora} ${jogo.awayTeam}
  </div>
` : ""}

<p class="status-palpite">${statusPalpite}</p>

    <div class="palpite">
      <input type="number" min="0" value="${homeGuess}" ${podePalpitar ? "" : "disabled"} />
      <span>x</span>
      <input type="number" min="0" value="${awayGuess}" ${podePalpitar ? "" : "disabled"} />
    </div>

   <button class="btn ${podePalpitar ? "" : "travado"}" ${podePalpitar ? "" : "disabled"}>
  ${podePalpitar ? "Salvar palpite" : "Palpite travado"}
</button>
  `;

  const inputs = div.querySelectorAll("input");
  const botao = div.querySelector("button");

  botao.addEventListener("click", async () => {
    const casa = Number(inputs[0].value);
    const fora = Number(inputs[1].value);

    if (inputs[0].value === "" || inputs[1].value === "") {
      botao.innerText = "Preencha o placar!";
      setTimeout(() => {
        botao.innerText = "Salvar palpite";
      }, 1500);
      return;
    }

    const novoEditCount = jaTemPalpite ? editCount + 1 : 0;

    await setDoc(palpiteRef, {
      userId: usuarioAtual.uid,
      userName: dadosUsuarioAtual.nome,
      matchId: jogo.id,
      homeTeam: jogo.homeTeam,
      awayTeam: jogo.awayTeam,
      homeGuess: casa,
      awayGuess: fora,
      points: 0,
      editCount: novoEditCount,
      locked: novoEditCount >= 2,
      createdAt: jaTemPalpite ? palpiteSnap.data().createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    botao.innerText = "Palpite salvo!";

    setTimeout(async () => {
      await carregarTudo();
    }, 1000);
  });

  return div;
}

function rodadaEstaAberta(jogos) {
  const horarios = jogos.map(jogo => new Date(jogo.kickoff).getTime());
  const primeiroJogo = new Date(Math.min(...horarios));

  const abertura = new Date(primeiroJogo.getTime() - 4 * 60 * 60 * 1000);

  return new Date() >= abertura;
}

function formatarHora(dataISO) {
  const data = new Date(dataISO);

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function carregarRanking() {
  const rankingDiv = document.getElementById("ranking");
  rankingDiv.innerHTML = "";

  const usersSnap = await getDocs(collection(db, "users"));
  const matchesSnap = await getDocs(collection(db, "matches"));
  const predictionsSnap = await getDocs(collection(db, "predictions"));

  const usuarios = [];
  usersSnap.forEach((docSnap) => {
    usuarios.push({
      id: docSnap.id,
      ...docSnap.data(),
      pontosCalculados: 0
    });
  });

  const jogosFinalizados = [];
  matchesSnap.forEach((docSnap) => {
    const jogo = {
      id: docSnap.id,
      ...docSnap.data()
    };

    if (jogo.status === "finished") {
      jogosFinalizados.push(jogo);
    }
  });

  const palpites = [];
  predictionsSnap.forEach((docSnap) => {
    palpites.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  usuarios.forEach((usuario) => {
    let total = 0;

    jogosFinalizados.forEach((jogo) => {
      const palpite = palpites.find((p) =>
        p.userId === usuario.id &&
        p.matchId === jogo.id
      );

      if (palpite) {
        total += calcularPontos(
          palpite.homeGuess,
          palpite.awayGuess,
          jogo.homeScore,
          jogo.awayScore
        );
      }
    });

    usuario.pontosCalculados = total;
  });

  usuarios.sort((a, b) => b.pontosCalculados - a.pontosCalculados);

  usuarios.forEach((usuario, index) => {
    const div = document.createElement("div");
    div.className = "ranking-item";

    div.innerHTML = `
      <span>${index + 1}. ${usuario.nome}</span>
      <strong>${usuario.pontosCalculados} pts</strong>
    `;

    rankingDiv.appendChild(div);
  });
}

async function cadastrarJogo() {
  const data = document.getElementById("dataJogo").value;
  const hora = document.getElementById("horaJogo").value;
  const timeCasa = document.getElementById("timeCasa").value;
  const timeFora = document.getElementById("timeFora").value;
  const adminMsg = document.getElementById("adminMsg");

  if (!data || !hora || !timeCasa || !timeFora) {
    adminMsg.innerText = "Preencha todos os campos.";
    return;
  }

  const kickoff = `${data}T${hora}:00`;

  await addDoc(collection(db, "matches"), {
    date: data,
    kickoff,
    homeTeam: timeCasa,
    awayTeam: timeFora,
    homeScore: null,
    awayScore: null,
    status: "scheduled"
  });

  adminMsg.innerText = "Jogo cadastrado com sucesso!";

  document.getElementById("dataJogo").value = "";
  document.getElementById("horaJogo").value = "";
  document.getElementById("timeCasa").value = "";
  document.getElementById("timeFora").value = "";

  await carregarTudo();
}

function horarioAberturaRodada(jogos) {
  const horarios = jogos.map(jogo => new Date(jogo.kickoff).getTime());
  const primeiroJogo = new Date(Math.min(...horarios));
  return new Date(primeiroJogo.getTime() - 4 * 60 * 60 * 1000);
}

function formatarContagem(ms) {
  if (ms <= 0) return "00h 00m 00s";

  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  return `${String(horas).padStart(2, "0")}h ${String(minutos).padStart(2, "0")}m ${String(segundos).padStart(2, "0")}s`;
}

function statusDoJogo(jogo, rodadaAberta) {
  const agora = new Date();
  const kickoff = new Date(jogo.kickoff);

  if (jogo.status === "finished") {
    return {
      texto: "Finalizado",
      classe: "status-travado"
    };
  }

  if (agora >= kickoff) {
    return {
      texto: "Travado",
      classe: "status-travado"
    };
  }

  if (rodadaAberta) {
    return {
      texto: "Aberto",
      classe: "status-aberto"
    };
  }

  return {
    texto: "Fechado",
    classe: "status-fechado"
  };
}

async function carregarPainelTempo() {
  const titulo = document.getElementById("tituloContagem");
  const texto = document.getElementById("textoContagem");
  const contador = document.getElementById("contadorPrincipal");

  const q = query(
    collection(db, "matches"),
    where("date", "==", hojeISO())
  );

  const snap = await getDocs(q);

  const jogos = [];
  snap.forEach((docSnap) => {
    jogos.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  jogos.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  if (jogos.length === 0) {
    titulo.innerText = "Nenhum jogo hoje";
    texto.innerText = "Quando houver jogos cadastrados, a contagem aparecerá aqui.";
    contador.innerText = "--:--:--";
    alvoContagem = null;
    return;
  }

  const agora = new Date();
  const abertura = horarioAberturaRodada(jogos);
  const rodadaAberta = agora >= abertura;

  const proximosJogos = jogos.filter(jogo => new Date(jogo.kickoff) > agora);

  if (!rodadaAberta) {
    titulo.innerText = "Rodada fechada";
    texto.innerText = "Palpites abrem 4 horas antes do primeiro jogo.";
    alvoContagem = abertura;
    contador.innerText = formatarContagem(alvoContagem - agora);
    return;
  }

 if (proximosJogos.length > 0) {
  let jogoAlvo = null;
  let aindaPodePalpitar = false;

  for (const jogo of proximosJogos) {
    const palpite = await obterPalpiteDoUsuario(jogo.id);

    if (!palpite) {
      jogoAlvo = jogo;
      aindaPodePalpitar = true;
      break;
    }

    const editCount = palpite.editCount ?? 0;

    if (editCount < 2) {
      jogoAlvo = jogo;
      aindaPodePalpitar = true;
      break;
    }
  }

  if (!jogoAlvo) {
    jogoAlvo = proximosJogos[0];
  }

  titulo.innerText = `${jogoAlvo.homeTeam} x ${jogoAlvo.awayTeam}`;

  if (aindaPodePalpitar) {
    texto.innerText = "Rodada aberta";
  } else {
    texto.innerText = "Jogo inicia";
  }

  alvoContagem = new Date(jogoAlvo.kickoff);
  contador.innerText = formatarContagem(alvoContagem - agora);
  return;
}

  titulo.innerText = "Jogos do dia em andamento ou encerrados";
  texto.innerText = "Os palpites dos jogos de hoje já foram travados.";
  contador.innerText = "00h 00m 00s";
  alvoContagem = null;
}

async function carregarResultadosAnteriores() {
  const painel = document.getElementById("painelResultados");
  painel.innerHTML = "";

  const snap = await getDocs(collection(db, "matches"));

  const jogos = [];
  snap.forEach((docSnap) => {
    jogos.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  const finalizados = jogos
    .filter(jogo => jogo.status === "finished")
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

  if (finalizados.length === 0) {
    painel.innerHTML = "<p>Nenhum resultado anterior ainda.</p>";
    return;
  }

  finalizados.forEach((jogo) => {
    const div = document.createElement("div");
    div.className = "linha-info";
    div.innerHTML = `
      <strong>${jogo.homeTeam} ${jogo.homeScore} x ${jogo.awayScore} ${jogo.awayTeam}</strong>
      <span>${jogo.date} — ${formatarHora(jogo.kickoff)}</span>
      <br>
      <span class="badge finalizado">Finalizado</span>
    `;

    painel.appendChild(div);
  });
}

async function carregarMeusPalpites() {
  const painel = document.getElementById("painelMeusPalpites");
  painel.innerHTML = "";

  const q = query(
    collection(db, "predictions"),
    where("userId", "==", usuarioAtual.uid)
  );

  const snap = await getDocs(q);

  const palpites = [];
  snap.forEach((docSnap) => {
    palpites.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  if (palpites.length === 0) {
    painel.innerHTML = "<p>Você ainda não fez nenhum palpite.</p>";
    return;
  }

  for (const palpite of palpites) {
    const jogoRef = doc(db, "matches", palpite.matchId);
    const jogoSnap = await getDoc(jogoRef);

    if (!jogoSnap.exists()) continue;

    const jogo = jogoSnap.data();

    const agora = new Date();
    const jogoComecou = agora >= new Date(jogo.kickoff);
    const jogoFinalizado = jogo.status === "finished";
    const jogoAoVivo = jogoComecou && !jogoFinalizado;

    let statusTexto = "Agendado";
    let badgeClasse = "agendado";
    let comparacao = "Aguardando o jogo acontecer.";

    if (jogoAoVivo) {
      statusTexto = "AO VIVO";
      badgeClasse = "ao-vivo";
      comparacao = `Placar atual: ${jogo.homeScore ?? 0} x ${jogo.awayScore ?? 0}`;
    }

    if (jogoFinalizado) {
      statusTexto = "Encerrado";
      badgeClasse = "finalizado";
      comparacao = textoResultadoPalpite(
        palpite.homeGuess,
        palpite.awayGuess,
        jogo.homeScore,
        jogo.awayScore
      );
    }

    const div = document.createElement("div");
    div.className = "linha-info";
    div.innerHTML = `
      <strong>${jogo.homeTeam} x ${jogo.awayTeam}</strong>
      <span>Seu palpite: ${palpite.homeGuess} x ${palpite.awayGuess}</span>
      <br>
      <span>${comparacao}</span>
      <br>
      <span class="badge ${badgeClasse}">${statusTexto}</span>
    `;

    painel.appendChild(div);
  }
}

function textoResultadoPalpite(palpiteCasa, palpiteFora, realCasa, realFora) {
  const pontos = calcularPontos(palpiteCasa, palpiteFora, realCasa, realFora);

  if (pontos === 3) {
    return "MAIS TREXXXXX PONTOS!!!";
  }

  if (pontos === 1) {
    return "É... UM PONTINHO...";
  }

  return "NADA PRA NINGUÉM...";
}

function calcularPontos(palpiteCasa, palpiteFora, realCasa, realFora) {
  palpiteCasa = Number(palpiteCasa);
  palpiteFora = Number(palpiteFora);
  realCasa = Number(realCasa);
  realFora = Number(realFora);

  if (palpiteCasa === realCasa && palpiteFora === realFora) {
    return 3;
  }

  const resultadoPalpite = getResultado(palpiteCasa, palpiteFora);
  const resultadoReal = getResultado(realCasa, realFora);

  if (resultadoPalpite === resultadoReal) {
    return 1;
  }

  return 0;
}

function getResultado(casa, fora) {
  casa = Number(casa);
  fora = Number(fora);

  if (casa > fora) return "CASA";
  if (fora > casa) return "FORA";
  return "EMPATE";
}

function trocarAba(aba) {
  const btnResultados = document.getElementById("btnResultados");
  const btnMeusPalpites = document.getElementById("btnMeusPalpites");
  const painelResultados = document.getElementById("painelResultados");
  const painelMeusPalpites = document.getElementById("painelMeusPalpites");

  if (aba === "resultados") {
    btnResultados.classList.add("ativa");
    btnMeusPalpites.classList.remove("ativa");

    painelResultados.classList.remove("escondido");
    painelMeusPalpites.classList.add("escondido");
  } else {
    btnMeusPalpites.classList.add("ativa");
    btnResultados.classList.remove("ativa");

    painelMeusPalpites.classList.remove("escondido");
    painelResultados.classList.add("escondido");
  }
}

function iniciarContagemEmTempoReal() {
  if (intervaloContagem) return;

  intervaloContagem = setInterval(() => {
    const contador = document.getElementById("contadorPrincipal");
    const contadorAmanha = document.getElementById("contadorAmanha");

    const agora = new Date();

    if (contador && alvoContagem) {
      const restante = alvoContagem - agora;
      contador.innerText = formatarContagem(restante);

      if (restante <= 60 * 60 * 1000) {
        contador.classList.add("alerta");
      } else {
        contador.classList.remove("alerta");
      }
    }

    if (contadorAmanha && alvoContagemAmanha) {
      const restanteAmanha = alvoContagemAmanha - agora;
      contadorAmanha.innerText = formatarContagem(restanteAmanha);

      if (restanteAmanha <= 60 * 60 * 1000) {
        contadorAmanha.classList.add("alerta");
      } else {
        contadorAmanha.classList.remove("alerta");
      }
    }
  }, 1000);
}

async function obterPalpiteDoUsuario(matchId) {
  const palpiteId = `${usuarioAtual.uid}_${matchId}`;
  const palpiteRef = doc(db, "predictions", palpiteId);
  const palpiteSnap = await getDoc(palpiteRef);

  if (!palpiteSnap.exists()) {
    return null;
  }

  return palpiteSnap.data();
}

function iniciarAtualizacaoAutomatica() {
  iniciarListenersTempoReal();

  if (window.atualizacaoPorTempoLigada) return;

  window.atualizacaoPorTempoLigada = true;

  setInterval(async () => {
    if (!usuarioAtual) return;

    const campoAtivo = document.activeElement;
    const usuarioEstaDigitando =
      campoAtivo &&
      (campoAtivo.tagName === "INPUT" || campoAtivo.tagName === "TEXTAREA");

    if (usuarioEstaDigitando) return;

    await carregarTudo();
  }, 15000);
}

function iniciarListenersTempoReal() {
  if (window.listenersTempoRealLigados) return;

  window.listenersTempoRealLigados = true;

  let timeoutAtualizacao = null;

  function atualizarComDebounce() {
    clearTimeout(timeoutAtualizacao);

    timeoutAtualizacao = setTimeout(async () => {
      if (!usuarioAtual) return;

      const campoAtivo = document.activeElement;
      const usuarioEstaDigitando =
        campoAtivo &&
        (campoAtivo.tagName === "INPUT" || campoAtivo.tagName === "TEXTAREA");

      if (usuarioEstaDigitando) return;

      await carregarTudo();
    }, 400);
  }

  onSnapshot(collection(db, "matches"), atualizarComDebounce);
  onSnapshot(collection(db, "predictions"), atualizarComDebounce);
  onSnapshot(collection(db, "users"), atualizarComDebounce);
}
