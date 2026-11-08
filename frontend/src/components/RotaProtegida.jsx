import {Navigate} from 'react-router-dom';

function RotaProtegida({children}){
    const sessao = localStorage.getItem('sessao_oinksafe')

if (!sessao){
    return <Navigate to="/login"/>
}
return children

}

export default RotaProtegida
