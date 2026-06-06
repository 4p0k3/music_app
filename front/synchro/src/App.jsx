import { useState } from 'react';
import { HashRouter, Routes, Route, BrowserRouter } from 'react-router-dom';
import './App.css';
import Home from './Home/Home';
import AllPosts from './AllPosts/AllPosts';
import Post from './Post/Post';
import User from './User/User';
import Admin from './Admin/Admin';


function App() {
  
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/AllPosts" element={<AllPosts/>}/>
          <Route path="/Post/:id" element={<Post postImage="https://placehold.co/500x500" userPfp="src\ReleasesCovers\charlixcx_brat.png" nickname="nickname" username="username" header="header" content="nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger nigger " date="13.06.2008"/>}/>
          <Route path="/User/:id"element={<User />}/>
          <Route path="/Admin"element={<Admin/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
