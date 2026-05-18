import style from './ReleasesItem.module.css';

function ReleasesItem({cover="https://placehold.co/80x80", artist="Artist",name = "Name",genre = "Genre"}){
   
    let ReleaseCover = cover;
    let ReleaseArtist = artist;
    let ReleaseName = name;
    let ReleaseGenre = genre;  
    
    return(
        <li className={style.ReleasesItem}>
        <img className = {style.ReleaseCover} src={ReleaseCover} alt="Обложка Релиза" />
        <span className={style.ReleasesItemInfo}>
            
            <p className={style.ReleasesItemName}>{ReleaseArtist} – {ReleaseName}</p>
            <p>{ReleaseGenre}</p>
            
        </span>
        </li>
    );
}
export default ReleasesItem;