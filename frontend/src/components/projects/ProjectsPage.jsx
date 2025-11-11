import { Routes, Route } from 'react-router-dom';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import ProjectDetail from './ProjectDetail';

export default function ProjectsPage() {
  return (
    <Routes>
      <Route index element={<ProjectList />} />
      <Route path="new" element={<ProjectForm />} />
      <Route path=":id" element={<ProjectDetail />} />
      <Route path=":id/edit" element={<ProjectForm />} />
    </Routes>
  );
}