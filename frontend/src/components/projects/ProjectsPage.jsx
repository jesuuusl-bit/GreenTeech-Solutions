import { Routes, Route } from 'react-router-dom';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import ProjectDetail from './ProjectDetail';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';

export default function ProjectsPage() {
  return (
    <Routes>
      <Route index element={<ProjectList />} />
      <Route path="new" element={<ProjectForm />} />
      <Route path=":id" element={<ProjectDetail />} />
      <Route path=":id/edit" element={<ProjectForm />} />
      <Route path=":projectId/tasks" element={<TaskList />} />
      <Route path=":projectId/tasks/new" element={<TaskForm />} />
      <Route path=":projectId/tasks/:taskId" element={<TaskDetail />} />
      <Route path=":projectId/tasks/:taskId/edit" element={<TaskForm />} />
    </Routes>
  );
}