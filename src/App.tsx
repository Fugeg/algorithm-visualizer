import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AlgorithmsPage from './pages/AlgorithmsPage';
import DataStructures from './pages/DataStructures';
import Array from './components/DataStructures/Array';
import LinkedList from './components/DataStructures/LinkedList';
import Stack from './components/DataStructures/Stack';
import Queue from './components/DataStructures/Queue';
import BinaryTree from './components/DataStructures/BinaryTree';
import Graph from './components/DataStructures/Graph';
import HashTable from './components/DataStructures/HashTable';
import BinarySearch from './components/Algorithms/BinarySearch';
import AVLTreePage from './components/Algorithms/AVLTreePage';
import NQueens from './components/Algorithms/NQueens';
import GraphAlgorithms from './components/DataStructures/GraphAlgorithms';
import AIChatLayout from './components/AIChat/AIChatLayout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="algorithms/*" element={<AlgorithmsPage />}>
            <Route path="binary-search" element={<BinarySearch />} />
            <Route path="avl-tree" element={<AVLTreePage />} />
            <Route path="n-queens" element={<NQueens />} />
          </Route>
          <Route path="data-structures/*" element={<DataStructures />}>
            <Route path="array" element={<Array />} />
            <Route path="linked-list" element={<LinkedList />} />
            <Route path="stack" element={<Stack />} />
            <Route path="queue" element={<Queue />} />
            <Route path="binary-tree" element={<BinaryTree />} />
            <Route path="graph" element={<Graph />} />
            <Route path="hash-table" element={<HashTable />} />
            <Route path="graph-algorithms" element={<GraphAlgorithms />} />
          </Route>
          <Route path="ai-chat" element={<AIChatLayout />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;