import style from './ReleasesItem.module.css';
import { useNavigate } from "react-router-dom";

function ReleasesItem({
    cover = "https://placehold.co/80x80",
    artist = "Artist",
    name = "Name",
    genre = "Genre"
}) {

    const navigate = useNavigate();

    const handleClick = () => {
        navigate(
            `/AllPosts?search=${encodeURIComponent(
                `${artist} ${name}`
            )}`
        );
    };

    let ReleaseCover = cover;
    let ReleaseArtist = artist;
    let ReleaseName = name;
    let ReleaseGenre = genre;

    return(
        <li
            className={style.ReleasesItem}
            onClick={handleClick}
        >
            <img
                className={style.ReleaseCover}
                src={ReleaseCover}
                alt="Обложка Релиза"
            />

            <span className={style.ReleasesItemInfo}>
                <p className={style.ReleasesItemName}>
                    {ReleaseArtist} – {ReleaseName}
                </p>

                <p>{ReleaseGenre}</p>
            </span>
        </li>
    );
}

export default ReleasesItem;