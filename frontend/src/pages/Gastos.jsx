
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
import iconeGastos from '../imgs-oinksafe/icone-gastos.png'
import iconeAddGasto from '../imgs-oinksafe/icone-addgasto.png'

import './Gastos.css'

// =========================================================
// CONFIGURAÇÃO DO CHART.JS
// =========================================================

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

function Gastos() {

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

  function carregarTransacoes(idUsuario) {

    fetch(`${API_URL}/api/transacoes/${idUsuario}`)

      .then(response => {

        if (!response.ok) {
          throw new Error('Erro ao carregar transações')
        }

        return response.json()
      })

      .then(data => {

        // A API devolve receitas e despesas.
        // Nesta página queremos somente despesas.

        const apenasDespesas = data.filter(
          transacao => transacao.tipo === 'despesa'
        )

        setTransacoes(apenasDespesas)
      })

      .catch(error => {
        console.error('Erro ao buscar transações:', error)
      })
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

      .then(response => response.json())

      .then(data => {

        const despesas = data.filter(
          categoria => categoria.tipo === 'despesa'
        )

        setCategorias(despesas)
      })

      .catch(error => {
        console.error('Erro ao buscar categorias:', error)
      })

    // =======================================================
    // CARREGA GASTOS DO USUÁRIO LOGADO
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

      if (categoriaFiltro !== 'todas') {
        if (transacao.categoria !== categoriaFiltro) {
          return false
        }
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

      const dataTransacaoObjeto = new Date(
        transacao.data_transacao
      )

      if (Number.isNaN(dataTransacaoObjeto.getTime())) {
        return false
      }

      // =================================================
      // ESTE MÊS
      // =================================================

      if (periodo === 'mes') {
        return (
          dataTransacaoObjeto.getUTCMonth() === hoje.getMonth() &&
          dataTransacaoObjeto.getUTCFullYear() === hoje.getFullYear()
        )
      }

      // =================================================
      // ÚLTIMOS 30 DIAS
      // =================================================

      if (periodo === '30dias') {

        const limite = new Date()
        limite.setDate(limite.getDate() - 30)

        return dataTransacaoObjeto >= limite
      }

      return true
    })

  }, [transacoes, periodo, categoriaFiltro])

  // =========================================================
  // TOTAL DE GASTOS
  // =========================================================

  const totalGastos = useMemo(() => {

    return transacoesFiltradas.reduce(
      (total, transacao) => {
        return total + Number(transacao.valor)
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

    const diasComGasto = new Set(
      transacoesFiltradas.map(transacao => {
        return String(transacao.data_transacao).slice(0, 10)
      })
    )

    if (diasComGasto.size === 0) {
      return 0
    }

    return totalGastos / diasComGasto.size

  }, [transacoesFiltradas, totalGastos])

  // =========================================================
  // AGRUPAR GASTOS POR CATEGORIA
  // =========================================================

  const gastosPorCategoria = useMemo(() => {

    const agrupados = {}

    transacoesFiltradas.forEach(transacao => {

      const categoria = transacao.categoria || 'Sem categoria'

      if (!agrupados[categoria]) {
        agrupados[categoria] = 0
      }

      agrupados[categoria] += Number(transacao.valor)
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

    labels: gastosPorCategoria.map(
      item => item.categoria
    ),

    datasets: [
      {
        data: gastosPorCategoria.map(
          item => item.total
        ),

        backgroundColor: [
          '#9d3cff',
          '#69ff00',
          '#6d28d9',
          '#a855f7',
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
      }
    }
  }

  // =========================================================
  // CADASTRAR GASTO
  // =========================================================

  async function cadastrarGasto(event) {

    event.preventDefault()

    const sessao = JSON.parse(
      localStorage.getItem('sessao_oinksafe')
    )

    if (!sessao) {
      alert('Faça login para cadastrar um gasto.')
      return
    }

    // =======================================================
    // CAMPOS OBRIGATÓRIOS
    // =======================================================

    if (
      !idCategoria ||
      !valor ||
      !descricao ||
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
      alert('A data do gasto não pode ser futura.')
      return
    }

    // =======================================================
    // ENVIA PARA API
    // =======================================================

    try {

      const response = await fetch(
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
            descricao,
            data_transacao: dataTransacao
          })
        }
      )

      const data = await response.json()

      if (response.ok) {

        alert('Gasto cadastrado com sucesso!')

        setIdCategoria('')
        setValor('')
        setDescricao('')
        setDataTransacao('')

        carregarTransacoes(sessao.id)

      } else {

        alert(
          data.message ||
          'Erro ao cadastrar gasto.'
        )
      }

    } catch (error) {

      console.error('Erro ao cadastrar gasto:', error)

      alert('Erro ao conectar com o servidor.')
    }
  }

  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <div>

      <Header />

      <main className="gastos">

        {/* ================================================= */}
        {/* CABEÇALHO */}
        {/* ================================================= */}

        <section className="gastos-cabecalho">

          <div className="gastos-cabecalho-texto">

            <h1>Gastos</h1>

            <p>
              Acompanhe e gerencie seus gastos
            </p>

          </div>

          <img
            src={porquinho}
            alt="Mascote OinkSafe"
            className="porquinho-gastos"
          />

        </section>

        {/* ================================================= */}
        {/* FILTROS */}
        {/* ================================================= */}

        <section className="gastos-filtros">

          <select
            value={periodo}
            onChange={event =>
              setPeriodo(event.target.value)
            }
          >

            <option value="todos">
              Todos os gastos
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

        <section className="gastos-resumo">

          <div className="gastos-card-resumo">

            <span>Total de gastos</span>

            <strong className="gasto-destaque-roxo">
              {formatarMoeda(totalGastos)}
            </strong>

            <small>
              No período selecionado
            </small>

          </div>

          <div className="gastos-card-resumo">

            <span>Média diária</span>

            <strong className="gasto-destaque-verde">
              {formatarMoeda(mediaDiaria)}
            </strong>

            <small>
              Média nos dias com gastos
            </small>

          </div>

        </section>

        {/* ================================================= */}
        {/* GRÁFICO */}
        {/* ================================================= */}

        <section className="gastos-bloco">

          <div className="gastos-bloco-topo">
            <h2>Gastos por categoria</h2>
          </div>

          <div className="gastos-grafico">

            {gastosPorCategoria.length === 0 ? (

              <div className="gastos-vazio">
                <p>Nenhum gasto encontrado.</p>
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
        {/* NOVO GASTO */}
        {/* ================================================= */}

        <section className="gastos-bloco">

          <div className="gastos-bloco-topo">

            <div>
              <h2>Novo gasto</h2>
              <p>Registre uma nova despesa</p>
            </div>

            <img
              src={iconeAddGasto}
              alt=""
              className="icone-novo-gasto"
            />

          </div>

          <form
            onSubmit={cadastrarGasto}
            className="form-gastos"
          >

            {/* CATEGORIA */}

            <div className="campo-gasto">

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

            <div className="campo-gasto">

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

            <div className="campo-gasto">

              <label>Descrição</label>

              <input
                type="text"
                value={descricao}
                onChange={event =>
                  setDescricao(event.target.value)
                }
                placeholder="Ex: Almoço"
              />

            </div>

            {/* DATA */}

            <div className="campo-gasto">

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
              className="btn-adicionar-gasto"
            >

              <img
                src={iconeAddGasto}
                alt=""
                className="icone-botao-gasto"
              />

              Adicionar gasto

            </button>

          </form>

        </section>

        {/* ================================================= */}
        {/* LISTA DE GASTOS */}
        {/* ================================================= */}

        <section className="gastos-bloco lista-gastos">

          <div className="gastos-bloco-topo">
            <h2>Lista de gastos</h2>
          </div>

          {transacoesFiltradas.length === 0 ? (

            <div className="gastos-vazio">
              <p>Nenhum gasto encontrado.</p>
            </div>

          ) : (

            <div className="gastos-lista">

              {transacoesFiltradas.map(transacao => (

                <div
                  className="gasto-item"
                  key={transacao.id_transacao}
                >

                  <div className="gasto-item-esquerda">

                    <div className="gasto-icone">

                      <img
                        src={iconeGastos}
                        alt=""
                      />

                    </div>

                    <div className="gasto-informacoes">

                      <strong>
                        {transacao.descricao}
                      </strong>

                      <p>
                        {transacao.categoria}
                      </p>

                      <small>
                        {new Date(
                          transacao.data_transacao
                        ).toLocaleDateString(
                          'pt-BR',
                          { timeZone: 'UTC' }
                        )}
                      </small>

                    </div>

                  </div>

                  <span className="gasto-valor">
                    - {formatarMoeda(transacao.valor)}
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

export default Gastos
