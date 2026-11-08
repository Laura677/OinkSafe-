import { useEffect, useMemo, useState } from 'react'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

import { Doughnut } from 'react-chartjs-2'

import Header from '../components/Header'

import porquinho from '../imgs-oinksafe/porquinho.png'
import iconeGanho from '../imgs-oinksafe/icone-ganho.png'
import iconeAddGanho from '../imgs-oinksafe/icone-addganho.png'

import './Ganhos.css'

// Configuração do gráfico.
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

function Ganhos() {
  // Categorias disponíveis para cadastrar receitas.
  const [categorias, setCategorias] = useState([])

  // Campos do formulário de cadastro.
  const [idCategoria, setIdCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataTransacao, setDataTransacao] = useState('')

  // Receitas cadastradas pelo usuário.
  const [transacoes, setTransacoes] = useState([])

  // Filtros da página.
  const [periodo, setPeriodo] = useState('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')

  // Data atual para impedir o cadastro de ganhos futuros.
  const dataHoje = new Date().toISOString().split('T')[0]

  // Formata valores no padrão de moeda brasileira.
  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Carrega as transações e mantém somente as receitas.
  async function carregarTransacoes(idUsuario) {
    try {
      const resposta = await fetch(
        `http://localhost:3000/api/transacoes/${idUsuario}`
      )

      if (!resposta.ok) {
        throw new Error('Erro ao carregar as transações.')
      }

      const dados = await resposta.json()

      const apenasReceitas = dados.filter(
        transacao => transacao.tipo === 'receita'
      )

      setTransacoes(apenasReceitas)
    } catch (error) {
      console.error('Erro ao buscar ganhos:', error)
      alert('Não foi possível carregar seus ganhos.')
    }
  }

  // Carrega as categorias e as receitas ao abrir a página.
  useEffect(() => {
    const sessao = JSON.parse(
      localStorage.getItem('sessao_oinksafe')
    )

    // Busca somente as categorias do tipo receita.
    fetch('http://localhost:3000/api/categorias')
      .then(resposta => {
        if (!resposta.ok) {
          throw new Error('Erro ao carregar as categorias.')
        }

        return resposta.json()
      })
      .then(dados => {
        const categoriasReceita = dados.filter(
          categoria => categoria.tipo === 'receita'
        )

        setCategorias(categoriasReceita)
      })
      .catch(error => {
        console.error('Erro ao buscar categorias:', error)
      })

    // Busca as transações do usuário conectado.
    if (sessao) {
      carregarTransacoes(sessao.id)
    }
  }, [])

  // Filtra os ganhos pelo período e pela categoria selecionados.
  const transacoesFiltradas = useMemo(() => {
    const hoje = new Date()

    return transacoes.filter(transacao => {
      // Filtro por categoria.
      if (
        categoriaFiltro !== 'todas' &&
        transacao.categoria !== categoriaFiltro
      ) {
        return false
      }

      // Exibe todos os ganhos, independentemente da data.
      if (periodo === 'todos') {
        return true
      }

      // Converte a data para evitar problemas com o fuso horário.
      const data = String(transacao.data_transacao).slice(0, 10)
      const [ano, mes, dia] = data.split('-').map(Number)

      const dataObjeto = new Date(ano, mes - 1, dia)

      if (Number.isNaN(dataObjeto.getTime())) {
        return false
      }

      // Exibe somente os ganhos do mês atual.
      if (periodo === 'mes') {
        return (
          dataObjeto.getMonth() === hoje.getMonth() &&
          dataObjeto.getFullYear() === hoje.getFullYear()
        )
      }

      // Exibe os ganhos dos últimos 30 dias.
      if (periodo === '30dias') {
        const limite = new Date()

        limite.setDate(limite.getDate() - 30)
        limite.setHours(0, 0, 0, 0)

        return (
          dataObjeto >= limite &&
          dataObjeto <= hoje
        )
      }

      return true
    })
  }, [transacoes, periodo, categoriaFiltro])

  // Soma o valor dos ganhos exibidos após aplicar os filtros.
  const totalGanhos = useMemo(() => {
    return transacoesFiltradas.reduce(
      (total, transacao) => {
        return total + Number(transacao.valor || 0)
      },
      0
    )
  }, [transacoesFiltradas])

  // Calcula a média diária nos dias em que houve ganhos.
  const mediaDiaria = useMemo(() => {
    if (transacoesFiltradas.length === 0) {
      return 0
    }

    const diasComGanho = new Set(
      transacoesFiltradas.map(transacao => {
        return String(transacao.data_transacao).slice(0, 10)
      })
    )

    if (diasComGanho.size === 0) {
      return 0
    }

    return totalGanhos / diasComGanho.size
  }, [transacoesFiltradas, totalGanhos])

  // Agrupa os ganhos por categoria para montar o gráfico.
  const ganhosPorCategoria = useMemo(() => {
    const agrupados = {}

    transacoesFiltradas.forEach(transacao => {
      const categoria = transacao.categoria || 'Sem categoria'

      if (!agrupados[categoria]) {
        agrupados[categoria] = 0
      }

      agrupados[categoria] += Number(transacao.valor || 0)
    })

    return Object.entries(agrupados).map(
      ([categoria, total]) => ({
        categoria,
        total
      })
    )
  }, [transacoesFiltradas])

  // Informações exibidas no gráfico.
  const dadosGrafico = {
    labels: ganhosPorCategoria.map(item => item.categoria),

    datasets: [
      {
        data: ganhosPorCategoria.map(item => item.total),

        backgroundColor: [
          '#69ff00',
          '#9d3cff',
          '#a3e635',
          '#22c55e',
          '#84cc16',
          '#7c3aed'
        ],

        borderWidth: 0
      }
    ]
  }

  // Aparência do gráfico.
  const opcoesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',

    plugins: {
      legend: {
        position: 'right',

        labels: {
          color: '#d5d5d5',
          boxWidth: 10,
          usePointStyle: true
        }
      },

      tooltip: {
        callbacks: {
          label: contexto => {
            return `${contexto.label}: ${formatarMoeda(contexto.raw)}`
          }
        }
      }
    }
  }

  // Cadastra um novo ganho usando a API existente.
  async function cadastrarGanho(event) {
    event.preventDefault()

    const sessao = JSON.parse(
      localStorage.getItem('sessao_oinksafe')
    )

    if (!sessao) {
      alert('Faça login para cadastrar um ganho.')
      return
    }

    // Verifica se todos os campos foram preenchidos.
    if (
      !idCategoria ||
      !valor ||
      !descricao.trim() ||
      !dataTransacao
    ) {
      alert('Preencha todos os campos.')
      return
    }

    // Impede valores iguais ou inferiores a zero.
    if (Number(valor) <= 0) {
      alert('Informe um valor maior que zero.')
      return
    }

    // Impede cadastrar uma receita com data futura.
    if (dataTransacao > dataHoje) {
      alert('A data do ganho não pode ser futura.')
      return
    }

    try {
      const resposta = await fetch(
        'http://localhost:3000/api/transacoes',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            id_usuario: sessao.id,
            id_categoria: Number(idCategoria),
            valor: Number(valor),
            descricao: descricao.trim(),
            data_transacao: dataTransacao
          })
        }
      )

      const dados = await resposta.json()

      if (resposta.ok) {
        alert('Ganho cadastrado com sucesso!')

        // Limpa o formulário após o cadastro.
        setIdCategoria('')
        setValor('')
        setDescricao('')
        setDataTransacao('')

        // Atualiza a lista após salvar a receita.
        await carregarTransacoes(sessao.id)
      } else {
        alert(
          dados.message || 'Erro ao cadastrar ganho.'
        )
      }
    } catch (error) {
      console.error('Erro ao cadastrar ganho:', error)
      alert('Erro ao conectar com o servidor.')
    }
  }

  return (
    <div className="ganhos-container">
      <Header />

      <main className="ganhos-page">

        {/* Cabeçalho da página */}
        <section className="ganhos-cabecalho">
          <div className="ganhos-cabecalho-texto">
            <h1>Ganhos</h1>
            <p>Acompanhe e gerencie suas entradas</p>
          </div>

          <img
            src={porquinho}
            alt="Porquinho do OinkSafe"
            className="ganhos-porquinho"
          />
        </section>

        {/* Filtros por período e categoria */}
        <section className="ganhos-filtros">
          <select
            value={periodo}
            onChange={event => setPeriodo(event.target.value)}
          >
            <option value="todos">Todos os ganhos</option>
            <option value="mes">Este mês</option>
            <option value="30dias">Últimos 30 dias</option>
          </select>

          <select
            value={categoriaFiltro}
            onChange={event => setCategoriaFiltro(event.target.value)}
          >
            <option value="todas">Todas as categorias</option>

            {categorias.map(categoria => (
              <option
                key={categoria.id_categoria}
                value={categoria.nome}
              >
                {categoria.nome}
              </option>
            ))}
          </select>
        </section>

        {/* Resumo dos ganhos */}
        <section className="ganhos-resumo">
          <div className="ganhos-card-resumo">
            <span>Total de ganhos</span>

            <strong className="ganho-destaque">
              {formatarMoeda(totalGanhos)}
            </strong>

            <small>No período selecionado</small>
          </div>

          <div className="ganhos-card-resumo">
            <span>Média diária</span>

            <strong className="ganho-destaque">
              {formatarMoeda(mediaDiaria)}
            </strong>

            <small>Média nos dias com ganhos</small>
          </div>
        </section>

        {/* Gráfico de ganhos por categoria */}
        <section className="ganhos-bloco">
          <div className="ganhos-bloco-topo">
            <h2>Ganhos por categoria</h2>
          </div>

          <div className="ganhos-grafico">
            {ganhosPorCategoria.length === 0 ? (
              <div className="ganhos-vazio">
                <p>Nenhum ganho encontrado.</p>
              </div>
            ) : (
              <Doughnut
                data={dadosGrafico}
                options={opcoesGrafico}
              />
            )}
          </div>
        </section>

        {/* Formulário de cadastro */}
        <section className="ganhos-bloco">
          <div className="ganhos-bloco-topo">
            <div>
              <h2>Novo ganho</h2>
              <p>Registre uma nova receita</p>
            </div>

            <img
              src={iconeAddGanho}
              alt=""
              className="icone-novo-ganho"
            />
          </div>

          <form
            onSubmit={cadastrarGanho}
            className="form-ganhos"
          >
            <div className="campo-ganho">
              <label>Categoria</label>

              <select
                value={idCategoria}
                onChange={event => setIdCategoria(event.target.value)}
              >
                <option value="">
                  Selecione uma categoria
                </option>

                {categorias.map(categoria => (
                  <option
                    key={categoria.id_categoria}
                    value={categoria.id_categoria}
                  >
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-ganho">
              <label>Valor</label>

              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={event => setValor(event.target.value)}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="campo-ganho">
              <label>Descrição</label>

              <input
                type="text"
                value={descricao}
                onChange={event => setDescricao(event.target.value)}
                placeholder="Ex: Salário"
              />
            </div>

            <div className="campo-ganho">
              <label>Data</label>

              <input
                type="date"
                value={dataTransacao}
                max={dataHoje}
                onChange={event => setDataTransacao(event.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-adicionar-ganho"
            >
              <img
                src={iconeAddGanho}
                alt=""
                className="icone-botao-ganho"
              />

              Adicionar ganho
            </button>
          </form>
        </section>

        {/* Lista de ganhos cadastrados */}
        <section className="ganhos-bloco lista-ganhos">
          <div className="ganhos-bloco-topo">
            <h2>Lista de ganhos</h2>
          </div>

          {transacoesFiltradas.length === 0 ? (
            <div className="ganhos-vazio">
              <p>Nenhum ganho encontrado.</p>
            </div>
          ) : (
            <div className="ganhos-lista">
              {transacoesFiltradas.map(transacao => (
                <div
                  className="ganho-item"
                  key={transacao.id_transacao}
                >
                  <div className="ganho-item-esquerda">
                    <div className="ganho-icone">
                      <img
                        src={iconeGanho}
                        alt=""
                      />
                    </div>

                    <div className="ganho-informacoes">
                      <strong>{transacao.descricao}</strong>

                      <p>{transacao.categoria}</p>

                      <small>
                        {new Date(
                          `${String(transacao.data_transacao).slice(0, 10)}T00:00:00`
                        ).toLocaleDateString('pt-BR')}
                      </small>
                    </div>
                  </div>

                  <span className="ganho-valor">
                    + {formatarMoeda(transacao.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

export default Ganhos