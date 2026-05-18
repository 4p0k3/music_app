import { useState } from 'react'
import './Allposts.module.css'
import Header from '../Header/Header'
import Main from '../Main/Main'
import InfoArea from '../InfoArea/InfoArea'
import PostsItem from '../PostsItem/PostsItem'

function AllPosts() {
  const lorem = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.";
  return (
    <>
    <Header/>
    <Main>
      <InfoArea label='Все посты'>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>
        <PostsItem cover="https://placehold.co/500x500" header='header' nickname='nickname' date='13.06.2008' content={lorem} type='main'/>

      </InfoArea>
    </Main>
    </>
  );
}

export default AllPosts;
