// VERSÃO 127 - Atualiza confrontos manuais e Canadá nas oitavas

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQszm5MRBszffXrrPxJHlcSoOoLYo5A6g",
  authDomain: "bolao-copa-2026-48fc2.firebaseapp.com",
  projectId: "bolao-copa-2026-48fc2",
  storageBucket: "bolao-copa-2026-48fc2.firebasestorage.app",
  messagingSenderId: "866731236351",
  appId: "1:866731236351:web:0bc6c58d7fd7da8224a5ca"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await setPersistence(auth, browserLocalPersistence);

let usuarioAtual = null;
let dadosUsuarioAtual = null;

let palpitesMataMata = {};

let carregamentoMataMataEmAndamento = false;
let carregamentoMataMataPendente = false;

window.usuarioSalvandoPalpiteMataMata = false;
window.usuarioInteragindoMataMata = false;
window.timeoutInteracaoMataMata = null;
window.ignorarAtualizacaoMataMataAte = 0;

function pausarAtualizacoesMataMataPorInteracao(tempo = 4000) {
  window.usuarioInteragindoMataMata = true;

  clearTimeout(window.timeoutInteracaoMataMata);

  window.timeoutInteracaoMataMata = setTimeout(() => {
    window.usuarioInteragindoMataMata = false;

    if (carregamentoMataMataPendente && usuarioAtual) {
      carregamentoMataMataPendente = false;
      carregarMataMata();
    }
  }, tempo);
}

