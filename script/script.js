document.addEventListener("DOMContentLoaded", function() {
    
    // Verifica se há alguém logado
    const sessao = JSON.parse(localStorage.getItem('sessao_oinksafe'));
    const isLogado = sessao !== null;

    // --- LÓGICA DOS GRÁFICOS (Protegidos com IF) ---
    const pieCanvas = document.getElementById('pieChart');
    if (pieCanvas) {
        const dadosPizza = isLogado ? [20, 10, 30, 15, 25] : [0, 0, 0, 0, 0];
        const ctxPie = pieCanvas.getContext('2d');
        new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Alimentação', 'Cofrinho', 'Contas', 'Transporte', 'Lazer'],
                datasets: [{ data: dadosPizza, backgroundColor: ['#B02626', '#EBE81B', '#29A643', '#2954A6', '#A02BA8'], borderWidth: 1, borderColor: '#EAD0A5' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { family: "'Nunito', sans-serif", size: 12 }, color: '#3A4B7C', boxWidth: 15 } } } }
        });
    }

    const barCanvas = document.getElementById('barChart');
    if (barCanvas) {
        const dadosBarras = isLogado ? [60, 40, 80, 70] : [0, 0, 0, 0];
        const ctxBar = barCanvas.getContext('2d');
        new Chart(ctxBar, {
            type: 'bar',
            data: { labels: ['Mar', 'Abri', 'Mai', 'Jun'], datasets: [{ label: 'Gastos', data: dadosBarras, backgroundColor: '#4A5CC0', barThickness: 30 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false, beginAtZero: true }, x: { grid: { display: false }, ticks: { font: { family: "'Nunito', sans-serif", weight: 'bold' }, color: '#3A4B7C' } } } }
        });
    }

    // --- LÓGICA DAS METAS ---
    carregarMetas();
});

let metasGlobais = [];

// Função que renderiza os cards na tela usando o Banco de Dados
async function carregarMetas() {
    const container = document.getElementById('container-metas');
    if (!container) return;

    const sessao = JSON.parse(localStorage.getItem('sessao_oinksafe'));
    container.innerHTML = '';

    if (!sessao) {
        container.innerHTML = `
            <div class="col-12 text-center mt-4">
                <h5 class="text-muted">Faça login na sua conta para criar e visualizar suas metas!</h5>
            </div>
        `;
        return; 
    }

    container.innerHTML = `
        <div class="col-md-4">
            <div class="card card-meta card-add-meta d-flex justify-content-center align-items-center h-100" data-bs-toggle="modal" data-bs-target="#modalNovaMeta">
                <span class="plus-icon">+</span>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`http://localhost:3000/api/metas/${sessao.id}`);
        const metas = await response.json();
        
        metasGlobais = metas;

        metas.forEach(meta => {
            const porcentagem = meta.valor_alvo > 0 ? Math.round((meta.valor_atual / meta.valor_alvo) * 100) : 0;
            const corTexto = meta.cor_destaque === '#3A4B7C' ? 'text-white' : '';

            const cardHTML = `
            <div class="col-md-4">
                <div class="card card-meta d-flex flex-column" style="background-color: ${meta.cor_destaque}; cursor: pointer;" data-bs-toggle="modal" data-bs-target="#modalDetalhesMeta" onclick="abrirDetalhesMeta(${meta.id_meta})">
                    <h4 class="${corTexto}">${meta.titulo}</h4>
                    <p class="mb-0 ${corTexto}">Objetivo: R$${parseFloat(meta.valor_alvo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    <p class="mb-3 ${corTexto}">Guardou: R$${parseFloat(meta.valor_atual).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    
                    <div class="d-flex align-items-center mt-3">
                        <div class="progress progress-custom w-100">
                            <div class="progress-bar progress-bar-custom" role="progressbar" style="width: ${porcentagem}%; background-color: var(--azul-escuro);"></div>
                        </div>
                        <span class="progress-text ${corTexto}">${porcentagem}%</span>
                    </div>
                </div>
            </div>
            `;
            container.innerHTML += cardHTML;
        });
    } catch (error) {
        console.error("Erro ao carregar metas do banco:", error);
    }
}

