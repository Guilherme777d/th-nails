// ===============================
// CONEXÃO COM O SUPABASE
// ===============================

const SUPABASE_URL = "https://xkcqdvnalifgdahlmsow.supabase.co";
const SUPABASE_KEY = "sb_publishable_w7jH6sfnE52hCwqb_cEBRw_B30u6ygJ";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, function (caractere) {
    const entidades = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entidades[caractere];
  });
}


const formulario = document.querySelector(".form-agendamento");

formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const telefone = document.getElementById("telefone").value;
    const servico = document.getElementById("servico").value;
    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    // VALIDAR HORÁRIO DE ATENDIMENTO

const partesData = data.split("-");

const dataAgendamento = new Date(
    Number(partesData[0]),
    Number(partesData[1]) - 1,
    Number(partesData[2])
);

const diaSemana = dataAgendamento.getDay();

if (diaSemana === 0 || diaSemana === 6) {

    // Sábado e domingo: a partir das 09:00
    if (horario < "09:00") {
        alert("Aos sábados e domingos, os agendamentos começam a partir das 09:00.");
        return;
    }

} else {

    // Segunda a sexta: a partir das 18:30
    if (horario < "18:30") {
        alert("De segunda a sexta, os agendamentos começam a partir das 18:30.");
        return;
    }
}

    // SALVAR AGENDAMENTO



const novoAgendamento = {
    nome: nome,
    telefone: telefone,
    servico: servico,
    data: data,
    horario: horario,
    status: "Agendado"
};

const { error: erroSalvar } = await supabaseClient
    .from("agendamentos")
    .insert([novoAgendamento]);

if (erroSalvar) {
    console.error("Erro ao salvar no Supabase:", erroSalvar);

    if (erroSalvar.code === "23505") {
        alert("⚠️ Este horário já está reservado! Por favor, escolha outra data ou horário. 💗");
    } else {
        alert("Não foi possível salvar o agendamento. Tente novamente.");
    }

    return;
}

console.log("Agendamento salvo no Supabase com sucesso!");
alert("Agendamento realizado com sucesso!");


    const numeroWhatsApp = "5511967695594";

    const mensagem = `Olá! Gostaria de solicitar um agendamento na TH Nails 💅

Nome: ${nome}
Telefone: ${telefone}
Serviço: ${servico}
Data: ${data}
Horário: ${horario}`;

    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    window.open(linkWhatsApp, "_blank");
});

// CADASTRO DE CLIENTES

const formularioCadastro = document.querySelector(".form-cadastro");

formularioCadastro.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nomeCadastro = document.getElementById("nomeCadastro").value;
    const telefoneCadastro = document.getElementById("telefoneCadastro").value;
    const emailCadastro = document.getElementById("emailCadastro").value;

    const cliente = {
        nome: nomeCadastro,
        telefone: telefoneCadastro,
        email: emailCadastro
    };

    const { error } = await supabaseClient
    .from("clientes")
    .insert([cliente]);

if (error) {
    alert("Erro ao salvar cliente: " + error.message);
    return;
}

    let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

    clientes.push(cliente);

    localStorage.setItem("clientes", JSON.stringify(clientes));
    mostrarClientes();

    alert("Cliente cadastrado com sucesso! 💅");

    formularioCadastro.reset();
});

function mostrarClientes() {
    const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    const lista = document.getElementById("clientesCadastrados");
    if (!lista) return;

    if (clientes.length === 0) {
        lista.innerHTML = "<p>Nenhum cliente cadastrado.</p>";
        return;
    }

    lista.innerHTML = "";

clientes.forEach(function(cliente, index) {
    lista.innerHTML += `
        <div class="cliente-card">
            
<strong>${escaparHTML(cliente.nome)}</strong>
<p>📱 ${escaparHTML(cliente.telefone)}</p>
<p>📧 ${escaparHTML(cliente.email)}</p>


            <div class="acoes-cliente">
                <button onclick="editarCliente(${index})">📝 Editar</button>
                <button onclick="excluirCliente(${index})">🗑️ Excluir</button>
            </div>
        </div>
    `;
});
}


