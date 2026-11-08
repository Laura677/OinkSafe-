import { useEffect, useState } from 'react'

import Header from '../components/Header'

import porquinho from '../imgs-oinksafe/porquinho.png'
import iconeMeta from '../imgs-oinksafe/icone-meta.png'
import iconeAdicionar from '../imgs-oinksafe/icone-addganho.png'
import iconeRetirar from '../imgs-oinksafe/icone-addgasto.png'

import './Metas.css'


function Metas() {


  // =========================================================
  // LISTA DE METAS
  // =========================================================

  const [metas, setMetas] =
    useState([])


  // Controla se estamos vendo metas
  // em andamento ou concluídas.

  const [aba, setAba] =
    useState('andamento')


  // =========================================================
  // FORMULÁRIO DE NOVA META
  // =========================================================

  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false)


  const [titulo, setTitulo] =
    useState('')


  const [valorAlvo, setValorAlvo] =
    useState('')


  const [valorAtual, setValorAtual] =
    useState('0')


  // =========================================================
  // MOVIMENTAÇÃO DE VALOR
  // =========================================================

  // Uma meta pode receber dinheiro
  // ou ter dinheiro retirado.
  //
  // + Adicionar valor
  // - Retirar valor

  const [
    metaSelecionada,
    setMetaSelecionada
  ] = useState(null)


  const [
    tipoMovimentacao,
    setTipoMovimentacao
  ] = useState(null)


  const [
    valorMovimentacao,
    setValorMovimentacao
  ] = useState('')


  // =========================================================
  // BUSCAR METAS
  // =========================================================

  function buscarMetas() {

    const sessao =
      JSON.parse(
        localStorage.getItem(
          'sessao_oinksafe'
        )
      )


    if (!sessao) {

      return
    }


    fetch(
      `http://localhost:3000/api/metas/${sessao.id}`
    )

      .then(response =>
        response.json()
      )

      .then(data => {

        if (
          Array.isArray(data)
        ) {

          setMetas(data)
        }

      })

      .catch(error => {

        console.error(
          'Erro ao buscar metas:',
          error
        )

      })
  }


  // =========================================================
  // CARREGAMENTO INICIAL
  // =========================================================

  useEffect(() => {

    buscarMetas()

  }, [])


  // =========================================================
  // CADASTRAR META
  // =========================================================

  async function cadastrarMeta(
    event
  ) {

    event.preventDefault()


    const sessao =
      JSON.parse(
        localStorage.getItem(
          'sessao_oinksafe'
        )
      )


    if (!sessao) {

      alert(
        'Faça login para cadastrar uma meta.'
      )

      return
    }


    // Nome e valor são obrigatórios.

    if (
      !titulo ||
      !valorAlvo
    ) {

      alert(
        'Preencha o nome e o valor da meta.'
      )

      return
    }


    // O objetivo precisa ser maior que zero.

    if (
      Number(valorAlvo) <= 0
    ) {

      alert(
        'O valor da meta deve ser maior que zero.'
      )

      return
    }


    // Não aceita dinheiro guardado negativo.

    if (
      Number(valorAtual) < 0
    ) {

      alert(
        'O valor guardado não pode ser negativo.'
      )

      return
    }


    try {

      const response =
        await fetch(

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
                  sessao.id,

                titulo,

                valor_alvo:
                  Number(
                    valorAlvo
                  ),

                valor_atual:
                  Number(
                    valorAtual || 0
                  ),

                cor_destaque:
                  '#75ff00'

              })

          }

        )


      const data =
        await response.json()


      if (
        response.ok
      ) {

        alert(
          'Meta criada com sucesso!'
        )


        // Limpa o formulário.

        setTitulo('')

        setValorAlvo('')

        setValorAtual('0')

        setMostrarFormulario(
          false
        )


        // Atualiza as metas.

        buscarMetas()


      } else {

        alert(

          data.message ||
          data.error ||
          'Erro ao criar meta.'

        )

      }


    } catch (error) {

      console.error(
        'Erro ao cadastrar meta:',
        error
      )


      alert(
        'Erro ao conectar com o servidor.'
      )

    }
  }


  // =========================================================
  // ABRIR MOVIMENTAÇÃO
  // =========================================================

  function abrirMovimentacao(
    idMeta,
    tipo
  ) {

    setMetaSelecionada(
      idMeta
    )


    setTipoMovimentacao(
      tipo
    )


    setValorMovimentacao('')

  }


  // =========================================================
  // CANCELAR MOVIMENTAÇÃO
  // =========================================================

  function cancelarMovimentacao() {

    setMetaSelecionada(null)

    setTipoMovimentacao(null)

    setValorMovimentacao('')

  }


  // =========================================================
  // ADICIONAR OU RETIRAR VALOR
  // =========================================================

  async function movimentarValor(
    idMeta
  ) {

    if (
      !valorMovimentacao ||
      Number(valorMovimentacao) <= 0
    ) {

      alert(
        'Digite um valor válido.'
      )

      return
    }


    // Define qual rota será chamada
    // dependendo da operação escolhida.

    const rota =

      tipoMovimentacao === 'adicionar'

        ? 'adicionar-valor'

        : 'retirar-valor'


    try {

      const response =
        await fetch(

          `http://localhost:3000/api/metas/${rota}/${idMeta}`,

          {

            method: 'PUT',

            headers: {

              'Content-Type':
                'application/json'

            },

            body:
              JSON.stringify({

                valor:
                  Number(
                    valorMovimentacao
                  )

              })

          }

        )


      const data =
        await response.json()


      if (
        response.ok
      ) {

        alert(
          data.message
        )


        // Fecha área de movimentação.

        cancelarMovimentacao()


        // Atualiza lista.

        buscarMetas()


        // Se atingiu a meta,
        // muda para a aba concluídas.

        if (
          data.status ===
          'concluida'
        ) {

          setAba(
            'concluidas'
          )

        } else {

          // Se retirou dinheiro de uma
          // meta concluída, ela pode voltar
          // automaticamente para andamento.

          setAba(
            'andamento'
          )

        }


      } else {

        alert(

          data.message ||
          data.error ||
          'Erro ao movimentar valor.'

        )

      }


    } catch (error) {

      console.error(
        'Erro ao movimentar valor:',
        error
      )


      alert(
        'Erro ao conectar com o servidor.'
      )

    }
  }


  // =========================================================
  // EXCLUIR META
  // =========================================================

  async function excluirMeta(
    idMeta
  ) {

    const confirmar =
      window.confirm(
        'Tem certeza que deseja excluir esta meta?'
      )


    if (!confirmar) {

      return
    }


    try {

      const response =
        await fetch(

          `http://localhost:3000/api/metas/${idMeta}`,

          {

            method:
              'DELETE'

          }

        )


      const data =
        await response.json()


      if (
        response.ok
      ) {

        alert(
          'Meta excluída com sucesso!'
        )


        cancelarMovimentacao()

        buscarMetas()


      } else {

        alert(

          data.message ||
          data.error ||
          'Erro ao excluir meta.'

        )

      }


    } catch (error) {

      console.error(
        'Erro ao excluir meta:',
        error
      )


      alert(
        'Erro ao conectar com o servidor.'
      )

    }
  }


  // =========================================================
  // CALCULAR PORCENTAGEM
  // =========================================================

  function calcularPorcentagem(
    meta
  ) {

    const atual =
      Number(
        meta.valor_atual
      )


    const alvo =
      Number(
        meta.valor_alvo
      )


    if (!alvo) {

      return 0
    }


    return Math.min(

      Math.round(
        (atual / alvo) *
        100
      ),

      100

    )
  }


  // =========================================================
  // CALCULAR QUANTO FALTA
  // =========================================================

  function calcularFalta(
    meta
  ) {

    return Math.max(

      Number(
        meta.valor_alvo
      ) -

      Number(
        meta.valor_atual
      ),

      0

    )
  }


  // =========================================================
  // VERIFICAR SE A META ESTÁ CONCLUÍDA
  // =========================================================

  function metaEstaConcluida(
    meta
  ) {

    return (

      meta.status ===
        'concluida'

      ||

      Number(
        meta.valor_atual
      ) >=

      Number(
        meta.valor_alvo
      )

    )
  }


  // =========================================================
  // FILTRAR METAS PELA ABA
  // =========================================================

  const metasFiltradas =
    metas.filter(

      meta => {

        const concluida =
          metaEstaConcluida(
            meta
          )


        if (
          aba ===
          'concluidas'
        ) {

          return concluida
        }


        return !concluida

      }

    )


  // =========================================================
  // INTERFACE
  // =========================================================

  return (

    <div>

      <Header />


      <main className="metas-page">


        {/* ================================================= */}
        {/* TOPO DA PÁGINA */}
        {/* ================================================= */}

        <section className="metas-topo">


          <div className="metas-titulo">

            <h1>
              Metas
            </h1>


            <p>

              Defina objetivos e conquiste seus sonhos

            </p>

          </div>


          {/* MASCOTE */}

          <img
            src={porquinho}
            alt="Mascote OinkSafe"
            className="porquinho-metas"
          />


        </section>


        {/* ================================================= */}
        {/* ABAS */}
        {/* ================================================= */}

        <div className="metas-abas">


          <button

            className={

              aba === 'andamento'

                ? 'aba ativa'

                : 'aba'

            }

            onClick={() =>
              setAba(
                'andamento'
              )
            }

          >

            Metas em Andamento

          </button>


          <button

            className={

              aba === 'concluidas'

                ? 'aba ativa'

                : 'aba'

            }

            onClick={() =>
              setAba(
                'concluidas'
              )
            }

          >

            Metas Concluídas

          </button>


        </div>


        {/* ================================================= */}
        {/* FORMULÁRIO NOVA META */}
        {/* ================================================= */}

        {mostrarFormulario && (

          <form

            className="form-meta"

            onSubmit={
              cadastrarMeta
            }

          >


            <h2>

              Nova Meta

            </h2>


            <div className="form-meta-grid">


              {/* NOME */}

              <div className="campo-meta">

                <label>

                  Nome da meta

                </label>


                <input

                  type="text"

                  placeholder="Ex: Viagem dos sonhos"

                  value={
                    titulo
                  }

                  onChange={
                    event =>
                      setTitulo(
                        event.target.value
                      )
                  }

                />

              </div>


              {/* VALOR ALVO */}

              <div className="campo-meta">

                <label>

                  Valor da meta

                </label>


                <input

                  type="number"

                  step="0.01"

                  min="0.01"

                  placeholder="5000"

                  value={
                    valorAlvo
                  }

                  onChange={
                    event =>
                      setValorAlvo(
                        event.target.value
                      )
                  }

                />

              </div>


              {/* VALOR JÁ GUARDADO */}

              <div className="campo-meta">

                <label>

                  Valor já guardado

                </label>


                <input

                  type="number"

                  step="0.01"

                  min="0"

                  value={
                    valorAtual
                  }

                  onChange={
                    event =>
                      setValorAtual(
                        event.target.value
                      )
                  }

                />

              </div>


            </div>


            {/* BOTÕES DO FORMULÁRIO */}

            <div className="form-meta-botoes">


              <button

                type="button"

                className="btn-cancelar-meta"

                onClick={() => {

                  setMostrarFormulario(
                    false
                  )

                  setTitulo('')

                  setValorAlvo('')

                  setValorAtual('0')

                }}

              >

                Cancelar

              </button>


              <button

                type="submit"

                className="btn-salvar-meta"

              >

                Criar Meta

              </button>


            </div>


          </form>

        )}


        {/* ================================================= */}
        {/* LISTA DE METAS */}
        {/* ================================================= */}

        <section className="metas-lista">


          {metasFiltradas.length ===
          0 ? (


            <div className="sem-metas">

              <p>

                {aba === 'andamento'

                  ? 'Você ainda não possui metas em andamento.'

                  : 'Você ainda não possui metas concluídas.'
                }

              </p>

            </div>


          ) : (


            metasFiltradas.map(

              meta => {


                const porcentagem =
                  calcularPorcentagem(
                    meta
                  )


                const falta =
                  calcularFalta(
                    meta
                  )


                const concluida =
                  metaEstaConcluida(
                    meta
                  )


                return (

                  <div

                    className="meta-card"

                    key={
                      meta.id_meta
                    }

                  >


                    {/* ===================================== */}
                    {/* CONTEÚDO PRINCIPAL */}
                    {/* ===================================== */}

                    <div className="meta-conteudo">


                      {/* ÍCONE PERSONALIZADO */}

                      <div className="meta-icone-personalizado">

                        <img
                          src={iconeMeta}
                          alt=""
                        />

                      </div>


                      {/* INFORMAÇÕES */}

                      <div className="meta-info">


                        <h3>

                          {meta.titulo}

                        </h3>


                        <strong>

                          R$ {
                            Number(
                              meta.valor_atual
                            ).toFixed(2)
                          }

                          {' de '}

                          R$ {
                            Number(
                              meta.valor_alvo
                            ).toFixed(2)
                          }

                        </strong>


                        <p>

                          {concluida

                            ? 'Meta concluída'

                            : `Faltam R$ ${falta.toFixed(2)}`
                          }

                        </p>


                      </div>


                      {/* =================================== */}
                      {/* BARRA DE PROGRESSO */}
                      {/* =================================== */}

                      <div className="meta-progresso">


                        <div className="barra">

                          <div

                            className="barra-preenchida"

                            style={{

                              width:
                                `${porcentagem}%`

                            }}

                          />

                        </div>


                        <span>

                          {porcentagem}%

                        </span>


                      </div>


                    </div>


                    {/* ===================================== */}
                    {/* AÇÕES */}
                    {/* ===================================== */}

                    <div className="meta-acoes">


                      {/* ADICIONAR VALOR */}

                      {!concluida && (

                        <button

                          className="btn-adicionar-valor"

                          onClick={() =>
                            abrirMovimentacao(

                              meta.id_meta,

                              'adicionar'

                            )
                          }

                        >


                          <img
                            src={iconeAdicionar}
                            alt=""
                            className="icone-botao-meta"
                          />


                          <span>

                            Adicionar valor

                          </span>


                        </button>

                      )}


                      {/* RETIRAR VALOR */}

                      {Number(
                        meta.valor_atual
                      ) > 0 && (

                        <button

                          className="btn-resgatar"

                          onClick={() =>
                            abrirMovimentacao(

                              meta.id_meta,

                              'retirar'

                            )
                          }

                        >


                          <img
                            src={iconeRetirar}
                            alt=""
                            className="icone-botao-meta"
                          />


                          <span>

                            Retirar valor

                          </span>


                        </button>

                      )}


                      {/* EXCLUIR */}

                      <button

                        className="btn-excluir-meta"

                        onClick={() =>
                          excluirMeta(
                            meta.id_meta
                          )
                        }

                      >

                        Excluir

                      </button>


                    </div>


                    {/* ===================================== */}
                    {/* ÁREA ADICIONAR / RETIRAR */}
                    {/* ===================================== */}

                    {metaSelecionada ===
                    meta.id_meta && (


                      <div className="adicionar-valor-area">


                        <input

                          type="number"

                          step="0.01"

                          min="0.01"

                          placeholder={

                            tipoMovimentacao ===
                            'adicionar'

                              ? 'Valor para adicionar'

                              : 'Valor para retirar'

                          }

                          value={
                            valorMovimentacao
                          }

                          onChange={
                            event =>
                              setValorMovimentacao(
                                event.target.value
                              )
                          }

                        />


                        <button

                          className="btn-confirmar-valor"

                          onClick={() =>
                            movimentarValor(
                              meta.id_meta
                            )
                          }

                        >

                          {tipoMovimentacao ===
                          'adicionar'

                            ? 'Adicionar'

                            : 'Retirar'
                          }

                        </button>


                        <button

                          className="btn-cancelar-valor"

                          onClick={
                            cancelarMovimentacao
                          }

                        >

                          Cancelar

                        </button>


                      </div>

                    )}


                  </div>

                )

              }

            )

          )}


        </section>


        {/* ================================================= */}
        {/* BOTÃO NOVA META */}
        {/* ================================================= */}

        {!mostrarFormulario && (

          <button

            className="btn-adicionar-meta"

            onClick={() =>
              setMostrarFormulario(
                true
              )
            }

          >

            + Adicionar Meta

          </button>

        )}


      </main>


    </div>

  )
}


export default Metas