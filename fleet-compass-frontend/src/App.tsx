import { Route,Routes} from 'react-router-dom'
import './App.css'
import FleetCompassApp from './FleetCompassApp'
import FleetCompassAuth from './Fleetcompassauth'
import ForgotPassword from './ForgotPassword'
import ConfirmEmail from './ConfirmEmail'
function App() {

  return (
    <>
  <Routes>
    <Route path='/' element={<FleetCompassAuth />}/>
    <Route path='/App' element={<FleetCompassApp />}/>
    <Route path='/confirm-email' element={<ConfirmEmail/>}/>
    <Route path='/forgot-password' element={<ForgotPassword />}/>
  </Routes>
    </>
  )
}

export default App
