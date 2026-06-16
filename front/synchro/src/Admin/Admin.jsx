import PostsItem from '../PostsItem/PostsItem';
import { useState, useEffect } from 'react';
import { 
    getAllUsers, 
    getUserPosts, 
    banUser, 
    unbanUser, 
    deletePost, 
    getReleases, 
    addRelease, 
    deleteRelease 
} from '../api';
import style from './Admin.module.css';
import Header from '../Header/Header';
import Main from '../Main/Main';
import Footer from '../Footer/Footer';

function Admin() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [releases, setReleases] = useState([]); // Стейт для списка релизов в админке
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);

    // Стейты для полей формы нового релиза
    const [relArtist, setRelArtist] = useState('');
    const [relName, setRelName] = useState('');
    const [relGenre, setRelGenre] = useState('');
    const [relCover, setRelCover] = useState(null);
    const [releaseError, setReleaseError] = useState(""); // Стейт для ошибки при добавлении релиза

    // Инициализация данных при монтировании
    useEffect(() => {
        async function loadInitData() {
            try {
                const [usersData, releasesData] = await Promise.all([
                    getAllUsers(),
                    getReleases()
                ]);
                setUsers(usersData);
                setReleases(releasesData);
            } catch (err) {
                setError('Нет доступа или ошибка загрузки данных');
            } finally {
                setLoadingUsers(false);
            }
        }
        loadInitData();
    }, []);

    // Выбор пользователя для просмотра его постов
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

    // Бан / Разбан пользователя
    async function handleBanToggle(targetUser) {
        try {
            if (targetUser.is_banned) {
                await unbanUser(targetUser.id);
            } else {
                await banUser(targetUser.id);
            }
            
            const updated = users.map((u) => 
                u.id === targetUser.id ? { ...u, is_banned: u.is_banned ? 0 : 1 } : u
            );
            setUsers(updated);
            
            if (selectedUser?.id === targetUser.id) {
                setSelectedUser((prev) => ({ ...prev, is_banned: prev.is_banned ? 0 : 1 }));
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Удаление поста пользователя
    async function handleDeletePost(postId) {
        if (!window.confirm("Удалить этот пост?")) return;
        try {
            await deletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
        } catch (err) {
            console.error(err);
        }
    }

    // Добавление нового релиза через FormData
    async function handleAddRelease(e) {
        e.preventDefault();
        setReleaseError(""); // Очищаем ошибку перед отправкой
        
        const formData = new FormData();
        formData.append('artist', relArtist);
        formData.append('name', relName);
        formData.append('genre', relGenre);
        if (relCover) {
            formData.append('cover', relCover);
        }

        try {
            await addRelease(formData);
            // Сразу же обновляем список релизов актуальными данными с сервера
            const updatedReleases = await getReleases();
            setReleases(updatedReleases);
            
            // Очистка полей формы
            setRelArtist('');
            setRelName('');
            setRelGenre('');
            setRelCover(null);
            e.target.reset(); // Сбрасываем элемент input[type=file]
        } catch (err) {
            console.error("Ошибка при создании релиза:", err);
            // Устанавливаем текст ошибки в стейт вместо alert
            setReleaseError(err.message || "Не удалось добавить релиз. Проверьте заполнение полей.");
        }
    }

    // Удаление релиза
    async function handleDeleteRelease(id) {
        if (!window.confirm("Вы уверены, что хотите удалить этот релиз из списка ожидаемых?")) return;
        try {
            await deleteRelease(id);
            setReleases((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            console.error("Ошибка при удалении релиза:", err);
        }
    }

    // Фильтрация пользователей по поисковой строке
    const filteredUsers = users.filter((u) => 
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.display_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Header />
            <Main>
                <div className={style.AdminPanels}>
                    
                    {/* ЛЕВАЯ ПАНЕЛЬ — Список пользователей */}
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
                                        className={`${style.UserItem} ${selectedUser?.id === u.id ? style.UserItemActive : ""} ${u.is_banned ? style.UserItemBanned : ""}`} 
                                        onClick={() => handleSelectUser(u)}
                                    >
                                        <div className={style.UserItemInfo}>
                                            <span className={style.UserItemDisplay}>{u.display_name}</span>
                                            <span className={style.UserItemUsername}>@{u.username}</span>
                                        </div>
                                        {u.is_banned && <span className={style.BannedBadge}>Забанен</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* СРЕДНЯЯ ПАНЕЛЬ — Список постов выбранного юзера */}
                    <div className={style.PostsSection}>
                        <h3 className={style.PostsSectionTitle}>
                            Посты
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
                                            cover={post.image_path ? `http://localhost:8000${post.image_path}` : "https://placehold.co/150x150"}
                                            header={post.title}
                                            nickname={selectedUser.username}
                                            date={new Date(post.created_at).toLocaleDateString("ru-RU")}
                                            content={post.content}
                                            likes={post.likes_count}
                                            genre={post.genre}
                                            type="side"
                                        />
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

                    {/* ПРАВАЯ ПАНЕЛЬ — Ожидаемые релизы */}
                    <div className={style.PostsSection}>
                        <h3 className={style.PostsSectionTitle}>
                            Ожидаемые релизы
                            <span className={style.UserCount}>{releases.length}</span>
                        </h3>
                        
                        <form onSubmit={handleAddRelease} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '15px', backgroundColor: '#e9e9e9ff', borderRadius: '8px' }}>
                            <input 
                                required 
                                type="text" 
                                placeholder="Исполнитель / Артист" 
                                value={relArtist} 
                                onChange={e => setRelArtist(e.target.value)} 
                                className={style.SearchInput} 
                            />
                            <input 
                                required 
                                type="text" 
                                placeholder="Название альбома / сингла" 
                                value={relName} 
                                onChange={e => setRelName(e.target.value)} 
                                className={style.SearchInput} 
                            />
                            <input 
                                type="text" 
                                placeholder="Жанр" 
                                value={relGenre} 
                                onChange={e => setRelGenre(e.target.value)} 
                                className={style.SearchInput} 
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px' }}>
                                <label style={{ color: '#ccc' }}>Обложка релиза:</label>
                                <input 
                                    type="file" 
                                    accept="image/jpeg, image/png, image/webp" 
                                    onChange={e => setRelCover(e.target.files[0])} 
                                    style={{ color: '#fff' }}
                                />
                            </div>

                            {/* Вывод ошибки формы */}
                            {releaseError && (
                                <p style={{ color: '#ff4d4f', margin: '5px 0', fontSize: '14px', textAlign: 'center' }}>
                                    {releaseError}
                                </p>
                            )}

                            <button 
                                type="submit" 
                                className={style.BanBtn} 
                                style={{ background: '#2e7d32', color: '#fff', cursor: 'pointer', marginTop: '5px' }}
                            >
                                Добавить в список
                            </button>
                        </form>

                        {releases.length === 0 ? (
                            <p className={style.StateMsg}>Список ожидаемых релизов пуст</p>
                        ) : (
                            <ul className={style.PostList}>
                                {releases.map((rel) => (
                                    <li key={rel.id} className={style.PostItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <img 
                                                src={rel.cover_path ? `http://localhost:8000${rel.cover_path}` : "https://placehold.co/50x50"} 
                                                alt="Обложка" 
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#333' }} 
                                            />
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: 'bold', color: '#fff' }}>{rel.artist}</div>
                                                <div style={{ color: '#aaa', fontSize: '14px' }}>{rel.name}</div>
                                                <span style={{ fontSize: '11px', background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#888' }}>
                                                    {rel.genre || 'Разное'}
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            className={style.DeleteBtn} 
                                            onClick={() => handleDeleteRelease(rel.id)}
                                            style={{ marginLeft: '10px', height: 'fit-content' }}
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