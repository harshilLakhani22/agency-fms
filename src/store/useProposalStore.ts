import { create } from 'zustand';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ProposalStatus = 'Applied' | 'Viewed' | 'Replied';

export interface Proposal {
  id: string;
  date: string;
  link: string;
  connects: number;
  boostConnects?: number;
  isInvite?: boolean;
  account: 'Harshil' | 'Dhruvit';
  status: ProposalStatus;
  userId: string;
  createdAt: number;
}

interface ProposalState {
  proposals: Proposal[];
  isLoading: boolean;
  error: string | null;
  subscribe: (userId: string) => () => void;
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt'>) => Promise<void>;
  updateProposalStatus: (id: string, status: ProposalStatus) => Promise<void>;
  updateProposal: (id: string, updates: Partial<Omit<Proposal, 'id' | 'createdAt' | 'userId'>>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
}

export const useProposalStore = create<ProposalState>((set) => ({
  proposals: [],
  isLoading: true,
  error: null,

  subscribe: (userId: string) => {
    set({ isLoading: true });
    const q = query(
      collection(db, 'proposals'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const proposals = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Proposal[];
        
        // We want all users in the agency to see all proposals.
        // No filtering by userId.
        
        set({ proposals, isLoading: false, error: null });
      },
      (error) => {
        console.error('Error fetching proposals:', error);
        set({ error: error.message, isLoading: false });
      }
    );

    return unsubscribe;
  },

  addProposal: async (proposal) => {
    try {
      await addDoc(collection(db, 'proposals'), {
        ...proposal,
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error adding proposal:', error);
      throw error;
    }
  },

  updateProposalStatus: async (id: string, status: ProposalStatus) => {
    try {
      const docRef = doc(db, 'proposals', id);
      await updateDoc(docRef, { status });
    } catch (error: any) {
      console.error('Error updating proposal status:', error);
      throw error;
    }
  },

  updateProposal: async (id: string, updates) => {
    try {
      const docRef = doc(db, 'proposals', id);
      await updateDoc(docRef, updates);
    } catch (error: any) {
      console.error('Error updating proposal:', error);
      throw error;
    }
  },

  deleteProposal: async (id: string) => {
    try {
      const docRef = doc(db, 'proposals', id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      throw error;
    }
  },
}));
