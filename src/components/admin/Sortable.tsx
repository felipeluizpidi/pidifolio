"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import clsx from "clsx";

type Handle = { attributes: Record<string, unknown>; listeners: Record<string, unknown> | undefined };

function Item({ id, children, className }: { id: string; className?: string; children: (h: Handle) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(className, isDragging && "relative z-10 opacity-80 shadow-[0_0_0_1px_#FF6030]")}
    >
      {children({ attributes: attributes as unknown as Record<string, unknown>, listeners })}
    </li>
  );
}

/** Drag-and-drop list (pointer + keyboard: focus the handle, Space, arrows, Space). */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  render,
  className,
  itemClassName,
  grid,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  render: (item: T, handle: React.ReactNode, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  grid?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item, index) => (
            <Item key={item.id} id={item.id} className={itemClassName}>
              {({ attributes, listeners }) =>
                render(
                  item,
                  <button
                    type="button"
                    className="flex h-9 w-7 shrink-0 cursor-grab items-center justify-center text-ash hover:text-ivory active:cursor-grabbing"
                    aria-label="Drag to reorder"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>,
                  index,
                )
              }
            </Item>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
