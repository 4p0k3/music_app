import style from './TextArea.module.css';

function TextArea({ children, className, onClick }) {
    return (
        <div
            className={`${style.TextArea} ${className || ''}`}
            onClick={onClick}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            {children}
        </div>
    );
}

export default TextArea;
