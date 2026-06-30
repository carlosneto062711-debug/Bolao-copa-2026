// VERSÃO 118

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
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

const APP_VERSION = "82";

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

function converterStatusFootballData(statusApi) {
  if (statusApi === "FINISHED") return "finished";

  if (
    statusApi === "IN_PLAY" ||
    statusApi === "PAUSED" ||
    statusApi === "SUSPENDED" ||
    statusApi === "EXTRA_TIME" ||
    statusApi === "PENALTY_SHOOTOUT"
  ) {
    return "live";
  }

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

function converterStatusFootballData(statusApi) {
  if (statusApi === "FINISHED") return "finished";

  if (
    statusApi === "IN_PLAY" ||
    statusApi === "PAUSED" ||
    statusApi === "SUSPENDED"
  ) {
    return "live";
  }

  return "scheduled";
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
        const jogoDocRef = doc(db, "matches", `football_data_${jogoApi.id}`);
const jogoExistenteSnap = await getDoc(jogoDocRef);
const jogoExistente = jogoExistenteSnap.exists() ? jogoExistenteSnap.data() : null;

const novoStatus = converterStatusFootballData(jogoApi.status);

const jogoJaEstavaFinalizado = jogoExistente?.status === "finished";

const finishedAt =
  novoStatus === "finished" && jogoExistente?.finishedAt
    ? jogoExistente.finishedAt
    : novoStatus === "finished" && !jogoJaEstavaFinalizado
      ? new Date().toISOString()
      : null;
        
  const novoJogo = {
  homeTeam: casaApi,
  awayTeam: foraApi,
  date: dataApi,
  kickoff: kickoffApi,
  status: novoStatus,
  apiStatus: jogoApi.status,
  apiProvider: "football-data",
  apiMatchId: jogoApi.id,

  winner: jogoApi.score?.winner || null,
  scoreDuration: jogoApi.score?.duration || null,

  regularTimeHomeScore: jogoApi.score?.regularTime?.home ?? null,
  regularTimeAwayScore: jogoApi.score?.regularTime?.away ?? null,

  extraTimeHomeScore: jogoApi.score?.extraTime?.home ?? null,
  extraTimeAwayScore: jogoApi.score?.extraTime?.away ?? null,

  penaltiesHomeScore: jogoApi.score?.penalties?.home ?? null,
  penaltiesAwayScore: jogoApi.score?.penalties?.away ?? null,

  createdFromApiAt: jogoExistente?.createdFromApiAt || new Date().toISOString(),
  updatedFromApiAt: new Date().toISOString()
};

if (finishedAt) {
  novoJogo.finishedAt = finishedAt;
}

  if (jogoApi.score?.fullTime?.home !== null && jogoApi.score?.fullTime?.home !== undefined) {
    novoJogo.homeScore = Number(jogoApi.score.fullTime.home);
  }

  if (jogoApi.score?.fullTime?.away !== null && jogoApi.score?.fullTime?.away !== undefined) {
    novoJogo.awayScore = Number(jogoApi.score.fullTime.away);
  }

 const idDocumentoApi = `football_data_${jogoApi.id}`;

await setDoc(jogoDocRef, novoJogo, { merge: true });
        
atualizados++;
continue;
}

      const novoStatus = statusFootballDataParaFirestore(jogoApi.status);

if (jogoFirestore.placarManual === true || jogoFirestore.placarManual === "true") {
  console.log(
    "Placar manual preservado. API ignorada para:",
    jogoFirestore.homeTeam,
    "x",
    jogoFirestore.awayTeam
  );

  atualizados++;
  continue;
}

   const novosDados = {
  homeTeam: casaApi,
  awayTeam: foraApi,
  date: dataApi,
  kickoff: kickoffApi,
  status: novoStatus,
  apiStatus: jogoApi.status,
  apiProvider: "football-data",
  apiMatchId: jogoApi.id,

  winner: jogoApi.score?.winner || null,
  scoreDuration: jogoApi.score?.duration || null,

  regularTimeHomeScore: jogoApi.score?.regularTime?.home ?? null,
  regularTimeAwayScore: jogoApi.score?.regularTime?.away ?? null,

  extraTimeHomeScore: jogoApi.score?.extraTime?.home ?? null,
  extraTimeAwayScore: jogoApi.score?.extraTime?.away ?? null,

  penaltiesHomeScore: jogoApi.score?.penalties?.home ?? null,
  penaltiesAwayScore: jogoApi.score?.penalties?.away ?? null,

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

console.log(`Sincronização concluída. Atualizados: ${atualizados}. Não encontrados: ${naoEncontrados.length}`);
    
  } catch (error) {
    console.error("Erro ao sincronizar football-data:", error);
console.log("Erro ao sincronizar API com Firestore. Veja o console.");
  }
}

async function sincronizarFootballDataHoje() {
  const hoje = hojeISO();
  await sincronizarFootballDataPeriodo(hoje, hoje);
}

window.sincronizarFootballDataHoje = sincronizarFootballDataHoje;
window.sincronizarFootballDataPeriodo = sincronizarFootballDataPeriodo;

let intervaloSincronizacaoApi = null;
let sincronizacaoApiRodando = false;

function usuarioAtualEhAdmin() {
  return dadosUsuarioAtual && dadosUsuarioAtual.admin === true;
}

function usuarioPodeSincronizarApi() {
  return usuarioAtual !== null;
}

function intervaloSincronizacaoApiMs() {
  if (usuarioAtualEhAdmin()) {
    return 3 * 60 * 1000;
  }

  return 5 * 60 * 1000;
}

function dataHojeEAmanhaParaApi() {
  const hoje = hojeISO();
  const amanha = adicionarDiasISO(hoje, 1);

  return {
    hoje,
    amanha
  };
}

function periodoMataMataParaApi() {
  return {
    inicio: "2026-06-28",
    fim: "2026-07-19"
  };
}

async function existeJogoAtivoOuProximo() {
  const snap = await getDocs(collection(db, "matches"));
  const agora = Date.now();

  let existe = false;

  snap.forEach((docSnap) => {
    const jogo = docSnap.data();

    if (jogo.status === "live") {
      existe = true;
      return;
    }

    if (jogo.status !== "scheduled") return;

    const inicio = new Date(jogo.kickoff).getTime();
    const abre = inicio - 4 * 60 * 60 * 1000;
    const fechaMonitoramento = inicio + 3 * 60 * 60 * 1000;

    if (agora >= abre && agora <= fechaMonitoramento) {
      existe = true;
    }
  });

  return existe;
}

async function sincronizarApiAutomaticamente(mostrarLog = true) {
 if (!usuarioPodeSincronizarApi()) {
  if (mostrarLog) console.log("Sincronização automática ignorada: usuário não está logado.");
  return;
}

  if (sincronizacaoApiRodando) {
    if (mostrarLog) console.log("Sincronização automática já está rodando.");
    return;
  }

  sincronizacaoApiRodando = true;

  try {
    const inicioPeriodoAtual = adicionarDiasISO(hojeISO(), -1);
const fimPeriodoAtual = adicionarDiasISO(hojeISO(), 1);

if (mostrarLog) {
  console.log(`Sincronização automática: ${inicioPeriodoAtual} até ${fimPeriodoAtual}`);
}

await sincronizarFootballDataPeriodo(inicioPeriodoAtual, fimPeriodoAtual);

const periodoMataMata = periodoMataMataParaApi();

if (mostrarLog) {
  console.log(
    `Sincronização mata-mata: ${periodoMataMata.inicio} até ${periodoMataMata.fim}`
  );
}

await sincronizarFootballDataPeriodo(periodoMataMata.inicio, periodoMataMata.fim);

await atualizarPontuacaoMataMata();

await recalcularRankingPorPalpites();
    
// Não chama carregarTudo aqui.
// O Firestore/onSnapshot já atualiza a tela automaticamente.
    
  } catch (error) {
    console.error("Erro na sincronização automática da API:", error);
  } finally {
    sincronizacaoApiRodando = false;
  }
}

async function iniciarSincronizacaoApiAutomatica() {
  if (!usuarioPodeSincronizarApi()) return;

  await sincronizarApiAutomaticamente(false);

  if (intervaloSincronizacaoApi) {
    clearInterval(intervaloSincronizacaoApi);
  }

  intervaloSincronizacaoApi = setInterval(async () => {
    const deveSincronizar = await existeJogoAtivoOuProximo();

    if (!deveSincronizar) {
      console.log("Sem jogo ativo ou próximo. API não foi chamada.");
      return;
    }

     await sincronizarApiAutomaticamente(true);
  }, intervaloSincronizacaoApiMs());
}

window.sincronizarApiAutomaticamente = sincronizarApiAutomaticamente;
window.iniciarSincronizacaoApiAutomatica = iniciarSincronizacaoApiAutomatica;

// ===============================
// IMPORTAR PALPITES HISTÓRICOS
// ===============================

