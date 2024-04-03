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

const SUBMIT_VALUE = "submit";

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

interface SubmitButtonProps {
  children: React.ReactNode;
}

function SubmitButton(props: SubmitButtonProps) {
  const {children} = props;

  const actionModalState = useContext(StateContext);

  return (
    <Button
      type="submit"
      disabled={actionModalState.isLoading}
      value={SUBMIT_VALUE}
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
