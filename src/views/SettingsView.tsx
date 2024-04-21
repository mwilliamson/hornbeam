import { Category, categoryBackgroundColorStyle } from "../app/categories";
import { AppSnapshot } from "../app/snapshots";
import "./SettingsView.scss";

interface SettingsViewProps {
  appSnapshot: AppSnapshot
}

export default function SettingsView(props: SettingsViewProps) {
  const {appSnapshot} = props;

  const categories = appSnapshot.allCategories();

  return (
    <section className="m-md">
      <h3>Categories</h3>

      <table className="SettingsView-CategoriesTable">
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
    </section>
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
          className="SettingsView-CategoryColor"
          style={categoryBackgroundColorStyle(category, appSnapshot)}
        >
          {color === null ? null : color.name}
        </span>
      </td>
    </tr>
  );
}