const PALPITES_HISTORICOS_TEXTO = `
Usuário: Andresa

México 2 x 1 África do Sul
Coreia 3 x 0 Tchéquia
Canadá 3 x 1 Bósnia
EUA 2 x 2 Paraguai
Catar 1 x 3 Suíça
Brasil 2 x 0 Marrocos
Haiti 0 x 1 Escócia
Austrália 1 x 2 Turquia
Alemanha 4 x 0 Curaçao
Holanda 2 x 2 Japão
Costa do Marfim 0 x 1 Equador
Suécia 2 x 0 Tunisia
Espanha 5 x 0 Cabo Verde
Bélgica 2 x 1 Egito
Arábia Saudita 0 x 1 Uruguai
Ira 2 x 1 Nova Zelândia
França 2 x 1 Senegal
Iraque 0 x 3 Noruega
Argentina 2 x 0 Argélia
Áustria 1 x 1 Jordânia
Portugal 2 x 0 RD Congo
Inglaterra 1 x 0 Croácia
Gana 2 x 1 Panamá
Uzbequistão 0 x 2 Colômbia
Tchéquia 2 x 1 África do Sul
Suíça 2 x 0 Bósnia
Canadá 2 x 1 Catar
México 2 x 1 Coreia do Sul
Estados Unidos 2 x 1 Austrália
Escócia 1 x 1 Marrocos
Brasil 2 x 1 Haiti
Turquia 2 x 2 Paraguai
Holanda 2 x 1 Suécia
Alemanha 4 x 0 Costa do Marfim
Equador 2 x 0 Curaçau
Tunísia 1 x 3 Japão

Usuário: Carlos

México 3 x 0 África do Sul
Coreia 3 x 0 Tchéquia
Canadá 2 x 0 Bósnia
EUA 2 x 1 Paraguai
Catar 0 x 2 Suíça
Brasil 2 x 1 Marrocos
Haiti 0 x 3 Escócia
Austrália 1 x 1 Turquia
Alemanha 3 x 0 Curaçao
Holanda 2 x 1 Japão
Costa do Marfim 1 x 2 Equador
Suécia 3 x 0 Tunisia
Espanha 3 x 1 Cabo Verde
Bélgica 3 x 1 Egito
Arábia Saudita 1 x 2 Uruguai
Ira 2 x 0 Nova Zelândia
França 2 x 1 Senegal
Iraque 0 x 2 Noruega
Argentina 2 x 1 Argélia
Áustria 2 x 1 Jordânia
Portugal 3 x 1 RD Congo
Inglaterra 2 x 1 Croácia
Gana 2 x 1 Panamá
Uzbequistão 0 x 2 Colômbia
Tchéquia 1 x 2 África do Sul
Suíça 2 x 1 Bósnia
Canadá 1 x 2 Catar
México 2 x 2 Coreia do Sul
Estados Unidos 2 x 1 Austrália
Escócia 1 x 2 Marrocos
Brasil 3 x 1 Haiti
Turquia 2 x 1 Paraguai
Holanda 3 x 2 Suécia
Alemanha 5 x 2 Costa do Marfim
Equador 2 x 1 Curaçau
Tunísia 1 x 3 Japão

Usuário: Irá

México 2 x 0 África do Sul
Coreia 3 x 2 Tchéquia
Canadá 3 x 2 Bósnia
EUA 2 x 2 Paraguai
Catar 1 x 1 Suíça
Brasil 3 x 1 Marrocos
Haiti 0 x 2 Escócia
Austrália 2 x 1 Turquia
Alemanha 4 x 0 Curaçao
Holanda 3 x 2 Japão
Costa do Marfim 2 x 1 Equador
Suécia 2 x 1 Tunisia
Espanha 2 x 1 Cabo Verde
Bélgica 3 x 1 Egito
Arábia Saudita 1 x 1 Uruguai
Ira 1 x 2 Nova Zelândia
França 3 x 2 Senegal
Iraque 1 x 3 Noruega
Argentina 3 x 1 Argélia
Áustria 3 x 2 Jordânia
Portugal 3 x 1 RD Congo
Inglaterra 4 x 1 Croácia
Gana 3 x 2 Panamá
Uzbequistão 1 x 1 Colômbia
Tchéquia 2 x 3 África do Sul
Suíça 1 x 1 Bósnia
Canadá 3 x 1 Catar
México 4 x 2 Coreia do Sul
Estados Unidos 3 x 2 Austrália
Escócia 1 x 3 Marrocos
Brasil 4 x 1 Haiti
Turquia 1 x 2 Paraguai
Holanda 3 x 1 Suécia
Alemanha 6 x 1 Costa do Marfim
Equador 2 x 1 Curaçau
Tunísia 1 x 3 Japão

Usuário: Demma

México 1 x 1 África do Sul
Coreia 1 x 2 Tchéquia
Canadá 1 x 1 Bósnia
EUA 2 x 1 Paraguai
Catar 0 x 2 Suíça
Brasil 3 x 1 Marrocos
Haiti 0 x 3 Escócia
Austrália 1 x 2 Turquia
Alemanha 2 x 0 Curaçao
Holanda 1 x 0 Japão
Costa do Marfim 2 x 1 Equador
Suécia 2 x 0 Tunisia
Espanha 3 x 0 Cabo Verde
Bélgica 2 x 0 Egito
Arábia Saudita 2 x 1 Uruguai
Ira 2 x 1 Nova Zelândia
França 2 x 0 Senegal
Iraque 1 x 3 Noruega
Argentina 2 x 1 Argélia
Áustria 2 x 0 Jordânia
Portugal 2 x 0 RD Congo
Inglaterra 2 x 0 Croácia
Gana 3 x 0 Panamá
Uzbequistão 0 x 3 Colômbia
Tchéquia 2 x 1 África do Sul
Suíça 1 x 1 Bósnia
Canadá 1 x 0 Catar
México 2 x 1 Coreia do Sul
Estados Unidos 2 x 0 Austrália
Escócia 0 x 2 Marrocos
Brasil 3 x 0 Haiti
Turquia 1 x 1 Paraguai
Holanda 1 x 1 Suécia
Alemanha 3 x 0 Costa do Marfim
Equador 2 x 0 Curaçau
Tunísia 0 x 2 Japão
`;

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function nomeCanonicoTime(nome) {
  const n = normalizarTexto(nome);

  const aliases = {
    "MEXICO": "MEXICO",
    "AFRICA DO SUL": "AFRICA DO SUL",
    "SOUTH AFRICA": "AFRICA DO SUL",

    "COREIA": "COREIA DO SUL",
    "COREIA DO SUL": "COREIA DO SUL",
    "SOUTH KOREA": "COREIA DO SUL",

    "TCHEQUIA": "TCHEQUIA",
    "CZECHIA": "TCHEQUIA",

    "CANADA": "CANADA",

    "BOSNIA": "BOSNIA-HERZEGOVINA",
    "BOSNIA-HERZEGOVINA": "BOSNIA-HERZEGOVINA",
    "BOSNIA AND HERZEGOVINA": "BOSNIA-HERZEGOVINA",

    "EUA": "ESTADOS UNIDOS",
    "ESTADOS UNIDOS": "ESTADOS UNIDOS",
    "UNITED STATES": "ESTADOS UNIDOS",

    "PARAGUAI": "PARAGUAI",
    "PARAGUAY": "PARAGUAI",

    "CATAR": "QATAR",
    "QATAR": "QATAR",

    "SUICA": "SUICA",
    "SWITZERLAND": "SUICA",

    "BRASIL": "BRASIL",
    "BRAZIL": "BRASIL",

    "MARROCOS": "MARROCOS",
    "MOROCCO": "MARROCOS",

    "HAITI": "HAITI",

    "ESCOCIA": "ESCOCIA",
    "SCOTLAND": "ESCOCIA",

    "AUSTRALIA": "AUSTRALIA",

    "TURQUIA": "TURQUIA",
    "TURKEY": "TURQUIA",

    "ALEMANHA": "ALEMANHA",
    "GERMANY": "ALEMANHA",

    "CURACAO": "CURACAO",
"CURACAU": "CURACAO",
"CURAÇAO": "CURACAO",
"CURAÇAU": "CURACAO",

    "HOLANDA": "HOLANDA",
    "NETHERLANDS": "HOLANDA",

    "JAPAO": "JAPAO",
    "JAPAN": "JAPAO",

    "COSTA DO MARFIM": "COSTA DO MARFIM",
    "IVORY COAST": "COSTA DO MARFIM",

    "EQUADOR": "EQUADOR",
    "ECUADOR": "EQUADOR",

    "SUECIA": "SUECIA",
    "SWEDEN": "SUECIA",

    "TUNISIA": "TUNISIA",
    "TUNISIA": "TUNISIA",

    "ESPANHA": "ESPANHA",
    "SPAIN": "ESPANHA",

  "CABO VERDE": "CABO VERDE",
"CAPE VERDE": "CABO VERDE",
"CABO VERDE ISLANDS": "CABO VERDE",
"CAPE VERDE ISLANDS": "CABO VERDE",

    "BELGICA": "BELGICA",
    "BELGIUM": "BELGICA",

    "EGITO": "EGITO",
    "EGYPT": "EGITO",

    "ARABIA SAUDITA": "ARABIA SAUDITA",
    "SAUDI ARABIA": "ARABIA SAUDITA",

    "URUGUAI": "URUGUAI",
    "URUGUAY": "URUGUAI",

    "IRA": "IRA",
    "IRAN": "IRA",

    "NOVA ZELANDIA": "NOVA ZELANDIA",
    "NEW ZEALAND": "NOVA ZELANDIA",

    "FRANCA": "FRANCA",
    "FRANCE": "FRANCA",

    "SENEGAL": "SENEGAL",

    "IRAQUE": "IRAQUE",
    "IRAQ": "IRAQUE",

    "NORUEGA": "NORUEGA",
    "NORWAY": "NORUEGA",

    "ARGENTINA": "ARGENTINA",

    "ARGELIA": "ARGELIA",
    "ALGERIA": "ARGELIA",

    "AUSTRIA": "AUSTRIA",

    "JORDANIA": "JORDANIA",
    "JORDAN": "JORDANIA",

    "PORTUGAL": "PORTUGAL",

    "RD CONGO": "CONGO DR",
    "DR CONGO": "CONGO DR",
    "CONGO DR": "CONGO DR",
    "CONGO": "CONGO DR",

    "INGLATERRA": "INGLATERRA",
    "ENGLAND": "INGLATERRA",

    "CROACIA": "CROACIA",
    "CROATIA": "CROACIA",

    "GANA": "GANA",
    "GHANA": "GANA",

    "PANAMA": "PANAMA",

    "UZBEQUISTAO": "UZBEQUISTAO",
    "UZBEKISTAN": "UZBEQUISTAO",

    "COLOMBIA": "COLOMBIA"
  };

  return aliases[n] || n;
}

function analisarTextoPalpites() {
  const linhas = PALPITES_HISTORICOS_TEXTO.split("\n");
  const palpites = [];
  let usuario = null;

  for (const linhaOriginal of linhas) {
    const linha = linhaOriginal.trim();

    if (!linha) continue;

    const matchUsuario = linha.match(/^Usuário:\s*(.+)$/i);
    if (matchUsuario) {
      usuario = matchUsuario[1].trim();
      continue;
    }

    const matchPalpite = linha.match(/^(.+?)\s+(\d+)\s+x\s+(\d+)\s+(.+)$/i);

    if (!matchPalpite || !usuario) {
      console.warn("Linha não reconhecida:", linha);
      continue;
    }

    palpites.push({
      usuario,
      homeTeam: matchPalpite[1].trim(),
      homeGuess: Number(matchPalpite[2]),
      awayGuess: Number(matchPalpite[3]),
      awayTeam: matchPalpite[4].trim()
    });
  }

  return palpites;
}

function resultadoDoPlacar(casa, fora) {
  casa = Number(casa);
  fora = Number(fora);

  if (casa > fora) return "CASA";
  if (fora > casa) return "FORA";
  return "EMPATE";
}

function pontosDoPalpite(palpiteCasa, palpiteFora, realCasa, realFora) {
  palpiteCasa = Number(palpiteCasa);
  palpiteFora = Number(palpiteFora);
  realCasa = Number(realCasa);
  realFora = Number(realFora);

  if (palpiteCasa === realCasa && palpiteFora === realFora) {
    return 3;
  }

  if (resultadoDoPlacar(palpiteCasa, palpiteFora) === resultadoDoPlacar(realCasa, realFora)) {
    return 1;
  }

  return 0;
}

function encontrarUsuarioPorNome(usuarios, nome) {
  const alvo = normalizarTexto(nome);

  return usuarios.find((usuario) => {
    const nomeUsuario = normalizarTexto(usuario.nome || usuario.name || usuario.displayName || "");
    const emailUsuario = normalizarTexto(usuario.email || "");

    return (
      nomeUsuario === alvo ||
      emailUsuario.includes(alvo)
    );
  });
}

function encontrarJogoPorTimes(jogos, casa, fora) {
  const casaAlvo = nomeCanonicoTime(casa);
  const foraAlvo = nomeCanonicoTime(fora);

  const encontrados = jogos.filter((jogo) => {
    const casaJogo = nomeCanonicoTime(jogo.homeTeam);
    const foraJogo = nomeCanonicoTime(jogo.awayTeam);

    return casaJogo === casaAlvo && foraJogo === foraAlvo;
  });

  encontrados.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  return encontrados[0] || null;
}

function calcularPontosMataMata(homeGuess, awayGuess, homeScore, awayScore) {
  const hg = Number(homeGuess);
  const ag = Number(awayGuess);
  const hs = Number(homeScore);
  const as = Number(awayScore);

  if (
    Number.isNaN(hg) ||
    Number.isNaN(ag) ||
    Number.isNaN(hs) ||
    Number.isNaN(as)
  ) {
    return 0;
  }

  if (hg === hs && ag === as) {
    return 3;
  }

  const resultadoPalpite =
    hg > ag ? "home" :
    hg < ag ? "away" :
    "draw";

  const resultadoReal =
    hs > as ? "home" :
    hs < as ? "away" :
    "draw";

  return resultadoPalpite === resultadoReal ? 1 : 0;
}

async function atualizarPontuacaoMataMata() {
  try {
    const snapPredictions = await getDocs(collection(db, "predictions"));
    const snapMatches = await getDocs(collection(db, "matches"));

    const matchesPorFirestoreId = {};
    const matchesPorApiId = {};
    const matchesPorDataHoraTimes = {};

    snapMatches.forEach((docSnap) => {
      const jogo = {
        id: docSnap.id,
        ...docSnap.data()
      };

      matchesPorFirestoreId[jogo.id] = jogo;

      if (jogo.apiMatchId) {
        matchesPorApiId[String(jogo.apiMatchId)] = jogo;
      }

      const chave = [
        jogo.date,
        String(jogo.kickoff || "").slice(11, 16),
        nomeSeguroJogoPrincipal(jogo.homeTeam),
        nomeSeguroJogoPrincipal(jogo.awayTeam)
      ].join("_");

      matchesPorDataHoraTimes[chave] = jogo;
    });

    const atualizacoes = [];

    snapPredictions.forEach((docSnap) => {
      const palpite = {
        id: docSnap.id,
        ...docSnap.data()
      };

      if (palpite.phase !== "knockout") return;

      let jogo =
        matchesPorFirestoreId[palpite.firestoreMatchId] ||
        matchesPorApiId[String(palpite.apiMatchId || "")];

      if (!jogo) {
        const chave = [
          palpite.date,
          String(palpite.kickoff || "").slice(11, 16),
          nomeSeguroJogoPrincipal(palpite.homeTeam),
          nomeSeguroJogoPrincipal(palpite.awayTeam)
        ].join("_");

        jogo = matchesPorDataHoraTimes[chave];
      }

      if (!jogo) return;
      if (jogo.status !== "finished") return;

      if (
        jogo.homeScore === undefined ||
        jogo.homeScore === null ||
        jogo.awayScore === undefined ||
        jogo.awayScore === null
      ) {
        return;
      }

     const placarBaseHome =
  jogo.regularTimeHomeScore ?? jogo.homeScore;

const placarBaseAway =
  jogo.regularTimeAwayScore ?? jogo.awayScore;

const pontos = calcularPontosMataMata(
  palpite.homeGuess,
  palpite.awayGuess,
  placarBaseHome,
  placarBaseAway
);

      if (
        Number(palpite.points || 0) === pontos &&
        palpite.scored === true
      ) {
        return;
      }

      atualizacoes.push(
        updateDoc(doc(db, "predictions", palpite.id), {
          points: pontos,
          scored: true,
          scoredAt: new Date().toISOString(),
          status: "finished",
         homeScore: Number(placarBaseHome),
awayScore: Number(placarBaseAway),
realFinalHomeScore: Number(jogo.homeScore),
realFinalAwayScore: Number(jogo.awayScore),
scoreDuration: jogo.scoreDuration || null,
winner: jogo.winner || null
        })
      );
    });

    await Promise.all(atualizacoes);

    if (atualizacoes.length > 0) {
      console.log(`Pontuação mata-mata atualizada: ${atualizacoes.length}`);
    }
  } catch (error) {
    console.error("Erro ao atualizar pontuação mata-mata:", error);
  }
}

