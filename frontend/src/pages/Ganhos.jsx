
import { useEffect, useMemo, useState } from 'react'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

import { Doughnut } from 'react-chartjs-2'

import Header from '../components/Header'
import API_URL from '../services/api'

import porquinho from '../imgs-oinksafe/porquinho.png'
import iconeGanho from '../imgs-oinksafe/icone-ganho.png'
import iconeAddGanho from '../imgs-oinksafe/icone-addganho.png'

import './Ganhos.css'

// =========================================================
// CONFIGURAÇÃO DO CHART.JS
// =========================================================

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

function Ganhos() {

  // =========================================================
  // CATEGORIAS
  // =========================================================

  const [categorias, setCategorias] = useState([])

  // =========================================================
  // FORMULÁRIO
  // =========================================================

  const [idCategoria, setIdCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataTransacao, setDataTransacao] = useState('')

  // =========================================================
  // TRANSAÇÕES
  // =========================================================

  const [transacoes, setTransacoes] = useState([])

  // =========================================================
  // FILTROS
  // =========================================================

  const [periodo, setPeriodo] = useState('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')

  // =========================================================
  // DATA ATUAL
  // =========================================================

  // Usa a data local para evitar problemas de fuso horário.

  const dataHoje = new Date().toLocaleDateString('en-CA')

  // =========================================================
  // FORMATAR MOEDA
  // =========================================================

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // =========================================================
  // CARREGAR TRANSAÇÕES
  // =========================================================

  async function carregarTransacoes(idUsuario) {

    try {

      const resposta = await fetch(
        `${API_URL}/api/transacoes/${idUsuario}`
      )

      if (!resposta.ok) {
        throw new Error('Erro ao carregar as transações.')
      }

      const dados = await resposta.json()

      // A API devolve receitas e despesas.
      // Nesta página queremos somente receitas.

      const apenasReceitas = dados.filter(
        transacao => transacao.tipo === 'receita'
      )

      setTransacoes(apenasReceitas)

    } catch (error) {

      console.error('Erro ao buscar ganhos:', error)

      alert('Não foi possível carregar seus ganhos.')
    }
  }

  // =========================================================
  // CARREGAMENTO DA PÁGINA
  // =========================================================

  useEffect(() => {

    const sessao = JSON.parse(
      localStorage.getItem('sessao_oinksafe')
    )

    // =======================================================
    // CARREGA CATEGORIAS
    // =======================================================

    fetch(`${API_URL}/api/categorias`)

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

    // =======================================================
    // CARREGA GANHOS DO USUÁRIO LOGADO
    // =======================================================

    if (sessao) {
      carregarTransacoes(sessao.id)
    }

  }, [])

  // =========================================================
  // FILTRAR TRANSAÇÕES
  // =========================================================

  const transacoesFiltradas = useMemo(() => {

    const hoje = new Date()

    return transacoes.filter(transacao => {

      // =================================================
      // FILTRO POR CATEGORIA
      // =================================================

      if (
        categoriaFiltro !== 'todas' &&
        transacao.categoria !== categoriaFiltro
      ) {
        return false
      }

      // =================================================
      // TODOS
      // =================================================

      if (periodo === 'todos') {
        return true
      }

      // =================================================
      // CONVERTER DATA
      // =================================================

      const data = String(
        transacao.data_transacao
      ).slice(0, 10)

      const [ano, mes, dia] = data.split('-').map(Number)

      const dataObjeto = new Date(ano, mes - 1, dia)

      if (Number.isNaN(dataObjeto.getTime())) {
        return false
      }

      // =================================================
      // ESTE MÊS
      // =================================================

      if (periodo === 'mes') {
        return (
          dataObjeto.getMonth() === hoje.getMonth() &&
          dataObjeto.getFullYear() === hoje.getFullYear()
        )
      }

      // =================================================
      // ÚLTIMOS 30 DIAS
      // =================================================

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

  // =========================================================
  // TOTAL DE GANHOS
  // =========================================================

  const totalGanhos = useMemo(() => {

    return transacoesFiltradas.reduce(
      (total, transacao) => {
        return total + Number(transacao.valor || 0)
      },
      0
    )

  }, [transacoesFiltradas])

  // =========================================================
  // MÉDIA DIÁRIA
  // =========================================================

  const mediaDiaria = useMemo(() => {

    if (transacoesFiltradas.length === 0) {
      return 0
    }

    const diasComGanho = new Set(
      transacoesFiltradas.map(transacao => {
        return String(
          transacao.data_transacao
        ).slice(0, 10)
      })
    )

    if (diasComGanho.size === 0) {
      return 0
    }

    return totalGanhos / diasComGanho.size

  }, [transacoesFiltradas, totalGanhos])

  // =========================================================
  // AGRUPAR GANHOS POR CATEGORIA
  // =========================================================

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

  // =========================================================
  // GRÁFICO
  // =========================================================

  const dadosGrafico = {

    labels: ganhosPorCategoria.map(
      item => item.categoria
    ),

    datasets: [
      {
        data: ganhosPorCategoria.map(
          item => item.total
        ),

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

  // =========================================================
  // CADASTRAR GANHO
  // =========================================================

  async function cadastrarGanho(event) {

    event.preventDefault()

    const sessao = JSON.parse(
      localStorage.getItem('sessao_oinksafe')
    )

    if (!sessao) {
      alert('Faça login para cadastrar um ganho.')
      return
    }

    // =======================================================
    // CAMPOS OBRIGATÓRIOS
    // =======================================================

    if (
      !idCategoria ||
      !valor ||
      !descricao.trim() ||
      !dataTransacao
    ) {
      alert('Preencha todos os campos.')
      return
    }

    // =======================================================
    // VALOR
    // =======================================================

    if (Number(valor) <= 0) {
      alert('Informe um valor maior que zero.')
      return
    }

    // =======================================================
    // DATA FUTURA
    // =======================================================

    if (dataTransacao > dataHoje) {
      alert('A data do ganho não pode ser futura.')
      return
    }

    // =======================================================
    // ENVIA PARA API
    // =======================================================

    try {

      const resposta = await fetch(
        `${API_URL}/api/transacoes`,
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

        // Limpa o formulário.

        setIdCategoria('')
        setValor('')
        setDescricao('')
        setDataTransacao('')

        // Atualiza os ganhos.

        await carregarTransacoes(sessao.id)

      } else {

        alert(
          dados.message ||
          'Erro ao cadastrar ganho.'
        )
      }

    } catch (error) {

      console.error('Erro ao cadastrar ganho:', error)

      alert('Erro ao conectar com o servidor.')
    }
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <div className="ganhos-container">

      <Header />

      <main className="ganhos-page">

        {/* ================================================= */}
        {/* CABEÇALHO */}
        {/* ================================================= */}

        <section className="ganhos-cabecalho">

          <div className="ganhos-cabecalho-texto">

            <h1>Ganhos</h1>

            <p>
              Acompanhe e gerencie suas entradas
            </p>

          </div>

          <img
            src={porquinho}
            alt="Porquinho do OinkSafe"
            className="ganhos-porquinho"
          />

        </section>

        {/* ================================================= */}
        {/* FILTROS */}
        {/* ================================================= */}

        <section className="ganhos-filtros">

          <select
            value={periodo}
            onChange={event =>
              setPeriodo(event.target.value)
            }
          >

            <option value="todos">
              Todos os ganhos
            </option>

            <option value="mes">
              Este mês
            </option>

            <option value="30dias">
              Últimos 30 dias
            </option>

          </select>

          <select
            value={categoriaFiltro}
            onChange={event =>
              setCategoriaFiltro(event.target.value)
            }
          >

            <option value="todas">
              Todas as categorias
            </option>

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

        {/* ================================================= */}
        {/* RESUMO */}
        {/* ================================================= */}

        <section className="ganhos-resumo">

          <div className="ganhos-card-resumo">

            <span>Total de ganhos</span>

            <strong className="ganho-destaque">
              {formatarMoeda(totalGanhos)}
            </strong>

            <small>
              No período selecionado
            </small>

          </div>

          <div className="ganhos-card-resumo">

            <span>Média diária</span>

            <strong className="ganho-destaque">
              {formatarMoeda(mediaDiaria)}
            </strong>

            <small>
              Média nos dias com ganhos
            </small>

          </div>

        </section>

        {/* ================================================= */}
        {/* GRÁFICO */}
        {/* ================================================= */}

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

        {/* ================================================= */}
        {/* NOVO GANHO */}
        {/* ================================================= */}

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

            {/* CATEGORIA */}

            <div className="campo-ganho">

              <label>Categoria</label>

              <select
                value={idCategoria}
                onChange={event =>
                  setIdCategoria(event.target.value)
                }
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

            {/* VALOR */}

            <div className="campo-ganho">

              <label>Valor</label>

              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={event =>
                  setValor(event.target.value)
                }
                placeholder="R$ 0,00"
              />

            </div>

            {/* DESCRIÇÃO */}

            <div className="campo-ganho">

              <label>Descrição</label>

              <input
                type="text"
                value={descricao}
                onChange={event =>
                  setDescricao(event.target.value)
                }
                placeholder="Ex: Salário"
              />

            </div>

            {/* DATA */}

            <div className="campo-ganho">

              <label>Data</label>

              <input
                type="date"
                value={dataTransacao}
                max={dataHoje}
                onChange={event =>
                  setDataTransacao(event.target.value)
                }
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

        {/* ================================================= */}
        {/* LISTA DE GANHOS */}
        {/* ================================================= */}

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

                      <strong>
                        {transacao.descricao}
                      </strong>

                      <p>
                        {transacao.categoria}
                      </p>

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
