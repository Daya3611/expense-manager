"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addExpense, deleteExpense, getExpenses } from "@/app/firebase/firestore";
import { logoutUser } from "@/app/firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// Removed chart dependency

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  category: string;
  date: string;
  time?: string;
  createdAt: string;
}

export default function BankingDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'credit' | 'debit'>('debit');
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const router = useRouter();

  const categories = {
    debit: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Others'],
    credit: ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Business', 'Others']
  };

  const fetch = async () => {
    setIsLoading(true);
    const data = await getExpenses();
    setTransactions(data);
    setIsLoading(false);
  };

  const add = async () => {
    if (!amount || !description || !category) return;
    setIsLoading(true);
    
    // Use provided time or current time if empty
    const transactionTime = time || new Date().toTimeString().slice(0, 5);
    const transactionDateTime = new Date(`${date}T${transactionTime}`).toISOString();
    
    const transactionData = {
      amount: parseFloat(amount),
      description,
      type,
      category,
      date,
      time: transactionTime,
      createdAt: transactionDateTime
    };
    
    await addExpense(transactionData.amount, `${transactionData.type}|${transactionData.category}|${transactionData.description}|${transactionData.date}|${transactionData.time}`);
    
    setAmount("");
    setDescription("");
    setCategory("");
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    fetch();
  };

  const remove = async (id: string) => {
    setIsLoading(true);
    await deleteExpense(id);
    fetch();
  };

  const logout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Account Summary", 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [["Date", "Time", "Type", "Category", "Description", "Amount (₹)", "Balance"]],
      body: filteredTransactions.map((txn, i) => [
        new Date(txn.date).toLocaleDateString(),
        txn.time || 'N/A',
        txn.type.toUpperCase(),
        txn.category,
        txn.description,
        txn.type === 'credit' ? `+${txn.amount}` : `-${txn.amount}`,
        calculateRunningBalance(filteredTransactions.slice(0, i + 1))
      ]),
    });

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`bank-statement-${date}.pdf`);
  };

  // Process transactions to include type and category
  const processedTransactions = transactions.map(txn => {
    const parts = txn.description.split('|');
    if (parts.length >= 5) {
      return {
        ...txn,
        type: parts[0] as 'credit' | 'debit',
        category: parts[1],
        description: parts[2],
        date: parts[3],
        time: parts[4]
      };
    }
    // Handle legacy format or incomplete data
    const currentDate = new Date(txn.createdAt);
    return {
      ...txn,
      type: 'debit' as const,
      category: 'Others',
      date: currentDate.toISOString().split('T')[0],
      time: currentDate.toTimeString().slice(0, 5)
    };
  });

  const filteredTransactions = processedTransactions.filter(txn => 
    filter === 'all' || txn.type === filter
  ).sort((a, b) => {
    // Sort by date and time (oldest first)
    const dateTimeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
    return dateTimeA - dateTimeB;
  });

  const calculateBalance = () => {
    return processedTransactions.reduce((balance, txn) => {
      return txn.type === 'credit' ? balance + txn.amount : balance - txn.amount;
    }, 0);
  };

  const calculateRunningBalance = (txns: Transaction[]) => {
    const balance = txns.reduce((bal, txn) => {
      return txn.type === 'credit' ? bal + txn.amount : bal - txn.amount;
    }, 0);
    return `₹${balance.toLocaleString()}`;
  };

  const totalCredits = processedTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = processedTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = calculateBalance();

  const categorySummary = processedTransactions.reduce((acc: any, txn) => {
    const key = `${txn.type}_${txn.category}`;
    acc[key] = (acc[key] || 0) + txn.amount;
    return acc;
  }, {});

  const chartColors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280", "#14B8A6"];
  const categoryEntries = Object.entries(categorySummary);
  const totalAmount = categoryEntries.reduce((sum, [, amount]) => sum + (amount as number), 0);

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 px-4 font-sans">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Banking Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your finances with ease</p>
          </div>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition">
            Logout
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Current Balance</p>
                <p className="text-3xl font-bold">₹{currentBalance.toLocaleString()}</p>
              </div>
              <div className="text-4xl opacity-80">💳</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Credits</p>
                <p className="text-3xl font-bold">₹{totalCredits.toLocaleString()}</p>
              </div>
              <div className="text-4xl opacity-80">📈</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Debits</p>
                <p className="text-3xl font-bold">₹{totalDebits.toLocaleString()}</p>
              </div>
              <div className="text-4xl opacity-80">📉</div>
            </div>
          </div>
        </div>

        {/* Transaction Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center">
            <span className="mr-3">➕</span>
            Add New Transaction
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 font-medium mb-2">Transaction Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setType('credit')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                    type === 'credit' 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Credit
                </button>
                <button
                  onClick={() => setType('debit')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition ${
                    type === 'debit' 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💸 Debit
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-slate-700 font-medium mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-slate-700 font-medium mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty for current time"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use current time</p>
            </div>
            
            <div>
              <label className="block text-slate-700 font-medium mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-slate-700 font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories[type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-medium mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter transaction description"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={add}
              disabled={isLoading || !amount || !description || !category}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Transaction"}
            </button>
            <button
              onClick={exportToPDF}
              className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transition"
            >
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Analytics Chart */}
        {processedTransactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center">
              <span className="mr-3">📊</span>
              Transaction Analytics
            </h2>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-80 mx-auto">
                {/* Custom Donut Chart */}
                <div className="relative w-64 h-64 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {categoryEntries.map(([key, amount], i) => {
                      const percentage = (amount as number) / totalAmount;
                      const circumference = 2 * Math.PI * 30; // radius = 30
                      const strokeDasharray = circumference * percentage;
                      const strokeDashoffset = -circumference * categoryEntries.slice(0, i).reduce((sum, [, amt]) => sum + (amt as number), 0) / totalAmount;
                      
                      return (
                        <circle
                          key={key}
                          cx="50"
                          cy="50"
                          r="30"
                          fill="transparent"
                          stroke={chartColors[i % chartColors.length]}
                          strokeWidth="8"
                          strokeDasharray={`${strokeDasharray} ${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-width-10"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-800">₹{totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-slate-600">Total</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                  {categoryEntries.map(([key, amount], i) => {
                    const [type, category] = key.split('_');
                    const percentage = ((amount as number) / totalAmount * 100).toFixed(1);
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3" 
                            style={{ backgroundColor: chartColors[i % chartColors.length] }}
                          />
                          <span className="font-medium text-slate-700">
                            {type === 'credit' ? '📈' : '📉'} {category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{(amount as number).toLocaleString()}
                          </span>
                          <div className="text-xs text-gray-500">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-800 flex items-center">
              <span className="mr-3">📋</span>
              Transaction History
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('credit')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'credit' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Credits
              </button>
              <button
                onClick={() => setFilter('debit')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'debit' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Debits
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-600">Loading transactions...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No transactions yet</h3>
              <p className="text-gray-600">Add your first transaction to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((txn, index) => (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      txn.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {txn.type === 'credit' ? '📈' : '📉'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{txn.description}</div>
                      <div className="text-sm text-gray-600">
                        {txn.category} • {new Date(txn.date).toLocaleDateString()} • {txn.time || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`font-bold text-lg ${
                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(`${txn.date}T${txn.time || '00:00'}`).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(txn.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}