import style from './Main.module.css';
import InfoArea from '../InfoArea/InfoArea';
import ReleasesItem from '../ReleasesItem/ReleasesItem';
import PostsItem from '../PostsItem/PostsItem';

let lorem = "Съешь ещё этих мягнцузских булок, да выпей же чаю. ССъешь ещё этих мягких французских булок, да выпей же чаю.Съешь ещё этих мягких французских булок, да выпей же чаю.Съешь ещё этих мягких французских булок, да выпей же чаю.Съешь ещё этих мягких французских булок, да выпей же чаю."

function Main({children}){
return(
    <main>
        {children}
    </main>
);

}
export default Main