async function excluirCliente(index) {
    const confirmar = confirm("Tem certeza que deseja excluir este cliente?");
    if (!confirmar) return;

    const { data: usuario } = await supabaseClient.auth.getUser();

    if (!usuario?.user) {
        alert("Faça login como administrador.");
        return;
    }

    const { data: clientes, error: erroBusca } = await supabaseClient
        .from("clientes")
        .select("id")
        .order("id", { ascending: false });

    if (erroBusca || !clientes || !clientes[index]) {
        alert("Não foi possível identificar o cliente.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("clientes")
        .delete()
        .eq("id", clientes[index].id)
        .select("id");

    if (error) {
        alert("Erro ao excluir: " + error.message);
        return;
    }

    if (!data || data.length === 0) {
        alert("Exclusão não autorizada. Verifique as políticas do Supabase.");
        return;
    }

    alert("Cliente excluído com sucesso!");
    carregarPainelAdmin();
}


mostrarClientes();

// =========================
// AGENDAMENTOS
// =========================


function mostrarAgendamentos() {
    // Agendamentos não são exibidos na área pública.
    const lista = document.getElementById("listaAgendamentos");

    if (lista) {
        lista.innerHTML = "";
        lista.style.display = "none";
    }
}



async function concluirAgendamento(id) {

    const { error } = await supabaseClient
        .from("agendamentos")
        .update({ status: "Concluído" })
        .eq("id", id);

    if (error) {
        alert("Erro ao concluir agendamento: " + error.message);
        return;
    }

    alert("Agendamento concluído com sucesso! ✅");

    carregarPainelAdmin();
}


async function excluirAgendamento(id) {

    const confirmar = confirm(
        "Tem certeza que deseja excluir este agendamento?"
    );

    if (!confirmar) {
        return;
    }

    const { error } = await supabaseClient
        .from("agendamentos")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Erro ao excluir agendamento: " + error.message);
        return;
    }

    alert("Agendamento excluído com sucesso! 🗑️");

    carregarPainelAdmin();
}


mostrarAgendamentos();

// Impede agendamentos em datas passadas
const campoData = document.getElementById("data");

if (campoData) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    campoData.min = `${ano}-${mes}-${dia}`;
}

// =========================
// HORÁRIOS DE ATENDIMENTO
// =========================

const campoHorario = document.getElementById("horario");

if (campoData && campoHorario) {

    campoData.addEventListener("change", function() {

        const partesData = campoData.value.split("-");

        if (partesData.length !== 3) {
            return;
        }

        const dataSelecionada = new Date(
            Number(partesData[0]),
            Number(partesData[1]) - 1,
            Number(partesData[2])
        );

        const diaSemana = dataSelecionada.getDay();

        // Domingo = 0 | Sábado = 6
        if (diaSemana === 0 || diaSemana === 6) {

            // Finais de semana: a partir das 09:00
            campoHorario.min = "09:00";

        } else {

            // Segunda a sexta: a partir das 18:30
            campoHorario.min = "18:30";
        }

        // Limpa o horário ao trocar a data
        campoHorario.value = "";
    });
}

// ===============================
// ÁREA ADMINISTRATIVA
// ===============================

const btnAdmin = document.getElementById("btnAdmin");
const loginAdmin = document.getElementById("loginAdmin");
const fecharAdmin = document.getElementById("fecharAdmin");

btnAdmin.addEventListener("click", function () {
    loginAdmin.classList.add("ativo");
});

fecharAdmin.addEventListener("click", function () {
    loginAdmin.classList.remove("ativo");
});
// LOGIN ADMINISTRATIVO

const entrarAdmin = document.getElementById("entrarAdmin");
const usuarioAdmin = document.getElementById("usuarioAdmin");
const senhaAdmin = document.getElementById("senhaAdmin");
const erroLogin = document.getElementById("erroLogin");


entrarAdmin.addEventListener("click", async function () {
    const email = usuarioAdmin.value.trim();
    const senha = senhaAdmin.value;

    erroLogin.textContent = "";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        erroLogin.textContent = "E-mail ou senha incorretos.";
        return;
    }

    const adminUID = "b5f29c73-84cc-4043-bb4e-4d05141fb8cd";

    if (data.user.id !== adminUID) {
        await supabaseClient.auth.signOut();
        erroLogin.textContent = "Acesso não autorizado.";
        return;
    }

    alert("Login realizado com sucesso!");

    loginAdmin.classList.remove("ativo");

    const painelAdmin = document.getElementById("painelAdmin");
    painelAdmin.style.display = "block";

    carregarPainelAdmin();

    painelAdmin.scrollIntoView({
        behavior: "smooth"
    });
});


// ========================================
// PAINEL ADMINISTRATIVO - TH NAILS
// ========================================

