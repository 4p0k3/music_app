import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import { getPosts } from '../api';

import Header from '../Header/Header';
import Main from '../Main/Main';
import InfoArea from '../InfoArea/InfoArea';
import PostsItem from '../PostsItem/PostsItem';
import Footer from '../Footer/Footer';

function AllPosts() {

    const [posts, setPosts] = useState([]);
  //SEARCH
    const [searchParams] = useSearchParams();
    const genre = searchParams.get("genre");
    const search = searchParams.get("search");
    const artist = searchParams.get("artist");
    const release = searchParams.get("release");

    useEffect(() => {
        async function loadPosts() {
            try {
                const data = await getPosts(
                    genre,
                    search,
                    artist,
                    release
                );

                setPosts(data);

            } catch (error) {
                console.error(error);
            }
        }

        loadPosts();

    }, [genre, search]);
    //название страницы
    try{
    if (search){
    document.title = search;
    }
    else{
      document.title = genre;
    }
    
    } 
    catch(error){
      console.log(error)
    }
    return (
        <>
            <Header />

            <Main>
                <InfoArea
                    label={
                        search
                            ? `Поиск: ${search}`
                            : genre
                            ? `Посты жанра: ${genre}`
                            : "Все посты"
                    }
                >

                    {posts.map((post) => (
                        <PostsItem
                            key={post.id}
                            id={post.id}
                            cover={
                                post.image_path
                                    ? `http://localhost:8000${post.image_path}`
                                    : "https://placehold.co/150x200"
                            }
                            header={post.title}
                            nickname={post.author}
                            date={new Date(post.created_at)
                                .toLocaleDateString("ru-RU")}
                            content={post.content}
                            likes={post.likes_count}
                            genre={post.genre}
                            type="main"
                        />
                    ))}

                </InfoArea>
            </Main>

            <Footer />
        </>
    );
}
export default AllPosts;