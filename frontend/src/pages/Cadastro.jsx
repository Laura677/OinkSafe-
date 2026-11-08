
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API_URL from '../services/api'
import './Cadastro.css'

function Cadastro() {

  // =========================
  // ESTADOS
  // =========================

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  const navigate = useNavigate()

  // =========================
  // CADASTRAR USUÁRIO
  // =========================

  async function cadastrarUsuario(event) {

    event.preventDefault()

    // =========================
    // VALIDAÇÕES
    // =========================

    if (
      !nome.trim() ||
      !email.trim() ||
      !senha ||
      !confirmarSenha
    ) {
      alert('Preencha todos os campos!')
      return
    }

    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem.')
      return
    }

    if (senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    // Evita múltiplos cadastros simultâneos.

    if (carregando) {
      return
    }

    setCarregando(true)

    // =========================
    // ENVIA PARA A API
    // =========================

    try {

      const response = await fetch(
        `${API_URL}/api/registrar`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            senha
          })
        }
      )

      const data = await response.json()

      // =========================
      // CADASTRO REALIZADO
      // =========================

      if (response.ok) {

        alert('Cadastro realizado com sucesso!')

        // Depois do cadastro,
        // envia o usuário para o login.

        navigate('/login')

      } else {

        alert(
          data.message ||
          data.error ||
          'Não foi possível realizar o cadastro.'
        )
      }

    } catch (error) {

      console.error('Erro no cadastro:', error)

      alert(
        'Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.'
      )

    } finally {

      setCarregando(false)
    }
  }

  // =========================
  // INTERFACE
  // =========================

  return (

    <main className="cadastro-page">

      <div className="cadastro-card">

        {/* NOME DO SISTEMA */}

        <h1>OinkSafe</h1>

        {/* TÍTULO */}

        <h2>Criar conta</h2>

        <p className="cadastro-subtitulo">
          Crie sua conta para começar a organizar suas finanças
        </p>

        {/* FORMULÁRIO */}

        <form onSubmit={cadastrarUsuario}>

          {/* NOME */}

          <label htmlFor="nome">
            Nome
          </label>

          <input
            id="nome"
            type="text"
            value={nome}
            onChange={event =>
              setNome(event.target.value)
            }
            placeholder="Digite seu nome"
            autoComplete="name"
            required
            disabled={carregando}
          />

          {/* EMAIL */}

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={event =>
              setEmail(event.target.value)
            }
            placeholder="Digite seu email"
            autoComplete="email"
            required
            disabled={carregando}
          />

          {/* SENHA */}

          <label htmlFor="senha">
            Senha
          </label>

          <input
            id="senha"
            type="password"
            value={senha}
            onChange={event =>
              setSenha(event.target.value)
            }
            placeholder="Crie uma senha"
            autoComplete="new-password"
            minLength={6}
            required
            disabled={carregando}
          />

          {/* CONFIRMAR SENHA */}

          <label htmlFor="confirmarSenha">
            Confirmar senha
          </label>

          <input
            id="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={event =>
              setConfirmarSenha(event.target.value)
            }
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            minLength={6}
            required
            disabled={carregando}
          />

          {/* BOTÃO */}

          <button
            type="submit"
            disabled={carregando}
          >
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>

        </form>

        {/* LINK PARA LOGIN */}

        <p className="cadastro-login">

          Já tem uma conta?{' '}

          <Link to="/login">
            Entrar
          </Link>

        </p>

      </div>

    </main>
  )
}

export default Cadastro
