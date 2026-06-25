// VERSÃO 98 - Mata-mata inicial

const jogosMataMata = [
  {
    id: "M101",
    fase: "round32",
    codigo: "M101",
    homeTeam: "2º Grupo A",
    awayTeam: "2º Grupo B",
    date: "2026-06-28",
    kickoff: "2026-06-28T16:00:00",
    status: "scheduled"
  },
  {
    id: "M102",
    fase: "round32",
    codigo: "M102",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-06-28",
    kickoff: "2026-06-28T19:00:00",
    status: "scheduled"
  },
  {
    id: "M103",
    fase: "round32",
    codigo: "M103",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-06-29",
    kickoff: "2026-06-29T16:00:00",
    status: "scheduled"
  },
  {
    id: "M104",
    fase: "round32",
    codigo: "M104",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-06-29",
    kickoff: "2026-06-29T19:00:00",
    status: "scheduled"
  },
  {
    id: "M105",
    fase: "round32",
    codigo: "M105",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-06-30",
    kickoff: "2026-06-30T16:00:00",
    status: "scheduled"
  },
  {
    id: "M106",
    fase: "round32",
    codigo: "M106",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-06-30",
    kickoff: "2026-06-30T19:00:00",
    status: "scheduled"
  },
  {
    id: "M107",
    fase: "round32",
    codigo: "M107",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-01",
    kickoff: "2026-07-01T16:00:00",
    status: "scheduled"
  },
  {
    id: "M108",
    fase: "round32",
    codigo: "M108",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-01",
    kickoff: "2026-07-01T19:00:00",
    status: "scheduled"
  },

  {
    id: "M109",
    fase: "oitavas",
    codigo: "O1",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-03",
    kickoff: "2026-07-03T16:00:00",
    status: "scheduled"
  },
  {
    id: "M110",
    fase: "oitavas",
    codigo: "O2",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-03",
    kickoff: "2026-07-03T19:00:00",
    status: "scheduled"
  },
  {
    id: "M111",
    fase: "oitavas",
    codigo: "O3",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-04",
    kickoff: "2026-07-04T16:00:00",
    status: "scheduled"
  },
  {
    id: "M112",
    fase: "oitavas",
    codigo: "O4",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-04",
    kickoff: "2026-07-04T19:00:00",
    status: "scheduled"
  },

  {
    id: "M113",
    fase: "quartas",
    codigo: "Q1",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-09",
    kickoff: "2026-07-09T16:00:00",
    status: "scheduled"
  },
  {
    id: "M114",
    fase: "quartas",
    codigo: "Q2",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-10",
    kickoff: "2026-07-10T16:00:00",
    status: "scheduled"
  },

  {
    id: "M115",
    fase: "semi",
    codigo: "S1",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-14",
    kickoff: "2026-07-14T16:00:00",
    status: "scheduled"
  },
  {
    id: "M116",
    fase: "semi",
    codigo: "S2",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-15",
    kickoff: "2026-07-15T16:00:00",
    status: "scheduled"
  },

  {
    id: "M117",
    fase: "final",
    codigo: "FINAL",
    homeTeam: "A definir",
    awayTeam: "A definir",
    date: "2026-07-19",
    kickoff: "2026-07-19T16:00:00",
    status: "scheduled"
  }
];

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
      ${jogo.homeTeam}<br>
      x<br>
      ${jogo.awayTeam}
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

function carregarChaveamento() {
  const container = document.getElementById("chaveamentoMataMata");
  container.innerHTML = "";

  const fases = [
    { id: "round32", titulo: "32 seleções" },
    { id: "oitavas", titulo: "Oitavas" },
    { id: "quartas", titulo: "Quartas" },
    { id: "semi", titulo: "Semifinal" },
    { id: "final", titulo: "Final" }
  ];

  fases.forEach((fase) => {
    const coluna = document.createElement("div");
    coluna.className = "coluna-fase";

    const titulo = document.createElement("h3");
    titulo.innerText = fase.titulo;
    coluna.appendChild(titulo);

    const jogos = jogosMataMata.filter((jogo) => jogo.fase === fase.id);

    jogos.forEach((jogo) => {
      coluna.appendChild(criarCardJogoMataMata(jogo));
    });

    container.appendChild(coluna);
  });
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
