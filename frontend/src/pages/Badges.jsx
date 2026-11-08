import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import './Badges.css'

// ========================================
// CATÁLOGO DAS 6 BADGES
// ========================================

const catalogo = [
  {
    id: 'primeira_transacao',
    nome: 'Primeiros Passos',
    descricao: 'Registre sua primeira transação no OinkSafe.',
    imagem: '/badges/primeiro-passo.png',
    destino: '/gastos',
    acao: 'Registrar movimentação'
  },
  {
    id: 'primeira_meta',
    nome: 'Primeira Meta',
    descricao: 'Crie sua primeira meta financeira.',
    imagem: '/badges/primeira-meta.png',
    destino: '/metas',
    acao: 'Criar uma meta'
  },
  {
    id: 'poupador',
    nome: 'Poupador',
    descricao: 'Comece a guardar dinheiro em uma meta financeira.',
    imagem: '/badges/poupador.png',
    destino: '/metas',
    acao: 'Guardar dinheiro'
  },
  {
    id: 'foco_no_plano',
    nome: 'Foco no Plano',
    descricao: 'Alcance 50% de uma meta financeira.',
    imagem: '/badges/foco-no-plano.png',
    destino: '/metas',
    acao: 'Acompanhar metas'
  },
  {
    id: 'meta_concluida',
    nome: 'Meta Concluída',
    descricao: 'Conclua sua primeira meta financeira.',
    imagem: '/badges/meta-concluida.png',
    destino: '/metas',
    acao: 'Ver minhas metas'
  },
  {
    id: 'cofre_cheio',
    nome: 'Cofre Cheio',
    descricao: 'Acumule R$ 1.000 em suas metas financeiras.',
    imagem: '/badges/cofre-cheio.png',
    destino: '/metas',
    acao: 'Continuar poupando'
  }
]

// ========================================
// COMPONENTE DE IMAGEM
// ========================================

function ImagemBadge({ src, nome }) {

  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    setFalhou(false)
  }, [src])

  if (falhou) {

    return (
      <span
        className="badge-icone-alternativo"
        aria-hidden="true"
      >
        🏆
      </span>
    )

  }

  return (
    <img
      src={src}
      alt={nome}
      className="badge-imagem"
      onError={() => setFalhou(true)}
    />
  )

}

// ========================================
// FORMATAR DATA
// ========================================

function formatarData(valor) {

  if (!valor) {
    return 'Data não disponível'
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return 'Data não disponível'
  }

  return data.toLocaleDateString('pt-BR')

}

// ========================================
// PÁGINA BADGES
// ========================================

