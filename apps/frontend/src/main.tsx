/**
 * @fileoverview 应用入口文件
 * @description React 应用的启动入口，创建 React 根节点并挂载到 DOM。
 *              配置 StrictMode 开发模式检测、BrowserRouter 路由支持。
 * @module main
 * @version 1.0.0
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
