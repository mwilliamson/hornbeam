import { Category, categoryBackgroundColorStyle } from "../../app/categories";
import { AppSnapshot } from "../../app/snapshots";
import "./CategoryListView.scss";

interface CategoryListViewProps {
  appSnapshot: AppSnapshot;
}

export default function CategoryListView(props: CategoryListViewProps) {
  const {appSnapshot} = props;

  const categories = appSnapshot.allCategories();

  return (
    <table className="CategoryListView">
      <thead>
        <tr>
          <th>Name</th>
          <th>Colour</th>
        </tr>
      </thead>
      <tbody>
        {categories.map(category => (
          <CategoryTableRow
            key={category.id}
            appSnapshot={appSnapshot}
            category={category}
          />
        ))}
      </tbody>
    </table>
  );
}

interface CategoryTableRowProps {
  appSnapshot: AppSnapshot;
  category: Category;
}

function CategoryTableRow(props: CategoryTableRowProps) {
  const {appSnapshot, category} = props;

  const color = appSnapshot.findPresetColorById(category.color.presetColorId);

  return (
    <tr>
      <td>
        {category.name}
      </td>
      <td>
        <span
          className="CategoryListView-CategoryColor"
          style={categoryBackgroundColorStyle(category, appSnapshot)}
        >
          {color === null ? null : color.name}
        </span>
      </td>
    </tr>
  );
}
