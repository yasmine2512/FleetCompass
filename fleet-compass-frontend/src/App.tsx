import { useState } from 'react'
import { Route,Routes} from 'react-router-dom'
import './App.css'
import FleetCompassApp from './FleetCompassApp'
import FleetCompassAuth from './Fleetcompassauth'
function App() {

  return (
    <>
  <Routes>
    <Route path='/' element={<FleetCompassAuth />}/>
    <Route path='/App' element={<FleetCompassApp />}/>
  </Routes>
    </>
  )
}

export default App
