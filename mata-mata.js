// VERSÃO 100 - Mata-mata responsivo

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

function criarCardJogoMataMata(jogo) {
  const div = document.createElement("div");
  div.className = `jogo-chave ${jogo.fase}`;

  const aberto = jogoLiberadoParaPalpite(jogo);

  let statusTexto = "Bloqueado";

  if (aberto) statusTexto = "Palpites abertos";
  if (jogo.status === "live") statusTexto = "Ao vivo";
  if (jogo.status === "finished") statusTexto = "Encerrado";

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

    <button ${aberto ? "" : "disabled"}>
      ${aberto ? "Palpitar" : "Bloqueado"}
    </button>
  `;

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
  setInterval(() => {
    carregarProximoJogo();
  }, 1000);
}

carregarChaveamento();
carregarProximoJogo();
iniciarContagem();