// Função para salvar a meta no Banco de Dados
async function salvarNovaMeta() {
    const titulo = document.getElementById('nomeMeta').value.trim();
    const valor_alvo = parseFloat(document.getElementById('valorMeta').value);
    
    let corSelecionada = '#E2E2E2'; 
    if (document.getElementById('corRoxa').checked) corSelecionada = '#D5BDE8';
    else if (document.getElementById('corVerde').checked) corSelecionada = '#D7E5AA';
    else if (document.getElementById('corAzul').checked) corSelecionada = '#3A4B7C';

    if (!titulo || isNaN(valor_alvo) || valor_alvo <= 0) {
        alert("Por favor, preencha o título e um valor válido para a meta.");
        return;
    }

    const sessao = JSON.parse(localStorage.getItem('sessao_oinksafe'));
    if (!sessao) return;

    try {
        const response = await fetch('http://localhost:3000/api/metas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: sessao.id,
                titulo: titulo,
                valor_alvo: valor_alvo,
                valor_atual: 0,
                cor_destaque: corSelecionada
            })
        });

        if (response.ok) {
            document.getElementById('nomeMeta').value = '';
            document.getElementById('valorMeta').value = '';
            carregarMetas(); 
        } else {
            alert("Erro ao criar meta no banco de dados.");
        }
    } catch (error) {
        console.error("Erro ao salvar meta:", error);
    }
}

// Função para carregar os dados no Modal de Detalhes
function abrirDetalhesMeta(id_meta) {
    const meta = metasGlobais.find(m => m.id_meta === id_meta);
    if (!meta) return;

    document.getElementById('modalDetalhesNomeMeta').innerText = meta.titulo;
    document.getElementById('modalDetalhesObjetivo').innerText = `R$ ${parseFloat(meta.valor_alvo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('modalDetalhesGuardou').innerText = `R$ ${parseFloat(meta.valor_atual).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    const porcentagem = meta.valor_alvo > 0 ? Math.round((meta.valor_atual / meta.valor_alvo) * 100) : 0;
    document.getElementById('modalDetalhesPorcentagem').innerText = `${porcentagem}%`;
    document.getElementById('modalDetalhesBarra').style.width = `${porcentagem}%`;

    const header = document.getElementById('modalDetalhesHeader');
    header.style.backgroundColor = meta.cor_destaque;
    
    if (meta.cor_destaque === '#3A4B7C') {
        document.getElementById('modalDetalhesNomeMeta').classList.add('text-white');
        document.querySelector('#modalDetalhesHeader .btn-close').classList.add('btn-close-white');
    } else {
        document.getElementById('modalDetalhesNomeMeta').classList.remove('text-white');
        document.querySelector('#modalDetalhesHeader .btn-close').classList.remove('btn-close-white');
    }

    document.getElementById('btnExcluirMeta').onclick = function() {
        const modalDetalhesEl = document.getElementById('modalDetalhesMeta');
        const modalDetalhesInstance = bootstrap.Modal.getInstance(modalDetalhesEl);
        if (modalDetalhesInstance) modalDetalhesInstance.hide();
        
        const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmarExclusao'));
        modalConfirmacao.show();
        
        document.getElementById('btnConfirmarExclusao').onclick = function() {
            excluirMeta(id_meta); 
            modalConfirmacao.hide(); 
        };
    };

    const btnResgatar = document.getElementById('btnResgatarMeta');
    if (btnResgatar) {
        btnResgatar.onclick = function() {
            const modalDetalhesEl = document.getElementById('modalDetalhesMeta');
            const modalDetalhesInstance = bootstrap.Modal.getInstance(modalDetalhesEl);
            if (modalDetalhesInstance) modalDetalhesInstance.hide();
            
            const modalResgate = new bootstrap.Modal(document.getElementById('modalConfirmarResgate'));
            modalResgate.show();
            
            document.getElementById('btnConfirmarResgate').onclick = function() {
                resgatarMeta(id_meta); 
                modalResgate.hide(); 
            };
        };
    }
}

// Função para excluir a meta do Banco de Dados
async function excluirMeta(id_meta) {
    try {
        const response = await fetch(`http://localhost:3000/api/metas/${id_meta}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarMetas(); 
        } else {
            alert("Erro ao excluir meta.");
        }
    } catch (error) {
        console.error("Erro ao excluir meta:", error);
    }
}

// Função para resgatar a meta alterando o status
async function resgatarMeta(id_meta) {
    try {
        const response = await fetch(`http://localhost:3000/api/metas/resgatar/${id_meta}`, {
            method: 'PUT'
        });

        if (response.ok) {
            carregarMetas(); 
        } else {
            alert("Erro ao resgatar meta.");
        }
    } catch (error) {
        console.error("Erro ao resgatar meta:", error);
    }
}