import { Card, CategorySet } from "../../app";
import Button from "../widgets/Button";
import "./CardDetailView.scss";

interface CardDetailViewProps {
  allCategories: CategorySet;
  card: Card;
  onAddChildClick: () => void;
}

export default function CardDetailView(props: CardDetailViewProps) {
  const {allCategories, card, onAddChildClick} = props;

  const category = allCategories.findCategoryById(card.categoryId);

  const categoryColor = category === null ? undefined : category.color.hex;

  return (
    <>
      <div className="CardDetailView-Header p-md" style={{backgroundColor: categoryColor}}>
        <h2>{card.text} (#{card.number})</h2>
      </div>
      <div>
        <Button
          intent="primary"
          type="button"
          onClick={onAddChildClick}
        >
          Add Child
        </Button>
      </div>
    </>
  );
}
