/**
 * @fileoverview 应用根组件
 * @description 定义 React 应用的路由结构，包括根路径重定向、候选人列表页、详情页路由，
 *              以及岗位编辑页面路由（新增/编辑）。
 *              使用 React Router v6 的 Routes/Route 组件进行声明式路由配置。
 * @module App
 * @version 1.0.0
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CandidateList from './pages/Candidates/CandidateList';
import CandidateDetail from './pages/Candidates/Detail/CandidateDetail';
import JobEdit from './pages/Jobs/JobEdit';
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/candidates" replace />} />
        <Route path="candidates" element={<CandidateList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="job/edit" element={<JobEdit />} />
        <Route path="job/:id" element={<JobEdit />} />
      </Route>
    </Routes>
  );
}

export default App
