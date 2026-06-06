import { useState, useEffect } from 'react';
import { getPosts } from '../api';

import Header from '../Header/Header';
import Main from '../Main/Main';
import InfoArea from '../InfoArea/InfoArea';
import PostsItem from '../PostsItem/PostsItem';
import Footer from '../Footer/Footer';

function AllPosts() {

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        async function loadPosts() {
            try {
                const data = await getPosts();
                setPosts(data);
            } catch (error) {
                console.error(error);
            }
        }

        loadPosts();
    }, []);

    return (
        <>
            <Header />

            <Main>
                <InfoArea label="Все посты">

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