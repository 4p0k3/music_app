import style from './SearchBar.module.css';

function SearchBar({value, onChange}){
    return(
        <div className={style.HeaderSearchBar}>
            

        <input type="text" placeholder='Поиск...' value={value} onChange={onChange}/>
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.5 23.5L18.1833 18.1833M21.0556 11.2778C21.0556 16.6779 16.6779 21.0556 11.2778 21.0556C5.87766 21.0556 1.5 16.6779 1.5 11.2778C1.5 5.87766 5.87766 1.5 11.2778 1.5C16.6779 1.5 21.0556 5.87766 21.0556 11.2778Z" stroke="#B3B3B3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        </div>
    );
}
export default SearchBar;
