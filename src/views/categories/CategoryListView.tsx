import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

import { Category, categoryBackgroundColorStyle } from "../../app/categories";
import { AppSnapshot } from "../../app/snapshots";
import { reorder } from "../../util/arrays";
import "./CategoryListView.scss";

interface CategoryListViewProps {
  appSnapshot: AppSnapshot;
  onReorder: (categoryIds: ReadonlyArray<string>) => Promise<void>;
}

export default function CategoryListView(props: CategoryListViewProps) {
  const {appSnapshot, onReorder} = props;

  const [pendingReorder, setPendingReorder] = useState<ReadonlyArray<string> | null>(null);

  let categories = appSnapshot.allCategories();
  if (pendingReorder !== null) {
    // Apply pending reordering to prevent the elements flying around.
    categories = reorder(categories, category => category.id, pendingReorder);
  }

  const categoryIds = categories.map(category => category.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const {active, over} = event;

    if (over !== null && active.id !== over.id) {
      let seen = false;
      const reorderedIds = categoryIds.flatMap(categoryId => {
        if (categoryId === active.id) {
          seen = true;
          return [];
        }

        if (categoryId === over.id) {
          return seen
            ? [over.id as string, active.id as string]
            : [active.id as string, over.id as string];
        }

        return [categoryId];
      });
      setPendingReorder(reorderedIds);
      try {
        await onReorder(reorderedIds);
      } finally {
        // TODO: don't clear reorder if another reorder has happened in the interim
        setPendingReorder(null);
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categoryIds}>
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
      </SortableContext>
    </DndContext>
  );
}

interface CategoryTableRowProps {
  appSnapshot: AppSnapshot;
  category: Category;
}

function CategoryTableRow(props: CategoryTableRowProps) {
  const {appSnapshot, category} = props;

  const color = appSnapshot.findPresetColorById(category.color.presetColorId);

  const {attributes, listeners, setNodeRef, transform, transition}  = useSortable({id: category.id});

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      {...attributes}
      {...listeners}
    >
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
