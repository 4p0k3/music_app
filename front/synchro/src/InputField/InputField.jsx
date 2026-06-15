import style from './InputField.module.css';

function InputField({ placeholder, value, onChange, type = "text", minLength = 3, maxLength, required = true }) {
  return (
    <div className={style.InputField}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
      />
    </div>
  );
}

export default InputField;
