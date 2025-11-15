import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import IDE from './pages/IDE'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<IDE />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

