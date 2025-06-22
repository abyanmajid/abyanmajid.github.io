import "./App.css";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import TasksPage from "./pages/TasksPage";
import TimerPage from "./pages/TimerPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dash/tasks" element={<TasksPage />} />
      <Route path="/dash/timer" element={<TimerPage />} />
      <Route path="/dash/analytics" element={<AnalyticsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
