const STORAGE_KEY = "ceeinfor_agenda_data";
const AUTH_KEY = "ceeinfor_admin_auth";

const defaultData = {
  turmas: [
    {
      id: crypto.randomUUID(),
      nome: "1º Ano A",
      horarios: [
        { id: crypto.randomUUID(), dia: "Segunda-feira", hora: "07:30 - 08:20", disciplina: "Matemática", professor: "Prof. Ana" },
        { id: crypto.randomUUID(), dia: "Terça-feira", hora: "08:20 - 09:10", disciplina: "Português", professor: "Prof. João" }
      ]
    },
    {
      id: crypto.randomUUID(),
      nome: "2º Ano B",
      horarios: [
        { id: crypto.randomUUID(), dia: "Quarta-feira", hora: "09:30 - 10:20", disciplina: "História", professor: "Prof. Carla" }
      ]
    }
  ]
};

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
}

const state = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const agendaView = document.getElementById("agendaView");
const adminView = document.getElementById("adminView");
const openAdminBtn = document.getElementById("openAdminBtn");
const closeAdminBtn = document.getElementById("closeAdminBtn");

const turmaSelect = document.getElementById("turmaSelect");
const diaFiltro = document.getElementById("diaFiltro");
const buscaInput = document.getElementById("buscaInput");
const agendaTabela = document.getElementById("agendaTabela");
const turmaAdminSelect = document.getElementById("turmaAdminSelect");
const adminLista = document.getElementById("adminLista");

const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const togglePassword = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminUser = document.getElementById("adminUser");
const adminPass = document.getElementById("adminPass");
const loginError = document.getElementById("loginError");
const toastSuccess = document.getElementById("toastSuccess");
const toastMessage = document.getElementById("toastMessage");

const totalTurmasEl = document.getElementById("totalTurmas");
const totalHorariosEl = document.getElementById("totalHorarios");

const novaTurmaNome = document.getElementById("novaTurmaNome");
const addTurmaBtn = document.getElementById("addTurmaBtn");

const diaInput = document.getElementById("diaInput");
const horaInput = document.getElementById("horaInput");
const disciplinaInput = document.getElementById("disciplinaInput");
const professorInput = document.getElementById("professorInput");
const addHorarioBtn = document.getElementById("addHorarioBtn");

function isAdminLogged() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function setAdminLogged(value) {
  localStorage.setItem(AUTH_KEY, value ? "true" : "false");
}

function updateAuthUI() {
  if (isAdminLogged()) {
    loginArea.classList.add("hidden");
    adminArea.classList.remove("hidden");
  } else {
    loginArea.classList.remove("hidden");
    adminArea.classList.add("hidden");
  }
}

function openAdmin() {
  agendaView.classList.add("hidden");
  adminView.classList.remove("hidden");
  updateAuthUI();
  if (isAdminLogged()) updateStats();
}

function closeAdmin() {
  adminView.classList.add("hidden");
  agendaView.classList.remove("hidden");
}

function renderTurmaOptions() {
  turmaSelect.innerHTML = "";
  turmaAdminSelect.innerHTML = "";

  if (state.turmas.length === 0) {
    const emptyPublic = document.createElement("option");
    emptyPublic.value = "";
    emptyPublic.textContent = "Nenhuma turma cadastrada";
    turmaSelect.appendChild(emptyPublic);

    const emptyAdmin = document.createElement("option");
    emptyAdmin.value = "";
    emptyAdmin.textContent = "Nenhuma turma cadastrada";
    turmaAdminSelect.appendChild(emptyAdmin);

    agendaTabela.innerHTML = "<p>Cadastre uma turma na área ADM.</p>";
    return;
  }

  state.turmas.forEach((turma) => {
    const optionPublic = document.createElement("option");
    optionPublic.value = turma.id;
    optionPublic.textContent = turma.nome;
    turmaSelect.appendChild(optionPublic);

    const optionAdmin = document.createElement("option");
    optionAdmin.value = turma.id;
    optionAdmin.textContent = turma.nome;
    turmaAdminSelect.appendChild(optionAdmin);
  });

  const selected = turmaSelect.value || state.turmas[0].id;
  turmaSelect.value = selected;
  renderAgenda(selected);
}

