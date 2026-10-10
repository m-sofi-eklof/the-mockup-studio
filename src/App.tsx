import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { TerminalPage } from './pages/TerminalPage'
import { VSCodePage } from './pages/VSCodePage'
import { ClaudePage } from './pages/ClaudePage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/terminal" replace />} />
          <Route path="/terminal" element={<TerminalPage />} />
          <Route path="/vscode" element={<VSCodePage />} />
          <Route path="/claude" element={<ClaudePage />} />
          <Route path="*" element={<Navigate to="/terminal" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
