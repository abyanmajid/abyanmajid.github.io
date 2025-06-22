import "./App.css";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import TasksPage from "./pages/TasksPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dash/tasks" element={<TasksPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
