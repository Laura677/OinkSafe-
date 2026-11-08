
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import './Header.css'

import porquinho from '../imgs-oinksafe/porquinho.png'
import iconeNotificacao from '../imgs-oinksafe/icone-notificacao.png'
import iconePerfil from '../imgs-oinksafe/icone-perfil.png'

function Header() {
  const navigate = useNavigate()

  // Controla a abertura do modal.
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false)

  // Guarda os avisos que serão exibidos no modal.
  const [notificacoes, setNotificacoes] = useState([])

  // Controla a mensagem de carregamento.
  const [carregando, setCarregando] = useState(false)

  // Busca a sessão do usuário.
  const sessao = JSON.parse(
    localStorage.getItem('sessao_oinksafe')
  )

  // Abre o Perfil normalmente.
  function irParaPerfil() {
    if (sessao) {
      navigate('/perfil')
    } else {
      navigate('/login')
    }
  }

  // Busca os avisos e abre o modal sem sair da tela atual.
  async function abrirNotificacoes() {
    if (!sessao) {
      navigate('/login')
      return
    }

    setMostrarNotificacoes(true)
    setCarregando(true)

    const avisos = []

    try {
      // Busca o resumo financeiro do usuário.
      const respostaDashboard = await fetch(
        `http://localhost:3000/api/dashboard/${sessao.id}`
      )

      if (!respostaDashboard.ok) {
        throw new Error('Não foi possível carregar o resumo financeiro.')
      }

      const data = await respostaDashboard.json()

      const receitas = Number(data.total_receitas) || 0
      const despesas = Number(data.total_despesas) || 0
      const saldo = Number(data.saldo) || 0

      // Alerta 1: saldo negativo.
      if (saldo < 0) {
        avisos.push('Seu saldo está negativo! Revise suas despesas.')
      }

      // Alerta 2: despesas maiores que receitas.
      if (despesas > receitas) {
        avisos.push(
          'Seus gastos estão maiores que seus ganhos! Você está gastando mais do que está ganhando.'
        )
      }

      // Alerta 3: gastou tudo que recebeu.
      if (receitas > 0 && despesas === receitas) {
        avisos.push(
          'Atenção! Você gastou tudo que ganhou, tudinho! Não sobrou nada para o betinha!'
        )
      }

      // Alerta 4: nenhuma movimentação financeira.
      if (receitas === 0 && despesas === 0) {
        avisos.push(
          'Você ainda não tem nenhuma movimentação registrada! Está ocultando seus fundos de mim?'
        )
      }

      // Alerta 5: receitas pelo menos duas vezes maiores que despesas.
      if (saldo > 0 && receitas >= despesas * 2) {
        avisos.push(
          'Wow, você está ganhando mais que o dobro do que gasta!'
        )
      }

      // Alerta 6: receitas pelo menos três vezes maiores que despesas.
      if (saldo > 0 && receitas >= despesas * 3) {
        avisos.push(
          'TRÊS VEZES MAIS? Você está ganhando três vezes mais que gastando? Meus parabéns!!! Um porquinho cheio é um porquinho feliz.'
        )
      }

      // Alerta 7: saldo de pelo menos R$ 8.000.
      if (saldo >= 8000) {
        avisos.push(
          'MAIS DE 8 MIL DE KI? Quer dizer Money!!! Você é uma máquina?'
        )
      }

      // Alerta 8: saldo zerado.
      if (saldo === 0) {
        avisos.push(
          'Seu saldo está zerado, vamos registrar seus ganhos?'
        )
      }

      // Busca as metas do usuário.
      const respostaMetas = await fetch(
        `http://localhost:3000/api/metas/${sessao.id}`
      )

      if (!respostaMetas.ok) {
        throw new Error('Não foi possível carregar as metas.')
      }

      const metas = await respostaMetas.json()

      // Cria os avisos de acordo com o progresso de cada meta.
      metas.forEach(meta => {
        const valorAtual = Number(meta.valor_atual) || 0
        const valorAlvo = Number(meta.valor_alvo) || 0

        if (valorAlvo <= 0) {
          return
        }

        const progresso = (valorAtual / valorAlvo) * 100

        // Meta concluída.
        if (progresso >= 100) {
          avisos.push(
            `Parabéns! Você concluiu a meta "${meta.titulo}"!`
          )
        }

        // Meta com pelo menos 80% de progresso.
        else if (progresso >= 80) {
          avisos.push(
            `Você está quase lá! A meta "${meta.titulo}" já alcançou ${Math.floor(progresso)}% do objetivo.`
          )
        }

        // Meta com pelo menos 50% de progresso.
        else if (progresso >= 50) {
          avisos.push(
            `Você chegou aos 50% da meta "${meta.titulo}"! Continue assim!`
          )
        }
      })

      // Atualiza a lista somente depois de buscar os dados.
      setNotificacoes(avisos)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)

      setNotificacoes([
        'Não foi possível carregar as notificações. Tente novamente.'
      ])
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <header className="header">
        <div className="header-container">

          {/* Logo do OinkSafe. */}
          <div className="header-logo">
            <Link to="/" className="header-logo-link">
              <img
                src={porquinho}
                alt="Logo OinkSafe"
                className="header-logo-imagem"
              />
            </Link>
          </div>

          {/* Links de navegação. */}
          <nav className="header-nav">
            <Link to="/">Início</Link>
            <Link to="/metas">Metas</Link>
            <Link to="/ganhos">Ganhos</Link>
            <Link to="/gastos">Gastos</Link>
            <Link to="/badges">Medalhas</Link>
            {/** COLOCAR SOBRE DEPOIS DE CONSTRUIR PAGINA DE VOLTA */}
          {/*  <Link to="/sobre">Sobre</Link>*/}
          </nav>

          {/* Ícones de ações. */}
          <div className="header-acoes">

            {/* O sino abre o modal na tela atual. */}
            <button
              className="header-icon"
              onClick={abrirNotificacoes}
              title="Notificações"
              type="button"
            >
              <img
                src={iconeNotificacao}
                alt="Notificações"
                className="header-icon-imagem"
              />
            </button>

            {/* Abre a página Perfil. */}
            <button
              className="header-icon"
              onClick={irParaPerfil}
              title="Perfil"
              type="button"
            >
              <img
                src={iconePerfil}
                alt="Perfil"
                className="header-icon-imagem"
              />
            </button>

          </div>
        </div>
      </header>

      {/* O modal fica fora do header para cobrir a tela toda. */}
      {mostrarNotificacoes && (
        <div
          className="header-notificacoes-fundo"
          onClick={() => setMostrarNotificacoes(false)}
        >
          <section
            className="header-notificacoes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-notificacoes"
            onClick={evento => evento.stopPropagation()}
          >
            <button
              className="header-notificacoes-fechar"
              type="button"
              title="Fechar notificações"
              onClick={() => setMostrarNotificacoes(false)}
            >
              ×
            </button>

            <h2 id="titulo-notificacoes">Notificações</h2>

            {carregando ? (
              <p>Carregando notificações...</p>
            ) : notificacoes.length > 0 ? (
              notificacoes.map((mensagem, index) => (
                <p key={index} className="header-notificacao-item">
                  {mensagem}
                </p>
              ))
            ) : (
              <p>Você não tem notificações no momento.</p>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default Header
