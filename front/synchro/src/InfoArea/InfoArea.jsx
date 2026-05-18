import style from './InfoArea.module.css';
import ReleasesItem from '../ReleasesItem/ReleasesItem';
function InfoArea({label="Info Area", children}){
    let InfoAreaLabel = label;
    return(
        <div className={style.InfoArea}>
            <h2 className={style.InfoAreaHeader}>{InfoAreaLabel}</h2>
            <ul>
                {children}
            </ul>
        </div>
    );


}
export default InfoArea;