import React, { useContext, useState } from "react";

import Button from "./Button";
import CancelButton from "./CancelButton";
import Spinner from "./Spinner";
import "./Form.scss";

interface State {
  isLoading: boolean;
}

const StateContext = React.createContext<State>({isLoading: false});

interface FormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit: () => Promise<void>;
}

export default function Form(props: FormProps) {
  const {children, className, onSubmit} = props;

  const [state, setState] = useState<State>({isLoading: false});

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState(state => ({...state, isLoading: true}));
    // TODO: handle errors
    await onSubmit();
    setState(state => ({...state, isLoading: false}));
  };

  return (
    <StateContext.Provider value={state}>
      <form className={className} onSubmit={handleSubmit}>
        {children}
      </form>
    </StateContext.Provider>
  );
}

interface MainButtonsProps {
  onCancel: () => void;
  submitText: string;
}

function MainButtons(props: MainButtonsProps) {
  const {onCancel, submitText} = props;

  return (
    <div className="Form-MainButtons">
      <div>
        <CancelButton onClick={onCancel} />
      </div>
      <div>
        <Form.Status />
        <Form.SubmitButton>{submitText}</Form.SubmitButton>
      </div>
    </div>
  );
}

Form.MainButtons = MainButtons;

interface SubmitButtonProps {
  children: React.ReactNode;
}

function SubmitButton(props: SubmitButtonProps) {
  const {children} = props;

  const formState = useContext(StateContext);

  return (
    <Button
      type="submit"
      intent="primary"
      disabled={formState.isLoading}
    >
      {children}
    </Button>
  );
}

Form.SubmitButton = SubmitButton;

function Status() {
  const formState = useContext(StateContext);

  return formState.isLoading ? (
    <span className="Form-Status">
      <Spinner />
    </span>
  ) : null;
}

Form.Status = Status;
