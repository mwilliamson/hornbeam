import React, { useContext, useState } from "react";

import Button from "./Button";
import Modal from "./Modal";
import Spinner from "./Spinner";
import "./ActionModal.scss";

interface State {
  isLoading: boolean;
}

const StateContext = React.createContext<State>({isLoading: false});

interface ActionModalProps {
  children: React.ReactNode;
  labelElementId: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export default function ActionModal(props: ActionModalProps) {
  const {children, labelElementId, onClose, onSubmit} = props;

  const [state, setState] = useState<State>({isLoading: false});

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState(state => ({...state, isLoading: true}));
    await onSubmit();
    setState(state => ({...state, isLoading: false}));
  };

  return (
    <Modal labelElementId={labelElementId} onClose={onClose}>
      <StateContext.Provider value={state}>
        <form method="dialog" onSubmit={handleSubmit}>
          {children}
        </form>
      </StateContext.Provider>
    </Modal>
  );
}

ActionModal.Header = Modal.Header;
ActionModal.Body = Modal.Body;
ActionModal.Footer = Modal.Footer;

interface SubmitButtonProps {
  children: React.ReactNode;
}

function SubmitButton(props: SubmitButtonProps) {
  const {children} = props;

  const actionModalState = useContext(StateContext);

  return (
    <Button
      type="submit"
      intent="primary"
      disabled={actionModalState.isLoading}
    >
      {children}
    </Button>
  );
}

ActionModal.SubmitButton = SubmitButton;

function Status() {
  const actionModalState = useContext(StateContext);

  return actionModalState.isLoading ? (
    <span className="ActionModal-Status">
      <Spinner />
    </span>
  ) : null;
}

ActionModal.Status = Status;
