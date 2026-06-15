import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './Header/Header.mob.css'
import './Main/Main.mob.css'
import './Footer/Footer.mob.css'
import './Post/Post.mob.css'
import './User/User.mob.css'
import './Admin/Admin.mob.css'
import './Home/Home.mob.css'
import './AllPosts/AllPosts.mob.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
