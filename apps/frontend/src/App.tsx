import FileUpload from './components/FileUpload'
import './App.css'

function App() {

  const handleFileUpload = (files: File[]) => {
    console.log('上传的文件:', files);
  };

  return (
    <div className="app">
      <h1>文件上传组件测试</h1>
      <FileUpload onFileUpload={handleFileUpload} />
    </div>
  )
}

export default App
