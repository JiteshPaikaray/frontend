import { useState, useEffect } from 'react';
import { getTransactions } from '../services/api';

const TransactionList = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const data = await getTransactions();
            console.log('Fetched transactions:', data);
            setTransactions(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch transactions');
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    // Ensure we have an array to map over. Some backends return objects like { data: [...] } or { value: [...] }.
    const list = Array.isArray(transactions)
        ? transactions
        : Array.isArray(transactions?.data)
        ? transactions.data
        : Array.isArray(transactions?.value)
        ? transactions.value
        : [];

    return (
        <div className="transaction-list">
            <h2>Transactions</h2>
            {list.length === 0 && <p>No transactions found.</p>}
            {list.map((t, idx) => {
                // Use a stable, more-unique key: prefer date+summary, fall back to index.
                const key = t?.date ? `${t.date}-${t.summary ?? ''}` : `tx-${idx}`;
                return (
                    <div className="transaction-item bg-red text-success" key={key}>
                        <div>
                            <h3>{t.summary}</h3>
                            <p>
                                Temperature: {t.temperatureC ?? 'N/A'}°C / {t.temperatureF ?? 'N/A'}°F
                            </p>
                            <p>Date: {t.date ? new Date(t.date).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionList;