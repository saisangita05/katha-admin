import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Dashboard from './pages/dashboard/dashboard'
import AddNewComic from "./pages/newCommic/newCommic";
import AddNewComicsFirestore from "./pages/newCommic/addNewFirestore";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-new-comics" element={<AddNewComic />} />
        <Route path="/add-new-comics-firestore" element={<AddNewComicsFirestore />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
