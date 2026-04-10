/**
 * @fileoverview 应用根组件
 * @description 定义 React 应用的路由结构，包括根路径重定向、候选人列表页和详情页路由。
 *              使用 React Router v6 的 Routes/Route 组件进行声明式路由配置。
 * @module App
 * @version 1.0.0
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CandidateList from './pages/Candidates/CandidateList';
import CandidateDetail from './pages/Candidates/Detail/CandidateDetail';
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/candidates" replace />} />
        <Route path="candidates" element={<CandidateList />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />      </Route>
    </Routes>
  );
}

export default App
