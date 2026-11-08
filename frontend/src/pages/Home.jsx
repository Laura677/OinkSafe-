import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

import {
  Doughnut,
  Bar
} from 'react-chartjs-2'

import Header from '../components/Header'

import porquinho from '../imgs-oinksafe/porquinho.png'

import iconeAddGanho from '../imgs-oinksafe/icone-addganho.png'
import iconeAddGasto from '../imgs-oinksafe/icone-addgasto.png'
import iconeMeta from '../imgs-oinksafe/icone-meta.png'
import iconeRelatorio from '../imgs-oinksafe/icone-relatorio.png'
import iconeGanho from '../imgs-oinksafe/icone-ganho.png'
import iconeGastos from '../imgs-oinksafe/icone-gastos.png'

import './Home.css'


// =========================================================
// PLUGIN - TEXTO CENTRAL DO GRÁFICO DE ROSCA
// =========================================================

const textoCentralRosca = {

  id: 'textoCentralRosca',

  afterDraw(chart) {

    // O texto central aparece somente
    // no gráfico de rosca.

    if (chart.config.type !== 'doughnut') {
      return
    }


    if (
      !chart.data.datasets.length ||
      !chart.getDatasetMeta(0).data.length
    ) {
      return
    }


    const ctx = chart.ctx

    const ponto =
      chart.getDatasetMeta(0).data[0]


    const total =
      chart.data.datasets[0].data.reduce(
        (soma, valor) =>
          soma + Number(valor),
        0
      )


    ctx.save()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.fillStyle = '#a8a8a8'
    ctx.font = '11px Arial'


    ctx.fillText(
      'Total gasto',
      ponto.x,
      ponto.y - 10
    )


    ctx.fillStyle = '#f5f5f5'
    ctx.font = 'bold 14px Arial'


    ctx.fillText(
      `R$ ${total.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      )}`,
      ponto.x,
      ponto.y + 10
    )


    ctx.restore()

  }

}


// =========================================================
// REGISTRO DO CHART.JS
// =========================================================

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  textoCentralRosca
)