function iniciarProtecaoMobileMataMata() {
  if (window.protecaoMobileMataMataLigada) return;

  window.protecaoMobileMataMataLigada = true;

  window.addEventListener("scroll", () => {
    pausarAtualizacoesMataMataPorInteracao(2500);
  }, { passive: true });

  window.addEventListener("touchstart", () => {
    pausarAtualizacoesMataMataPorInteracao(4000);
  }, { passive: true });

  window.addEventListener("touchmove", () => {
    pausarAtualizacoesMataMataPorInteracao(4000);
  }, { passive: true });

  document.addEventListener("input", () => {
    pausarAtualizacoesMataMataPorInteracao(6000);
  });

  document.addEventListener("focusin", (event) => {
    if (
      event.target &&
      (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")
    ) {
      pausarAtualizacoesMataMataPorInteracao(8000);
    }
  });
}

const jogosMataMata = [
  // LADO ESQUERDO - Segunda rodada / 32 seleções
  {
    id: "M101",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M101",
    homeTeam: "ÁFRICA DO SUL",
    awayTeam: "CANADÁ",
    homeFlag: "🇿🇦",
    awayFlag: "🇨🇦",
    date: "2026-06-28",
    kickoff: "2026-06-28T16:00:00",
    status: "finished",
    homeScore: 0,
    awayScore: 1
  },
  {
    id: "M102",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M102",
    homeTeam: "BRASIL",
    awayTeam: "JAPÃO",
    homeFlag: "🇧🇷",
    awayFlag: "🇯🇵",
    date: "2026-06-29",
    kickoff: "2026-06-29T14:00:00",
    status: "scheduled"
  },
  {
    id: "M103",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M103",
    homeTeam: "ALEMANHA",
    awayTeam: "PARAGUAI",
    homeFlag: "🇩🇪",
    awayFlag: "🇵🇾",
    date: "2026-06-29",
    kickoff: "2026-06-29T17:30:00",
    status: "scheduled"
  },
  {
    id: "M104",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M104",
    homeTeam: "HOLANDA",
    awayTeam: "MARROCOS",
    homeFlag: "🇳🇱",
    awayFlag: "🇲🇦",
    date: "2026-06-29",
    kickoff: "2026-06-29T22:00:00",
    status: "scheduled"
  },
  {
    id: "M105",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M105",
    homeTeam: "COSTA DO MARFIM",
    awayTeam: "NORUEGA",
    homeFlag: "🇨🇮",
    awayFlag: "🇳🇴",
    date: "2026-06-30",
    kickoff: "2026-06-30T14:00:00",
    status: "scheduled"
  },
  {
    id: "M106",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M106",
    homeTeam: "FRANÇA",
    awayTeam: "SUÉCIA",
    homeFlag: "🇫🇷",
    awayFlag: "🇸🇪",
    date: "2026-06-30",
    kickoff: "2026-06-30T18:00:00",
    status: "scheduled"
  },
  {
    id: "M107",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M107",
    homeTeam: "MÉXICO",
    awayTeam: "EQUADOR",
    homeFlag: "🇲🇽",
    awayFlag: "🇪🇨",
    date: "2026-06-30",
    kickoff: "2026-06-30T22:00:00",
    status: "scheduled"
  },
  {
    id: "M108",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M108",
    homeTeam: "INGLATERRA",
    awayTeam: "CONGO DR",
    homeFlag: "🏴",
    awayFlag: "🇨🇩",
    date: "2026-07-01",
    kickoff: "2026-07-01T13:00:00",
    status: "scheduled"
  },

  // LADO DIREITO - Segunda rodada / 32 seleções
  {
    id: "M109",
    lado: "direito",
    fase: "round32",
    codigo: "M109",
    homeTeam: "BÉLGICA",
    awayTeam: "SENEGAL",
    homeFlag: "🇧🇪",
    awayFlag: "🇸🇳",
    date: "2026-07-01",
    kickoff: "2026-07-01T17:00:00",
    status: "scheduled"
  },
  {
    id: "M110",
    lado: "direito",
    fase: "round32",
    codigo: "M110",
    homeTeam: "ESTADOS UNIDOS",
    awayTeam: "BÓSNIA E HERZEGOVINA",
    homeFlag: "🇺🇸",
    awayFlag: "🇧🇦",
    date: "2026-07-01",
    kickoff: "2026-07-01T21:00:00",
    status: "scheduled"
  },
  {
    id: "M111",
    lado: "direito",
    fase: "round32",
    codigo: "M111",
    homeTeam: "ESPANHA",
    awayTeam: "A definir",
    homeFlag: "🇪🇸",
    awayFlag: "🛡️",
    date: "2026-07-02",
    kickoff: "2026-07-02T16:00:00",
    status: "scheduled"
  },
  {
    id: "M112",
    lado: "direito",
    fase: "round32",
    codigo: "M112",
    homeTeam: "PORTUGAL",
    awayTeam: "CROÁCIA",
    homeFlag: "🇵🇹",
    awayFlag: "🇭🇷",
    date: "2026-07-02",
    kickoff: "2026-07-02T20:00:00",
    status: "scheduled"
  },
  {
    id: "M113",
    lado: "direito",
    fase: "round32",
    codigo: "M113",
    homeTeam: "SUÍÇA",
    awayTeam: "ARGÉLIA",
    homeFlag: "🇨🇭",
    awayFlag: "🇩🇿",
    date: "2026-07-03",
    kickoff: "2026-07-03T00:00:00",
    status: "scheduled"
  },
  {
    id: "M114",
    lado: "direito",
    fase: "round32",
    codigo: "M114",
    homeTeam: "AUSTRÁLIA",
    awayTeam: "EGITO",
    homeFlag: "🇦🇺",
    awayFlag: "🇪🇬",
    date: "2026-07-03",
    kickoff: "2026-07-03T15:00:00",
    status: "scheduled"
  },
  {
    id: "M115",
    lado: "direito",
    fase: "round32",
    codigo: "M115",
    homeTeam: "ARGENTINA",
    awayTeam: "CABO VERDE",
    homeFlag: "🇦🇷",
    awayFlag: "🇨🇻",
    date: "2026-07-03",
    kickoff: "2026-07-03T19:00:00",
    status: "scheduled"
  },
  {
    id: "M116",
    lado: "direito",
    fase: "round32",
    codigo: "M116",
    homeTeam: "COLÔMBIA",
    awayTeam: "GANA",
    homeFlag: "🇨🇴",
    awayFlag: "🇬🇭",
    date: "2026-07-03",
    kickoff: "2026-07-03T22:30:00",
    status: "scheduled"
  },

  // OITAVAS
  ...criarJogosGenericos("esquerdo", "oitavas", "O", 4, [
    ["2026-07-04", "14:00"],
    ["2026-07-05", "17:00"],
    ["2026-07-06", "16:00"],
    ["2026-07-07", "13:00"]
  ]),
  ...criarJogosGenericos("direito", "oitavas", "O", 4, [
    ["2026-07-04", "18:00"],
    ["2026-07-05", "21:00"],
    ["2026-07-06", "21:00"],
    ["2026-07-07", "17:00"]
  ]),

  // QUARTAS
  ...criarJogosGenericos("esquerdo", "quartas", "Q", 2, [
    ["2026-07-09", "17:00"],
    ["2026-07-11", "18:00"]
  ]),
  ...criarJogosGenericos("direito", "quartas", "Q", 2, [
    ["2026-07-10", "16:00"],
    ["2026-07-11", "22:00"]
  ]),

  // SEMIFINAIS
  {
    id: "S1",
    lado: "centro",
    fase: "semi",
    codigo: "S1",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-07-14",
    kickoff: "2026-07-14T16:00:00",
    status: "scheduled"
  },
  {
    id: "S2",
    lado: "centro",
    fase: "semi",
    codigo: "S2",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-07-15",
    kickoff: "2026-07-15T16:00:00",
    status: "scheduled"
  },

  // TERCEIRO LUGAR
  {
    id: "T3",
    lado: "centro",
    fase: "terceiro",
    codigo: "3º",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-07-18",
    kickoff: "2026-07-18T18:00:00",
    status: "scheduled"
  },

  // FINAL
  {
    id: "FINAL",
    lado: "centro",
    fase: "final",
    codigo: "FINAL",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-07-19",
    kickoff: "2026-07-19T16:00:00",
    status: "scheduled"
  }
];

function aplicarClassificadosManuaisMataMata() {
  const oitavaCanada = jogosMataMata.find((jogo) =>
    jogo.fase === "oitavas" &&
    jogo.lado === "esquerdo" &&
    jogo.date === "2026-07-04" &&
    jogo.kickoff === "2026-07-04T14:00:00"
  );

  if (oitavaCanada) {
    oitavaCanada.homeTeam = "CANADÁ";
    oitavaCanada.homeFlag = "🇨🇦";
  }
}

aplicarClassificadosManuaisMataMata();

function criarJogosGenericos(lado, fase, prefixo, quantidade, datas) {
  return datas.map((item, index) => {
    const numero = index + 1;
    const [date, hora] = item;

    return {
      id: `${prefixo}${lado}${numero}`,
      lado,
      fase,
      codigo: `${prefixo}${numero}`,
      homeTeam: "A definir",
      awayTeam: "A definir",
      homeFlag: "🛡️",
      awayFlag: "🛡️",
      date,
      kickoff: `${date}T${hora}:00`,
      status: "scheduled"
    };
  });
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(dataHora) {
  const data = new Date(dataHora);

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatarContagem(ms) {
  if (ms <= 0) return "00h 00m 00s";

  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  return `${String(horas).padStart(2, "0")}h ${String(minutos).padStart(2, "0")}m ${String(segundos).padStart(2, "0")}s`;
}

function dataHoraAberturaPalpites(jogo) {
  const dataJogo = new Date(`${jogo.date}T00:00:00`);
  dataJogo.setDate(dataJogo.getDate() - 1);

  const ano = dataJogo.getFullYear();
  const mes = String(dataJogo.getMonth() + 1).padStart(2, "0");
  const dia = String(dataJogo.getDate()).padStart(2, "0");

  return new Date(`${ano}-${mes}-${dia}T20:00:00`).getTime();
}

function normalizarNomeMataMata(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function bandeiraPorTimeMataMata(nome) {
  const time = normalizarNomeMataMata(nome);

  const bandeiras = {
    "AFRICA DO SUL": "🇿🇦",
    "CANADA": "🇨🇦",
    "BRASIL": "🇧🇷",
    "ALEMANHA": "🇩🇪",
    "MARROCOS": "🇲🇦",
    "MEXICO": "🇲🇽",
    "ESTADOS UNIDOS": "🇺🇸",
    "SUICA": "🇨🇭",
    "ARGENTINA": "🇦🇷",
    "COREIA DO SUL": "🇰🇷",
    "TCHEQUIA": "🇨🇿",
    "BOSNIA-HERZEGOVINA": "🇧🇦",
    "QATAR": "🇶🇦",
    "HAITI": "🇭🇹",
    "ESCOCIA": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "AUSTRALIA": "🇦🇺",
    "TURQUIA": "🇹🇷",
    "PARAGUAI": "🇵🇾",
    "CURACAU": "🇨🇼",
    "COSTA DO MARFIM": "🇨🇮",
    "EQUADOR": "🇪🇨",
    "HOLANDA": "🇳🇱",
    "SUECIA": "🇸🇪",
    "TUNISIA": "🇹🇳",
    "JAPAO": "🇯🇵",
    "BELGICA": "🇧🇪",
    "EGITO": "🇪🇬",
    "IRA": "🇮🇷",
    "NOVA ZELANDIA": "🇳🇿",
    "ESPANHA": "🇪🇸",
    "CABO VERDE": "🇨🇻",
    "ARABIA SAUDITA": "🇸🇦",
    "URUGUAI": "🇺🇾",
    "FRANCA": "🇫🇷",
    "SENEGAL": "🇸🇳",
    "IRAQUE": "🇮🇶",
    "NORUEGA": "🇳🇴",
    "ARGELIA": "🇩🇿",
    "AUSTRIA": "🇦🇹",
    "JORDANIA": "🇯🇴",
    "PORTUGAL": "🇵🇹",
    "CONGO DR": "🇨🇩",
    "UZBEQUISTAO": "🇺🇿",
    "COLOMBIA": "🇨🇴",
    "INGLATERRA": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "CROACIA": "🇭🇷",
    "GANA": "🇬🇭",
    "PANAMA": "🇵🇦"
  };

  return bandeiras[time] || "🏳️";
}

function dataCurtaMataMata(valor) {
  if (!valor) return "";

  if (typeof valor?.toDate === "function") {
    return valor.toDate().toISOString().slice(0, 10);
  }

  const texto = String(valor);

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }

  return "";
}

function horaCurtaMataMata(valor) {
  if (!valor) return "";

  if (typeof valor?.toDate === "function") {
    return valor
      .toDate()
      .toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo"
      });
  }

  const texto = String(valor);

  const matchHoraIso = texto.match(/T(\d{2}:\d{2})/);
  if (matchHoraIso) return matchHoraIso[1];

  const matchHoraSolta = texto.match(/^(\d{2}:\d{2})/);
  if (matchHoraSolta) return matchHoraSolta[1];

  return "";
}

function nomeCasaMatchMataMata(match) {
  return (
    match.homeTeam ||
    match.home ||
    match.homeName ||
    match.home_team ||
    match.homeTeamName ||
    ""
  );
}

function nomeForaMatchMataMata(match) {
  return (
    match.awayTeam ||
    match.away ||
    match.awayName ||
    match.away_team ||
    match.awayTeamName ||
    ""
  );
}

function dataMatchMataMata(match) {
  return (
    match.date ||
    match.matchDate ||
    dataCurtaMataMata(match.kickoff) ||
    dataCurtaMataMata(match.utcDate) ||
    ""
  );
}

function horaMatchMataMata(match) {
  return (
    horaCurtaMataMata(match.kickoff) ||
    horaCurtaMataMata(match.utcDate) ||
    horaCurtaMataMata(match.time) ||
    ""
  );
}

function partidaEhDoMataMata(match) {
  if (!match) return false;

  const data = dataMatchMataMata(match);

  if (match.phase === "knockout") return true;
  if (match.round === "round32") return true;
  if (match.stage === "LAST_32") return true;
  if (match.stage === "ROUND_OF_32") return true;

  if (data >= "2026-06-28") return true;

  return false;
}

function encontrarJogoFirestoreParaMataMata(jogoLocal, jogosFirestore) {
  const dataLocal = jogoLocal.date;
  const horaLocal = horaCurtaMataMata(jogoLocal.kickoff);

  const casaLocal = normalizarNomeMataMata(jogoLocal.homeTeam);
  const foraLocal = normalizarNomeMataMata(jogoLocal.awayTeam);

  return jogosFirestore.find((match) => {
    if (!partidaEhDoMataMata(match)) return false;

    if (
      jogoLocal.apiMatchId &&
      match.apiMatchId &&
      Number(jogoLocal.apiMatchId) === Number(match.apiMatchId)
    ) {
      return true;
    }

    const dataMatch = dataMatchMataMata(match);
    const horaMatch = horaMatchMataMata(match);

    const mesmaDataHora =
      dataMatch === dataLocal &&
      horaMatch === horaLocal;

    const casaMatch = normalizarNomeMataMata(nomeCasaMatchMataMata(match));
    const foraMatch = normalizarNomeMataMata(nomeForaMatchMataMata(match));

    const localTemADefinir =
      casaLocal.includes("A DEFINIR") ||
      foraLocal.includes("A DEFINIR");

    if (mesmaDataHora && localTemADefinir) {
      return true;
    }

    if (
      mesmaDataHora &&
      casaLocal === casaMatch &&
      foraLocal === foraMatch
    ) {
      return true;
    }

    const algumTimeBate =
      (casaLocal && casaLocal === casaMatch) ||
      (casaLocal && casaLocal === foraMatch) ||
      (foraLocal && foraLocal === casaMatch) ||
      (foraLocal && foraLocal === foraMatch);

    if (dataMatch === dataLocal && algumTimeBate) {
      return true;
    }

    return false;
  });
}

async function atualizarMataMataPorMatchesFirestore() {
  try {
    const snapshot = await getDocs(collection(db, "matches"));

    const jogosFirestore = snapshot.docs.map((documento) => ({
      firestoreId: documento.id,
      ...documento.data()
    }));

    console.log("Jogos encontrados em matches:", jogosFirestore.length);
    console.log("Primeiros matches:", jogosFirestore.slice(0, 5));

    const jogosPossiveisMataMata = jogosFirestore.filter((match) => {
  const data =
    match.date ||
    String(match.kickoff || "").slice(0, 10) ||
    String(match.utcDate || "").slice(0, 10) ||
    "";

  return data >= "2026-06-28";
});

console.log(
  "Possíveis jogos do mata-mata em matches:",
  jogosPossiveisMataMata.map((match) => ({
    id: match.firestoreId,
    apiMatchId: match.apiMatchId,
    date: match.date,
    kickoff: match.kickoff,
    utcDate: match.utcDate,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    status: match.status,
    apiStatus: match.apiStatus,
    stage: match.stage,
    round: match.round,
    phase: match.phase
  }))
);

    let atualizados = 0;

    jogosMataMata.forEach((jogoLocal) => {
      const match = encontrarJogoFirestoreParaMataMata(jogoLocal, jogosFirestore);

      if (jogoLocal.id === "M101") {
        console.log("Match encontrado para M101:", match);
      }

      if (!match) return;

      jogoLocal.firestoreMatchId = match.firestoreId;
      jogoLocal.apiMatchId = match.apiMatchId || jogoLocal.apiMatchId || null;
      jogoLocal.apiStatus = match.apiStatus || jogoLocal.apiStatus || null;

      const homeTeamMatch = nomeCasaMatchMataMata(match);
      const awayTeamMatch = nomeForaMatchMataMata(match);

      if (
  homeTeamMatch &&
  normalizarNomeMataMata(homeTeamMatch) !== "A DEFINIR" &&
  normalizarNomeMataMata(homeTeamMatch) !== "NULL" &&
  normalizarNomeMataMata(homeTeamMatch) !== "UNDEFINED"
) {
  jogoLocal.homeTeam = homeTeamMatch;
  jogoLocal.homeFlag = bandeiraPorTimeMataMata(homeTeamMatch);
}

if (
  awayTeamMatch &&
  normalizarNomeMataMata(awayTeamMatch) !== "A DEFINIR" &&
  normalizarNomeMataMata(awayTeamMatch) !== "NULL" &&
  normalizarNomeMataMata(awayTeamMatch) !== "UNDEFINED"
) {
  jogoLocal.awayTeam = awayTeamMatch;
  jogoLocal.awayFlag = bandeiraPorTimeMataMata(awayTeamMatch);
}

      const dataMatch = dataMatchMataMata(match);
      const horaMatch = horaMatchMataMata(match);

      if (dataMatch) {
        jogoLocal.date = dataMatch;
      }

      if (dataMatch && horaMatch) {
        jogoLocal.kickoff = `${dataMatch}T${horaMatch}:00`;
      }

      if (match.status) jogoLocal.status = match.status;
      if (match.apiStatus) jogoLocal.apiStatus = match.apiStatus;

      if (match.homeScore !== undefined && match.homeScore !== null) {
        jogoLocal.homeScore = Number(match.homeScore);
      }

      if (match.awayScore !== undefined && match.awayScore !== null) {
        jogoLocal.awayScore = Number(match.awayScore);
      }

      if (match.finishedAt) {
        jogoLocal.finishedAt = match.finishedAt;
      }

      atualizados++;
    });

    if (atualizados > 0) {
      console.log(`Mata-mata atualizado por matches: ${atualizados} jogo(s).`);
    }
  } catch (error) {
    console.warn("Não foi possível atualizar mata-mata por matches. Mantendo manual.", error);
  }
}

function jogoLiberadoParaPalpite(jogo) {
  if (jogo.status !== "scheduled") return false;

  const agora = Date.now();
  const abertura = dataHoraAberturaPalpites(jogo);
  const inicio = new Date(jogo.kickoff).getTime();

  return agora >= abertura && agora < inicio;
}

async function carregarPalpitesMataMata() {
  if (!usuarioAtual) return;

  palpitesMataMata = {};

  for (const jogo of jogosMataMata) {
    const palpiteId = `${usuarioAtual.uid}_${jogo.id}`;
    const palpiteSnap = await getDoc(doc(db, "predictions", palpiteId));

    if (palpiteSnap.exists()) {
      palpitesMataMata[jogo.id] = palpiteSnap.data();
    }
  }
}

async function salvarPalpiteMataMata(jogo, homeGuess, awayGuess, botao) {
  if (!usuarioAtual) {
    alert("Você precisa estar logado.");
    return;
  }

  const palpiteExistente = palpitesMataMata[jogo.id];
  const editCountAtual = Number(palpiteExistente?.editCount || 0);

  if (palpiteExistente && editCountAtual >= 2) {
    alert("Você já usou as 2 alterações deste palpite.");
    return;
  }

  if (homeGuess === "" || awayGuess === "") {
    alert("Preencha os dois placares.");
    return;
  }

  const homeNumber = Number(homeGuess);
  const awayNumber = Number(awayGuess);

  if (
    Number.isNaN(homeNumber) ||
    Number.isNaN(awayNumber) ||
    homeNumber < 0 ||
    awayNumber < 0
  ) {
    alert("Digite placares válidos.");
    return;
  }

  window.usuarioSalvandoPalpiteMataMata = true;
  window.ignorarAtualizacaoMataMataAte = Date.now() + 5000;
  pausarAtualizacoesMataMataPorInteracao(8000);

  botao.disabled = true;
  botao.innerText = "Salvando...";

  try {
    const palpiteId = `${usuarioAtual.uid}_${jogo.id}`;

    const novoEditCount = palpiteExistente
      ? editCountAtual + 1
      : 0;

    const palpite = {
  userId: usuarioAtual.uid,
  userName: dadosUsuarioAtual?.nome || usuarioAtual.email || "Usuário",

  matchId: jogo.id,
  knockoutMatchId: jogo.id,
  phase: "knockout",
  round: jogo.fase,

  firestoreMatchId: jogo.firestoreMatchId || null,
  apiMatchId: jogo.apiMatchId || null,

  date: jogo.date,
  kickoff: jogo.kickoff,

  homeTeam: jogo.homeTeam,
  awayTeam: jogo.awayTeam,
  homeFlag: jogo.homeFlag || "",
  awayFlag: jogo.awayFlag || "",

  homeGuess: homeNumber,
  awayGuess: awayNumber,

  editCount: novoEditCount,
  locked: novoEditCount >= 2,

  points: Number(palpiteExistente?.points || 0),

  createdAt: palpiteExistente?.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

    await setDoc(doc(db, "predictions", palpiteId), palpite, { merge: true });

    palpitesMataMata[jogo.id] = palpite;

    carregarChaveamento();
    carregarProximoJogo();

  } catch (error) {
    console.log("Erro ao salvar palpite mata-mata:", error);
    alert("Erro ao salvar palpite. Tente novamente.");
  } finally {
    setTimeout(() => {
      window.usuarioSalvandoPalpiteMataMata = false;
      window.usuarioInteragindoMataMata = false;
      window.ignorarAtualizacaoMataMataAte = Date.now() + 3000;
      carregamentoMataMataPendente = false;
    }, 500);
  }
}

function jogoComecouMataMata(jogo) {
  const agora = Date.now();
  const inicio = new Date(jogo.kickoff).getTime();

  return agora >= inicio;
}

function jogoAoVivoMataMata(jogo) {
  if (!jogo) return false;

  if (jogo.status === "finished") return false;

  if (
    jogo.apiStatus === "IN_PLAY" ||
    jogo.apiStatus === "PAUSED" ||
    jogo.apiStatus === "SUSPENDED"
  ) {
    return true;
  }

  return jogoComecouMataMata(jogo);
}

function textoTempoDoJogoMataMata(jogo) {
  if (!jogo) return "";

  if (jogo.status === "finished") return "ENCERRADO";

  if (jogo.apiStatus === "PAUSED") return "INTERVALO";
  if (jogo.apiStatus === "SUSPENDED") return "SUSPENSO";

  if (!jogoComecouMataMata(jogo)) return "";

  const agora = Date.now();
  const inicio = new Date(jogo.kickoff).getTime();

  let minutos = Math.floor((agora - inicio) / 60000) + 1;

  if (minutos < 1) minutos = 1;

  if (minutos <= 45) {
    return `1º TEMPO - ${minutos}'`;
  }

  if (minutos <= 60) {
    return "INTERVALO";
  }

  const minutoSegundoTempo = Math.min(90, minutos - 15);

  return `2º TEMPO - ${minutoSegundoTempo}'`;
}

function criarCardJogoMataMata(jogo) {
  const div = document.createElement("div");

  const aoVivo = jogoAoVivoMataMata(jogo);

  div.className = `jogo-chave ${jogo.fase}`;
  div.id = `jogo-${jogo.id}`;

  if (aoVivo) {
    div.classList.add("ao-vivo");
  }

  if (jogo.status === "finished") {
    div.classList.add("encerrado");
  }

  const aberto = jogoLiberadoParaPalpite(jogo);
  const palpite = palpitesMataMata[jogo.id];

  const editCount = Number(palpite?.editCount || 0);
  const alteracoesRestantes = palpite ? Math.max(0, 2 - editCount) : 2;
  const travado = palpite && editCount >= 2;

  let statusTexto = "Bloqueado";

  if (aberto) {
    statusTexto = "Palpites abertos";
  }

  if (aoVivo) {
    statusTexto = textoTempoDoJogoMataMata(jogo) || "JOGO EM ANDAMENTO";
  }

  if (jogo.status === "finished") {
    statusTexto = "ENCERRADO";
  }

  if (jogo.apiStatus === "SUSPENDED") {
  statusTexto = "SUSPENSO";
}

  const jogoFinalizado = jogo.status === "finished";

const blocoPlacarMata =
  aoVivo || jogoFinalizado
    ? `
      <div class="placar-card-mata">
        <div class="${aoVivo ? "badge-live-mata" : "badge-finished-mata"}">
          ${aoVivo ? "AO VIVO" : "ENCERRADO"}
        </div>

        <div class="linha-placar-mata">
          <span>${jogo.homeTeam}</span>
          <strong>${jogo.homeScore ?? 0} x ${jogo.awayScore ?? 0}</strong>
          <span>${jogo.awayTeam}</span>
        </div>

        <div class="tempo-mata">${statusTexto}</div>
      </div>
    `
    : "";
  
  const temPlacarOficial =
  jogo.homeScore !== undefined &&
  jogo.homeScore !== null &&
  jogo.awayScore !== undefined &&
  jogo.awayScore !== null;

const placarOficial = temPlacarOficial
  ? `
    <div class="placar-oficial-mata">
      Placar: <strong>${jogo.homeScore} x ${jogo.awayScore}</strong>
    </div>
  `
  : "";

  const mostrarAlteracoesRestantes =
  palpite &&
  !aoVivo &&
  jogo.status !== "finished" &&
  aberto &&
  !travado;

const areaPalpiteSalvo = palpite
  ? `
    <div class="palpite-salvo-mata">
      Seu palpite: <strong>${palpite.homeGuess} x ${palpite.awayGuess}</strong>
      ${
        mostrarAlteracoesRestantes
          ? `<br>Alterações restantes: <strong>${alteracoesRestantes}</strong>`
          : ""
      }
    </div>
  `
  : "";

  let areaAcao = "";

  if (!usuarioAtual && aberto) {
    areaAcao = `<button disabled>Faça login para palpitar</button>`;
  } else if (jogo.status === "finished") {
    areaAcao = `<button disabled>Encerrado</button>`;
  } else if (aoVivo) {
    areaAcao = `<button disabled>Jogo em andamento</button>`;
  } else if (!aberto) {
    areaAcao = `<button disabled>Bloqueado</button>`;
  } else if (travado) {
    areaAcao = `<button disabled>Palpite travado</button>`;
  } else {
    areaAcao = `
      <div class="form-palpite-mata">
        <div class="linha-palpite-mata">
          <input type="number" min="0" class="input-home-mata" value="${palpite?.homeGuess ?? ""}" />
          <span>x</span>
          <input type="number" min="0" class="input-away-mata" value="${palpite?.awayGuess ?? ""}" />
        </div>

        <button class="btn-salvar-palpite-mata">
          ${palpite ? "Alterar palpite" : "Salvar palpite"}
        </button>
      </div>
    `;
  }

  div.innerHTML = `
    <span class="codigo-jogo">${jogo.codigo}</span>

    ${blocoPlacarMata || `
  <div class="times">
    <div class="time-linha">
      <span>${jogo.homeFlag}</span>
      <strong>${jogo.homeTeam}</strong>
    </div>

    <div class="time-linha">
      <span>${jogo.awayFlag}</span>
      <strong>${jogo.awayTeam}</strong>
    </div>
  </div>

  <div class="data">
    ${formatarDataBR(jogo.date)} — ${formatarHora(jogo.kickoff)}
  </div>

  <div class="status">${statusTexto}</div>

  ${placarOficial}
`}

${areaPalpiteSalvo}

    ${areaAcao}
  `;

  const botaoSalvar = div.querySelector(".btn-salvar-palpite-mata");

  if (botaoSalvar) {
    botaoSalvar.addEventListener("click", async () => {
      const inputHome = div.querySelector(".input-home-mata");
      const inputAway = div.querySelector(".input-away-mata");

      await salvarPalpiteMataMata(
        jogo,
        inputHome.value,
        inputAway.value,
        botaoSalvar
      );
    });
  }

  return div;
}

function criarColuna(titulo, jogos, ladoClasse) {
  const coluna = document.createElement("div");
  coluna.className = `coluna-chave ${ladoClasse}`;

  const h3 = document.createElement("h3");
  h3.innerText = titulo;
  coluna.appendChild(h3);

  jogos.forEach((jogo) => {
    coluna.appendChild(criarCardJogoMataMata(jogo));
  });

  return coluna;
}

async function carregarMataMata() {
  if (
    window.usuarioSalvandoPalpiteMataMata ||
    window.usuarioInteragindoMataMata ||
    Date.now() < window.ignorarAtualizacaoMataMataAte
  ) {
    carregamentoMataMataPendente = true;
    return;
  }

  if (carregamentoMataMataEmAndamento) {
    carregamentoMataMataPendente = true;
    return;
  }

  carregamentoMataMataEmAndamento = true;

  try {
    await atualizarMataMataPorMatchesFirestore();
    await carregarPalpitesMataMata();
    carregarChaveamento();
carregarProximoJogo();
rolarParaJogoMataMataDaUrl();
  } catch (error) {
    console.log("Erro ao carregar mata-mata:", error);
  } finally {
    carregamentoMataMataEmAndamento = false;
  }

  if (
    carregamentoMataMataPendente &&
    !window.usuarioSalvandoPalpiteMataMata &&
    !window.usuarioInteragindoMataMata &&
    Date.now() >= window.ignorarAtualizacaoMataMataAte
  ) {
    carregamentoMataMataPendente = false;

    setTimeout(() => {
      carregarMataMata();
    }, 1000);
  }
}

let jaRolouParaJogoDaUrlMataMata = false;

function rolarParaJogoMataMataDaUrl() {
  if (jaRolouParaJogoDaUrlMataMata) return;

  const params = new URLSearchParams(window.location.search);
  const jogoId = params.get("jogo");

  if (!jogoId) return;

  const tentarRolar = (tentativas = 0) => {
    const card = document.getElementById(`jogo-${jogoId}`);

    if (!card && tentativas < 10) {
      setTimeout(() => tentarRolar(tentativas + 1), 400);
      return;
    }

    if (!card) return;

    jaRolouParaJogoDaUrlMataMata = true;

    card.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    card.classList.add("destaque-jogo-url");

    setTimeout(() => {
      card.classList.remove("destaque-jogo-url");
    }, 4000);
  };

  tentarRolar();
}

function carregarChaveamento() {
  const container = document.getElementById("chaveamentoMataMata");
  container.innerHTML = "";

  const round32Esq = jogosMataMata.filter(j => j.lado === "esquerdo" && j.fase === "round32");
  const oitavasEsq = jogosMataMata.filter(j => j.lado === "esquerdo" && j.fase === "oitavas");
  const quartasEsq = jogosMataMata.filter(j => j.lado === "esquerdo" && j.fase === "quartas");

  const quartasDir = jogosMataMata.filter(j => j.lado === "direito" && j.fase === "quartas");
  const oitavasDir = jogosMataMata.filter(j => j.lado === "direito" && j.fase === "oitavas");
  const round32Dir = jogosMataMata.filter(j => j.lado === "direito" && j.fase === "round32");

  const semi = jogosMataMata.filter(j => j.fase === "semi");
  const terceiro = jogosMataMata.filter(j => j.fase === "terceiro");
  const final = jogosMataMata.filter(j => j.fase === "final");

  container.appendChild(criarColuna("32 seleções", round32Esq, "lado-esquerdo"));
  container.appendChild(criarColuna("Oitavas", oitavasEsq, "lado-esquerdo"));
  container.appendChild(criarColuna("Quartas", quartasEsq, "lado-esquerdo"));

  const centro = document.createElement("div");
  centro.className = "coluna-centro";

  const blocoSemi = document.createElement("div");
  blocoSemi.className = "bloco-centro";
  blocoSemi.innerHTML = "<h3>Semifinais</h3>";
  semi.forEach(jogo => blocoSemi.appendChild(criarCardJogoMataMata(jogo)));

  const blocoTerceiro = document.createElement("div");
  blocoTerceiro.className = "bloco-centro";
  blocoTerceiro.innerHTML = "<h3>3º lugar</h3>";
  terceiro.forEach(jogo => blocoTerceiro.appendChild(criarCardJogoMataMata(jogo)));

  const blocoFinal = document.createElement("div");
  blocoFinal.className = "bloco-centro";
  blocoFinal.innerHTML = "<h3>Final</h3>";
  final.forEach(jogo => blocoFinal.appendChild(criarCardJogoMataMata(jogo)));

  centro.appendChild(blocoSemi);
  centro.appendChild(blocoTerceiro);
  centro.appendChild(blocoFinal);

  container.appendChild(centro);

  container.appendChild(criarColuna("Quartas", quartasDir, "lado-direito"));
  container.appendChild(criarColuna("Oitavas", oitavasDir, "lado-direito"));
  container.appendChild(criarColuna("32 seleções", round32Dir, "lado-direito"));
}

function carregarProximoJogo() {
  const titulo = document.getElementById("tituloProximoJogo");
  const contador = document.getElementById("contadorProximoJogo");

  const agora = Date.now();

  const proximos = jogosMataMata
    .filter((jogo) => jogo.status === "scheduled")
    .filter((jogo) => new Date(jogo.kickoff).getTime() > agora)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  if (proximos.length === 0) {
    titulo.innerText = "Nenhum jogo futuro encontrado";
    contador.innerText = "00h 00m 00s";
    return;
  }

  const jogo = proximos[0];
  const inicio = new Date(jogo.kickoff).getTime();
  const abertura = dataHoraAberturaPalpites(jogo);

  titulo.innerText = `${jogo.homeTeam} x ${jogo.awayTeam}`;

  if (Date.now() < abertura) {
    contador.innerText = `Palpites abrem em ${formatarContagem(abertura - Date.now())}`;
  } else {
    contador.innerText = `Jogo inicia em ${formatarContagem(inicio - Date.now())}`;
  }
}

function iniciarContagem() {
  if (window.contagemMataMataLigada) return;

  window.contagemMataMataLigada = true;

  let ultimaAtualizacaoMatchesMataMata = 0;

setInterval(async () => {
  carregarProximoJogo();

  const agora = Date.now();

  if (
    !window.usuarioSalvandoPalpiteMataMata &&
    !window.usuarioInteragindoMataMata &&
    Date.now() >= window.ignorarAtualizacaoMataMataAte
  ) {
    if (agora - ultimaAtualizacaoMatchesMataMata >= 60 * 1000) {
      ultimaAtualizacaoMatchesMataMata = agora;
      await atualizarMataMataPorMatchesFirestore();
    }

    carregarChaveamento();
  }
}, 1000);
}

function configurarLoginMataMata() {
  const loginBox = document.getElementById("loginMataMata");
  const emailInput = document.getElementById("emailMataMata");
  const senhaInput = document.getElementById("senhaMataMata");
  const botaoEntrar = document.getElementById("btnEntrarMataMata");
  const erro = document.getElementById("erroLoginMataMata");

  if (!loginBox || !emailInput || !senhaInput || !botaoEntrar || !erro) return;

  botaoEntrar.onclick = async () => {
    erro.innerText = "";

    const email = emailInput.value.trim().toLowerCase();
    const senha = senhaInput.value;

    if (!email || !senha) {
      erro.innerText = "Preencha e-mail e senha.";
      return;
    }

    botaoEntrar.disabled = true;
    botaoEntrar.innerText = "Entrando...";

    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
      console.log("Erro login mata-mata:", error.code, error.message);

      if (error.code === "auth/invalid-credential") {
        erro.innerText = "Login recusado pelo Firebase. Confira se este usuário existe no Authentication.";
      } else if (error.code === "auth/user-not-found") {
        erro.innerText = "Usuário não encontrado no Authentication.";
      } else if (error.code === "auth/wrong-password") {
        erro.innerText = "Senha incorreta.";
      } else if (error.code === "auth/too-many-requests") {
        erro.innerText = "Muitas tentativas. Aguarde um pouco e tente novamente.";
      } else {
        erro.innerText = `Erro: ${error.code}`;
      }
    } finally {
      botaoEntrar.disabled = false;
      botaoEntrar.innerText = "Entrar";
    }
  };
}

configurarLoginMataMata();

onAuthStateChanged(auth, async (user) => {
  const loginBox = document.getElementById("loginMataMata");

  iniciarProtecaoMobileMataMata();

  if (!user) {
    usuarioAtual = null;
    dadosUsuarioAtual = null;

    if (loginBox) {
      loginBox.classList.remove("escondido");
    }

    carregarChaveamento();
    carregarProximoJogo();
    iniciarContagem();

    return;
  }

  usuarioAtual = user;

  if (loginBox) {
    loginBox.classList.add("escondido");
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));

  if (userSnap.exists()) {
    dadosUsuarioAtual = userSnap.data();
  }

  await carregarMataMata();

  iniciarContagem();
});