async function carregarPainelAdmin() {
const { data: { user }, error } = await supabaseClient.auth.getUser();

if (error || !user || user.id !== "b5f29c73-84cc-4043-bb4e-4d05141fb8cd") {
    alert("Acesso não autorizado ao painel administrativo.");
    return;
}
    const agendamentosAdmin = document.getElementById("agendamentosAdmin");
    const clientesAdmin = document.getElementById("clientesAdmin");

    const { data: agendamentosSalvos, error: erroAgendamentos } =
    await supabaseClient
        .from("agendamentos")
        .select("*")
        .order("created_at", { ascending: false });

const { data: clientesSalvos, error: erroClientes } =
    await supabaseClient
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

if (erroAgendamentos || erroClientes) {
    alert("Erro ao carregar dados do painel administrativo.");
    return;
}

    // AGENDAMENTOS
    agendamentosAdmin.innerHTML = "";

    if (agendamentosSalvos.length === 0) {

        agendamentosAdmin.innerHTML =
            "<p>Nenhum agendamento cadastrado.</p>";

    } else {

        agendamentosSalvos.forEach(function(agendamento, index) {

    agendamentosAdmin.innerHTML += `
        <div class="admin-card agendamento-admin-card">

      <div class="admin-card-topo">      
<strong>${escaparHTML(agendamento.nome)}</strong>
<span class="status-agendado">
    ${escaparHTML(agendamento.status)}
</span>

            </div>

            
<p>📞 ${escaparHTML(agendamento.telefone)}</p>
<p>💅 ${escaparHTML(agendamento.servico)}</p>
<p>🗓️ ${escaparHTML(agendamento.data)} às ${escaparHTML(agendamento.horario)}</p>


            <div class="admin-card-acoes">

    ${agendamento.status !== "Concluído" ? `
        
<button onclick="concluirAgendamento(${Number(agendamento.id)})">

            ✓ Concluir
        </button>
    ` : `
        <span class="agendamento-finalizado">
            ✅ Atendimento finalizado
        </span>
    `}

    <button onclick="excluirAgendamento(${Number(agendamento.id)})">
        🗑 Excluir
    </button>

</div>
    `;
});
    }

    // CLIENTES
    clientesAdmin.innerHTML = "";

    if (clientesSalvos.length === 0) {

        clientesAdmin.innerHTML =
            "<p>Nenhum cliente cadastrado.</p>";

    } else {

        clientesSalvos.forEach(function(cliente, index) {

            clientesAdmin.innerHTML += `
                <div class="admin-card">
                    <strong>${escaparHTML(cliente.nome)}</strong>

                    <p>📞 ${escaparHTML(cliente.telefone)}</p>
<p>✉️ ${escaparHTML(cliente.email)}</p>

                   
<button onclick="excluirClienteAdmin(${Number(cliente.id)})">

    🗑 Excluir
</button>
                </div>
            `;
        });
    }
}

async function excluirClienteAdmin(clienteId) {
    const confirmar = confirm(
        "Tem certeza que deseja excluir este cliente?"
    );

    if (!confirmar) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("clientes")
        .delete()
        .eq("id", clienteId)
        .select("id");

    if (error) {
        console.error("Erro ao excluir cliente:", error);
        alert("Erro ao excluir cliente: " + error.message);
        return;
    }
if (!data || data.length === 0) {
    alert("Cliente não excluído. Verifique as permissões no Supabase.");
    return;
}
    carregarPainelAdmin();
    alert("Cliente excluído com sucesso!");
}

const sairAdmin = document.getElementById("sairAdmin");

sairAdmin.addEventListener("click", async function () {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Erro ao sair: " + error.message);
        return;
    }

    document.getElementById("painelAdmin").style.display = "none";

    document.getElementById("usuarioAdmin").value = "";
    document.getElementById("senhaAdmin").value = "";

    alert("Você saiu do painel administrativo!");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

document.addEventListener("DOMContentLoaded", async () => {
  const painel = document.getElementById("painelAdmin");

  if (!painel) return;

  painel.style.display = "none";

  const { data, error } = await supabaseClient.auth.getUser();

  const adminUID = "b5f29c73-84cc-4043-bb4e-4d05141fb8cd";

  if (!error && data.user?.id === adminUID) {
    painel.style.display = "block";
    carregarPainelAdmin();
  }
});

// ABAS DO PAINEL ADMINISTRATIVO

const abaAgendamentos = document.getElementById("abaAgendamentos");
const abaClientes = document.getElementById("abaClientes");

const painelAgendamentos = document.getElementById("painelAgendamentos");
const painelClientes = document.getElementById("painelClientes");

abaAgendamentos.addEventListener("click", function () {
    painelAgendamentos.style.display = "block";
    painelClientes.style.display = "none";
});

abaClientes.addEventListener("click", function () {
    painelAgendamentos.style.display = "none";
    painelClientes.style.display = "block";
});

// Exibir agendamentos inicialmente
painelAgendamentos.style.display = "block";
painelClientes.style.display = "none";