function Home() {

  const navigate = useNavigate()


  // =========================================================
  // RESUMO
  // =========================================================

  const [resumo, setResumo] =
    useState({

      total_receitas: 0,
      total_despesas: 0,
      saldo: 0

    })


  const [usuario, setUsuario] =
    useState(null)


  const [mensagem, setMensagem] =
    useState('')


  const [metas, setMetas] =
    useState([])


  const [movimentacoes, setMovimentacoes] =
    useState([])


  // =========================================================
  // GRÁFICOS
  // =========================================================

  const [
    gastosCategoria,
    setGastosCategoria
  ] = useState([])


  const [
    gastosMensais,
    setGastosMensais
  ] = useState([])


  const [
    periodoGraficoMensal,
    setPeriodoGraficoMensal
  ] = useState('6')


  // =========================================================
  // NOVO GANHO
  // =========================================================

  const [
    modalEntrada,
    setModalEntrada
  ] = useState(false)


  const [
    categoriasReceita,
    setCategoriasReceita
  ] = useState([])


  const [entrada, setEntrada] =
    useState({

      id_categoria: '',
      valor: '',
      descricao: '',
      data_transacao: ''

    })


  // =========================================================
  // NOVO GASTO
  // =========================================================

  const [
    modalSaida,
    setModalSaida
  ] = useState(false)


  const [
    categoriasDespesa,
    setCategoriasDespesa
  ] = useState([])


  const [saida, setSaida] =
    useState({

      id_categoria: '',
      valor: '',
      descricao: '',
      data_transacao: ''

    })


  // =========================================================
  // NOVA META
  // =========================================================

  const [
    modalMeta,
    setModalMeta
  ] = useState(false)


  const [meta, setMeta] =
    useState({

      titulo: '',
      valor_alvo: '',
      valor_atual: ''

    })


  // =========================================================
  // DATA DE HOJE
  // =========================================================

  function obterDataHoje() {

    const hoje =
      new Date()


    const ano =
      hoje.getFullYear()


    const mes =
      String(
        hoje.getMonth() + 1
      ).padStart(
        2,
        '0'
      )


    const dia =
      String(
        hoje.getDate()
      ).padStart(
        2,
        '0'
      )


    return `${ano}-${mes}-${dia}`

  }


  const dataHoje =
    obterDataHoje()


  // =========================================================
  // FORMATAR MÊS
  // =========================================================

  function formatarMes(valor) {

    if (
      valor === null ||
      valor === undefined
    ) {

      return ''

    }


    const meses = [

      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez'

    ]


    const texto =
      String(valor)


    // Exemplo:
    // 9 -> Set

    if (/^\d{1,2}$/.test(texto)) {

      const numeroMes =
        Number(texto)


      if (
        numeroMes >= 1 &&
        numeroMes <= 12
      ) {

        return meses[
          numeroMes - 1
        ]

      }

    }


    // Exemplo:
    // 2026-09 -> Set

    const formatoAnoMes =
      texto.match(
        /^(\d{4})-(\d{1,2})$/
      )


    if (formatoAnoMes) {

      const numeroMes =
        Number(
          formatoAnoMes[2]
        )


      if (
        numeroMes >= 1 &&
        numeroMes <= 12
      ) {

        return meses[
          numeroMes - 1
        ]

      }

    }


    // Exemplo:
    // 09/2026 -> Set

    const formatoMesAno =
      texto.match(
        /^(\d{1,2})\/(\d{4})$/
      )


    if (formatoMesAno) {

      const numeroMes =
        Number(
          formatoMesAno[1]
        )


      if (
        numeroMes >= 1 &&
        numeroMes <= 12
      ) {

        return meses[
          numeroMes - 1
        ]

      }

    }


    return texto

  }


  // =========================================================
  // CARREGAR HOME
  // =========================================================

  useEffect(() => {

    const sessao =
      JSON.parse(
        localStorage.getItem(
          'sessao_oinksafe'
        )
      )


    if (!sessao) {

      navigate('/login')

      return

    }


    setUsuario(
      sessao
    )


    carregarDashboard(
      sessao.id
    )


    carregarMetas(
      sessao.id
    )


    carregarMovimentacoes(
      sessao.id
    )


    carregarGastosCategoria(
      sessao.id
    )


    carregarGastosMensais(
      sessao.id
    )


  }, [navigate])


  // =========================================================
  // DASHBOARD
  // =========================================================

  function carregarDashboard(
    idUsuario
  ) {

    fetch(
      `http://localhost:3000/api/dashboard/${idUsuario}`
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao buscar dashboard'
          )

        }


        return response.json()

      })

      .then(data => {

        setResumo(
          data
        )

      })

      .catch(error => {

        console.error(
          'Erro ao buscar dashboard:',
          error
        )

      })

  }


  // =========================================================
  // METAS
  // =========================================================

  function carregarMetas(
    idUsuario
  ) {

    fetch(
      `http://localhost:3000/api/metas/${idUsuario}`
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao buscar metas'
          )

        }


        return response.json()

      })

      .then(data => {

        setMetas(
          data
        )

      })

      .catch(error => {

        console.error(
          'Erro ao buscar metas:',
          error
        )

      })

  }


  // =========================================================
  // MOVIMENTAÇÕES
  // =========================================================

  function carregarMovimentacoes(
    idUsuario
  ) {

    fetch(
      `http://localhost:3000/api/transacoes/${idUsuario}`
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao buscar movimentações'
          )

        }


        return response.json()

      })

      .then(data => {

        setMovimentacoes(
          data
        )

      })

      .catch(error => {

        console.error(
          'Erro ao buscar movimentações:',
          error
        )

      })

  }


  // =========================================================
  // GASTOS POR CATEGORIA
  // =========================================================

  function carregarGastosCategoria(
    idUsuario
  ) {

    fetch(
      `http://localhost:3000/api/dashboard/${idUsuario}/gastos-categoria`
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao buscar gastos por categoria'
          )

        }


        return response.json()

      })

      .then(data => {

        setGastosCategoria(
          data
        )

      })

      .catch(error => {

        console.error(
          'Erro ao buscar gastos por categoria:',
          error
        )

      })

  }


  // =========================================================
  // GASTOS MENSAIS
  // =========================================================

  function carregarGastosMensais(
    idUsuario
  ) {

    fetch(
      `http://localhost:3000/api/dashboard/${idUsuario}/gastos-mensais`
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao buscar gastos mensais'
          )

        }


        return response.json()

      })

      .then(data => {

        setGastosMensais(
          data
        )

      })

      .catch(error => {

        console.error(
          'Erro ao buscar gastos mensais:',
          error
        )

      })

  }


  // =========================================================
  // ATUALIZAR DADOS FINANCEIROS
  // =========================================================

  function atualizarDadosFinanceiros() {

    if (!usuario) {

      return

    }


    carregarDashboard(
      usuario.id
    )


    carregarMovimentacoes(
      usuario.id
    )


    carregarGastosCategoria(
      usuario.id
    )


    carregarGastosMensais(
      usuario.id
    )

  }


  // =========================================================
  // MENSAGEM
  // =========================================================

  function mostrarMensagem(
    texto
  ) {

    setMensagem(
      texto
    )


    setTimeout(() => {

      setMensagem('')

    }, 3000)

  }


  // =========================================================
  // ABRIR NOVO GANHO
  // =========================================================

  function abrirNovaEntrada() {

    fetch(
      'http://localhost:3000/api/categorias'
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao buscar categorias'
          )

        }


        return response.json()

      })

      .then(data => {

        const receitas =
          data.filter(

            categoria =>
              categoria.tipo ===
              'receita'

          )


        setCategoriasReceita(
          receitas
        )


        setModalEntrada(
          true
        )

      })

      .catch(error => {

        console.error(
          'Erro ao buscar categorias:',
          error
        )

      })

  }


  // =========================================================
  // CADASTRAR GANHO
  // =========================================================

  function cadastrarEntrada(
    event
  ) {

    event.preventDefault()


    if (!usuario) {

      return

    }


    if (
      entrada.data_transacao >
      dataHoje
    ) {

      mostrarMensagem(
        'Não é permitido cadastrar uma data futura.'
      )

      return

    }


    fetch(
      'http://localhost:3000/api/transacoes',
      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json'

        },

        body:
          JSON.stringify({

            id_usuario:
              usuario.id,

            id_categoria:
              Number(
                entrada.id_categoria
              ),

            valor:
              Number(
                entrada.valor
              ),

            descricao:
              entrada.descricao,

            data_transacao:
              entrada.data_transacao

          })

      }
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao cadastrar ganho'
          )

        }


        return response.json()

      })

      .then(() => {

        atualizarDadosFinanceiros()


        setEntrada({

          id_categoria: '',
          valor: '',
          descricao: '',
          data_transacao: ''

        })


        setModalEntrada(
          false
        )


        mostrarMensagem(
          'Ganho adicionado com sucesso!'
        )

      })

      .catch(error => {

        console.error(
          'Erro ao cadastrar ganho:',
          error
        )

      })

  }


  // =========================================================
  // ABRIR NOVO GASTO
  // =========================================================

  function abrirNovaSaida() {

    fetch(
      'http://localhost:3000/api/categorias'
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao buscar categorias'
          )

        }


        return response.json()

      })

      .then(data => {

        const despesas =
          data.filter(

            categoria =>
              categoria.tipo ===
              'despesa'

          )


        setCategoriasDespesa(
          despesas
        )


        setModalSaida(
          true
        )

      })

      .catch(error => {

        console.error(
          'Erro ao buscar categorias:',
          error
        )

      })

  }


  // =========================================================
  // CADASTRAR GASTO
  // =========================================================

  function cadastrarSaida(
    event
  ) {

    event.preventDefault()


    if (!usuario) {

      return

    }


    if (
      saida.data_transacao >
      dataHoje
    ) {

      mostrarMensagem(
        'Não é permitido cadastrar uma data futura.'
      )

      return

    }


    fetch(
      'http://localhost:3000/api/transacoes',
      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json'

        },

        body:
          JSON.stringify({

            id_usuario:
              usuario.id,

            id_categoria:
              Number(
                saida.id_categoria
              ),

            valor:
              Number(
                saida.valor
              ),

            descricao:
              saida.descricao,

            data_transacao:
              saida.data_transacao

          })

      }
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao cadastrar gasto'
          )

        }


        return response.json()

      })

      .then(() => {

        atualizarDadosFinanceiros()


        setSaida({

          id_categoria: '',
          valor: '',
          descricao: '',
          data_transacao: ''

        })


        setModalSaida(
          false
        )


        mostrarMensagem(
          'Gasto adicionado com sucesso!'
        )

      })

      .catch(error => {

        console.error(
          'Erro ao cadastrar gasto:',
          error
        )

      })

  }


  // =========================================================
  // ABRIR NOVA META
  // =========================================================

  function abrirNovaMeta() {

    setModalMeta(
      true
    )

  }


  // =========================================================
  // CADASTRAR META
  // =========================================================

  function cadastrarMeta(
    event
  ) {

    event.preventDefault()


    if (!usuario) {

      return

    }


    fetch(
      'http://localhost:3000/api/metas',
      {

        method: 'POST',

        headers: {

          'Content-Type':
            'application/json'

        },

        body:
          JSON.stringify({

            id_usuario:
              usuario.id,

            titulo:
              meta.titulo,

            valor_alvo:
              Number(
                meta.valor_alvo
              ),

            valor_atual:
              meta.valor_atual
                ? Number(
                    meta.valor_atual
                  )
                : 0

          })

      }
    )

      .then(response => {

        if (!response.ok) {

          throw new Error(
            'Erro ao cadastrar meta'
          )

        }


        return response.json()

      })

      .then(() => {

        carregarMetas(
          usuario.id
        )


        setMeta({

          titulo: '',
          valor_alvo: '',
          valor_atual: ''

        })


        setModalMeta(
          false
        )


        mostrarMensagem(
          'Meta criada com sucesso!'
        )

      })

      .catch(error => {

        console.error(
          'Erro ao cadastrar meta:',
          error
        )

      })

  }


  // =========================================================
  // ÚLTIMOS MESES
  // =========================================================

  const gastosMensaisFiltrados =
    useMemo(() => {

      const quantidade =
        Number(
          periodoGraficoMensal
        )


      const resultado = []

      const hoje =
        new Date()


      for (
        let i = quantidade - 1;
        i >= 0;
        i--
      ) {

        const data =
          new Date(
            hoje.getFullYear(),
            hoje.getMonth() - i,
            1
          )


        const mes =
          data.getMonth() + 1


        const ano =
          data.getFullYear()


        const registro =
          gastosMensais.find(

            item => {

              const mesItem =
                Number(

                  item.mes ??
                  item.numero_mes

                )


              const anoItem =
                Number(

                  item.ano ??
                  ano

                )


              return (

                mesItem === mes &&
                anoItem === ano

              )

            }

          )


        resultado.push({

          mes,
          ano,

          total:
            registro
              ? Number(

                  registro.total ??
                  registro.total_gasto ??
                  registro.valor ??
                  0

                )
              : 0

        })

      }


      return resultado


    }, [

      gastosMensais,
      periodoGraficoMensal

    ])


  // =========================================================
  // GRÁFICO POR CATEGORIA
  // =========================================================

  const dadosGraficoCategoria = {

    labels:
      gastosCategoria.map(

        item =>

          item.categoria ||
          item.nome ||
          item.nome_categoria ||
          'Categoria'

      ),


    datasets: [

      {

        data:
          gastosCategoria.map(

            item =>
              Number(

                item.total ||
                item.total_gasto ||
                item.valor ||
                0

              )

          ),


        backgroundColor: [

          '#69ff00',
          '#9d3cff',
          '#4ecb00',
          '#7b24d6',
          '#a2ff60',
          '#c266ff'

        ],


        hoverOffset: 5,

        borderWidth: 0

      }

    ]

  }


  // =========================================================
  // GRÁFICO MENSAL
  // =========================================================

  const dadosGraficoMensal = {

    labels:
      gastosMensaisFiltrados.map(

        item =>
          formatarMes(
            item.mes
          )

      ),


    datasets: [

      {

        label:
          'Gastos',


        data:
          gastosMensaisFiltrados.map(

            item =>
              Number(
                item.total
              )

          ),


        backgroundColor:
          '#8f35f6',


        hoverBackgroundColor:
          '#a64bff',


        borderRadius: 8,

        borderSkipped: false,

        barPercentage: 0.72,

        categoryPercentage: 0.58

      }

    ]

  }


  // =========================================================
  // OPÇÕES ROSCA
  // =========================================================

  const opcoesRosca = {

    responsive: true,

    maintainAspectRatio: false,

    cutout: '67%',


    plugins: {

      legend: {

        position:
          'right',


        labels: {

          color:
            '#d4d4d4',

          boxWidth: 9,

          boxHeight: 9,

          padding: 14,

          usePointStyle: true,

          pointStyle:
            'circle',


          font: {

            size: 11

          }

        }

      },


      tooltip: {

        callbacks: {

          label: context => {

            const valor =
              Number(
                context.raw || 0
              )


            return `${context.label}: R$ ${valor.toLocaleString(
              'pt-BR',
              {

                minimumFractionDigits: 2,
                maximumFractionDigits: 2

              }
            )}`

          }

        }

      }

    }

  }


  // =========================================================
  // OPÇÕES GRÁFICO DE BARRAS
  // =========================================================

  const opcoesBarra = {

    responsive: true,

    maintainAspectRatio: false,


    plugins: {

      legend: {

        display: false

      },


      tooltip: {

        callbacks: {

          label: context => {

            const valor =
              Number(
                context.raw || 0
              )


            return `R$ ${valor.toLocaleString(
              'pt-BR',
              {

                minimumFractionDigits: 2,
                maximumFractionDigits: 2

              }
            )}`

          }

        }

      }

    },


    layout: {

      padding: {

        top: 10,
        right: 10,
        left: 5,
        bottom: 0

      }

    },


    scales: {

      x: {

        ticks: {

          color:
            '#e5e5e5',


          font: {

            size: 12,
            weight: '600'

          }

        },


        grid: {

          display: false

        },


        border: {

          display: false

        }

      },


      y: {

        beginAtZero: true,


        ticks: {

          color:
            '#cfcfcf',


          font: {

            size: 11

          },


          callback: value =>

            `R$ ${Number(
              value
            ).toLocaleString(
              'pt-BR'
            )}`

        },


        grid: {

          color:
            'rgba(255,255,255,0.05)'

        },


        border: {

          display: false

        }

      }

    }

  }


  // =========================================================
  // INTERFACE
  // =========================================================

  return (

    <div className="pagina-home">


      <Header />


      {/* ================================================= */}
      {/* MENSAGEM */}
      {/* ================================================= */}

      {mensagem && (

        <div className="mensagem-sucesso">

          {mensagem}

        </div>

      )}


      <main className="home">


        {/* ================================================= */}
        {/* BOAS-VINDAS */}
        {/* ================================================= */}

        <section className="boas-vindas boas-vindas-com-porquinho">


          <div className="boas-vindas-texto">


            <h1>

              {usuario
                ? `Olá, ${usuario.nome}!`
                : 'Olá!'
              }

            </h1>


            <p>

              Vamos cuidar das suas finanças hoje!

            </p>


          </div>


          <img

            src={porquinho}

            alt="Mascote OinkSafe"

            className="porquinho-home"

          />


        </section>


        {/* ================================================= */}
        {/* RESUMO */}
        {/* ================================================= */}

        <section className="resumo-card">


          <div className="saldo-principal">


            <span>

              Saldo atual

            </span>


            <h2>

              R$ {Number(
                resumo.saldo
              ).toFixed(2)}

            </h2>


          </div>


          <div className="resumo-secundario">


            {/* GANHOS */}

            <div className="resumo-item ganhos">


              <div className="resumo-titulo">


                <span className="bolinha verde"></span>


                <span>

                  Ganhos

                </span>


              </div>


              <strong>

                R$ {Number(
                  resumo.total_receitas
                ).toFixed(2)}

              </strong>


            </div>


            {/* GASTOS */}

            <div className="resumo-item despesas">


              <div className="resumo-titulo">


                <span className="bolinha roxa"></span>


                <span>

                  Gastos

                </span>


              </div>


              <strong>

                R$ {Number(
                  resumo.total_despesas
                ).toFixed(2)}

              </strong>


            </div>


          </div>


        </section>


        {/* ================================================= */}
        {/* AÇÕES RÁPIDAS */}
        {/* ================================================= */}

        <section className="secao-home">


          <h2 className="titulo-secao">

            Ações rápidas

          </h2>


          <div className="acoes-rapidas">


            {/* NOVO GANHO */}

            <button

              className="acao acao-verde"

              onClick={
                abrirNovaEntrada
              }

            >


              <div className="icone-acao icone-acao-sem-borda">

                <img

                  src={iconeAddGanho}

                  alt=""

                  className="imagem-icone-acao"

                />

              </div>


              <span>

                Novo ganho

              </span>


            </button>


            {/* NOVO GASTO */}

            <button

              className="acao acao-roxa"

              onClick={
                abrirNovaSaida
              }

            >


              <div className="icone-acao icone-acao-sem-borda">

                <img

                  src={iconeAddGasto}

                  alt=""

                  className="imagem-icone-acao"

                />

              </div>


              <span>

                Novo gasto

              </span>


            </button>


            {/* NOVA META */}

            <button

              className="acao acao-verde"

              onClick={
                abrirNovaMeta
              }

            >


              <div className="icone-acao icone-acao-sem-borda">

                <img

                  src={iconeMeta}

                  alt=""

                  className="imagem-icone-acao"

                />

              </div>


              <span>

                Nova meta

              </span>


            </button>


            {/* RELATÓRIO */}

            <button

              className="acao acao-roxa acao-desabilitada"

              disabled

              title="Em breve"

            >


              <div className="icone-acao icone-acao-sem-borda">

                <img

                  src={iconeRelatorio}

                  alt=""

                  className="imagem-icone-acao"

                />

              </div>


              <span>

                Relatório

              </span>


              <small>

                Em breve

              </small>


            </button>


          </div>


        </section>


        {/* ================================================= */}
        {/* GRÁFICOS */}
        {/* ================================================= */}

        <section className="graficos-home">


          {/* GASTOS POR CATEGORIA */}

          <div className="bloco-home grafico-card grafico-categoria-card">


            <div className="grafico-topo">

              <h2>

                Gastos por categoria

              </h2>

            </div>


            <div className="grafico-real grafico-rosca">


              {gastosCategoria.length === 0 ? (

                <div className="conteudo-vazio">

                  <p>

                    Nenhum gasto cadastrado.

                  </p>

                </div>

              ) : (

                <Doughnut

                  data={
                    dadosGraficoCategoria
                  }

                  options={
                    opcoesRosca
                  }

                />

              )}


            </div>


            <div className="grafico-rodape">


              <button

                className="btn-ver-detalhes-grafico"

                onClick={() =>
                  navigate('/gastos')
                }

              >

                Ver detalhes

              </button>


            </div>


          </div>


          {/* GASTOS MENSAIS */}

          <div className="bloco-home grafico-card grafico-mensal-card">


            <div className="grafico-topo">


              <h2>

                Gastos mensais

              </h2>


              <select

                className="filtro-periodo"

                value={
                  periodoGraficoMensal
                }

                onChange={event =>
                  setPeriodoGraficoMensal(
                    event.target.value
                  )
                }

              >


                <option value="3">

                  3 meses

                </option>


                <option value="6">

                  6 meses

                </option>


                <option value="12">

                  12 meses

                </option>


              </select>


            </div>


            <div className="grafico-real grafico-barras">


              {gastosMensaisFiltrados.length === 0 ? (

                <div className="conteudo-vazio">

                  <p>

                    Nenhum gasto cadastrado.

                  </p>

                </div>

              ) : (

                <Bar

                  data={
                    dadosGraficoMensal
                  }

                  options={
                    opcoesBarra
                  }

                />

              )}


            </div>


            <div className="grafico-rodape">


              <button

                className="btn-ver-detalhes-grafico"

                onClick={() =>
                  navigate('/gastos')
                }

              >

                Ver detalhes

              </button>


            </div>


          </div>


        </section>


        {/* ================================================= */}
        {/* METAS */}
        {/* ================================================= */}

        <section className="bloco-home metas-home">


          <div className="titulo-bloco">


            <h2>

              Minhas metas

            </h2>


            <button

              className="ver-todos"

              onClick={() =>
                navigate('/metas')
              }

            >

              Ver todas

            </button>


          </div>


          <div className="lista-metas-home">


            {metas.length === 0 ? (

              <div className="conteudo-vazio">

                <p>

                  Você ainda não possui metas.

                </p>

              </div>

            ) : (

              metas

                .slice(
                  0,
                  3
                )

                .map(metaItem => {


                  const valorAtual =
                    Number(
                      metaItem.valor_atual
                    )


                  const valorAlvo =
                    Number(
                      metaItem.valor_alvo
                    )


                  let porcentagem =
                    0


                  if (
                    valorAlvo > 0
                  ) {

                    porcentagem =
                      (
                        valorAtual /
                        valorAlvo
                      ) * 100

                  }


                  porcentagem =
                    Math.min(
                      porcentagem,
                      100
                    )


                  return (

                    <div

                      className="meta-card-home"

                      key={
                        metaItem.id_meta
                      }

                    >


                      {/* ÍCONE DA META */}

                      <div className="meta-icone">


                        <img

                          src={iconeMeta}

                          alt=""

                          className="imagem-icone-meta-home"

                        />


                      </div>


                      {/* CONTEÚDO */}

                      <div className="meta-conteudo">


                        <div className="meta-info-home">


                          <div className="meta-textos">


                            <h3>

                              {metaItem.titulo}

                            </h3>


                            <p>

                              R$ {valorAtual.toLocaleString(
                                'pt-BR',
                                {

                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2

                                }
                              )}


                              <span>

                                {' '}de{' '}

                              </span>


                              R$ {valorAlvo.toLocaleString(
                                'pt-BR',
                                {

                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2

                                }
                              )}


                            </p>


                          </div>


                          <div className="meta-percentual">

                            {porcentagem.toFixed(0)}%

                          </div>


                        </div>


                        {/* BARRA */}

                        <div className="barra-meta-home">


                          <div

                            className="progresso-meta-home"

                            style={{

                              width:
                                `${porcentagem}%`

                            }}

                          />


                        </div>


                      </div>


                    </div>

                  )

                })

            )}


          </div>


        </section>


        {/* ================================================= */}
        {/* ÚLTIMAS MOVIMENTAÇÕES */}
        {/* ================================================= */}

        <section className="bloco-home movimentacoes-home">


          <div className="titulo-bloco">


            <h2>

              Últimas movimentações

            </h2>


            <button

              className="ver-todos"

              onClick={() =>
                navigate('/gastos')
              }

            >

              Ver todas

            </button>


          </div>


          <div className="lista-movimentacoes-home">


            {movimentacoes.length === 0 ? (

              <div className="conteudo-vazio">

                <p>

                  Você ainda não possui movimentações.

                </p>

              </div>

            ) : (

              movimentacoes

                .slice(
                  0,
                  4
                )

                .map(
                  movimentacao => (


                    <div

                      className="movimentacao-item-home"

                      key={
                        movimentacao.id_transacao
                      }

                    >


                      <div className="movimentacao-esquerda-home">


                        {/* ÍCONE GANHO / GASTO */}

                        <div

                          className={

                            movimentacao.tipo ===
                            'receita'

                              ? 'movimentacao-icone-home ganho'

                              : 'movimentacao-icone-home gasto'

                          }

                        >


                          <img

                            src={

                              movimentacao.tipo ===
                              'receita'

                                ? iconeGanho

                                : iconeGastos

                            }

                            alt=""

                          />


                        </div>


                        <div className="movimentacao-dados">


                          <strong>

                            {movimentacao.descricao ||
                              movimentacao.categoria}

                          </strong>


                          <span>

                            {movimentacao.categoria}

                          </span>


                        </div>


                      </div>


                      <div

                        className={

                          movimentacao.tipo ===
                          'receita'

                            ? 'movimentacao-valor receita'

                            : 'movimentacao-valor despesa'

                        }

                      >


                        {movimentacao.tipo ===
                        'receita'

                          ? '+ '

                          : '- '

                        }


                        R$ {Number(
                          movimentacao.valor
                        ).toLocaleString(
                          'pt-BR',
                          {

                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2

                          }
                        )}


                      </div>


                    </div>


                  )

                )

            )}


          </div>


        </section>


        {/* ================================================= */}
        {/* MODAL NOVO GANHO */}
        {/* ================================================= */}

        {modalEntrada && (

          <div className="modal-fundo">


            <div className="modal">


              <div className="modal-topo">


                <h2>

                  Novo ganho

                </h2>


                <button

                  className="fechar-modal"

                  onClick={() =>
                    setModalEntrada(
                      false
                    )
                  }

                  type="button"

                >

                  ×

                </button>


              </div>


              <form

                onSubmit={
                  cadastrarEntrada
                }

              >


                <label>

                  Valor

                </label>


                <input

                  type="number"

                  step="0.01"

                  min="0.01"

                  placeholder="R$ 0,00"

                  value={
                    entrada.valor
                  }

                  onChange={event =>
                    setEntrada({

                      ...entrada,

                      valor:
                        event.target.value

                    })
                  }

                  required

                />


                <label>

                  Categoria

                </label>


                <select

                  value={
                    entrada.id_categoria
                  }

                  onChange={event =>
                    setEntrada({

                      ...entrada,

                      id_categoria:
                        event.target.value

                    })
                  }

                  required

                >


                  <option value="">

                    Selecione uma categoria

                  </option>


                  {categoriasReceita.map(

                    categoria => (

                      <option

                        key={
                          categoria.id_categoria
                        }

                        value={
                          categoria.id_categoria
                        }

                      >

                        {categoria.nome}

                      </option>

                    )

                  )}


                </select>


                <label>

                  Descrição

                </label>


                <input

                  type="text"

                  placeholder="Ex: Salário"

                  value={
                    entrada.descricao
                  }

                  onChange={event =>
                    setEntrada({

                      ...entrada,

                      descricao:
                        event.target.value

                    })
                  }

                />


                <label>

                  Data

                </label>


                <input

                  type="date"

                  max={
                    dataHoje
                  }

                  value={
                    entrada.data_transacao
                  }

                  onChange={event =>
                    setEntrada({

                      ...entrada,

                      data_transacao:
                        event.target.value

                    })
                  }

                  required

                />


                <div className="modal-acoes">


                  <button

                    type="button"

                    className="cancelar"

                    onClick={() =>
                      setModalEntrada(
                        false
                      )
                    }

                  >

                    Cancelar

                  </button>


                  <button

                    type="submit"

                    className="salvar"

                  >

                    Adicionar ganho

                  </button>


                </div>


              </form>


            </div>


          </div>

        )}


        {/* ================================================= */}
        {/* MODAL NOVO GASTO */}
        {/* ================================================= */}

        {modalSaida && (

          <div className="modal-fundo">


            <div className="modal">


              <div className="modal-topo">


                <h2>

                  Novo gasto

                </h2>


                <button

                  className="fechar-modal"

                  onClick={() =>
                    setModalSaida(
                      false
                    )
                  }

                  type="button"

                >

                  ×

                </button>


              </div>


              <form

                onSubmit={
                  cadastrarSaida
                }

              >


                <label>

                  Valor

                </label>


                <input

                  type="number"

                  step="0.01"

                  min="0.01"

                  placeholder="R$ 0,00"

                  value={
                    saida.valor
                  }

                  onChange={event =>
                    setSaida({

                      ...saida,

                      valor:
                        event.target.value

                    })
                  }

                  required

                />


                <label>

                  Categoria

                </label>


                <select

                  value={
                    saida.id_categoria
                  }

                  onChange={event =>
                    setSaida({

                      ...saida,

                      id_categoria:
                        event.target.value

                    })
                  }

                  required

                >


                  <option value="">

                    Selecione uma categoria

                  </option>


                  {categoriasDespesa.map(

                    categoria => (

                      <option

                        key={
                          categoria.id_categoria
                        }

                        value={
                          categoria.id_categoria
                        }

                      >

                        {categoria.nome}

                      </option>

                    )

                  )}


                </select>


                <label>

                  Descrição

                </label>


                <input

                  type="text"

                  placeholder="Ex: Mercado"

                  value={
                    saida.descricao
                  }

                  onChange={event =>
                    setSaida({

                      ...saida,

                      descricao:
                        event.target.value

                    })
                  }

                />


                <label>

                  Data

                </label>


                <input

                  type="date"

                  max={
                    dataHoje
                  }

                  value={
                    saida.data_transacao
                  }

                  onChange={event =>
                    setSaida({

                      ...saida,

                      data_transacao:
                        event.target.value

                    })
                  }

                  required

                />


                <div className="modal-acoes">


                  <button

                    type="button"

                    className="cancelar"

                    onClick={() =>
                      setModalSaida(
                        false
                      )
                    }

                  >

                    Cancelar

                  </button>


                  <button

                    type="submit"

                    className="salvar"

                  >

                    Adicionar gasto

                  </button>


                </div>


              </form>


            </div>


          </div>

        )}


        {/* ================================================= */}
        {/* MODAL NOVA META */}
        {/* ================================================= */}

        {modalMeta && (

          <div className="modal-fundo">


            <div className="modal">


              <div className="modal-topo">


                <h2>

                  Nova meta

                </h2>


                <button

                  className="fechar-modal"

                  onClick={() =>
                    setModalMeta(
                      false
                    )
                  }

                  type="button"

                >

                  ×

                </button>


              </div>


              <form

                onSubmit={
                  cadastrarMeta
                }

              >


                <label>

                  Nome da meta

                </label>


                <input

                  type="text"

                  placeholder="Ex: Notebook novo"

                  value={
                    meta.titulo
                  }

                  onChange={event =>
                    setMeta({

                      ...meta,

                      titulo:
                        event.target.value

                    })
                  }

                  required

                />


                <label>

                  Valor da meta

                </label>


                <input

                  type="number"

                  step="0.01"

                  min="0.01"

                  placeholder="R$ 0,00"

                  value={
                    meta.valor_alvo
                  }

                  onChange={event =>
                    setMeta({

                      ...meta,

                      valor_alvo:
                        event.target.value

                    })
                  }

                  required

                />


                <label>

                  Valor já guardado

                </label>


                <input

                  type="number"

                  step="0.01"

                  min="0"

                  placeholder="R$ 0,00"

                  value={
                    meta.valor_atual
                  }

                  onChange={event =>
                    setMeta({

                      ...meta,

                      valor_atual:
                        event.target.value

                    })
                  }

                />


                <div className="modal-acoes">


                  <button

                    type="button"

                    className="cancelar"

                    onClick={() =>
                      setModalMeta(
                        false
                      )
                    }

                  >

                    Cancelar

                  </button>


                  <button

                    type="submit"

                    className="salvar"

                  >

                    Criar meta

                  </button>


                </div>


              </form>


            </div>


          </div>

        )}


      </main>


    </div>

  )

}


export default Home