import { useState } from 'react'

import './App.css'
import FleetCompassApp from './FleetCompassApp'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
        <FleetCompassApp></FleetCompassApp>
    </>
  )
}

export default App
