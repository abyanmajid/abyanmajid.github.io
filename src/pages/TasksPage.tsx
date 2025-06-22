import React, {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  clearCompletedTasks,
  type Task,
} from "../lib/storage";
import { ConfirmModal } from "../components/ConfirmModal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AddTaskModal({
  open,
  initialText = "",
  onClose,
  onSave,
}: {
  open: boolean;
  initialText?: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>("dialog input");
        input?.focus();
      }, 0);
    }
  }, [open, initialText]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      onSave(trimmed);
      setText("");
    }
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };
  if (!open) return null;
  return (
    <dialog open>
      <article>
        <header>
          <button aria-label="Close" rel="prev" onClick={onClose}></button>
          <p>
            <strong>📝 {initialText ? "Edit Task" : "Add a New Task"}</strong>
          </p>
        </header>
        <div>
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <input
              placeholder="What needs to be done?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="w-full" type="submit" disabled={!text.trim()}>
              {initialText ? "Save" : "Add Task"}
            </button>
          </form>
        </div>
      </article>
    </dialog>
  );
}

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: { id: string; text: string; done: boolean };
  onToggle: (id: string, done: boolean) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="group rounded p-4 shadow-3xl">
      {task.text}
      <footer className="hidden group-hover:flex mt-2">
        <div className="flex gap-2">
          <button onClick={() => onToggle(task.id, !task.done)}>
            {task.done ? "Undone" : "Done"}
          </button>
          <button
            className="outline"
            onClick={() => onEdit(task.id, task.text)}
          >
            Edit
          </button>
          <button
            className="outline secondary"
            onClick={() => onDelete(task.id)}
          >
            Delete
          </button>
        </div>
      </footer>
    </article>
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const COMPLETED_PREVIEW_COUNT = 3;

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "LockInData") {
        setTasks(getTasks());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const reload = useCallback(() => {
    setTasks(getTasks());
  }, []);

  const handleAddClick = () => {
    setEditingId(null);
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
    setEditingId(null);
  };
  const handleSave = (text: string) => {
    if (editingId) {
      updateTask(editingId, { text });
    } else {
      addTask(text);
    }
    reload();
    setModalOpen(false);
    setEditingId(null);
  };

  const handleToggle = (id: string, done: boolean) => {
    updateTask(id, { done });
    reload();
  };

  const handleEdit = (id: string, _text: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // Optionally, you can also use ConfirmModal here if desired.
    if (confirm("Delete this task?")) {
      deleteTask(id);
      reload();
    }
  };

  const activeTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);
  const completedToShow = showAllCompleted
    ? completedTasks
    : completedTasks.slice(0, COMPLETED_PREVIEW_COUNT);
  const hiddenCount = completedTasks.length - completedToShow.length;

  // Clear all completed: open modal
  const onRequestClearAll = () => {
    setClearAllModalOpen(true);
  };
  const onCancelClearAll = () => {
    setClearAllModalOpen(false);
  };
  const onConfirmClearAll = () => {
    clearCompletedTasks();
    reload();
    setShowAllCompleted(false);
    setClearAllModalOpen(false);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto my-16">
        {/* Add / Edit Task Modal */}
        <AddTaskModal
          open={modalOpen}
          initialText={
            editingId ? tasks.find((t) => t.id === editingId)?.text || "" : ""
          }
          onClose={handleModalClose}
          onSave={handleSave}
        />

        {/* Clear All Completed Confirmation Modal */}
        <ConfirmModal
          open={clearAllModalOpen}
          title="Clear All Completed Tasks"
          message={`Are you sure you want to delete all ${completedTasks.length} completed task(s)? This cannot be undone.`}
          onCancel={onCancelClearAll}
          onConfirm={onConfirmClearAll}
        />

        <div className="flex justify-between">
          <h1>Tasks</h1>
          <button className="flex items-center" onClick={handleAddClick}>
            Add Task
          </button>
        </div>
        <hr />
        {activeTasks.length > 0 ? (
          activeTasks.map((task) => (
            <React.Fragment key={task.id}>
              <TaskCard
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </React.Fragment>
          ))
        ) : (
          <p>No active tasks.</p>
        )}
        {completedTasks.length > 0 && (
          <details name="example" open>
            <summary className="pt-6">
              <strong>Finished Tasks</strong> ({completedTasks.length})
            </summary>
            {completedToShow.map((task) => (
              <React.Fragment key={task.id}>
                <TaskCard
                  task={task}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </React.Fragment>
            ))}
            {hiddenCount > 0 && (
              <button
                className="w-full secondary"
                onClick={() => setShowAllCompleted((prev) => !prev)}
              >
                {showAllCompleted
                  ? "Show Less"
                  : `Load more (${hiddenCount} left hidden)`}
              </button>
            )}
          </details>
        )}
        {completedTasks.length > 0 && (
          <div className="pt-12">
            <hr />
            <details open>
              <summary>
                <strong className="text-red-900">Destructive</strong>
              </summary>
              <button
                className="outline secondary w-full"
                onClick={onRequestClearAll}
              >
                Clear all completed
              </button>
            </details>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default TasksPage;
