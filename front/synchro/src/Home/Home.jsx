import { useEffect, useState } from "react";
import { getPosts } from "../api";

import Header from "../Header/Header";
import Main from "../Main/Main";
import InfoArea from "../InfoArea/InfoArea";
import PostsItem from "../PostsItem/PostsItem";
import ReleasesItem from "../ReleasesItem/ReleasesItem";
import Footer from "../Footer/Footer";

function Home() {
    const [recentPosts, setRecentPosts] = useState([]);
    const [topPosts, setTopPosts] = useState([]);

    useEffect(() => {
        async function loadPosts() {
            try {
                const posts = await getPosts();

                // 5 последних
                const recent = [...posts]
                    .sort(
                        (a, b) =>
                            new Date(b.created_at) -
                            new Date(a.created_at)
                    )
                    .slice(0, 5);

                // 5 лучших по лайкам
                const top = [...posts]
                    .sort((a, b) => b.likes_count - a.likes_count)
                    .slice(0, 5);

                setRecentPosts(recent);
                setTopPosts(top);
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
                <InfoArea label="Ожидаемые релизы">
                    <ReleasesItem
                        cover="src/ReleasesCovers/2hollis_star.jpg"
                        artist="2hollis"
                        name="star"
                        genre="EDM, hyperpop"
                    />

                    <ReleasesItem
                        cover="src/ReleasesCovers/charlixcx_brat.png"
                        artist="Charli XCX"
                        name="brat"
                        genre="electropop, dance-pop, hyperpop"
                    />

                    <ReleasesItem
                        cover="src/ReleasesCovers/ogbuda_freerio2.jpg"
                        artist="OG Buda"
                        name="FREERIO 2"
                        genre="Detroit-rap"
                    />

                    <ReleasesItem
                        cover="src/ReleasesCovers/PinkPantheress_Fancy_That.png"
                        artist="PinkPantheress"
                        name="Fancy That"
                        genre="UK garage, jungle, dance-pop"
                    />
                </InfoArea>

                <InfoArea label="Недавние посты">
                    {recentPosts.map((post) => (
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
                            date={new Date(
                                post.created_at
                            ).toLocaleDateString("ru-RU")}
                            content={post.content}
                            likes={post.likes_count}
                            genre={post.genre}
                            type="side"
                        />
                    ))}
                </InfoArea>

                <InfoArea label="Лучшее за месяц">
                    {topPosts.map((post) => (
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
                            date={new Date(
                                post.created_at
                            ).toLocaleDateString("ru-RU")}
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

export default Home;