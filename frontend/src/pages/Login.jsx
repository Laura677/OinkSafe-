
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API_URL from '../services/api'
import './Login.css'

function Login() {

  // =========================
  // ESTADOS
  // =========================

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  const navigate = useNavigate()

  // =========================
  // FAZER LOGIN
  // =========================

  async function fazerLogin(event) {
    event.preventDefault()

    // Validação simples
    if (!email || !senha) {
      alert('Preencha email e senha!')
      return
    }

    if (carregando) return

    setCarregando(true)

    try {

      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email: email.trim(),
            senha
          })
        }
      )

      const data = await response.json()

      // =========================
      // LOGIN CORRETO
      // =========================

      if (response.ok) {

        // Salva somente os dados necessários
        // para identificar o usuário logado

        localStorage.setItem(
          'sessao_oinksafe',
          JSON.stringify({
            id: data.usuario.id,
            nome: data.usuario.nome,
            email: data.usuario.email
          })
        )

        // Depois do login,
        // vai para a Home

        navigate('/')

      } else {

        alert(
          data.message ||
          'Email ou senha inválidos.'
        )
      }

    } catch (error) {

      console.error(
        'Erro no login:',
        error
      )

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
    <main className="login-page">

      <div className="login-card">

        {/* LOGO / NOME */}

        <h1>OinkSafe</h1>

        <h2>Entrar</h2>

        <p className="login-subtitulo">
          Acesse sua conta para continuar
        </p>

        {/* FORMULÁRIO */}

        <form onSubmit={fazerLogin}>

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Digite seu email"
            autoComplete="email"
            required
            disabled={carregando}
          />

          <label htmlFor="senha">
            Senha
          </label>

          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(event) =>
              setSenha(event.target.value)
            }
            placeholder="Digite sua senha"
            autoComplete="current-password"
            required
            disabled={carregando}
          />

          <button
            type="submit"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

        </form>

        {/* LINK PARA CADASTRO */}

        <p className="login-cadastro">

          Não tem uma conta?{' '}

          <Link to="/cadastro">
            Cadastre-se
          </Link>

        </p>

      </div>

    </main>
  )
}

export default Login
