// VERSÃO 114 - Data real M101 + base segura para API mata-mata

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
  doc,
  getDoc,
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
    homeTeam: "A definir",
    awayTeam: "Canadá",
    homeFlag: "🛡️",
    awayFlag: "🇨🇦",
    date: "2026-06-28",
kickoff: "2026-06-28T16:00:00",
    status: "scheduled"
  },
  {
    id: "M102",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M102",
    homeTeam: "Brasil",
    awayTeam: "A definir",
    homeFlag: "🇧🇷",
    awayFlag: "🛡️",
    date: "2026-06-29",
    kickoff: "2026-06-29T14:00:00",
    status: "scheduled"
  },
  {
    id: "M103",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M103",
    homeTeam: "Alemanha",
    awayTeam: "A definir",
    homeFlag: "🇩🇪",
    awayFlag: "🛡️",
    date: "2026-06-29",
    kickoff: "2026-06-29T17:30:00",
    status: "scheduled"
  },
  {
    id: "M104",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M104",
    homeTeam: "A definir",
    awayTeam: "Marrocos",
    homeFlag: "🛡️",
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
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-06-30",
    kickoff: "2026-06-30T14:00:00",
    status: "scheduled"
  },
  {
    id: "M106",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M106",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-06-30",
    kickoff: "2026-06-30T18:00:00",
    status: "scheduled"
  },
  {
    id: "M107",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M107",
    homeTeam: "México",
    awayTeam: "A definir",
    homeFlag: "🇲🇽",
    awayFlag: "🛡️",
    date: "2026-06-30",
    kickoff: "2026-06-30T22:00:00",
    status: "scheduled"
  },
  {
    id: "M108",
    lado: "esquerdo",
    fase: "round32",
    codigo: "M108",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
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
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-07-01",
    kickoff: "2026-07-01T17:00:00",
    status: "scheduled"
  },
  {
    id: "M110",
    lado: "direito",
    fase: "round32",
    codigo: "M110",
    homeTeam: "Estados Unidos",
    awayTeam: "A definir",
    homeFlag: "🇺🇸",
    awayFlag: "🛡️",
    date: "2026-07-01",
    kickoff: "2026-07-01T21:00:00",
    status: "scheduled"
  },
  {
    id: "M111",
    lado: "direito",
    fase: "round32",
    codigo: "M111",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
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
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-07-02",
    kickoff: "2026-07-02T20:00:00",
    status: "scheduled"
  },
  {
    id: "M113",
    lado: "direito",
    fase: "round32",
    codigo: "M113",
    homeTeam: "Suíça",
    awayTeam: "A definir",
    homeFlag: "🇨🇭",
    awayFlag: "🛡️",
    date: "2026-07-03",
    kickoff: "2026-07-03T00:00:00",
    status: "scheduled"
  },
  {
    id: "M114",
    lado: "direito",
    fase: "round32",
    codigo: "M114",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
    date: "2026-07-03",
    kickoff: "2026-07-03T15:00:00",
    status: "scheduled"
  },
  {
    id: "M115",
    lado: "direito",
    fase: "round32",
    codigo: "M115",
    homeTeam: "Argentina",
    awayTeam: "A definir",
    homeFlag: "🇦🇷",
    awayFlag: "🛡️",
    date: "2026-07-03",
    kickoff: "2026-07-03T19:00:00",
    status: "scheduled"
  },
  {
    id: "M116",
    lado: "direito",
    fase: "round32",
    codigo: "M116",
    homeTeam: "A definir",
    awayTeam: "A definir",
    homeFlag: "🛡️",
    awayFlag: "🛡️",
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
      userName: dadosUsuarioAtual?.nome || usuarioAtual.email,
      matchId: jogo.id,

      phase: "knockout",
      round: jogo.fase,

      homeTeam: jogo.homeTeam,
      awayTeam: jogo.awayTeam,
      homeGuess: homeNumber,
      awayGuess: awayNumber,

      editCount: novoEditCount,
      locked: novoEditCount >= 2,

      points: palpiteExistente?.points || 0,

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

function textoTempoDoJogoMataMata(jogo) {
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

  if (minutosCorridos > 45 && minutosCorridos <= 64) {
    return "INTERVALO";
  }

  const minutoJogo = Math.min(90, minutosCorridos - 19);
  return `2º TEMPO - ${minutoJogo}'`;
}

function jogoAoVivoMataMata(jogo) {
  if (jogo.status === "finished") return false;
  if (jogo.status === "live") return true;

  return jogo.status === "scheduled" && jogoComecouMataMata(jogo);
}

function criarCardJogoMataMata(jogo) {
  const div = document.createElement("div");

  const aoVivo = jogoAoVivoMataMata(jogo);

  div.className = `jogo-chave ${jogo.fase}`;

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

  const areaPalpiteSalvo = palpite
    ? `
      <div class="palpite-salvo-mata">
        Seu palpite: <strong>${palpite.homeGuess} x ${palpite.awayGuess}</strong><br>
        Alterações restantes: <strong>${alteracoesRestantes}</strong>
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
  await carregarPalpitesMataMata();

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
    carregarChaveamento();
    carregarProximoJogo();
  } catch (error) {
    console.log("Erro ao carregar mata-mata:", error);
  } finally {
    carregamentoMataMataEmAndamento = false;

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

  setInterval(() => {
    carregarProximoJogo();

    if (
      !window.usuarioSalvandoPalpiteMataMata &&
      !window.usuarioInteragindoMataMata
    ) {
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
