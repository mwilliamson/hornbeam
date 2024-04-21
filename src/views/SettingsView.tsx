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
            <tr key={category.id}>
              <td>
                {category.name}
              </td>
              <td>
                {appSnapshot.findPresetColorById(category.color.presetColorId)?.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
