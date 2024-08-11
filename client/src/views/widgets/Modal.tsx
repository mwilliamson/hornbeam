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

interface ModalHeaderProps {
  children: React.ReactNode;
}

function ModalHeader(props: ModalHeaderProps) {
  const {children} = props;

  return (
    <div className="Modal--Header">
      {children}
    </div>
  );
}

Modal.Header = ModalHeader;

interface ModalBodyProps {
  children: React.ReactNode;
}

function ModalBody(props: ModalBodyProps) {
  const {children} = props;

  return (
    <div className="Modal--Body">
      {children}
    </div>
  );
}

Modal.Body = ModalBody;

interface ModalFooterProps {
  children: React.ReactNode;
}

function ModalFooter(props: ModalFooterProps) {
  const {children} = props;

  return (
    <div className="Modal--Footer">
      {children}
    </div>
  );
}

Modal.Footer = ModalFooter;
