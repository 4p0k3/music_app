import style from './SignInModal.module.css';

function SignInModal({ children, label = "label", onClose }) {
  return (
    <div className={style.modal}>
      <div className={style.modalWrapper}>
        <div className={style.modalContent}>
          <h2 className={style.SignInAreaHeader}>
            {label}
            <button onClick={onClose} className={style.closeModalButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="30" viewBox="0 0 304 384">
                <path fill="#696969" d="M299 73L179 192l120 119l-30 30l-120-119L30 341L0 311l119-119L0 73l30-30l119 119L269 43z" />
              </svg>
            </button>
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
}

export default SignInModal;
