import { useState } from 'react'
import './Post.module.css'
import Header from '../Header/Header'
import Main from '../Main/Main'
import InfoArea from '../InfoArea/InfoArea'
import PostsItem from '../PostsItem/PostsItem'
import TextArea from '../assets/TextArea/TextArea'
import style from './Post.module.css'

function Post() {
  const lorem = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.";
  return (
    <>
    <Header/>
    <Main>
      <TextArea type="header">
        asdasdasdasdas
      </TextArea>
      <img src="src\ReleasesCovers\charlixcx_brat.png" alt="Изображение" className={style.PostPicture}/>
      <p className={style.PostDate}>13.06.2008</p>
      <TextArea type = "Header">
        <img src="src\ReleasesCovers\charlixcx_brat.png" alt="Изображение профиля" className={style.PostUserProfile}/>
        <p>Nickname</p>
        <p>@nickname</p>

      </TextArea>
    </Main>
    </>
  );
}

export default Post;