function Badges() {

  const [conquistas, setConquistas] = useState([])

  const [carregando, setCarregando] = useState(true)

  const [erro, setErro] = useState('')

  const [tentativa, setTentativa] = useState(0)

  // ========================================
  // CARREGAR CONQUISTAS DO USUÁRIO
  // ========================================

  useEffect(() => {

    const controller = new AbortController()

    async function carregarConquistas() {

      setCarregando(true)
      setErro('')

      try {

        const sessao = JSON.parse(
          localStorage.getItem('sessao_oinksafe') || 'null'
        )

        if (!sessao?.id) {

          throw new Error(
            'Sua sessão não foi encontrada. Entre novamente.'
          )

        }

        const resposta = await fetch(

          `http://localhost:3000/api/badges/${encodeURIComponent(sessao.id)}`,

          {
            signal: controller.signal
          }

        )

        if (!resposta.ok) {

          throw new Error(
            'Não foi possível carregar suas conquistas. Tente novamente.'
          )

        }

        const dados = await resposta.json()

        if (!Array.isArray(dados)) {

          throw new Error(
            'A API retornou uma resposta inesperada.'
          )

        }

        if (!controller.signal.aborted) {

          setConquistas(dados)

        }

      } catch (error) {

        if (controller.signal.aborted) {
          return
        }

        setErro(

          error instanceof TypeError

            ? 'Não foi possível conectar à API. Confira se o servidor Node está iniciado.'

            : error.message

        )

      } finally {

        if (!controller.signal.aborted) {

          setCarregando(false)

        }

      }

    }

    carregarConquistas()

    return () => controller.abort()

  }, [tentativa])

  // ========================================
  // CONTADOR DE BADGES CONQUISTADAS
  // ========================================

  const totalConquistadas = catalogo.filter(badge =>

    conquistas.some(
      conquista => conquista.badgeId === badge.id
    )

  ).length

  const porcentagem = Math.round(
    (totalConquistadas / catalogo.length) * 100
  )

  // ========================================
  // INTERFACE
  // ========================================

  return (

    <div className="pagina-badges">

      <Header />

      <main className="badges-container">

        {/* ========================================
            CABEÇALHO
        ======================================== */}

        <div className="badges-cabecalho">

          <div>

            <h1>Medalhas</h1>

            <p className="badges-introducao">
              Cada passo conta na sua organização financeira.
              Conquiste medalhas conforme evolui no OinkSafe.
            </p>

          </div>

          <Link
            to="/"
            className="badges-voltar"
          >
            Voltar ao início
          </Link>

        </div>

        {/* ========================================
            CARREGAMENTO
        ======================================== */}

        {carregando ? (

          <p
            className="badges-aviso"
            role="status"
          >
            Carregando suas conquistas...
          </p>

        ) : erro ? (

          <div
            className="badges-aviso badges-erro"
            role="alert"
          >

            <p>{erro}</p>

            <button
              type="button"
              className="badges-botao"
              onClick={() =>
                setTentativa(valor => valor + 1)
              }
            >
              Tentar novamente
            </button>

          </div>

        ) : (

          <>

            {/* ========================================
                RESUMO DO PROGRESSO
            ======================================== */}

            <section
              className="badges-resumo"
              aria-label="Seu progresso"
            >

              <div className="badges-resumo-texto">

                <h2>Seu progresso</h2>

                <p>
                  Continue registrando suas movimentações,
                  economizando e alcançando suas metas.
                </p>

                <div className="badges-progresso">

                  <div
                    className="badges-progresso-preenchido"
                    style={{
                      width: `${porcentagem}%`
                    }}
                  />

                </div>

                <span className="badges-porcentagem">
                  {porcentagem}% concluído
                </span>

              </div>

              <div className="badges-contador">

                <strong>
                  {totalConquistadas}/{catalogo.length}
                </strong>

                <span>
                  conquistas desbloqueadas
                </span>

              </div>

            </section>

            {/* ========================================
                LISTA DAS 6 BADGES
            ======================================== */}

            <section
              className="badges-grade"
              aria-label="Lista de badges"
            >

              {catalogo.map(badge => {

                const conquista = conquistas.find(
                  item => item.badgeId === badge.id
                )

                const desbloqueada = Boolean(conquista)

                return (

                  <article

                    key={badge.id}

                    className={`badge-card ${
                      desbloqueada

                        ? 'badge-card-conquistada'

                        : 'badge-card-bloqueada'
                    }`}

                  >

                    {/* STATUS */}

                    <span

                      className={`badge-status ${
                        desbloqueada

                          ? 'badge-status-conquistada'

                          : 'badge-status-bloqueada'
                      }`}

                    >

                      {desbloqueada
                        ? '✓ Conquistada'
                        : '🔒 Bloqueada'
                      }

                    </span>

                    {/* IMAGEM */}

                    <div className="badge-imagem-area">

                      <ImagemBadge
                        src={badge.imagem}
                        nome={badge.nome}
                      />

                    </div>

                    {/* NOME */}

                    <h2>
                      {badge.nome}
                    </h2>

                    {/* DESCRIÇÃO */}

                    <p className="badge-descricao">
                      {badge.descricao}
                    </p>

                    {/* DATA OU BOTÃO */}

                    {desbloqueada ? (

                      <p className="badge-data">

                        Conquistada em{' '}

                        {formatarData(
                          conquista.dataConquista
                        )}

                      </p>

                    ) : (

                      <Link
                        to={badge.destino}
                        className="badges-botao"
                      >
                        {badge.acao}
                      </Link>

                    )}

                  </article>

                )

              })}

            </section>

          </>

        )}

      </main>

    </div>

  )

}

export default Badges