import { useState } from "react";
import TransactionList from './components/TransactionList';
import UserMaster from './components/UserMaster';
import './App.css';
import Login from "./components/Login";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState('login'); // 'login' | 'users' | 'transactions'

  const handleTransactionAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLoginSuccess = () => {
    setPage('users');
  };

  return (
    <div className="app">
      <header>
        <h1>AI Finance Tracker</h1>
      </header>
      
      <main>
        <div className="container">
          {page === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
          {page === 'users' && <UserMaster />}
          {page === 'transactions' && <TransactionList key={refreshKey} />}
        </div>
      </main>
    </div>
  );
}

export default App;
