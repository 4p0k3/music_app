import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Home/Home';
import AllPosts from './AllPosts/AllPosts';
import Post from './Post/Post';


function App() {
  
  return (
    <>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/AllPosts" element={<AllPosts/>}/>
        <Route path="/Post" element={<Post/>}/>
      </Routes>
    </HashRouter>
    
    </>
  )
}

export default App;