function parseHoraInicio(hora) {
  const match = hora.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function renderAgenda(turmaId) {
  const turma = state.turmas.find((t) => t.id === turmaId);
  if (!turma) {
    agendaTabela.innerHTML = "<p>Turma não encontrada.</p>";
    return;
  }

  const diaSelecionado = diaFiltro.value;
  const busca = buscaInput.value.trim().toLowerCase();

  const horariosFiltrados = [...turma.horarios]
    .filter((h) => (diaSelecionado ? h.dia === diaSelecionado : true))
    .filter((h) => {
      if (!busca) return true;
      return (
        h.disciplina.toLowerCase().includes(busca) ||
        h.professor.toLowerCase().includes(busca)
      );
    })
    .sort((a, b) => parseHoraInicio(a.hora) - parseHoraInicio(b.hora));

  if (!horariosFiltrados.length) {
    agendaTabela.innerHTML = `<p><span class="badge">Nenhum horário encontrado para o filtro aplicado</span></p>`;
    return;
  }

  const diasOrdem = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const agrupado = {};
  horariosFiltrados.forEach((h) => {
    if (!agrupado[h.dia]) agrupado[h.dia] = [];
    agrupado[h.dia].push(h);
  });

  const diasRender = Object.keys(agrupado).sort((a, b) => diasOrdem.indexOf(a) - diasOrdem.indexOf(b));

  agendaTabela.innerHTML = diasRender
    .map((dia) => {
      const rows = agrupado[dia]
        .map(
          (h) => `
          <tr>
            <td>${h.hora}</td>
            <td>${h.disciplina}</td>
            <td>${h.professor}</td>
          </tr>
        `
        )
        .join("");

      return `
        <div class="dia-bloco">
          <h3 class="dia-titulo">${dia}</h3>
          <div style="overflow:auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Disciplina</th>
                  <th>Professor(a)</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderAdminLista() {
  if (!state.turmas.length) {
    adminLista.innerHTML = "<p>Nenhuma turma cadastrada.</p>";
    return;
  }

  adminLista.innerHTML = state.turmas
    .map(
      (turma) => `
      <div class="turma-box">
        <div class="turma-title">
          <strong>${turma.nome}</strong>
          <button class="delete" onclick="removeTurma('${turma.id}')">Remover Turma</button>
        </div>
        ${
          turma.horarios.length
            ? `<div style="overflow:auto;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th>Horário</th>
                      <th>Disciplina</th>
                      <th>Professor(a)</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${turma.horarios
                      .map(
                        (h) => `
                      <tr>
                        <td>${h.dia}</td>
                        <td>${h.hora}</td>
                        <td>${h.disciplina}</td>
                        <td>${h.professor}</td>
                        <td><button class="delete" onclick="removeHorario('${turma.id}', '${h.id}')">Excluir</button></td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>`
            : "<p>Sem horários nesta turma.</p>"
        }
      </div>
    `
    )
    .join("");
}

function refreshAll() {
  renderTurmaOptions();
  renderAdminLista();
}

function addTurma() {
  const nome = novaTurmaNome.value.trim();
  if (!nome) {
    alert("Informe o nome da turma.");
    return;
  }

  state.turmas.push({
    id: crypto.randomUUID(),
    nome,
    horarios: []
  });

  novaTurmaNome.value = "";
  saveData();
  refreshAll();
  showToast("Turma adicionada com sucesso!");
  if (isAdminLogged()) updateStats();
}

function addHorario() {
  const turmaId = turmaAdminSelect.value;
  const dia = diaInput.value.trim();
  const hora = horaInput.value.trim();
  const disciplina = disciplinaInput.value.trim();
  const professor = professorInput.value.trim();

  if (!turmaId || !dia || !hora || !disciplina || !professor) {
    alert("Preencha todos os campos do horário.");
    return;
  }

  const turma = state.turmas.find((t) => t.id === turmaId);
  if (!turma) return;

  turma.horarios.push({
    id: crypto.randomUUID(),
    dia,
    hora,
    disciplina,
    professor
  });

  diaInput.value = "";
  horaInput.value = "";
  disciplinaInput.value = "";
  professorInput.value = "";

  saveData();
  refreshAll();
  showToast("Horário adicionado com sucesso!");
  if (isAdminLogged()) updateStats();
}

window.removeTurma = function (turmaId) {
  const ok = confirm("Deseja realmente remover esta turma?");
  if (!ok) return;

  state.turmas = state.turmas.filter((t) => t.id !== turmaId);
  saveData();
  refreshAll();
  showToast("Turma removida com sucesso!");
  if (isAdminLogged()) updateStats();
};

window.removeHorario = function (turmaId, horarioId) {
  const turma = state.turmas.find((t) => t.id === turmaId);
  if (!turma) return;

  turma.horarios = turma.horarios.filter((h) => h.id !== horarioId);
  saveData();
  refreshAll();
  showToast("Horário removido com sucesso!");
};

// Toggle password visibility
togglePassword.addEventListener("click", () => {
  const isPassword = adminPass.type === "password";
  adminPass.type = isPassword ? "text" : "password";
  togglePassword.classList.toggle("active", isPassword);
});

// Login with validation and loading state
function doLogin() {
  const user = adminUser.value.trim();
  const pass = adminPass.value.trim();

  // Validation
  if (!user || !pass) {
    loginError.classList.remove("hidden");
    return;
  }

  // Show loading
  loginBtn.classList.add("loading");
  loginBtn.disabled = true;

  // Simulate network delay
  setTimeout(() => {
    if (user === "admin" && pass === "123456") {
      setAdminLogged(true);
      adminUser.value = "";
      adminPass.value = "";
      updateAuthUI();
      updateStats();
    } else {
      loginError.classList.remove("hidden");
      adminUser.value = "";
      adminPass.value = "";
      adminUser.focus();
    }
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }, 800);
}

loginBtn.addEventListener("click", doLogin);

// Enter key support
adminPass.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    doLogin();
  }
});

