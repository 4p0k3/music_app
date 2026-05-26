import { useState } from 'react'
import './Home.module.css'
import Header from '../Header/Header'
import Main from '../Main/Main'
import InfoArea from '../InfoArea/InfoArea'
import PostsItem from '../PostsItem/PostsItem'
import ReleasesItem from '../ReleasesItem/ReleasesItem'
import Footer from '../assets/Footer/Footer'
function Home() {
  const lorem = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam aliquid odio ab, officiis adipisci accusamus ipsam itaque voluptatum quae odit commodi similique repellendus eos saepe! Nobis assumenda quisquam mollitia ipsa!";
  return (
    <>
    <Header/>
    <Main>
      <InfoArea label="Ожидаемые релизы"> 
            <ReleasesItem cover="src\ReleasesCovers\2hollis_star.jpg" artist="2hollis" name="star" genre = "EDM, hyperpop" />
            <ReleasesItem cover="src\ReleasesCovers\charlixcx_brat.png" artist="Charli XCX" name = "brat" genre = "electropop, dance-pop, hyperpop"/>
            <ReleasesItem cover="src\ReleasesCovers\ogbuda_freerio2.jpg" artist="OG Buda" name="FREERIO 2" genre = "Detroit-rap"/> 
            <ReleasesItem cover="src\ReleasesCovers\PinkPantheress_Fancy_That.png" artist="PinkPantheress" name="Fancy That" genre="UK garage, jungle, dance-pop"/>
        </InfoArea>
        <InfoArea label="Недавние посты" > 
            <PostsItem content={lorem} cover='https://placehold.co/1000x2000' type = "side"/> 
            <PostsItem content={lorem} cover='https://placehold.co/500x600' type = "side"/> 
            <PostsItem content={lorem}/>
            <PostsItem content={lorem} cover='https://placehold.co/3000x600' type = "side"/> 
            <PostsItem content={lorem} cover='https://placehold.co/600x500' type = "side"/>     
        </InfoArea> 
            
        <InfoArea label="Лучшее за месяц" >
            <PostsItem content={lorem} cover='https://placehold.co/1000x2000' type = "main"/> 
            <PostsItem content={lorem} cover='https://placehold.co/1000x2000' type = "main"/> 
            <PostsItem content={lorem} cover='https://placehold.co/1000x2000' type = "main"/> 
            <PostsItem content={lorem} cover='https://placehold.co/1000x2000' type = "main"/> 
            <PostsItem content={lorem} cover='https://placehold.co/1000x2000' type = "main"/> 
            <PostsItem content={lorem} cover='https://placehold.co/400x300' type = "main"/> 
        </InfoArea>
    </Main>
    <Footer/>
    </>
  )
}

export default Home;
