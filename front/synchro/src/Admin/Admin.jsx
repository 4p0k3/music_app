import InfoArea from "../InfoArea/InfoArea";
import PostsItem from "../PostsItem/PostsItem";
import Main from "../Main/Main";
import style from './Admin.module.css'
import Header from "../Header/Header";
import MainButton from "../MainButton/MainButton";
function Admin(){
    const lorem="Lorem, ipsum dolor sit amet consectetur adipisicing elit. Deserunt voluptatem assumenda expedita minima quam error incidunt velit blanditiis optio nobis veritatis cupiditate necessitatibus accusamus natus commodi, maiores voluptates quia mollitia."
    let UserNickname="jopa";
    let Username = "jopa";
    let postHeader = "header";
    let postContent = lorem;
    let postCoverUrl="https://placehold.co/500x500";

    return(
    <>
        <Header/>
        <Main>
            <InfoArea label="Выбрать пользователя">
                <div className={style.ChooseUserItem}>
                    <img src="src\ReleasesCovers\2hollis_star.jpg" alt="" className={style.userPfp}/>
                    <p>{UserNickname} | @{Username}</p>
                </div>
                    
            </InfoArea>
            <InfoArea label="Модерация постов">
                <div className={style.postWithButtons}>
                <PostsItem cover={postCoverUrl} header={postHeader} nickname={Username} date='13.06.2008' content={lorem} type='main'/>
                <MainButton text={"удалить"} type="main"></MainButton>
                </div>
                <div className={style.postWithButtons}>
                <PostsItem cover={postCoverUrl} header={postHeader} nickname={Username} date='13.06.2008' content={lorem} type='main'/>
                <MainButton text={"удалить"} type="main"></MainButton>
                </div>
                
            </InfoArea>
        </Main>
    </>
    );
    

}

export default Admin;