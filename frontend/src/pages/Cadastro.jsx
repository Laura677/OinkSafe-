import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Cadastro.css'

function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

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
      !nome ||
      !email ||
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
      alert(
        'A senha deve ter pelo menos 6 caracteres.'
      )

      return
    }


    try {
      const response = await fetch(
        'http://localhost:3000/api/registrar',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            nome,
            email,
            senha
          })
        }
      )


      const data = await response.json()


      // =========================
      // CADASTRO REALIZADO
      // =========================

      if (response.ok) {

        alert(
          'Cadastro realizado com sucesso!'
        )


        // Depois do cadastro,
        // envia o usuário para o login.
        navigate('/login')

      } else {

        alert(
          data.message ||
          'Não foi possível realizar o cadastro.'
        )

      }

    } catch (error) {

      console.error(
        'Erro no cadastro:',
        error
      )


      alert(
        'Erro ao conectar com o servidor.'
      )
    }
  }


  return (
    <main className="cadastro-page">

      <div className="cadastro-card">


        {/* NOME DO SISTEMA */}

        <h1>
          OinkSafe
        </h1>


        {/* TÍTULO */}

        <h2>
          Criar conta
        </h2>


        <p className="cadastro-subtitulo">
          Crie sua conta para começar a organizar suas finanças
        </p>


        {/* FORMULÁRIO */}

        <form
          onSubmit={
            cadastrarUsuario
          }
        >


          {/* NOME */}

          <label htmlFor="nome">
            Nome
          </label>

          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(event) =>
              setNome(
                event.target.value
              )
            }
            placeholder="Digite seu nome"
            autoComplete="name"
            required
          />


          {/* EMAIL */}

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="Digite seu email"
            autoComplete="email"
            required
          />


          {/* SENHA */}

          <label htmlFor="senha">
            Senha
          </label>

          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(event) =>
              setSenha(
                event.target.value
              )
            }
            placeholder="Crie uma senha"
            autoComplete="new-password"
            required
          />


          {/* CONFIRMAR SENHA */}

          <label htmlFor="confirmarSenha">
            Confirmar senha
          </label>

          <input
            id="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={(event) =>
              setConfirmarSenha(
                event.target.value
              )
            }
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            required
          />


          {/* BOTÃO */}

          <button type="submit">
            Criar conta
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