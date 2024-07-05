import { AppRequest } from "../app/snapshots";
import { useSendRequest } from "../backendConnections";

interface BoundaryProps {
  render: (
    sendRequest: (update: AppRequest) => Promise<void>,
  ) => React.ReactNode;
}

export default function Boundary(props: BoundaryProps) {
  const {render} = props;

  const sendRequest = useSendRequest();

  return render(sendRequest);
}
