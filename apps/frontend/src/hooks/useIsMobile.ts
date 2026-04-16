import { useState, useEffect } from 'react';

/** PC端断点阈值（像素） */
const DESKTOP_BREAKPOINT = 992;

/** useIsMobile 返回值接口 */
interface UseIsMobileReturn {
  /** 是否为移动端设备 */
  isMobile: boolean;
}

/**
 * 移动端检测 Hook
 * @description 响应式监听窗口尺寸变化，判断当前是否为移动端设备。
 *              基于 window.innerWidth 与断点阈值比较，支持窗口 resize 实时更新。
 *              统一管理移动端判断逻辑，避免在多个组件中重复实现。
 * @returns {UseIsMobileReturn} 包含 isMobile 状态的对象
 * @example
 * ```tsx
 * const { isMobile } = useIsMobile();
 *
 * return (
 *   <div style={{ display: isMobile ? 'block' : 'flex' }}>
 *     {isMobile ? '移动端布局' : 'PC端布局'}
 *   </div>
 * );
 * ```
 */
const useIsMobile = (): UseIsMobileReturn => {
  const [isMobile, setIsMobile] = useState(false);

  /** 监听窗口大小变化，实时更新移动端状态 */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
};

export default useIsMobile;
