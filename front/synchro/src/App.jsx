import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Home/Home';
import AllPosts from './AllPosts/AllPosts';
import Post from './Post/Post';
import User from './User/User';
import Admin from './Admin/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/AllPosts" element={<AllPosts />} />
        <Route path="/Post/:id" element={<Post />} />
        <Route path="/User/:id" element={<User />} />
        <Route path="/Admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
