import Header from '../components/Header'
import './Sobre.css'

function Sobre() {
  return (
    <div>
      <Header />

      <main className="sobre-page">

        <div className="sobre-conteudo">
          <h1>Sobre o OinkSafe</h1>

          <p>
            O OinkSafe é uma plataforma criada para ajudar no controle
            financeiro de forma simples e organizada.
          </p>

          <div className="em-construcao">
            <h2>Em construção</h2>
            <p>Novidades serão adicionadas em breve.</p>
          </div>
        </div>

      </main>
    </div>
  )
}

export default Sobre