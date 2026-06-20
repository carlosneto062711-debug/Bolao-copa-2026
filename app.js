// VERSÃO 33
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
// API-FOOTBALL / COPA DO MUNDO
// ===============================

const API_FOOTBALL_KEY = "318670cf13b5dbabf5a70cfcd11fca9d";
const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

async function testarApiCopa() {
  try {
    console.log("Testando API da Copa...");

    const response = await fetch(
      `${API_FOOTBALL_BASE_URL}/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`,
      {
        method: "GET",
        headers: {
          "x-apisports-key": API_FOOTBALL_KEY
        }
      }
    );

    const data = await response.json();

    console.log("Resposta da API-Football:", data);

    if (!response.ok) {
      alert("Erro ao consultar API. Veja o console.");
      return;
    }

    alert("API respondeu! Abra o console para ver os jogos.");

  } catch (error) {
    console.error("Erro ao testar API:", error);
    alert("Erro ao testar API. Veja o console.");
  }
}

window.testarApiCopa = testarApiCopa;

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

function hojeISO() {
  const hoje = new Date();
  return hoje.toISOString().slice(0, 10);
}

function amanhaISO() {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  return amanha.toISOString().slice(0, 10);
}

async function carregarJogosHoje() {
  const jogosHojeDiv = document.getElementById("jogosHoje");
  const statusRodada = document.getElementById("statusRodada");

  jogosHojeDiv.innerHTML = "";

  try {
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
      statusRodada.innerText = "Nenhum jogo cadastrado para hoje.";
      return;
    }

    const rodadaAberta = rodadaEstaAberta(jogos);

    statusRodada.innerText = rodadaAberta
      ? "Rodada aberta para palpites."
      : "Rodada ainda fechada. Abre 4 horas antes do primeiro jogo.";

    if (rodadaAberta) {
      for (const jogo of jogos) {
        const card = await criarCardJogo(jogo, rodadaAberta);
        jogosHojeDiv.appendChild(card);
      }

      return;
    }

    const primeiroJogo = jogos[0];
    const outrosJogos = jogos.slice(1);

    const cardPrincipal = await criarCardJogo(primeiroJogo, rodadaAberta);
    cardPrincipal.classList.add("jogo-principal");
    jogosHojeDiv.appendChild(cardPrincipal);

    if (outrosJogos.length > 0) {
      const listaMenor = document.createElement("div");
      listaMenor.className = "jogos-menores";
      listaMenor.innerHTML = "<h3>Próximos jogos de hoje</h3>";

      for (const jogo of outrosJogos) {
        const status = statusDoJogo(jogo, rodadaAberta);

        const item = document.createElement("div");
        item.className = "jogo-mini";
        item.innerHTML = `
          <span>${formatarHora(jogo.kickoff)}</span>
          <strong>${jogo.homeTeam} x ${jogo.awayTeam}</strong>
          <span class="${status.classe}">${status.texto}</span>
        `;

        listaMenor.appendChild(item);
      }

      jogosHojeDiv.appendChild(listaMenor);
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
      jogos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

 jogos.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

if (jogos.length === 0) {
  jogosAmanhaDiv.innerHTML = "<p>Nenhum jogo cadastrado para amanhã.</p>";
  alvoContagemAmanha = null;
  return;
}

const aberturaAmanha = horarioAberturaRodada(jogos);
const agora = new Date();

alvoContagemAmanha = aberturaAmanha;
    
const aviso = document.createElement("p");

if (agora >= aberturaAmanha) {
  aviso.innerHTML = `<strong>Rodada de amanhã já está dentro da janela de abertura.</strong>`;
} else {
  aviso.innerHTML = `<strong>Abre em <span id="contadorAmanha">${formatarContagem(aberturaAmanha - agora)}</span></strong>`;
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
