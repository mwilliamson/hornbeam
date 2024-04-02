import { useEffect, useRef } from "react";

import "./Modal.scss";

interface ModalProps {
  children: React.ReactElement;
  labelElementId: string;
  onClose: (returnValue: string) => void;
}

export default function Modal(props: ModalProps) {
  const {children, labelElementId, onClose} = props;

  const modalRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.showModal();
    }
  }, []);

  const handleClose = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    const returnValue: string = (event.target as unknown as {returnValue: string}).returnValue;
    onClose(returnValue);
  };

  return (
    <dialog
      aria-labelledby={labelElementId}
      className="Modal"
      onClose={handleClose}
      ref={modalRef}
    >
      {children}
    </dialog>
  );
}