adminUser.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    doLogin();
  }
});

// Hide error on input
adminUser.addEventListener("input", () => {
  loginError.classList.add("hidden");
});

adminPass.addEventListener("input", () => {
  loginError.classList.add("hidden");
});

// Update statistics
function updateStats() {
  const totalTurmas = state.turmas.length;
  const totalHorarios = state.turmas.reduce((acc, t) => acc + t.horarios.length, 0);
  totalTurmasEl.textContent = totalTurmas;
  totalHorariosEl.textContent = totalHorarios;
}

// Toast notification
function showToast(message) {
  toastMessage.textContent = message;
  toastSuccess.classList.remove("hidden");
  setTimeout(() => {
    toastSuccess.classList.add("hidden");
  }, 3000);
}

logoutBtn.addEventListener("click", () => {
  setAdminLogged(false);
  updateAuthUI();
});

openAdminBtn.addEventListener("click", openAdmin);
closeAdminBtn.addEventListener("click", closeAdmin);
addTurmaBtn.addEventListener("click", addTurma);
addHorarioBtn.addEventListener("click", addHorario);

turmaSelect.addEventListener("change", (e) => {
  renderAgenda(e.target.value);
});

diaFiltro.addEventListener("change", () => {
  renderAgenda(turmaSelect.value);
});

buscaInput.addEventListener("input", () => {
  renderAgenda(turmaSelect.value);
});

updateAuthUI();
closeAdmin();
refreshAll();
