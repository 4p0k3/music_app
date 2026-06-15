import PostsItem from '../PostsItem/PostsItem';
import { useState, useEffect } from 'react';
import { getAllUsers, getUserPosts, banUser, deletePost } from '../api';
import { unbanUser } from '../api';
import TextArea from '../TextArea/TextArea';     
import style from './Admin.module.css';
import Header from '../Header/Header';
import Main from '../Main/Main';
import Footer from '../Footer/Footer';

function Admin() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);

    // Load all users on mount
    useEffect(() => {
        async function loadUsers() {
            try {
                const data = await getAllUsers();
                setUsers(data);
            } catch (err) {
                setError('Нет доступа');
            } finally {
                setLoadingUsers(false);
            }
        }
        loadUsers();
    }, []);

    // Load posts when a user is selected
    async function handleSelectUser(user) {
        setSelectedUser(user);
        setLoadingPosts(true);
        try {
            const data = await getUserPosts(user.id);
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPosts(false);
        }
    }

    async function handleBanToggle(targetUser) {
        try {
            if (targetUser.is_banned) {
                await unbanUser(targetUser.id);
            } else {
                await banUser(targetUser.id);
            }
            const updated = users.map((u) =>
                u.id === targetUser.id
                    ? { ...u, is_banned: u.is_banned ? 0 : 1 }
                    : u
            );
            setUsers(updated);
            if (selectedUser?.id === targetUser.id) {
                setSelectedUser((prev) => ({
                    ...prev,
                    is_banned: prev.is_banned ? 0 : 1,
                }));
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleDeletePost(postId) {
        try {
            await deletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch (err) {
            console.error(err);
        }
    }

    const filteredUsers = users.filter(
        (u) =>
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.display_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Header />
            <Main>
                <div className={style.AdminPanels}>
                {/* LEFT PANEL — user list */}
<div className={style.UserListPanel}>
    <div className={style.PanelHeader}>
        <h2 className={style.PanelTitle}>Пользователи</h2>
        <span className={style.UserCount}>{users.length}</span>
    </div>

    <input
        className={style.SearchInput}
        placeholder="Поиск по нику..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
    />

    {loadingUsers ? (
        <p className={style.StateMsg}>Загрузка...</p>
    ) : error ? (
        <p className={style.StateMsg}>{error}</p>
    ) : filteredUsers.length === 0 ? (
        <p className={style.StateMsg}>Нет пользователей</p>
    ) : (
        <ul className={style.UserList}>
            {filteredUsers.map((u) => (
                <li
                    key={u.id}
                    className={`${style.UserItem} ${
                        selectedUser?.id === u.id ? style.UserItemActive : ""
                    } ${u.is_banned ? style.UserItemBanned : ""}`}
                    onClick={() => handleSelectUser(u)}
                >
                    <div className={style.UserItemInfo}>
                        <span className={style.UserItemDisplay}>
                            {u.display_name}
                        </span>
                        <span className={style.UserItemUsername}>
                            @{u.username}
                        </span>
                    </div>

                    {u.is_banned && (
                        <span className={style.BannedBadge}>Забанен</span>
                    )}
                </li>
            ))}
        </ul>
    )}
</div>


{/* RIGHT PANEL — POSTS */}
<div className={style.PostsSection}>
    <h3 className={style.PostsSectionTitle}>
        Посты пользователя
        {selectedUser && (
            <>
                {' '}<b>{selectedUser.display_name}</b>
                <span className={style.UserCount}>{posts.length}</span>
                <button
                    className={selectedUser.is_banned ? style.UnbanBtn : style.BanBtn}
                    onClick={() => handleBanToggle(selectedUser)}
                >
                    {selectedUser.is_banned ? 'Разбанить' : 'Забанить'}
                </button>
            </>
        )}
    </h3>

    {loadingPosts ? (
        <p className={style.StateMsg}>Загрузка постов...</p>
    ) : posts.length === 0 ? (
        <p className={style.StateMsg}>Постов нет</p>
    ) : (
        <ul className={style.PostList}>
            {posts.map((post) => (
                <li key={post.id} className={style.PostItem}>
                    
                    <PostsItem
                        id={post.id}
                        cover={
                            post.image_path
                                ? `http://localhost:8000${post.image_path}`
                                : "https://placehold.co/150x150"
                        }
                        header={post.title}
                        nickname={selectedUser.username}
                        date={new Date(post.created_at).toLocaleDateString("ru-RU")}
                        content={post.content}
                        likes={post.likes_count}
                        genre={post.genre}
                        type="side"
                    />

                    {/* КНОПКА РЯДОМ С ПОСТОМ */}
                    <button
                        className={style.DeleteBtn}
                        onClick={() => handleDeletePost(post.id)}
                    >
                        Удалить
                    </button>
                </li>
            ))}
        </ul>
    )}
</div>
                </div>
            </Main>
            <Footer />
        </>
    );
}

export default Admin;