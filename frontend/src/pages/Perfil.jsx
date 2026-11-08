
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import API_URL from '../services/api'
import './Perfil.css'

function Perfil() {
  const navigate = useNavigate()
  const inputFotoRef = useRef(null)

  const [usuario, setUsuario] = useState(null)

  const [resumo, setResumo] = useState({
    saldo: 0,
    total_receitas: 0,
    total_despesas: 0
  })

  const [notificacoes, setNotificacoes] = useState([])
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)

  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false)
  const [nomeEditado, setNomeEditado] = useState('')
  const [fotoPerfil, setFotoPerfil] = useState(null)
  const [fotoEditada, setFotoEditada] = useState(null)

  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erroEdicao, setErroEdicao] = useState('')

  // ========================================
  // CARREGAR DADOS DO USUÁRIO
  // ========================================

  useEffect(() => {
    let ativo = true

    async function carregarPerfil() {
      const sessaoSalva = localStorage.getItem('sessao_oinksafe')

      if (!sessaoSalva) {
        navigate('/login')
        return
      }

      let sessao

      try {
        sessao = JSON.parse(sessaoSalva)
      } catch {
        navigate('/login')
        return
      }

      if (!sessao?.id) {
        navigate('/login')
        return
      }

      setUsuario(sessao)
      setNomeEditado(sessao.nome || '')

      const fotoSalva = localStorage.getItem(
        `oinksafe_foto_perfil_${sessao.id}`
      )

      if (fotoSalva) {
        setFotoPerfil(fotoSalva)
      }

      try {
        const [respostaResumo, respostaMetas] = await Promise.all([
          fetch(`${API_URL}/api/dashboard/${sessao.id}`),
          fetch(`${API_URL}/api/metas/${sessao.id}`)
        ])

        if (!respostaResumo.ok) {
          throw new Error('Não foi possível carregar o resumo.')
        }

        if (!respostaMetas.ok) {
          throw new Error('Não foi possível carregar as metas.')
        }

        const dadosResumo = await respostaResumo.json()
        const metas = await respostaMetas.json()

        if (!ativo) return

        setResumo(dadosResumo)

        const avisos = []

        const receitas = Number(dadosResumo.total_receitas) || 0
        const despesas = Number(dadosResumo.total_despesas) || 0
        const saldo = Number(dadosResumo.saldo) || 0

        // ========================================
        // NOTIFICAÇÕES FINANCEIRAS
        // ========================================

        if (saldo < 0) {
          avisos.push(
            'Seu saldo está negativo! Revise suas despesas.'
          )
        }

        if (despesas > receitas) {
          avisos.push(
            'Seus gastos estão maiores que seus ganhos! Você está gastando mais do que está ganhando.'
          )
        }

        if (receitas > 0 && despesas === receitas) {
          avisos.push(
            'Atenção! Você gastou tudo que ganhou, tudinho! Não sobrou nada para o betinha!'
          )
        }

        if (receitas === 0 && despesas === 0) {
          avisos.push(
            'Você ainda não tem nenhuma movimentação registrada! Está ocultando seus fundos de mim?'
          )
        }

        // Evita mensagens duplicadas de 2x e 3x.
        // Também evita comparar ganhos com gastos zerados.

        if (despesas > 0 && saldo > 0) {
          if (receitas >= despesas * 3) {
            avisos.push(
              'TRÊS VEZES MAIS? Você está ganhando três vezes mais que gastando? Meus parabéns!!! Um porquinho cheio é um porquinho feliz.'
            )
          } else if (receitas >= despesas * 2) {
            avisos.push(
              'Wow você está ganhando mais que o dobro do que gasta!'
            )
          }
        }

        if (saldo >= 8000) {
          avisos.push(
            'MAIS DE 8 MIL DE KI? Quer dizer Money!!! Você é uma máquina?'
          )
        }

        if (saldo === 0) {
          avisos.push(
            'Seu saldo está zerado, vamos registrar seus ganhos?'
          )
        }

        // ========================================
        // NOTIFICAÇÕES DAS METAS
        // ========================================

        if (Array.isArray(metas)) {
          metas.forEach(meta => {
            const valorAtual = Number(meta.valor_atual) || 0
            const valorAlvo = Number(meta.valor_alvo) || 0

            if (valorAlvo <= 0) return

            const progresso = (valorAtual / valorAlvo) * 100

            if (progresso >= 100) {
              avisos.push(
                `Parabéns! Você concluiu a meta "${meta.titulo}"!`
              )
            } else if (progresso >= 80) {
              avisos.push(
                `Você está quase lá! A meta "${meta.titulo}" já alcançou ${Math.floor(progresso)}% do objetivo.`
              )
            } else if (progresso >= 50) {
              avisos.push(
                `Você chegou aos 50% da meta "${meta.titulo}"!`
              )
            }
          })
        }

        setNotificacoes(avisos)

      } catch (erro) {
        console.error('Erro ao carregar perfil:', erro)

        if (ativo) {
          setMensagem(
            'Não foi possível carregar todas as informações financeiras.'
          )
        }
      }
    }

    carregarPerfil()

    return () => {
      ativo = false
    }
  }, [navigate])

  // ========================================
  // FORMATAR DINHEIRO
  // ========================================

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // ========================================
  // ABRIR EDIÇÃO
  // ========================================

  function abrirEditarPerfil() {
    setNomeEditado(usuario?.nome || '')
    setFotoEditada(fotoPerfil)
    setErroEdicao('')
    setMostrarEditarPerfil(true)
  }

  // ========================================
  // ESCOLHER FOTO
  // ========================================

  function selecionarFoto(evento) {
    const arquivo = evento.target.files?.[0]

    if (!arquivo) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      setErroEdicao(
        'Escolha uma imagem PNG, JPG ou WEBP.'
      )
      return
    }

    // Limite reduzido porque a foto será salva
    // no localStorage do navegador.

    if (arquivo.size > 1024 * 1024) {
      setErroEdicao(
        'A imagem deve ter no máximo 1 MB.'
      )
      return
    }

    setErroEdicao('')

    const leitor = new FileReader()

    leitor.onload = () => {
      setFotoEditada(leitor.result)
    }

    leitor.onerror = () => {
      setErroEdicao('Não foi possível carregar a imagem.')
    }

    leitor.readAsDataURL(arquivo)
  }

  // ========================================
  // SALVAR PERFIL
  // ========================================

  async function salvarPerfil(evento) {
    evento.preventDefault()

    if (!usuario?.id || salvando) return

    const nome = nomeEditado.trim()

    if (nome.length < 2 || nome.length > 100) {
      setErroEdicao(
        'O nome deve ter entre 2 e 100 caracteres.'
      )
      return
    }

    setSalvando(true)
    setErroEdicao('')
    setMensagem('')

    try {
      const resposta = await fetch(
        `${API_URL}/api/usuarios/${usuario.id}/perfil`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nome })
        }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(
          dados.message || 'Não foi possível salvar o perfil.'
        )
      }

      const usuarioAtualizado = {
        ...usuario,
        ...dados.usuario
      }

      // Atualiza o nome na sessão do OinkSafe.

      localStorage.setItem(
        'sessao_oinksafe',
        JSON.stringify(usuarioAtualizado)
      )

      setUsuario(usuarioAtualizado)

      // Salva a foto apenas neste navegador.

      const chaveFoto = `oinksafe_foto_perfil_${usuario.id}`

      try {
        if (fotoEditada) {
          localStorage.setItem(chaveFoto, fotoEditada)
        } else {
          localStorage.removeItem(chaveFoto)
        }

        setFotoPerfil(fotoEditada)

        setMensagem('Perfil atualizado com sucesso!')

      } catch (erroFoto) {
        console.error('Erro ao salvar foto:', erroFoto)

        setMensagem(
          'Nome atualizado! Não foi possível salvar a foto neste navegador.'
        )
      }

      setMostrarEditarPerfil(false)

    } catch (erro) {
      console.error('Erro ao salvar perfil:', erro)
      setErroEdicao(erro.message)

    } finally {
      setSalvando(false)
    }
  }

  // ========================================
  // LOGOUT
  // ========================================

  function fazerLogout() {
    localStorage.removeItem('sessao_oinksafe')
    navigate('/login')
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <div>
      <Header />

      <main className="perfil-page">

        {/* TÍTULO */}

        <section className="perfil-titulo">
          <h1>Meu perfil</h1>
          <p>Gerencie suas informações e preferências</p>
        </section>

        {/* USUÁRIO */}

        <section className="perfil-usuario">
          <div className="perfil-avatar">
            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt="Foto de perfil"
                className="perfil-avatar-imagem"
              />
            ) : (
              usuario?.nome?.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          <div className="perfil-dados-usuario">
            <h2>{usuario?.nome || 'Usuário'}</h2>
            <p>{usuario?.email || 'E-mail não disponível'}</p>
          </div>
        </section>

        {/* MENSAGEM */}

        {mensagem && (
          <p className="perfil-mensagem" role="status">
            {mensagem}
          </p>
        )}

        {/* RESUMO */}

        <section className="perfil-resumo">
          <h2>Resumo da conta</h2>

          <div className="perfil-cards">
            <div className="perfil-card">
              <span>Saldo atual</span>
              <strong className="valor-verde">
                {formatarMoeda(resumo.saldo)}
              </strong>
            </div>

            <div className="perfil-card">
              <span>Total de receitas</span>
              <strong className="valor-verde">
                {formatarMoeda(resumo.total_receitas)}
              </strong>
            </div>

            <div className="perfil-card">
              <span>Total de despesas</span>
              <strong className="valor-roxo">
                {formatarMoeda(resumo.total_despesas)}
              </strong>
            </div>
          </div>
        </section>

        {/* CONFIGURAÇÕES */}

        <section className="perfil-configuracoes">
          <h2>Configurações</h2>

          <button
            type="button"
            onClick={abrirEditarPerfil}
          >
            Editar perfil
          </button>

          <button
            type="button"
            onClick={() => setMostrarNotificacoes(true)}
          >
            Notificações
          </button>

          <button
            type="button"
            onClick={() => navigate('/metas')}
          >
            Metas
          </button>

          <button
            type="button"
            onClick={() => navigate('/badges')}
          >
            Minhas conquistas
          </button>

          <button
            type="button"
            className="btn-sair"
            onClick={fazerLogout}
          >
            Sair da conta
          </button>
        </section>

        {/* ========================================
            MODAL DE NOTIFICAÇÕES
        ======================================== */}

        {mostrarNotificacoes && (
          <>
            <div
              className="perfil-modal-fundo"
              onClick={() => setMostrarNotificacoes(false)}
            />

            <section
              className="perfil-notificacoes"
              role="dialog"
              aria-modal="true"
              aria-label="Notificações"
            >
              <button
                type="button"
                className="btn-fechar"
                aria-label="Fechar notificações"
                onClick={() => setMostrarNotificacoes(false)}
              >
                ×
              </button>

              <h2>Notificações</h2>

              {notificacoes.length > 0 ? (
                notificacoes.map((aviso, index) => (
                  <p key={index}>
                    {aviso}
                  </p>
                ))
              ) : (
                <p>
                  Você não tem notificações no momento.
                </p>
              )}
            </section>
          </>
        )}

        {/* ========================================
            MODAL DE EDITAR PERFIL
        ======================================== */}

        {mostrarEditarPerfil && (
          <>
            <div
              className="perfil-modal-fundo"
              onClick={() => {
                if (!salvando) {
                  setMostrarEditarPerfil(false)
                }
              }}
            />

            <section
              className="perfil-editar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-editar-perfil"
            >
              <button
                type="button"
                className="btn-fechar"
                aria-label="Fechar edição"
                disabled={salvando}
                onClick={() => setMostrarEditarPerfil(false)}
              >
                ×
              </button>

              <h2 id="titulo-editar-perfil">
                Editar perfil
              </h2>

              <p className="perfil-editar-descricao">
                Personalize suas informações no OinkSafe.
              </p>

              <form onSubmit={salvarPerfil}>
                <div className="perfil-editar-foto">
                  <div className="perfil-avatar perfil-avatar-preview">
                    {fotoEditada ? (
                      <img
                        src={fotoEditada}
                        alt="Prévia da foto"
                        className="perfil-avatar-imagem"
                      />
                    ) : (
                      nomeEditado.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>

                  <input
                    ref={inputFotoRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={selecionarFoto}
                    className="perfil-input-arquivo"
                  />

                  <button
                    type="button"
                    className="perfil-btn-foto"
                    onClick={() => inputFotoRef.current?.click()}
                    disabled={salvando}
                  >
                    Escolher foto
                  </button>

                  {fotoEditada && (
                    <button
                      type="button"
                      className="perfil-btn-remover-foto"
                      onClick={() => setFotoEditada(null)}
                      disabled={salvando}
                    >
                      Remover foto
                    </button>
                  )}

                  <small>
                    PNG, JPG ou WEBP de até 1 MB.
                  </small>
                </div>

                <label
                  className="perfil-label"
                  htmlFor="perfil-nome"
                >
                  Nome
                </label>

                <input
                  id="perfil-nome"
                  type="text"
                  value={nomeEditado}
                  onChange={evento => setNomeEditado(evento.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  disabled={salvando}
                  className="perfil-input"
                />

                <label
                  className="perfil-label"
                  htmlFor="perfil-email"
                >
                  E-mail
                </label>

                <input
                  id="perfil-email"
                  type="email"
                  value={usuario?.email || ''}
                  disabled
                  className="perfil-input perfil-input-desabilitado"
                />

                <small className="perfil-ajuda">
                  O e-mail não pode ser alterado nesta versão.
                </small>

                {erroEdicao && (
                  <p className="perfil-erro" role="alert">
                    {erroEdicao}
                  </p>
                )}

                <div className="perfil-editar-acoes">
                  <button
                    type="button"
                    className="perfil-btn-cancelar"
                    disabled={salvando}
                    onClick={() => setMostrarEditarPerfil(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="perfil-btn-salvar"
                    disabled={salvando}
                  >
                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default Perfil
