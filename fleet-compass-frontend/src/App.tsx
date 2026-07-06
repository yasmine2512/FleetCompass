import { Route,Routes} from 'react-router-dom'
import './App.css'
import FleetCompassApp from './FleetCompassApp'
import FleetCompassAuth from './FleetCompassAuth'
import ForgotPassword from './ForgotPassword'
import UpdatePassword from './UpdatePassword'
import { ConfirmProcessing } from './ConfirmProcessing'
import { AppLayout } from './Layout'
import { NotFound } from './NotFound'
function App() {

  return (
    <>
  <Routes>
    <Route path='/' element={<FleetCompassAuth />}/>
    <Route path='/App' element={
      <AppLayout>
      <FleetCompassApp />
      </AppLayout>
      }/>
    <Route path='/forgot-password' element={<ForgotPassword />}/>
    <Route path='/reset-password' element={<UpdatePassword />}/>
    <Route path='/confirm-processing' element={<ConfirmProcessing />}/>
    <Route path='*' element={<NotFound/>}/>
  </Routes>
    </>
  )
}

export default App
