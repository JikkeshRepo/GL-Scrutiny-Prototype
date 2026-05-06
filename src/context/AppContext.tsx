import React, { createContext, useContext, useState } from 'react';
import { mockRuns, Run, mockAccounts, GLAccount, mockRules, Rule, mockClients, Client, mockProjects, Project } from '../data/mockData';

interface AppContextType {
  currentClient: Client;
  setCurrentClient: (client: Client) => void;
  currentRun: Run;
  setCurrentRun: (run: Run) => void;
  clients: Client[];
  projects: Project[];
  runs: Run[];
  accounts: GLAccount[];
  rules: Rule[];
  approveTransaction: (accountId: string, transactionId: string, reason: string) => void;
  flagTransaction: (accountId: string, transactionId: string, reason: string) => void;
  addRule: (rule: Rule) => void;
  addRun: (run: Run) => void;
  addProject: (project: Project) => void;
  updateRun: (run: Run) => void;
  updateProject: (project: Project) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients] = useState<Client[]>(mockClients);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [runs, setRuns] = useState<Run[]>(mockRuns);
  
  const [currentClient, setCurrentClient] = useState<Client>(mockClients[0]);
  const [currentRun, setCurrentRun] = useState<Run>(mockRuns[0]);
  const [accounts, setAccounts] = useState<GLAccount[]>(mockAccounts);
  const [rules, setRules] = useState<Rule[]>(mockRules);

  const approveTransaction = (accountId: string, transactionId: string, reason: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          transactions: acc.transactions.map(t => 
            t.id === transactionId ? { ...t, isFlagged: false, overrideReason: reason, overridenBy: 'Admin' } : t
          )
        };
      }
      return acc;
    }));
  };

  const flagTransaction = (accountId: string, transactionId: string, reason: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          transactions: acc.transactions.map(t => 
            t.id === transactionId ? { ...t, isFlagged: true, overrideReason: reason, overridenBy: 'Admin' } : t
          )
        };
      }
      return acc;
    }));
  };

  const addRule = (rule: Rule) => {
    setRules(prev => [...prev, rule]);
  };

  const addRun = (run: Run) => {
    setRuns(prev => [run, ...prev]);
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const updateRun = (updatedRun: Run) => {
    setRuns(prev => prev.map(r => r.id === updatedRun.id ? updatedRun : r));
    if (currentRun.id === updatedRun.id) {
      setCurrentRun(updatedRun);
    }
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  return (
    <AppContext.Provider value={{ currentClient, setCurrentClient, clients, projects, currentRun, setCurrentRun, runs, accounts, rules, approveTransaction, flagTransaction, addRule, addRun, addProject, updateRun, updateProject }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
