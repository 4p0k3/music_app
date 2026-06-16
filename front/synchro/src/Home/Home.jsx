import { useEffect, useState } from "react";
import { getPosts, getReleases } from "../api"; // Импортируем функцию getReleases

import Header from "../Header/Header";
import Main from "../Main/Main";
import InfoArea from "../InfoArea/InfoArea";
import PostsItem from "../PostsItem/PostsItem";
import ReleasesItem from "../ReleasesItem/ReleasesItem";
import Footer from "../Footer/Footer";

function Home() {
    const [recentPosts, setRecentPosts] = useState([]);
    const [topPosts, setTopPosts] = useState([]);
    const [releases, setReleases] = useState([]); // Стейт для динамических релизов

    useEffect(() => {
        async function loadData() {
            try {
                // Параллельная загрузка постов и релизов
                const [posts, releasesData] = await Promise.all([
                    getPosts(),
                    getReleases()
                ]);

                // 5 последних постов
                const recent = [...posts]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);

                // 5 лучших постов по лайкам
                const top = [...posts]
                    .sort((a, b) => b.likes_count - a.likes_count)
                    .slice(0, 5);

                setRecentPosts(recent);
                setTopPosts(top);
                setReleases(releasesData);
            } catch (error) {
                console.error("Ошибка при загрузке данных на главной:", error);
            }
        }

        loadData();
    }, []);

    // Название страницы
    try {
        document.title = "SYNCHRO";
    } catch(error) {
        console.log(error);
    }

    return (
        <>
            <Header />

            <Main>
                <div className="m-f">
                    <InfoArea label="Ожидаемые релизы">
                        {releases.length > 0 ? (
                            releases.map((release) => (
                                <ReleasesItem
                                    key={release.id}
                                    cover={
                                        release.cover_path
                                            ? `http://localhost:8000${release.cover_path}`
                                            : "https://placehold.co/150x150"
                                    }
                                    artist={release.artist}
                                    name={release.name}
                                    genre={release.genre || "Разное"}
                                />
                            ))
                        ) : (
                            <p style={{ padding: "15px", color: "#888", textAlign: "center" }}>
                                Нет ожидаемых релизов
                            </p>
                        )}
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
                                date={new Date(post.created_at).toLocaleDateString("ru-RU")}
                                content={post.content}
                                likes={post.likes_count}
                                genre={post.genre}
                                type="side"
                            />
                        ))}
                    </InfoArea>
                </div>
                
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
                            date={new Date(post.created_at).toLocaleDateString("ru-RU")}
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