window.atualizarPontuacaoMataMata = atualizarPontuacaoMataMata;

async function recalcularRankingPorPalpites() {
  const snapUsers = await getDocs(collection(db, "users"));
  const usuarios = [];
  snapUsers.forEach((docSnap) => {
    usuarios.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  const snapMatches = await getDocs(collection(db, "matches"));
  const jogos = {};
  snapMatches.forEach((docSnap) => {
    jogos[docSnap.id] = {
      id: docSnap.id,
      ...docSnap.data()
    };
  });

  const snapPredictions = await getDocs(collection(db, "predictions"));

  const pontosPorUsuario = {};
  usuarios.forEach((usuario) => {
    pontosPorUsuario[usuario.id] = 0;
  });

  snapPredictions.forEach((docSnap) => {
  const palpite = docSnap.data();

if (palpite.phase === "knockout") {
  if (palpite.scored === true || palpite.status === "finished") {
    pontosPorUsuario[palpite.userId] =
      (pontosPorUsuario[palpite.userId] || 0) + Number(palpite.points || 0);
  }

  return;
}

  const jogo = jogos[palpite.matchId];

  if (!jogo) return;
    if (jogo.status !== "finished") return;

    const temPlacar =
      jogo.homeScore !== undefined &&
      jogo.awayScore !== undefined &&
      jogo.homeScore !== null &&
      jogo.awayScore !== null;

    if (!temPlacar) return;

    const pontos = pontosDoPalpite(
      palpite.homeGuess,
      palpite.awayGuess,
      jogo.homeScore,
      jogo.awayScore
    );

    pontosPorUsuario[palpite.userId] = (pontosPorUsuario[palpite.userId] || 0) + pontos;
  });

  for (const usuario of usuarios) {
    await updateDoc(doc(db, "users", usuario.id), {
      pontos: pontosPorUsuario[usuario.id] || 0
    });
  }

  console.log("Ranking recalculado:", pontosPorUsuario);
  await carregarRanking();
}

window.recalcularRankingPorPalpites = recalcularRankingPorPalpites;

async function importarPalpitesHistoricos() {
  try {
    const palpites = analisarTextoPalpites();

    const snapUsers = await getDocs(collection(db, "users"));
    const usuarios = [];
    snapUsers.forEach((docSnap) => {
      usuarios.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    const snapMatches = await getDocs(collection(db, "matches"));
    const jogos = [];
    snapMatches.forEach((docSnap) => {
      jogos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    let criados = 0;
    const problemas = [];

    for (const palpite of palpites) {
      const usuario = encontrarUsuarioPorNome(usuarios, palpite.usuario);

      if (!usuario) {
        problemas.push({
          tipo: "usuário não encontrado",
          usuario: palpite.usuario
        });
        continue;
      }

      const jogo = encontrarJogoPorTimes(jogos, palpite.homeTeam, palpite.awayTeam);

      if (!jogo) {
        problemas.push({
          tipo: "jogo não encontrado",
          usuario: palpite.usuario,
          jogo: `${palpite.homeTeam} x ${palpite.awayTeam}`
        });
        continue;
      }

      const predictionId = `${usuario.id}_${jogo.id}`;

      await setDoc(doc(db, "predictions", predictionId), {
        userId: usuario.id,
        matchId: jogo.id,
        homeGuess: palpite.homeGuess,
        awayGuess: palpite.awayGuess,
        editCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imported: true
      });

      criados++;
    }

    await recalcularRankingPorPalpites();

    console.log("Palpites importados/atualizados:", criados);
    console.table(problemas);

    alert(`Importação finalizada. Palpites salvos: ${criados}. Problemas: ${problemas.length}.`);

    await carregarTudo();

  } catch (error) {
    console.error("Erro ao importar palpites:", error);
    alert("Erro ao importar palpites. Veja o console.");
  }
}

window.importarPalpitesHistoricos = importarPalpitesHistoricos;
window.recalcularRankingPorPalpites = recalcularRankingPorPalpites;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await setPersistence(auth, browserLocalPersistence);

let usuarioAtual = null;
let dadosUsuarioAtual = null;

let carregamentoGeralEmAndamento = false;
let carregamentoGeralPendente = false;

window.usuarioSalvandoPalpite = false;
window.usuarioInteragindoNoSite = false;
window.timeoutInteracaoUsuario = null;
window.ignorarAtualizacaoFirestoreAte = 0;

window.cardAbertoJogosSeguintes = null;
window.jogoAbertoJogosSeguintes = null;

let dataSelecionadaResultados = hojeISO();
let dataSelecionadaMeusPalpites = hojeISO();

let alvoContagem = null;
let alvoContagemAmanha = null;
let intervaloContagem = null;

window.painelContagemTipo = null;
window.painelContagemJogo = null;

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
    iniciarProtecaoMobile();
iniciarContagemEmTempoReal();
iniciarAtualizacaoAutomatica();
 
    if (window.innerWidth <= 768) {
  setTimeout(() => {
    iniciarSincronizacaoApiAutomatica();
  }, 2500);
} else {
  iniciarSincronizacaoApiAutomatica();
}
    
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

let dataSelecionadaAdversarios = hojeISO();
let painelAdversariosAberto = false;

async function carregarPalpitesAdversarios(dataFiltro = dataSelecionadaAdversarios) {
  dataSelecionadaAdversarios = dataFiltro;

  const painel = document.getElementById("painelPalpitesAdversarios");
  painel.innerHTML = "";

  const blocoFiltro = document.createElement("div");
  blocoFiltro.className = "filtro-resultados";
  blocoFiltro.innerHTML = `
    <label for="dataPalpitesAdversarios">📅 Ver palpites adversários por data</label>
    <input type="date" id="dataPalpitesAdversarios" value="${dataSelecionadaAdversarios}">
  `;

  painel.appendChild(blocoFiltro);

  const inputData = blocoFiltro.querySelector("#dataPalpitesAdversarios");
  inputData.addEventListener("change", () => {
    carregarPalpitesAdversarios(inputData.value);
  });

  const snapJogos = await getDocs(collection(db, "matches"));
  const jogos = [];

  snapJogos.forEach((docSnap) => {
    jogos.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  adicionarJogosMataMataManuais(jogos);

 const snapPredictions = await getDocs(collection(db, "predictions"));
const palpites = [];

snapPredictions.forEach((docSnap) => {
  palpites.push({
    id: docSnap.id,
    ...docSnap.data()
  });
});

const jogosUnicosPorChave = {};

jogos
  .filter((jogo) => jogo.date === dataSelecionadaAdversarios)
  .forEach((jogo) => {
    const jogoSeguro = jogoPrincipalComDadosSeguros(jogo);
    const idMataMata = jogoSeguro.knockoutMatchId || idMataMataPorJogoPrincipal(jogo);

    const chave = idMataMata
      ? idMataMata
      : `${jogoSeguro.date}_${String(jogoSeguro.kickoff || "").slice(11, 16)}_${nomeSeguroJogoPrincipal(jogoSeguro.homeTeam)}_${nomeSeguroJogoPrincipal(jogoSeguro.awayTeam)}`;

    jogosUnicosPorChave[chave] = {
      ...jogoSeguro,
      knockoutMatchId: idMataMata || jogoSeguro.knockoutMatchId || null,
      homeTeam: nomeSeguroJogoPrincipal(jogoSeguro.homeTeam),
      awayTeam: nomeSeguroJogoPrincipal(jogoSeguro.awayTeam)
    };
  });

palpites
  .filter((palpite) =>
    palpite.phase === "knockout" &&
    palpite.date === dataSelecionadaAdversarios
  )
  .forEach((palpite) => {
    const chave = palpite.knockoutMatchId || palpite.matchId;

    const jogoFirestore =
      jogos.find((jogo) => jogo.id === palpite.firestoreMatchId) ||
      jogos.find((jogo) => String(jogo.apiMatchId || "") === String(palpite.apiMatchId || ""));

    const jogoExistente = jogosUnicosPorChave[chave] || {};

    jogosUnicosPorChave[chave] = {
      ...jogoExistente,
      id: palpite.matchId,
      knockoutMatchId: palpite.knockoutMatchId || palpite.matchId,

      homeTeam: nomeSeguroJogoPrincipal(
        jogoFirestore?.homeTeam || jogoExistente.homeTeam,
        palpite.homeTeam || "A definir"
      ),

      awayTeam: nomeSeguroJogoPrincipal(
        jogoFirestore?.awayTeam || jogoExistente.awayTeam,
        palpite.awayTeam || "A definir"
      ),

      date: jogoFirestore?.date || jogoExistente.date || palpite.date,
      kickoff: jogoFirestore?.kickoff || jogoExistente.kickoff || palpite.kickoff,

      status: jogoFirestore?.status || jogoExistente.status || palpite.status || "scheduled",
      apiStatus: jogoFirestore?.apiStatus || jogoExistente.apiStatus || palpite.apiStatus || null,

      homeScore: jogoFirestore?.homeScore ?? jogoExistente.homeScore ?? palpite.homeScore ?? null,
      awayScore: jogoFirestore?.awayScore ?? jogoExistente.awayScore ?? palpite.awayScore ?? null
    };
  });

const jogosDaData = Object.values(jogosUnicosPorChave)
  .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  
  if (jogosDaData.length === 0) {
    const vazio = document.createElement("p");
    vazio.innerText = "Nenhum jogo encontrado para esta data.";
    painel.appendChild(vazio);
    return;
  }

  const snapUsers = await getDocs(collection(db, "users"));
  const usuariosPorId = {};

  snapUsers.forEach((docSnap) => {
    usuariosPorId[docSnap.id] = {
      id: docSnap.id,
      ...docSnap.data()
    };
  });

  let mostrouAlgum = false;

  jogosDaData.forEach((jogo) => {
    const inicio = new Date(jogo.kickoff).getTime();
    const agora = Date.now();
    const jogoComecou = agora >= inicio;
    const jogoFinalizado = jogo.status === "finished";
    const jogoAoVivo = jogo.status === "live" || (jogoComecou && !jogoFinalizado);

    const cardJogo = document.createElement("div");
    cardJogo.className = "card-palpites-adversarios";

    let statusJogo = "Bloqueado";
    let resultadoJogo = "Os palpites serão liberados quando o jogo começar.";

    if (jogoAoVivo) {
  statusJogo = htmlTempoJogoDinamico(jogo);
  resultadoJogo = `Placar atual: ${placarTempoNormalJogo(jogo).home} x ${placarTempoNormalJogo(jogo).away}`;
}

    if (jogoFinalizado) {
  statusJogo = "Encerrado";
  resultadoJogo = `Resultado final: ${textoResultadoFinalPalpitesJogo(jogo)}`;
}

    cardJogo.innerHTML = `
<strong>${nomeSeguroJogoPrincipal(jogo.homeTeam)} x ${nomeSeguroJogoPrincipal(jogo.awayTeam)}</strong>
<span>${formatarDataBR(jogo.date)} — ${formatarHora(jogo.kickoff)}</span>
      <br>
      <span class="linha-resultado-real">${resultadoJogo}</span>
      <br>
      <span class="badge ${jogoFinalizado ? "finalizado" : jogoAoVivo ? "ao-vivo" : "agendado"}">${statusJogo}</span>
    `;

    if (!jogoComecou) {
      painel.appendChild(cardJogo);
      return;
    }

    const palpitesDoJogo = palpites
  .filter((palpite) => {
    if (palpite.matchId === jogo.id) return true;

    if (
      palpite.phase === "knockout" &&
      palpite.knockoutMatchId &&
      palpite.knockoutMatchId === jogo.knockoutMatchId
    ) {
      return true;
    }

    return false;
  })
  .sort((a, b) => {
    if (a.userId === usuarioAtual.uid) return -1;
    if (b.userId === usuarioAtual.uid) return 1;

    const nomeA = usuariosPorId[a.userId]?.nome || "";
    const nomeB = usuariosPorId[b.userId]?.nome || "";

    return nomeA.localeCompare(nomeB);
  });

    if (palpitesDoJogo.length === 0) {
      const semPalpites = document.createElement("p");
      semPalpites.innerText = "Nenhum adversário palpitou neste jogo.";
      cardJogo.appendChild(semPalpites);
      painel.appendChild(cardJogo);
      mostrouAlgum = true;
      return;
    }

    palpitesDoJogo.forEach((palpite) => {
      const usuario = usuariosPorId[palpite.userId];
const souEu = palpite.userId === usuarioAtual.uid;
const nomeUsuario = souEu
  ? "⭐ Você"
  : usuario?.nome || usuario?.name || usuario?.displayName || "Usuário";

      let bolinha = "⚪";
      let textoPontos = "";

     if (jogoFinalizado) {
  const placarBolao = placarTempoNormalJogo(jogo);

  const pontos =
    palpite.phase === "knockout"
      ? calcularPontosMataMata(
          palpite.homeGuess,
          palpite.awayGuess,
          placarBolao.home,
          placarBolao.away
        )
      : calcularPontos(
          palpite.homeGuess,
          palpite.awayGuess,
          jogo.homeScore,
          jogo.awayScore
        );

  bolinha = pontos > 0 ? "🟢" : "🔴";
  textoPontos = ` — ${pontos} ${pontos === 1 ? "ponto" : "pontos"}`;
}

      const linha = document.createElement("div");
linha.className = souEu
  ? "linha-palpite-adversario meu-palpite-adversario"
  : "linha-palpite-adversario";

linha.innerHTML = `
  <span>${bolinha}</span>
  <strong>${nomeUsuario}</strong>
  <span>${palpite.homeGuess} x ${palpite.awayGuess}${textoPontos}</span>
`;
      
      cardJogo.appendChild(linha);
    });

    painel.appendChild(cardJogo);
    mostrouAlgum = true;
  });

  if (!mostrouAlgum) {
    const aviso = document.createElement("p");
    aviso.innerText = "Os palpites desta data ainda estão bloqueados.";
    painel.appendChild(aviso);
  }
}

function alternarPalpitesAdversarios() {
  const painel = document.getElementById("painelPalpitesAdversarios");
  const botao = document.getElementById("btnPalpitesAdversarios");

  painelAdversariosAberto = !painelAdversariosAberto;

  if (painelAdversariosAberto) {
    painel.classList.remove("escondido");
    botao.innerText = "Ocultar palpites";
    carregarPalpitesAdversarios(dataSelecionadaAdversarios);
  } else {
    painel.classList.add("escondido");
    botao.innerText = "Palpites adversários";
  }
}

const btnPalpitesAdversarios = document.getElementById("btnPalpitesAdversarios");

if (btnPalpitesAdversarios) {
  btnPalpitesAdversarios.addEventListener("click", alternarPalpitesAdversarios);
}
function pausarAtualizacoesPorInteracao(tempo = 4000) {
  window.usuarioInteragindoNoSite = true;

  clearTimeout(window.timeoutInteracaoUsuario);

  window.timeoutInteracaoUsuario = setTimeout(() => {
    window.usuarioInteragindoNoSite = false;

    if (carregamentoGeralPendente && usuarioAtual) {
      carregamentoGeralPendente = false;
      carregarTudo();
    }
  }, tempo);
}

function iniciarProtecaoMobile() {
  if (window.protecaoMobileLigada) return;

  window.protecaoMobileLigada = true;

  window.addEventListener("scroll", () => {
    pausarAtualizacoesPorInteracao(2500);
  }, { passive: true });

  window.addEventListener("touchstart", () => {
    pausarAtualizacoesPorInteracao(4000);
  }, { passive: true });

  window.addEventListener("touchmove", () => {
    pausarAtualizacoesPorInteracao(4000);
  }, { passive: true });

  document.addEventListener("input", () => {
    pausarAtualizacoesPorInteracao(6000);
  });

  document.addEventListener("focusin", (event) => {
    if (
      event.target &&
      (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")
    ) {
      pausarAtualizacoesPorInteracao(8000);
    }
  });
}

async function carregarTudo() {
  if (
    window.usuarioSalvandoPalpite ||
    window.usuarioInteragindoNoSite ||
    Date.now() < window.ignorarAtualizacaoFirestoreAte
  ) {
    carregamentoGeralPendente = true;
    return;
  }

  if (carregamentoGeralEmAndamento) {
    carregamentoGeralPendente = true;
    return;
  }

  carregamentoGeralEmAndamento = true;

  try {
    await carregarPainelTempo();
    await carregarJogosHoje();

    if (!window.usuarioMexendoEmJogosSeguintes) {
      await carregarJogosAmanha(dataSelecionadaJogosAmanha);
    }

    if (!window.usuarioMexendoEmFiltroResultados) {
      await carregarResultadosAnteriores(dataSelecionadaResultados);
    }

    if (!window.usuarioMexendoEmFiltroPalpites) {
      await carregarMeusPalpites(dataSelecionadaMeusPalpites);
    }

    await carregarRanking();

    if (painelAdversariosAberto) {
      await carregarPalpitesAdversarios(dataSelecionadaAdversarios);
    }

  } catch (error) {
    console.log("Erro ao carregar tudo:", error);
  } finally {
    carregamentoGeralEmAndamento = false;

    if (
      carregamentoGeralPendente &&
      !window.usuarioSalvandoPalpite &&
      !window.usuarioInteragindoNoSite &&
      Date.now() >= window.ignorarAtualizacaoFirestoreAte
    ) {
      carregamentoGeralPendente = false;

      setTimeout(() => {
        carregarTudo();
      }, 1000);
    }
  }
}

function configurarBotaoAtualizarSite() {
  const botao = document.getElementById("btnAtualizarSite");

  if (!botao) return;

  botao.addEventListener("click", () => {
    const aviso = document.getElementById("avisoNovaVersao");

    localStorage.setItem("ultimaVersaoVista", window.versaoDisponivel || APP_VERSION);

    if (aviso) {
      aviso.classList.add("escondido");
    }

    window.location.reload();
  });
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

function textoTempoDoJogo(jogo) {
  if (jogo.status === "finished") {
    return "ENCERRADO";
  }

  if (jogo.apiStatus === "PAUSED") {
    return "JOGO PAUSADO";
  }

  if (jogo.apiStatus === "SUSPENDED") {
    return "SUSPENSO";
  }

  const agora = Date.now();
  const inicio = new Date(jogo.kickoff).getTime();

  if (agora < inicio) {
    return "";
  }

  const minutosCorridos = Math.floor((agora - inicio) / 60000);

  if (minutosCorridos <= 45) {
    const minutoJogo = Math.max(1, minutosCorridos + 1);
    return `1º TEMPO - ${minutoJogo}'`;
  }

  if (minutosCorridos > 45 && minutosCorridos <= 65) {
    return "INTERVALO";
  }

  const minutoJogo = Math.min(90, minutosCorridos - 20);
  return `2º TEMPO - ${minutoJogo}'`;
}

function removerJogosDuplicados(listaJogos) {
  const mapa = new Map();

  listaJogos.forEach((jogo) => {
    const chave = jogo.apiMatchId
      ? `api_${jogo.apiMatchId}`
      : `${normalizarNomeTime(jogo.homeTeam)}_${normalizarNomeTime(jogo.awayTeam)}_${jogo.date}`;

    const jogoExistente = mapa.get(chave);

    if (!jogoExistente) {
      mapa.set(chave, jogo);
      return;
    }

    const existenteTemApi = !!jogoExistente.apiMatchId;
    const novoTemApi = !!jogo.apiMatchId;

    if (novoTemApi && !existenteTemApi) {
      mapa.set(chave, jogo);
      return;
    }

    const atualizadoExistente = new Date(
      jogoExistente.updatedFromApiAt || jogoExistente.createdFromApiAt || 0
    ).getTime();

    const atualizadoNovo = new Date(
      jogo.updatedFromApiAt || jogo.createdFromApiAt || 0
    ).getTime();

    if (atualizadoNovo > atualizadoExistente) {
      mapa.set(chave, jogo);
    }
  });

  return Array.from(mapa.values());
}

function jogoComecou(jogo) {
  return new Date(jogo.kickoff).getTime() <= Date.now();
}

function dataHoraAberturaPalpites(jogo) {
  const dataJogo = new Date(`${jogo.date}T00:00:00`);

  // Dia anterior ao jogo
  dataJogo.setDate(dataJogo.getDate() - 1);

  const ano = dataJogo.getFullYear();
  const mes = String(dataJogo.getMonth() + 1).padStart(2, "0");
  const dia = String(dataJogo.getDate()).padStart(2, "0");

  // Abre às 20:00 do dia anterior
  return new Date(`${ano}-${mes}-${dia}T20:00:00`).getTime();
}

function jogoLiberadoParaPalpite(jogo) {
  if (jogo.status !== "scheduled") return false;

  const agora = Date.now();
  const inicio = new Date(jogo.kickoff).getTime();
  const abre = dataHoraAberturaPalpites(jogo);

  return agora >= abre && agora < inicio;
}

function jogoEncerradoAindaFicaHoje(jogo) {
  if (jogo.status !== "finished") return false;

  const agora = Date.now();

  let horarioFim = null;

  if (jogo.finishedAt) {
    horarioFim = new Date(jogo.finishedAt).getTime();
  } else {
    const inicio = new Date(jogo.kickoff).getTime();

    // fallback para jogos antigos que ainda não tinham finishedAt
    horarioFim = inicio + 3 * 60 * 60 * 1000;
  }

  const limite = horarioFim + 60 * 60 * 1000;

  return agora <= limite;
}

function jogoDeveAparecerHoje(jogo) {
  const hoje = hojeISO();
  const ontem = adicionarDiasISO(hoje, -1);

  if (jogo.date !== hoje && jogo.date !== ontem) return false;

  if (jogo.date === ontem) {
    if (jogo.status === "live") return true;

    if (jogo.status === "finished") {
      return jogoEncerradoAindaFicaHoje(jogo);
    }

    if (jogo.status === "scheduled") {
      const inicio = new Date(jogo.kickoff).getTime();
      const agora = Date.now();

      return agora >= inicio && agora <= inicio + 3 * 60 * 60 * 1000;
    }

    return false;
  }

  if (jogo.status === "live") return true;

  if (jogo.status === "finished") {
    return jogoEncerradoAindaFicaHoje(jogo);
  }

  if (jogo.status === "scheduled") {
    return jogoLiberadoParaPalpite(jogo) || jogoComecou(jogo);
  }

  return false;
}

function jogoDeveAparecerAmanha(jogo) {
  return jogo.status === "scheduled" && jogo.date >= amanhaISO();
}

async function carregarJogosHoje() {
  const jogosHojeDiv = document.getElementById("jogosHoje");
  const statusRodada = document.getElementById("statusRodada");

  jogosHojeDiv.innerHTML = "";

  try {
    const hoje = hojeISO();
const ontem = adicionarDiasISO(hoje, -1);

const qHoje = query(
  collection(db, "matches"),
  where("date", "in", [ontem, hoje])
);

const snap = await getDocs(qHoje);
    
    const todosJogos = [];
    snap.forEach((docSnap) => {
      todosJogos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    const jogosFiltrados = todosJogos.filter((jogo) => {
  if (jogo.date === ontem) {
    if (jogo.status === "live") return true;

    if (jogo.status === "finished") {
      return jogoEncerradoAindaFicaHoje(jogo);
    }

    if (jogo.status === "scheduled") {
      const inicio = new Date(jogo.kickoff).getTime();
      const agora = Date.now();

      // Jogos que começaram tarde ontem e ainda podem estar acontecendo.
      return agora >= inicio && agora <= inicio + 3 * 60 * 60 * 1000;
    }

    return false;
  }

  if (jogo.date === hoje) {
    if (jogo.status === "live") return true;

    if (jogo.status === "finished") {
      return jogoEncerradoAindaFicaHoje(jogo);
    }

    if (jogo.status === "scheduled") {
      return jogoLiberadoParaPalpite(jogo) || jogoComecou(jogo);
    }

    return false;
  }

  return false;
});

    const jogos = removerJogosDuplicados(jogosFiltrados).sort((a, b) => {
      const pesoStatus = (jogo) => {
        if (jogo.status === "live") return 1;
        if (jogo.status === "scheduled") return 2;
        if (jogo.status === "finished") return 3;
        return 4;
      };

      const pesoA = pesoStatus(a);
      const pesoB = pesoStatus(b);

      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      return new Date(a.kickoff) - new Date(b.kickoff);
    });

    if (jogos.length === 0) {
      statusRodada.innerText = "Nenhum jogo aberto no momento.";
      return;
    }

    const jogosComPalpitePossivel = jogos.filter((jogo) => {
      return jogo.status === "scheduled" && jogoLiberadoParaPalpite(jogo);
    });

    if (jogosComPalpitePossivel.length === 0) {
      statusRodada.innerText = "Nenhum palpite aberto no momento.";
    } else {
      const todosJaTravados = [];

      for (const jogo of jogosComPalpitePossivel) {
        const palpiteId = `${usuarioAtual.uid}_${jogo.id}`;
        const palpiteSnap = await getDoc(doc(db, "predictions", palpiteId));

        if (!palpiteSnap.exists()) {
          todosJaTravados.push(false);
          continue;
        }

        const palpite = palpiteSnap.data();
        todosJaTravados.push(Number(palpite.editCount || 0) >= 2);
      }

      const usuarioJaTravouTodos = todosJaTravados.every((valor) => valor === true);

      statusRodada.innerText = usuarioJaTravouTodos
        ? "Você já palpitou em todos palpites. Aguarde a próxima abertura."
        : "Rodada aberta para palpites.";
    }

    for (const jogo of jogos) {
      const podePalpitarEsteJogo = jogoLiberadoParaPalpite(jogo);
      const card = await criarCardJogo(jogo, podePalpitarEsteJogo);
      jogosHojeDiv.appendChild(card);
    }

  } catch (error) {
    console.log("Erro ao carregar jogos do dia:", error);
    statusRodada.innerText = `Erro ao carregar jogos: ${error.code}`;
  }
}

let dataSelecionadaJogosAmanha = null;

function adicionarDiasISO(dataISO, dias) {
  const data = new Date(`${dataISO}T00:00:00`);
  data.setDate(data.getDate() + dias);
  return formatarDataLocalISO(data);
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function chaveMataMataPorHorario(jogo) {
  return `${jogo.date}_${String(jogo.kickoff || "").slice(11, 16)}`;
}

function idMataMataPorJogoPrincipal(jogo) {
  if (jogo.knockoutMatchId) return jogo.knockoutMatchId;

  const mapa = {
    "2026-06-28_16:00": "M101",
    "2026-06-29_14:00": "M102",
    "2026-06-29_17:30": "M103",
    "2026-06-29_22:00": "M104",
    "2026-06-30_14:00": "M105",
    "2026-06-30_18:00": "M106",
    "2026-06-30_22:00": "M107",
    "2026-07-01_13:00": "M108",
    "2026-07-01_17:00": "M109",
    "2026-07-01_21:00": "M110",
    "2026-07-02_16:00": "M111",
    "2026-07-02_20:00": "M112",
    "2026-07-03_00:00": "M113",
    "2026-07-03_15:00": "M114",
    "2026-07-03_19:00": "M115",
    "2026-07-03_22:30": "M116",

    "2026-07-04_14:00": "Oesquerdo1",
    "2026-07-04_18:00": "Odireito1",
    "2026-07-05_17:00": "Oesquerdo2",
    "2026-07-05_21:00": "Odireito2",
    "2026-07-06_16:00": "Oesquerdo3",
    "2026-07-06_21:00": "Odireito3",
    "2026-07-07_13:00": "Oesquerdo4",
    "2026-07-07_17:00": "Odireito4",

    "2026-07-09_17:00": "Qesquerdo1",
    "2026-07-10_16:00": "Qdireito1",
    "2026-07-11_18:00": "Qesquerdo2",
    "2026-07-11_22:00": "Qdireito2",

    "2026-07-14_16:00": "S1",
    "2026-07-15_16:00": "S2",
    "2026-07-18_18:00": "T3",
    "2026-07-19_16:00": "FINAL"
  };

  return mapa[chaveMataMataPorHorario(jogo)] || null;
}

function jogoEhMataMataPrincipal(jogo) {
  return Boolean(idMataMataPorJogoPrincipal(jogo));
}

function urlMataMataParaJogoPrincipal(jogo) {
  const idMataMata = idMataMataPorJogoPrincipal(jogo);

  if (!idMataMata) {
    return "mata-mata.html";
  }

  return `mata-mata.html?jogo=${encodeURIComponent(idMataMata)}`;
}

function nomeSeguroJogoPrincipal(nome, fallback = "A definir") {
  const texto = String(nome ?? "").trim();

  if (!texto || texto.toLowerCase() === "null" || texto.toLowerCase() === "undefined") {
    return fallback;
  }

  return texto;
}

function chaveJogoPrincipalPorDataHora(jogo) {
  return `${jogo.date}_${String(jogo.kickoff || "").slice(11, 16)}`;
}

function dadosMataMataManualPorChave(chave) {
  const mapa = {
    "2026-06-28_16:00": {
      id: "M101",
      homeTeam: "ÁFRICA DO SUL",
      awayTeam: "CANADÁ"
    },

    "2026-06-29_14:00": {
      id: "M102",
      homeTeam: "BRASIL",
      awayTeam: "JAPÃO"
    },

    "2026-06-29_17:30": {
      id: "M103",
      homeTeam: "ALEMANHA",
      awayTeam: "PARAGUAI"
    },

    "2026-06-29_22:00": {
      id: "M104",
      homeTeam: "HOLANDA",
      awayTeam: "MARROCOS"
    },

    "2026-06-30_14:00": {
      id: "M105",
      homeTeam: "COSTA DO MARFIM",
      awayTeam: "NORUEGA"
    },

    "2026-06-30_18:00": {
      id: "M106",
      homeTeam: "FRANÇA",
      awayTeam: "SUÉCIA"
    },

    "2026-06-30_22:00": {
      id: "M107",
      homeTeam: "MÉXICO",
      awayTeam: "EQUADOR"
    },

    "2026-07-01_13:00": {
      id: "M108",
      homeTeam: "INGLATERRA",
      awayTeam: "CONGO DR"
    },

    "2026-07-01_17:00": {
      id: "M109",
      homeTeam: "BÉLGICA",
      awayTeam: "SENEGAL"
    },

    "2026-07-01_21:00": {
      id: "M110",
      homeTeam: "ESTADOS UNIDOS",
      awayTeam: "BÓSNIA E HERZEGOVINA"
    },

    "2026-07-02_16:00": {
      id: "M111",
      homeTeam: "ESPANHA",
      awayTeam: "A definir"
    },

    "2026-07-02_20:00": {
      id: "M112",
      homeTeam: "PORTUGAL",
      awayTeam: "CROÁCIA"
    },

    "2026-07-03_00:00": {
      id: "M113",
      homeTeam: "SUÍÇA",
      awayTeam: "ARGÉLIA"
    },

    "2026-07-03_15:00": {
      id: "M114",
      homeTeam: "AUSTRÁLIA",
      awayTeam: "EGITO"
    },

    "2026-07-03_19:00": {
      id: "M115",
      homeTeam: "ARGENTINA",
      awayTeam: "CABO VERDE"
    },

    "2026-07-03_22:30": {
      id: "M116",
      homeTeam: "COLÔMBIA",
      awayTeam: "GANA"
    }
  };

  return mapa[chave] || null;
}

function vencedorDoJogoPrincipal(jogo) {
  if (!jogo) return null;
  if (jogo.status !== "finished") return null;

  if (jogo.winner === "HOME_TEAM") {
    return {
      team: jogo.homeTeam,
      flag: jogo.homeFlag || ""
    };
  }

  if (jogo.winner === "AWAY_TEAM") {
    return {
      team: jogo.awayTeam,
      flag: jogo.awayFlag || ""
    };
  }

  const extraHome = Number(jogo.extraTimeHomeScore);
  const extraAway = Number(jogo.extraTimeAwayScore);

  if (!Number.isNaN(extraHome) && !Number.isNaN(extraAway)) {
    if (extraHome > extraAway) {
      return {
        team: jogo.homeTeam,
        flag: jogo.homeFlag || ""
      };
    }

    if (extraAway > extraHome) {
      return {
        team: jogo.awayTeam,
        flag: jogo.awayFlag || ""
      };
    }
  }

  const penHome = Number(jogo.penaltiesHomeScore);
  const penAway = Number(jogo.penaltiesAwayScore);

  if (!Number.isNaN(penHome) && !Number.isNaN(penAway)) {
    if (penHome > penAway) {
      return {
        team: jogo.homeTeam,
        flag: jogo.homeFlag || ""
      };
    }

    if (penAway > penHome) {
      return {
        team: jogo.awayTeam,
        flag: jogo.awayFlag || ""
      };
    }
  }

  const homeScore = Number(jogo.homeScore);
  const awayScore = Number(jogo.awayScore);

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return null;

  if (homeScore > awayScore) {
    return {
      team: jogo.homeTeam,
      flag: jogo.homeFlag || ""
    };
  }

  if (awayScore > homeScore) {
    return {
      team: jogo.awayTeam,
      flag: jogo.awayFlag || ""
    };
  }

  return null;
}

function aplicarTimeNoJogoPrincipal(jogo, lado, classificado) {
  if (!jogo || !classificado) return;

  if (lado === "home") {
    jogo.homeTeam = classificado.team;
    jogo.homeFlag = classificado.flag || "";
  }

  if (lado === "away") {
    jogo.awayTeam = classificado.team;
    jogo.awayFlag = classificado.flag || "";
  }
}

function adicionarJogosMataMataManuais(listaJogos) {
  const chaves = [
    "2026-06-28_16:00",
    "2026-06-29_14:00",
    "2026-06-29_17:30",
    "2026-06-29_22:00",
    "2026-06-30_14:00",
    "2026-06-30_18:00",
    "2026-06-30_22:00",
    "2026-07-01_13:00",
    "2026-07-01_17:00",
    "2026-07-01_21:00",
    "2026-07-02_16:00",
    "2026-07-02_20:00",
    "2026-07-03_00:00",
    "2026-07-03_15:00",
    "2026-07-03_19:00",
    "2026-07-03_22:30"
  ];

  chaves.forEach((chave) => {
    const dadosManual = dadosMataMataManualPorChave(chave);
    if (!dadosManual) return;

    const [date, hora] = chave.split("_");
    const kickoff = `${date}T${hora}:00`;

    const jaExiste = listaJogos.some((jogo) => {
      const mesmaData = jogo.date === date;
      const mesmaHora = String(jogo.kickoff || "").slice(11, 16) === hora;

      const mesmoId =
        jogo.id === dadosManual.id ||
        jogo.matchId === dadosManual.id ||
        jogo.knockoutMatchId === dadosManual.id ||
        idMataMataPorJogoPrincipal(jogo) === dadosManual.id;

      return mesmoId || (mesmaData && mesmaHora);
    });

    if (jaExiste) return;

    listaJogos.push({
      id: dadosManual.id,
      matchId: dadosManual.id,
      knockoutMatchId: dadosManual.id,
      phase: "knockout",
      round: "round32",
      homeTeam: dadosManual.homeTeam,
      awayTeam: dadosManual.awayTeam,
      date,
      kickoff,
      status: "scheduled",
      apiProvider: "manual"
    });
  });
}

function dadosMataMataManualPorJogo(jogo) {
  const chave = chaveJogoPrincipalPorDataHora(jogo);
  return dadosMataMataManualPorChave(chave);
}

function jogoPrincipalComDadosSeguros(jogo) {
  const dadosMataMata = dadosMataMataManualPorJogo(jogo);
  const idMataMata = idMataMataPorJogoPrincipal(jogo);

  return {
    ...jogo,
    id: idMataMata || jogo.id,
    knockoutMatchId: idMataMata || jogo.knockoutMatchId || null,
    homeTeam: nomeSeguroJogoPrincipal(
      jogo.homeTeam,
      dadosMataMata?.homeTeam || "A definir"
    ),
    awayTeam: nomeSeguroJogoPrincipal(
      jogo.awayTeam,
      dadosMataMata?.awayTeam || "A definir"
    )
  };
}

function chaveUnicaJogoPrincipal(jogo) {
  const seguro = jogoPrincipalComDadosSeguros(jogo);

  return [
    seguro.date,
    String(seguro.kickoff || "").slice(11, 16),
    nomeSeguroJogoPrincipal(seguro.homeTeam),
    nomeSeguroJogoPrincipal(seguro.awayTeam)
  ].join("_");
}

async function carregarJogosAmanha(dataEscolhida = dataSelecionadaJogosAmanha) {
  const jogosAmanhaDiv = document.getElementById("jogosAmanha");
  jogosAmanhaDiv.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "matches"));

    const todosJogos = [];
    snap.forEach((docSnap) => {
      todosJogos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    adicionarJogosMataMataManuais(todosJogos);

    const amanha = amanhaISO();

    const jogosFuturos = removerJogosDuplicados(
      todosJogos
        .filter((jogo) => jogo.status === "scheduled")
        .filter((jogo) => jogo.date >= amanha)
    ).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    const datasDisponiveis = [...new Set(jogosFuturos.map((jogo) => jogo.date))].sort();

    const primeiraDataComJogos = datasDisponiveis.length > 0
      ? datasDisponiveis[0]
      : amanha;

    const dataParaMostrar = dataEscolhida || primeiraDataComJogos;

    dataSelecionadaJogosAmanha = dataEscolhida || null;

    const dataAnterior = [...datasDisponiveis]
      .reverse()
      .find((data) => data < dataParaMostrar);

    const proximaData = datasDisponiveis.find((data) => data > dataParaMostrar);

    const topo = document.createElement("div");
    topo.className = "topo-jogos-amanha";

    const tituloData = document.createElement("p");
    tituloData.innerHTML = `<strong>Jogos de ${formatarDataBR(dataParaMostrar)}</strong>`;

    const areaBotoes = document.createElement("div");
    areaBotoes.className = "botoes-datas-jogos";

    if (dataAnterior) {
      const botaoAnterior = document.createElement("button");
      botaoAnterior.innerText = formatarDataBR(dataAnterior);
      botaoAnterior.onclick = () => {
        dataSelecionadaJogosAmanha = dataAnterior;
        carregarJogosAmanha(dataAnterior);
      };

      areaBotoes.appendChild(botaoAnterior);
    }

    const botaoProximaData = document.createElement("button");

    if (proximaData) {
      botaoProximaData.innerText = formatarDataBR(proximaData);
      botaoProximaData.onclick = () => {
        dataSelecionadaJogosAmanha = proximaData;
        carregarJogosAmanha(proximaData);
      };
    } else {
      botaoProximaData.innerText = "Fim da fase";
      botaoProximaData.disabled = true;
    }

    areaBotoes.appendChild(botaoProximaData);

    topo.appendChild(tituloData);
    topo.appendChild(areaBotoes);
    jogosAmanhaDiv.appendChild(topo);

    const jogosFiltrados = todosJogos
      .filter((jogo) => jogo.status === "scheduled")
      .filter((jogo) => jogo.date === dataParaMostrar);

    const jogos = removerJogosDuplicados(jogosFiltrados)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    if (jogos.length === 0) {
      jogosAmanhaDiv.innerHTML += "<p>Nenhum jogo encontrado para esta data.</p>";
      alvoContagemAmanha = null;
      return;
    }

    const aberturaJogos = dataHoraAberturaPalpites(jogos[0]);
    const agora = Date.now();

    alvoContagemAmanha = new Date(aberturaJogos);

    const textoJogosSeguintes = document.getElementById("textoJogosSeguintes");
    const aviso = document.createElement("p");

  if (agora >= aberturaJogos) {
  if (textoJogosSeguintes) {
    textoJogosSeguintes.classList.add("escondido");
  }

  aviso.innerHTML = `<strong>Palpites desta data já estão abertos.</strong>`;
} else {
  if (textoJogosSeguintes) {
    textoJogosSeguintes.classList.remove("escondido");
    textoJogosSeguintes.innerText = "Palpites bloqueados. Abre todos os dias, às 20 horas.";
  }

  aviso.innerHTML = `<strong>Palpites abrem em <span id="contadorAmanha">${formatarContagem(aberturaJogos - agora)}</span></strong>`;
}

    jogosAmanhaDiv.appendChild(aviso);

    for (const jogo of jogos) {
      const abertoParaPalpite = jogoLiberadoParaPalpite(jogo);

      const item = document.createElement("div");
      item.className = abertoParaPalpite
        ? "jogo-mini jogo-mini-palpitar"
        : "jogo-mini";

      const ehMataMata = jogoEhMataMataPrincipal(jogo);
const textoAcao = abertoParaPalpite
  ? (ehMataMata ? "Palpitar no mata-mata" : "Palpitar")
  : "Bloqueado";

      if (ehMataMata) {
  item.classList.add("item-jogo-mata-mata-principal");
}

      const jogoSeguro = jogoPrincipalComDadosSeguros(jogo);

item.innerHTML = `
  <div class="linha-jogo-seguinte-info">
    <span class="hora-jogo-seguinte">${formatarHora(jogo.kickoff)}</span>
    <strong class="times-jogo-seguinte">${jogoSeguro.homeTeam} x ${jogoSeguro.awayTeam}</strong>
  </div>

  <span class="acao-jogo-seguinte ${ehMataMata ? "acao-mata-mata" : ""}">
    ${textoAcao}
  </span>
`;
      
     if (abertoParaPalpite) {
  item.addEventListener("click", async () => {
    if (jogoEhMataMataPrincipal(jogo)) {
      window.location.href = urlMataMataParaJogoPrincipal(jogo);
      return;
    }

    window.usuarioMexendoEmJogosSeguintes = true;

    const container = document.createElement("div");
    const botaoVoltarCard = document.createElement("button");
    botaoVoltarCard.innerText = "Voltar aos jogos";
    botaoVoltarCard.className = "btn-voltar-card-palpite";
    botaoVoltarCard.onclick = () => {
      window.usuarioMexendoEmJogosSeguintes = false;
      window.cardAbertoJogosSeguintes = null;
      window.jogoAbertoJogosSeguintes = null;
      carregarJogosAmanha(dataParaMostrar);
    };

    const card = await criarCardJogo(jogo, true);

    container.appendChild(botaoVoltarCard);
    container.appendChild(card);

    item.replaceWith(container);

    window.cardAbertoJogosSeguintes = container;
    window.jogoAbertoJogosSeguintes = jogo;
  });
}

      jogosAmanhaDiv.appendChild(item);
    }
  } catch (error) {
    console.log("Erro ao carregar jogos seguintes:", error);
    jogosAmanhaDiv.innerHTML = `<p>Erro ao carregar jogos: ${error.code}</p>`;
  }
}

async function atualizarCardDepoisDoPalpite(card, jogo) {
  try {
    const ehCardAbertoDosJogosSeguintes =
      window.cardAbertoJogosSeguintes &&
      window.jogoAbertoJogosSeguintes &&
      window.jogoAbertoJogosSeguintes.id === jogo.id &&
      card &&
      window.cardAbertoJogosSeguintes.contains(card);

    if (ehCardAbertoDosJogosSeguintes) {
      const novoCard = await criarCardJogo(jogo, jogoLiberadoParaPalpite(jogo));

      const botaoVoltarCard = document.createElement("button");
      botaoVoltarCard.innerText = "Voltar aos jogos";
      botaoVoltarCard.className = "btn-voltar-card-palpite";

      botaoVoltarCard.onclick = () => {
        window.usuarioMexendoEmJogosSeguintes = false;
        window.cardAbertoJogosSeguintes = null;
        window.jogoAbertoJogosSeguintes = null;
        carregarJogosAmanha(dataSelecionadaJogosAmanha);
      };

      const novoContainer = document.createElement("div");
      novoContainer.appendChild(botaoVoltarCard);
      novoContainer.appendChild(novoCard);

      window.cardAbertoJogosSeguintes.replaceWith(novoContainer);
      window.cardAbertoJogosSeguintes = novoContainer;
      window.jogoAbertoJogosSeguintes = jogo;

    } else {
      const novoCard = await criarCardJogo(jogo, jogoLiberadoParaPalpite(jogo));

      if (card && card.parentNode) {
        card.replaceWith(novoCard);
      }
    }

  } catch (error) {
    console.log("Erro ao atualizar card depois do palpite:", error);
  }

  try {
    await carregarRanking();
  } catch (error) {
    console.log("Erro ao atualizar ranking depois do palpite:", error);
  }

  try {
    if (!window.usuarioMexendoEmFiltroPalpites) {
      await carregarMeusPalpites(dataSelecionadaMeusPalpites);
    }
  } catch (error) {
    console.log("Erro ao atualizar meus palpites depois do palpite:", error);
  }
}

async function criarCardJogo(jogo, rodadaAberta) {
  const div = document.createElement("div");
  div.className = "jogo";

  const ehMataMata = jogoEhMataMataPrincipal(jogo);

if (ehMataMata) {
  const inicio = new Date(jogo.kickoff).getTime();
  const agora = Date.now();

  const jogoFinalizado = jogo.status === "finished";
  const jogoAoVivo =
    jogo.status === "live" ||
    (agora >= inicio && !jogoFinalizado);

  const jogoSeguro = jogoPrincipalComDadosSeguros(jogo);

  const cardMataMata = document.createElement("div");
  cardMataMata.className = "card-jogo card-mata-mata-principal";

  let areaStatus = `
    <a class="btn-palpitar-mata-mata-principal" href="${urlMataMataParaJogoPrincipal(jogo)}">
      Palpitar no mata-mata
    </a>
  `;

  if (jogoAoVivo) {
    areaStatus = `
      <div class="placar-mata-principal">
        <span>${nomeSeguroJogoPrincipal(jogoSeguro.homeTeam)}</span>
        <strong>${placarTempoNormalJogo(jogo).home} x ${placarTempoNormalJogo(jogo).away}</strong>
        <span>${nomeSeguroJogoPrincipal(jogoSeguro.awayTeam)}</span>
      </div>

      <div class="status-live-principal">
        <span class="bolinha-live"></span>
        AO VIVO — ${htmlTempoJogoDinamico(jogo)}
      </div>

      ${htmlDetalhesExtrasJogo(jogo)}
      
    `;
  }

  if (jogoFinalizado) {
    areaStatus = `
      <div class="placar-mata-principal">
        <span>${nomeSeguroJogoPrincipal(jogoSeguro.homeTeam)}</span>
        <strong>${placarTempoNormalJogo(jogo).home} x ${placarTempoNormalJogo(jogo).away}</strong>
        <span>${nomeSeguroJogoPrincipal(jogoSeguro.awayTeam)}</span>
      </div>

      <div class="status-encerrado-principal">
        ENCERRADO
      </div>

      ${htmlDetalhesExtrasJogo(jogo)} 
      
    `;
  }

  if (jogoAoVivo || jogoFinalizado) {
  cardMataMata.innerHTML = areaStatus;
} else {
  cardMataMata.innerHTML = `
    <div class="card-mata-mata-topo">
      <strong>${nomeSeguroJogoPrincipal(jogoSeguro.homeTeam)} x ${nomeSeguroJogoPrincipal(jogoSeguro.awayTeam)}</strong>
      <span>${formatarHora(jogo.kickoff)}</span>
    </div>

    <p class="aviso-mata-mata-principal">
      Palpite disponível na página do mata-mata.
    </p>

    ${areaStatus}
  `;
}

  return cardMataMata;
}

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
  const tempoJogo = textoTempoDoJogo(jogo);

 div.classList.add("jogo-ao-vivo");
div.dataset.kickoff = jogo.kickoff;
div.dataset.status = "live";
div.dataset.apiStatus = jogo.apiStatus || "";

  div.innerHTML = `
    <div class="ao-vivo-topo">
      <div class="ao-vivo-label">
        <span class="bolinha-ao-vivo"></span>
<span class="tempo-jogo-ao-vivo">${tempoJogo || "AO VIVO"}</span>     
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

  if (atingiuLimiteAlteracoes && !jogoJaComecou) {
  div.className = "jogo-mini palpite-travado-mini";

  div.innerHTML = `
    <span>${formatarHora(jogo.kickoff)}</span>
  <strong>${nomeSeguroJogoPrincipal(jogo.homeTeam)} x ${nomeSeguroJogoPrincipal(jogo.awayTeam)}</strong>
    <span class="status-fechado">Palpite feito. Aguarde começar!</span>
  `;

  return div;
}
  
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
    window.usuarioSalvandoPalpite = true;
window.ignorarAtualizacaoFirestoreAte = Date.now() + 5000;

pausarAtualizacoesPorInteracao(8000);

botao.disabled = true;
botao.innerText = "Salvando...";
    window.usuarioSalvandoPalpite = true;
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
  await atualizarCardDepoisDoPalpite(div, jogo);

  window.usuarioSalvandoPalpite = false;
  window.usuarioInteragindoNoSite = false;
  window.ignorarAtualizacaoFirestoreAte = Date.now() + 3000;

  carregamentoGeralPendente = false;
}, 800);
  });

  return div;
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

  const usuarios = [];

  usersSnap.forEach((docSnap) => {
    const usuario = {
      id: docSnap.id,
      ...docSnap.data()
    };

    usuarios.push({
      ...usuario,
      pontosCalculados: Number(usuario.pontos || 0)
    });
  });

  usuarios.sort((a, b) => b.pontosCalculados - a.pontosCalculados);

  usuarios.forEach((usuario, index) => {
    const div = document.createElement("div");
    div.className = "ranking-item";

    const nome =
      usuario.nome ||
      usuario.name ||
      usuario.displayName ||
      usuario.email ||
      "Usuário";

    div.innerHTML = `
      <span>${index + 1}. ${nome}</span>
      <strong>${usuario.pontosCalculados} pts</strong>
    `;

    rankingDiv.appendChild(div);
  });
}

window.carregarRanking = carregarRanking;

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

  try {
    const snapJogos = await getDocs(collection(db, "matches"));

    const jogos = [];
    snapJogos.forEach((docSnap) => {
      jogos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (jogos.length === 0) {
      titulo.innerText = "Nenhum jogo cadastrado";
      texto.innerText = "Quando houver jogos cadastrados, a contagem aparecerá aqui.";
      contador.innerText = "--:--:--";
      alvoContagem = null;
      return;
    }

    const snapPalpites = await getDocs(
      query(
        collection(db, "predictions"),
        where("userId", "==", usuarioAtual.uid)
      )
    );

    const palpitesPorJogo = {};
    snapPalpites.forEach((docSnap) => {
      const palpite = docSnap.data();
      palpitesPorJogo[palpite.matchId] = palpite;
    });

    const agora = Date.now();

    const jogosOrdenados = removerJogosDuplicados(jogos)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

    const jogosAgendados = jogosOrdenados.filter((jogo) => jogo.status === "scheduled");
    const jogosAoVivo = jogosOrdenados.filter((jogo) => jogo.status === "live");

    const jogosAbertos = jogosAgendados.filter((jogo) => {
      const inicio = new Date(jogo.kickoff).getTime();
      const abre = dataHoraAberturaPalpites(jogo);

      return agora >= abre && agora < inicio;
    });

    const jogosAbertosSemPalpiteLivre = jogosAbertos.filter((jogo) => {
      const palpite = palpitesPorJogo[jogo.id];

      if (!palpite) return true;

      return Number(palpite.editCount || 0) < 2;
    });

    if (jogosAbertosSemPalpiteLivre.length > 0) {
  const jogoAlvo = jogosAbertosSemPalpiteLivre[0];
  const inicio = new Date(jogoAlvo.kickoff).getTime();
  const restante = inicio - agora;

  titulo.innerText = `${jogoAlvo.homeTeam} x ${jogoAlvo.awayTeam}`;

  if (restante <= 30 * 60 * 1000) {
    texto.innerText = "Jogo inicia em";
    contador.classList.add("alerta");
  } else {
    texto.innerText = "Rodada aberta";
    contador.classList.remove("alerta");
  }

 alvoContagem = new Date(inicio);
configurarPainelContagem("jogo_aberto", jogoAlvo);
contador.innerText = formatarContagem(restante);
atualizarPainelContagemPrincipal();

return;
}

    const proximoJogoAberto = jogosAbertos[0];

    if (proximoJogoAberto) {
      const inicio = new Date(proximoJogoAberto.kickoff).getTime();

      titulo.innerText = `${proximoJogoAberto.homeTeam} x ${proximoJogoAberto.awayTeam}`;
      texto.innerText = "Jogo inicia em";
alvoContagem = new Date(inicio);
configurarPainelContagem("jogo_aberto", proximoJogoAberto);
contador.innerText = formatarContagem(inicio - agora);
atualizarPainelContagemPrincipal();

return;
    }

    const proximosJogosFechados = jogosAgendados.filter((jogo) => {
      const abre = dataHoraAberturaPalpites(jogo);
      return abre > agora;
    });

    if (proximosJogosFechados.length > 0) {
      const jogoAlvo = proximosJogosFechados[0];
      const abertura = dataHoraAberturaPalpites(jogoAlvo);

      titulo.innerText = `${jogoAlvo.homeTeam} x ${jogoAlvo.awayTeam}`;
      texto.innerText = "Palpites abrem às 20 horas";
      alvoContagem = new Date(abertura);
configurarPainelContagem("abertura_palpites", jogoAlvo);
      
      return;
    }

    if (jogosAoVivo.length > 0) {
      const jogoAlvo = jogosAoVivo[0];

      titulo.innerText = `${jogoAlvo.homeTeam} x ${jogoAlvo.awayTeam}`;
      texto.innerText = textoTempoDoJogo(jogoAlvo) || "Jogo em andamento";
      contador.innerText = "00h 00m 00s";
configurarPainelContagem(null, null);
      
      return;
    }

    titulo.innerText = "Jogos do dia em andamento ou encerrados";
    texto.innerText = "Aguarde a próxima abertura de palpites.";
    contador.innerText = "00h 00m 00s";
    alvoContagem = null;

  } catch (error) {
    console.log("Erro ao carregar painel de tempo:", error);
    titulo.innerText = "Erro ao carregar contagem";
    texto.innerText = "Tente atualizar a página.";
    contador.innerText = "--:--:--";
    alvoContagem = null;
  }
}

async function carregarResultadosAnteriores(dataFiltro = dataSelecionadaResultados) {
  dataSelecionadaResultados = dataFiltro;

  const painel = document.getElementById("painelResultados");
  painel.innerHTML = "";

  const blocoFiltro = document.createElement("div");
  blocoFiltro.className = "filtro-resultados";
  blocoFiltro.innerHTML = `
    <label for="dataResultados">📅 Ver resultados por data</label>
    <input type="date" id="dataResultados" value="${dataSelecionadaResultados}">
  `;

  painel.appendChild(blocoFiltro);

  const inputData = blocoFiltro.querySelector("#dataResultados");

  inputData.addEventListener("focus", () => {
    window.usuarioMexendoEmFiltroResultados = true;
  });

  inputData.addEventListener("blur", () => {
    setTimeout(() => {
      window.usuarioMexendoEmFiltroResultados = false;
    }, 500);
  });

  inputData.addEventListener("change", () => {
    dataSelecionadaResultados = inputData.value;
    carregarResultadosAnteriores(dataSelecionadaResultados);
  });

  const snap = await getDocs(collection(db, "matches"));

  const jogos = [];
  snap.forEach((docSnap) => {
    jogos.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  const finalizados = jogos
    .filter((jogo) => jogo.status === "finished")
    .filter((jogo) => jogo.date === dataSelecionadaResultados)
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));

  if (finalizados.length === 0) {
    const vazio = document.createElement("p");
    vazio.innerText = "Nenhum resultado para esta data.";
    painel.appendChild(vazio);
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

function jogoEhKnockoutParaTempo(jogo) {
  if (!jogo) return false;

  if (jogo.phase === "knockout") return true;
  if (jogo.knockoutMatchId) return true;
  if (jogo.matchId && String(jogo.matchId).startsWith("M")) return true;
  if (jogo.id && String(jogo.id).startsWith("M")) return true;
  if (jogo.id && String(jogo.id).startsWith("O")) return true;

  if (typeof jogoEhMataMataPrincipal === "function") {
    return jogoEhMataMataPrincipal(jogo);
  }

  return false;
}

function minutosDesdeInicioJogo(kickoff) {
  if (!kickoff) return 0;

  const inicio = new Date(kickoff).getTime();
  const agora = Date.now();

  return Math.max(0, Math.floor((agora - inicio) / 60000));
}

function textoTempoDoJogoDetalhado(jogo) {
  if (!jogo) return "";

  if (jogo.status === "finished") return "ENCERRADO";

  const ehKnockout = jogoEhKnockoutParaTempo(jogo);
  const minutos = minutosDesdeInicioJogo(jogo.kickoff);

  if (jogo.apiStatus === "PENALTY_SHOOTOUT") return "PÊNALTIS";
  const penaltis = placarPenaltisJogo(jogo);

if (penaltis || jogo.apiStatus === "PENALTY_SHOOTOUT") {
  return "PÊNALTIS";
}

if (jogo.apiStatus === "SUSPENDED") {
  if (ehKnockout && minutos > 120) return "PÊNALTIS";
  return "JOGO PAUSADO";
}
  if (jogo.apiStatus === "PAUSED") {
  if (ehKnockout && minutos > 120) return "PÊNALTIS";
  if (ehKnockout && minutos > 105) return "INTERVALO PRORROGAÇÃO";
  if (ehKnockout && minutos > 90) return "INTERVALO PRORROGAÇÃO";
  return "INTERVALO";
}

  if (jogo.apiStatus === "EXTRA_TIME") {
    if (minutos <= 95) return "INTERVALO PRORROGAÇÃO";
    if (minutos <= 105) return `1ºT PRORROGAÇÃO - ${minutos}'`;
    if (minutos <= 110) return "INTERVALO PRORROGAÇÃO";
    if (minutos <= 120) return `2ºT PRORROGAÇÃO - ${minutos}'`;
    return "PÊNALTIS";
  }

  if (minutos <= 45) return `1º TEMPO - ${minutos}'`;
  if (minutos <= 50) return "INTERVALO";
  if (minutos <= 90) return `2º TEMPO - ${minutos}'`;

  if (!ehKnockout) return `2º TEMPO - ${minutos}'`;

  const empatado =
    Number(jogo.homeScore ?? 0) === Number(jogo.awayScore ?? 0);

  if (!empatado) return `2º TEMPO - ${minutos}'`;

  if (minutos <= 95) return "INTERVALO PRORROGAÇÃO";
  if (minutos <= 105) return `1ºT PRORROGAÇÃO - ${minutos}'`;
  if (minutos <= 110) return "INTERVALO PRORROGAÇÃO";
  if (minutos <= 120) return `2ºT PRORROGAÇÃO - ${minutos}'`;

  return "PÊNALTIS";
}

function htmlTempoJogoDinamico(jogo, textoPadrao = "AO VIVO") {
  return `
    <span
      class="tempo-jogo-dinamico"
      data-kickoff="${jogo.kickoff}"
      data-status="${jogo.status}"
      data-api-status="${jogo.apiStatus || ""}"
      data-home-score="${jogo.homeScore ?? ""}"
      data-away-score="${jogo.awayScore ?? ""}"
      data-phase="${jogo.phase || ""}"
      data-knockout-match-id="${jogo.knockoutMatchId || ""}"
      data-match-id="${jogo.matchId || jogo.id || ""}"
    >
      ${textoTempoDoJogoDetalhado(jogo) || textoTempoDoJogo(jogo) || textoPadrao}
    </span>
  `;
}

function placarTempoNormalJogo(jogo) {
  return {
    home: jogo.regularTimeHomeScore ?? jogo.homeScore ?? 0,
    away: jogo.regularTimeAwayScore ?? jogo.awayScore ?? 0
  };
}

function placarProrrogacaoFinalJogo(jogo) {
  const temProrrogacao =
    jogo.extraTimeHomeScore !== undefined &&
    jogo.extraTimeHomeScore !== null &&
    jogo.extraTimeAwayScore !== undefined &&
    jogo.extraTimeAwayScore !== null;

  if (!temProrrogacao) return null;

  const tempoNormal = placarTempoNormalJogo(jogo);

  const extraHome = Number(jogo.extraTimeHomeScore);
  const extraAway = Number(jogo.extraTimeAwayScore);

  if (Number.isNaN(extraHome) || Number.isNaN(extraAway)) return null;

  const extraPareceSerPeriodo =
    extraHome < Number(tempoNormal.home) ||
    extraAway < Number(tempoNormal.away);

  if (extraPareceSerPeriodo) {
    return {
      home: Number(tempoNormal.home) + extraHome,
      away: Number(tempoNormal.away) + extraAway
    };
  }

  return {
    home: extraHome,
    away: extraAway
  };
}

function placarPenaltisJogo(jogo) {
  const temPenaltis =
    jogo.penaltiesHomeScore !== undefined &&
    jogo.penaltiesHomeScore !== null &&
    jogo.penaltiesAwayScore !== undefined &&
    jogo.penaltiesAwayScore !== null;

  if (!temPenaltis) return null;

  return {
    home: Number(jogo.penaltiesHomeScore),
    away: Number(jogo.penaltiesAwayScore)
  };
}

function textoResultadoFinalPalpitesJogo(jogo) {
  const normal = placarTempoNormalJogo(jogo);
  const prorrogacao = placarProrrogacaoFinalJogo(jogo);
  const penaltis = placarPenaltisJogo(jogo);

  if (penaltis) {
    return `${normal.home} (${penaltis.home}) x (${penaltis.away}) ${normal.away}`;
  }

  if (prorrogacao) {
    return `${prorrogacao.home} x ${prorrogacao.away}`;
  }

  return `${normal.home} x ${normal.away}`;
}

function htmlDetalhesExtrasJogo(jogo) {
const prorrogacao = placarProrrogacaoFinalJogo(jogo);
  const penaltis = placarPenaltisJogo(jogo);

  if (!prorrogacao && !penaltis) return "";

  return `
    <div class="bloco-extras-jogo">
      ${
        prorrogacao
          ? `<div class="linha-extra-jogo">Prorrogação: <strong>${prorrogacao.home} x ${prorrogacao.away}</strong></div>`
          : ""
      }
      ${
        penaltis
          ? `<div class="linha-extra-jogo">Pênaltis: <strong>${penaltis.home} x ${penaltis.away}</strong></div>`
          : ""
      }
    </div>
  `;
}

async function carregarMeusPalpites(dataFiltro = dataSelecionadaMeusPalpites) {
  dataSelecionadaMeusPalpites = dataFiltro;

  const painel = document.getElementById("painelMeusPalpites");
  painel.innerHTML = "";

  const blocoFiltro = document.createElement("div");
  blocoFiltro.className = "filtro-resultados";
  blocoFiltro.innerHTML = `
    <label for="dataMeusPalpites">📅 Ver seus palpites por data</label>
    <input type="date" id="dataMeusPalpites" value="${dataSelecionadaMeusPalpites}">
  `;

  painel.appendChild(blocoFiltro);

  const inputData = blocoFiltro.querySelector("#dataMeusPalpites");

  inputData.addEventListener("focus", () => {
    window.usuarioMexendoEmFiltroPalpites = true;
  });

  inputData.addEventListener("blur", () => {
    setTimeout(() => {
      window.usuarioMexendoEmFiltroPalpites = false;
    }, 500);
  });

  inputData.addEventListener("change", () => {
    dataSelecionadaMeusPalpites = inputData.value;
    carregarMeusPalpites(dataSelecionadaMeusPalpites);
  });

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
    const vazio = document.createElement("p");
    vazio.innerText = "Você ainda não fez nenhum palpite.";
    painel.appendChild(vazio);
    return;
  }

  const snapJogos = await getDocs(collection(db, "matches"));
  const jogosPorId = {};

  snapJogos.forEach((docSnap) => {
    jogosPorId[docSnap.id] = {
      id: docSnap.id,
      ...docSnap.data()
    };
  });

  const lista = [];

palpites.forEach((palpite) => {
  let jogo =
    jogosPorId[palpite.matchId] ||
    jogosPorId[palpite.firestoreMatchId];

  if (palpite.phase === "knockout") {
    jogo = {
      ...(jogo || {}),
      id: palpite.matchId,
      knockoutMatchId: palpite.knockoutMatchId || palpite.matchId,
      homeTeam: nomeSeguroJogoPrincipal(palpite.homeTeam, jogo?.homeTeam),
      awayTeam: nomeSeguroJogoPrincipal(palpite.awayTeam, jogo?.awayTeam),
      homeScore: jogo?.homeScore ?? palpite.homeScore ?? null,
      awayScore: jogo?.awayScore ?? palpite.awayScore ?? null,
      date: palpite.date || jogo?.date,
      kickoff: palpite.kickoff || jogo?.kickoff,
      status: jogo?.status || palpite.status || "scheduled"
    };
  }

  if (!jogo) return;
  if (jogo.date !== dataSelecionadaMeusPalpites) return;

  lista.push({
    palpite,
    jogo
  });
});
  
  lista.sort((a, b) => new Date(a.jogo.kickoff) - new Date(b.jogo.kickoff));

  if (lista.length === 0) {
    const vazio = document.createElement("p");
    vazio.innerText = "Nenhum palpite para esta data.";
    painel.appendChild(vazio);
    return;
  }

  lista.forEach(({ palpite, jogo }) => {
    const inicioMs = new Date(jogo.kickoff).getTime();
const agoraMs = Date.now();
const jogoComecouAgora = agoraMs >= inicioMs;
const passouLimiteAoVivo = agoraMs > inicioMs + 3 * 60 * 60 * 1000;

const jogoFinalizado = jogo.status === "finished";

const jogoAoVivo =
  !jogoFinalizado &&
  (
    jogo.status === "live" ||
    (jogoComecouAgora && !passouLimiteAoVivo)
  );

    let statusTexto = "Agendado";
    let badgeClasse = "agendado";
    let comparacao = "Aguardando o jogo acontecer.";
    let resultadoLinha = "Resultado: ainda não disponível.";
    let pontosLinha = "";

    if (jogoAoVivo) {
  statusTexto = htmlTempoJogoDinamico(jogo);
  badgeClasse = "ao-vivo";
  resultadoLinha = `Placar atual: ${placarTempoNormalJogo(jogo).home} x ${placarTempoNormalJogo(jogo).away}`;
  comparacao = "Tempo normal encerrado.";
}
    
   if (jogoFinalizado) {
  statusTexto = "Encerrado";
  badgeClasse = "finalizado";

  const placarBolao = placarTempoNormalJogo(jogo);

  const pontos =
    palpite.phase === "knockout"
      ? calcularPontosMataMata(
          palpite.homeGuess,
          palpite.awayGuess,
          placarBolao.home,
          placarBolao.away
        )
      : calcularPontos(
          palpite.homeGuess,
          palpite.awayGuess,
          jogo.homeScore,
          jogo.awayScore
        );

  resultadoLinha = `Resultado final: ${textoResultadoFinalPalpitesJogo(jogo)}`;
  pontosLinha = `Você fez: ${pontos} ${pontos === 1 ? "ponto" : "pontos"}`;

  comparacao =
    palpite.phase === "knockout"
      ? textoResultadoPalpite(
          palpite.homeGuess,
          palpite.awayGuess,
          placarBolao.home,
          placarBolao.away
        )
      : textoResultadoPalpite(
          palpite.homeGuess,
          palpite.awayGuess,
          jogo.homeScore,
          jogo.awayScore
        );
}

    const div = document.createElement("div");
    div.className = "linha-info";
    div.innerHTML = `
     
  <strong>${nomeSeguroJogoPrincipal(jogo.homeTeam)} x ${nomeSeguroJogoPrincipal(jogo.awayTeam)}</strong>
      <span>Data: ${formatarDataBR(jogo.date)} — ${formatarHora(jogo.kickoff)}</span>
      <br>
      <span>Seu palpite: ${palpite.homeGuess} x ${palpite.awayGuess}</span>
      <br>
      <span class="linha-resultado-real">${resultadoLinha}</span>
      <br>
      ${pontosLinha ? `<span class="pontos-palpite">${pontosLinha}</span><br>` : ""}
      <span>${comparacao}</span>
      <br>
<span class="badge ${badgeClasse}">${statusTexto}</span>
`;

    painel.appendChild(div);
  });
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
  window.usuarioVendoMeusPalpites = aba !== "resultados";
  
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

carregarMeusPalpites(dataSelecionadaMeusPalpites);  
  }
}

function atualizarTempoDosJogosAoVivo() {
  const cardsAoVivo = document.querySelectorAll(".jogo-ao-vivo");

  cardsAoVivo.forEach((card) => {
    const kickoff = card.dataset.kickoff;
    const apiStatus = card.dataset.apiStatus;

    if (!kickoff) return;

    const jogoTemporario = {
      kickoff,
      status: "live",
      apiStatus
    };

    const tempo = textoTempoDoJogo(jogoTemporario);
    const textoTempo = card.querySelector(".tempo-jogo-ao-vivo");

    if (textoTempo) {
      textoTempo.innerText = tempo || "AO VIVO";
    }
  });

  const temposDinamicos = document.querySelectorAll(".tempo-jogo-dinamico");

  temposDinamicos.forEach((elemento) => {
    const kickoff = elemento.dataset.kickoff;
    const status = elemento.dataset.status;
    const apiStatus = elemento.dataset.apiStatus;

    if (!kickoff) return;
    if (status !== "live") return;

    const jogoTemporario = {
      kickoff,
      status,
      apiStatus
    };

    const tempo = textoTempoDoJogo(jogoTemporario);

    if (tempo) {
      elemento.innerText = tempo;
    }
  });

  atualizarPainelContagemPrincipal();
}

function configurarPainelContagem(tipo, jogo = null) {
  window.painelContagemTipo = tipo;
  window.painelContagemJogo = jogo;
}

function atualizarPainelContagemPrincipal() {
  const texto = document.getElementById("textoContagem");
  const contador = document.getElementById("contadorPrincipal");

  if (!texto || !contador) return;
  if (!alvoContagem) return;

  const agora = Date.now();
  const restante = alvoContagem.getTime() - agora;

  if (restante <= 0) return;

  if (window.painelContagemTipo === "jogo_aberto") {
    if (restante <= 30 * 60 * 1000) {
      texto.innerText = "Jogo inicia em";
      contador.classList.add("alerta");
    } else {
      texto.innerText = "Rodada aberta";
      contador.classList.remove("alerta");
    }
  }

  if (window.painelContagemTipo === "abertura_palpites") {
    texto.innerText = "Palpites abrem às 20 horas";
    contador.classList.remove("alerta");
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
    atualizarTempoDosJogosAoVivo();
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
  window.ultimoRecarregamentoPorTempo = 0;

  setInterval(async () => {
    if (!usuarioAtual) return;

    const agora = Date.now();

    const contadorPrincipalZerou =
      alvoContagem &&
      alvoContagem.getTime &&
      alvoContagem.getTime() <= agora;

    const contadorAmanhaZerou =
      alvoContagemAmanha &&
      alvoContagemAmanha.getTime &&
      alvoContagemAmanha.getTime() <= agora;

    const algumContadorZerou = contadorPrincipalZerou || contadorAmanhaZerou;

    if (!algumContadorZerou) return;

// Evita ficar recarregando várias vezes seguidas
    if (agora - window.ultimoRecarregamentoPorTempo < 10000) return;
    
    window.ultimoRecarregamentoPorTempo = agora;

    const campoAtivo = document.activeElement;
    const usuarioEstaDigitando =
      campoAtivo &&
      (campoAtivo.tagName === "INPUT" || campoAtivo.tagName === "TEXTAREA");

    if (usuarioEstaDigitando) return;

    await carregarTudo();
  }, 5000);
}

function iniciarListenersTempoReal() {
  if (window.listenersTempoRealLigados) return;

  window.listenersTempoRealLigados = true;

  let timeoutAtualizacao = null;
  let atualizacaoEmAndamento = false;
  let atualizacaoPendente = false;

  async function executarAtualizacao() {
    if (!usuarioAtual) return;

    if (Date.now() < window.ignorarAtualizacaoFirestoreAte) {
  carregamentoGeralPendente = false;
  return;
}
    
    const campoAtivo = document.activeElement;
    const usuarioEstaDigitando =
      campoAtivo &&
      (campoAtivo.tagName === "INPUT" || campoAtivo.tagName === "TEXTAREA");

    if (
  usuarioEstaDigitando ||
  window.usuarioSalvandoPalpite ||
  window.usuarioInteragindoNoSite
) {
  atualizacaoPendente = true;
  carregamentoGeralPendente = true;
  return;
}

    if (atualizacaoEmAndamento) {
      atualizacaoPendente = true;
      return;
    }

    atualizacaoEmAndamento = true;

    try {
      await carregarTudo();
    } catch (error) {
      console.log("Erro na atualização em tempo real:", error);
    } finally {
      atualizacaoEmAndamento = false;

      if (atualizacaoPendente) {
        atualizacaoPendente = false;

        clearTimeout(timeoutAtualizacao);
        timeoutAtualizacao = setTimeout(() => {
          executarAtualizacao();
        }, 1500);
      }
    }
  }

  function atualizarComDebounce() {
    clearTimeout(timeoutAtualizacao);

    timeoutAtualizacao = setTimeout(() => {
      executarAtualizacao();
    }, 1500);
  }

  onSnapshot(collection(db, "matches"), atualizarComDebounce);
  onSnapshot(collection(db, "predictions"), atualizarComDebounce);
  onSnapshot(collection(db, "users"), atualizarComDebounce);
}
