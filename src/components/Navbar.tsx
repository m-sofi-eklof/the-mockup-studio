import { NavLink } from 'react-router-dom'
import { Code, Palette, Sparkles, SquareTerminal } from 'lucide-react'

const links = [
  { to: '/terminal', label: 'Terminal', icon: SquareTerminal },
  { to: '/vscode', label: 'VS Code', icon: Code },
  { to: '/claude', label: 'Claude', icon: Sparkles },
]

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="brand">
        <Palette size={18} /> Theme Mockup Studio
      </div>
      <div className="nav-links">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
