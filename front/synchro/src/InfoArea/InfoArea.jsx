import style from './InfoArea.module.css';

function InfoArea({ label = "Info Area", children }) {
  return (
    <div className={`${style.InfoArea} w100`}>
      <h2 className={style.InfoAreaHeader}>{label}</h2>
      <ul>
        {children}
      </ul>
    </div>
  );
}

export default InfoArea;
