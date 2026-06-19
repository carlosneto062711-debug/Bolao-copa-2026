// VERSÃO 13
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
  orderBy
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioAtual = null;
let dadosUsuarioAtual = null;

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
  await carregarJogosHoje();
  await carregarJogosAmanha();
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

    for (const jogo of jogos) {
      jogosHojeDiv.appendChild(await criarCardJogo(jogo, rodadaAberta));
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
      return;
    }

    jogos.forEach((jogo) => {
      const div = document.createElement("div");
      div.className = "jogo";
      div.innerHTML = `
        <div class="times">
          <span>${jogo.homeTeam}</span>
          <span>x</span>
          <span>${jogo.awayTeam}</span>
        </div>
        <p>${formatarHora(jogo.kickoff)}</p>
      `;

      jogosAmanhaDiv.appendChild(div);
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

  if (palpiteSnap.exists()) {
    const p = palpiteSnap.data();
    homeGuess = p.homeGuess ?? "";
    awayGuess = p.awayGuess ?? "";
  }

  const jogoJaComecou = new Date() >= new Date(jogo.kickoff);
  const podePalpitar = rodadaAberta && !jogoJaComecou;

  div.innerHTML = `
    <div class="times">
      <span>${jogo.homeTeam}</span>
      <span>x</span>
      <span>${jogo.awayTeam}</span>
    </div>

    <p>${formatarHora(jogo.kickoff)}</p>

    <div class="palpite">
      <input type="number" min="0" value="${homeGuess}" ${podePalpitar ? "" : "disabled"} />
      <span>x</span>
      <input type="number" min="0" value="${awayGuess}" ${podePalpitar ? "" : "disabled"} />
    </div>

    <button class="btn" ${podePalpitar ? "" : "disabled"}>
      Salvar palpite
    </button>
  `;

  const inputs = div.querySelectorAll("input");
  const botao = div.querySelector("button");

  botao.addEventListener("click", async () => {
    const casa = Number(inputs[0].value);
    const fora = Number(inputs[1].value);

    await setDoc(palpiteRef, {
      userId: usuarioAtual.uid,
      userName: dadosUsuarioAtual.nome,
      matchId: jogo.id,
      homeGuess: casa,
      awayGuess: fora,
      points: 0,
      createdAt: new Date().toISOString()
    });

    botao.innerText = "Palpite salvo!";
    setTimeout(() => {
      botao.innerText = "Salvar palpite";
    }, 1500);
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

  const q = query(collection(db, "users"), orderBy("pontos", "desc"));
  const snap = await getDocs(q);

  let posicao = 1;

  snap.forEach((docSnap) => {
    const user = docSnap.data();

    const div = document.createElement("div");
    div.className = "ranking-item";
    div.innerHTML = `
      <span>${posicao}. ${user.nome}</span>
      <strong>${user.pontos || 0} pts</strong>
    `;

    rankingDiv.appendChild(div);
    posicao++;
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
