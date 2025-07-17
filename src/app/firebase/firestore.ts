import { db, auth } from "./config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

// Define an interface for consistency
export interface Expense {
  id?: string;
  uid: string;
  amount: number;
  description: string;
  createdAt: number; // Store as timestamp (ms)
}

// Add new expense
export const addExpense = async (amount: number, description: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const newExpense: Omit<Expense, "id"> = {
    uid: user.uid,
    amount,
    description,
    createdAt: Date.now(), // Unix ms timestamp
  };

  await addDoc(collection(db, "expenses"), newExpense);
};

// Fetch user's expenses
export const getExpenses = async (): Promise<Expense[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, "expenses"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Expense, "id">),
  }));
};

// Delete an expense by document ID
export const deleteExpense = async (id: string) => {
  await deleteDoc(doc(db, "expenses", id));
};
