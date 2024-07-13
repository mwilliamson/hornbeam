import Button from "./widgets/Button";
import "./TopBar.scss";

interface TopBarProps {
  onCardAddClick: () => void;
  onSettingsClick: () => void;
  onSubboardClose: (() => void) | undefined;
  onTimeTravelStart: () => void;
}

export default function TopBar(props: TopBarProps) {
  const {onCardAddClick, onSettingsClick, onSubboardClose, onTimeTravelStart} = props;

  return (
    <div className="TopBar">
      <h1 className="TopBar-Title">Hornbeam</h1>

      <div className="TopBar-Controls">
        {onSubboardClose !== undefined && (
          <div>
            <Button type="button" intent="secondary" onClick={onSubboardClose} fullWidth>
              Close subboard
            </Button>
          </div>
        )}

        <div>
          <Button type="button" intent="secondary" onClick={onCardAddClick}>
            Add card
          </Button>
        </div>

        <div>
          <Button type="button" intent="secondary" onClick={onTimeTravelStart} fullWidth>
            Time travel
          </Button>
        </div>

        <div>
          <Button type="button" intent="secondary" onClick={onSettingsClick} fullWidth>
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
