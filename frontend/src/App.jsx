import RotaProtegida from './components/RotaProtegida'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Gastos from './pages/Gastos'
import Metas from './pages/Metas'
import Perfil from './pages/Perfil'
import Login from './pages/Login'
import Sobre from './pages/Sobre'
import Cadastro from './pages/Cadastro'
import Ganhos from './pages/Ganhos'
import Badges from './pages/Badges'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RotaProtegida>
              <Home />
            </RotaProtegida>
          }
        />

        <Route
          path="/gastos"
          element={
            <RotaProtegida>
              <Gastos />
            </RotaProtegida>
          }
        />

        <Route
          path="/metas"
          element={
            <RotaProtegida>
              <Metas />
            </RotaProtegida>
          }
        />

        <Route
          path="/perfil"
          element={
            <RotaProtegida>
              <Perfil />
            </RotaProtegida>
          }
        />

        <Route
          path="/ganhos"
          element={
            <RotaProtegida>
              <Ganhos />
            </RotaProtegida>
          }
        />

        <Route
          path="/badges"
          element={
            <RotaProtegida>
              <Badges />
            </RotaProtegida>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App