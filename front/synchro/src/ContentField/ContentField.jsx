import style from './ContentField.module.css';

function ContentField({ placeholder, value, onChange, rows = 6, maxLength }) {
    return (
        <div className={style.ContentField}>
            <textarea
                className={style.ContentTextarea}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                rows={rows}
                maxLength={maxLength}
            />
            {maxLength && (
                <span className={style.Counter}>
                    {value?.length ?? 0}/{maxLength}
                </span>
            )}
        </div>
    );
}

export default ContentField;
