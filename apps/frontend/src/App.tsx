import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CandidateList from './pages/Candidates/CandidateList';
import CandidateDetail from './pages/Candidates/Detail/CandidateDetail';
import ResumeUpload from './pages/Candidates/ResumeUpload';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/candidates" replace />} />
        <Route path="candidates" element={<CandidateList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="upload" element={<ResumeUpload />} />
      </Route>
    </Routes>
  );
}

export default App
