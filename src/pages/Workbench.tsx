import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { ArrowLeft, Building, Briefcase, FileDigit, BarChart4, MoveRight, Layers, FileSpreadsheet, Download, PanelRight, X, PlusCircle, ShieldCheck, ChevronDown, Filter, Search, AlertTriangle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

type WorkbenchStep = 'clients' | 'projects' | 'run-details';

export const Workbench: React.FC = () => {
  const { clients, projects, runs, accounts, rules, currentClient, setCurrentClient, currentRun, setCurrentRun, approveTransaction, flagTransaction, addRun, addProject, updateRun, updateProject } = useAppContext();
  
  const [step, setStep] = useState<WorkbenchStep>('clients');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Search States
  const [clientSearch, setClientSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [runSearch, setRunSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  
  // New Project Form State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPeriod, setNewProjectPeriod] = useState<'Quarterly' | 'FY'>('FY');

  // New Run / File Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [cyFile, setCyFile] = useState<File | null>(null);
  const [pyFile, setPyFile] = useState<File | null>(null);
  const [coaFile, setCoaFile] = useState<File | null>(null);

  // Sign Off Modal State
  const [runToSignOff, setRunToSignOff] = useState<any>(null);
  const [signOffReviewNotes, setSignOffReviewNotes] = useState('');

  // Pre-compute run-level aggregations
  const runRuleFreqs: Record<string, number> = {};
  let topFlaggedAccount = accounts.length > 0 ? accounts[0] : null;
  accounts.forEach(acc => {
    if (topFlaggedAccount && acc.flaggedCount > topFlaggedAccount.flaggedCount) {
        topFlaggedAccount = acc;
    }
    acc.transactions.forEach(t => {
      if (t.isFlagged) {
        t.violatedRules.forEach(r => runRuleFreqs[r] = (runRuleFreqs[r] || 0) + 1);
      }
    });
  });
  const totalRunFlags = Object.values(runRuleFreqs).reduce((a, b) => a + b, 0) || 1;

  // Synchronization between Workbench local state and Header global context
  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setCurrentClient(client);
      setStep('projects');
      setSelectedProjectId(null);
      setSelectedAccountId(null);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentRun(null);
    setSelectedAccountId(null);
    setStep('run-details');
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: `proj_${Date.now()}`,
      clientId: currentClient.id,
      name: newProjectName,
      periodType: newProjectPeriod,
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      status: 'In progress' as const,
      reviewer: 'Unassigned',
      createdAt: new Date().toISOString()
    };
    
    addProject(newProject);
    setNewProjectName('');
    setNewProjectPeriod('FY');
    setIsNewProjectModalOpen(false);
    handleProjectSelect(newProject.id); // Auto-jump into the new project
  };

  const executeNewRun = () => {
    if (!selectedProjectId) return;
    setIsExecuting(true);
    
    setTimeout(() => {
      const parentProject = projects.find(j => j.id === selectedProjectId);
      const existingRunsCount = runs.filter(r => r.projectId === selectedProjectId).length;
      const v = existingRunsCount + 1;
      
      const newRun = {
        id: `run_${Date.now()}`,
        projectId: selectedProjectId,
        name: `${parentProject?.name ? parentProject.name.split(' ')[0] : 'Review'} - v${v}`,
        timestamp: new Date().toISOString(),
        rulebookVersion: `Standard v${v}.0`,
        files: { cy: cyFile?.name || `GL_CY_v${v}.csv`, py: pyFile?.name || `GL_PY_v${v}.csv`, coa: coaFile?.name || 'COA.xlsx' },
        metrics: { totalRows: 15400, flagsFound: Math.floor(Math.random() * 200), flagsResolved: 0 }
      };
      
      addRun(newRun);
      setCurrentRun(newRun);
      setIsExecuting(false);
      setIsUploadModalOpen(false);
      setCyFile(null);
      setPyFile(null);
      setCoaFile(null);
    }, 1500);
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.industry.toLowerCase().includes(clientSearch.toLowerCase()));
  const filteredProjects = projects.filter(j => j.clientId === currentClient?.id && j.name.toLowerCase().includes(projectSearch.toLowerCase()));
  const filteredRuns = runs.filter(r => r.projectId === selectedProjectId && r.name.toLowerCase().includes(runSearch.toLowerCase()));
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const filteredAccounts = accounts.filter(a => a.accountNumber.includes(accountSearch) || a.accountName.toLowerCase().includes(accountSearch.toLowerCase()));
  const filteredTransactions = selectedAccount?.transactions.filter(t => t.description.toLowerCase().includes(transactionSearch.toLowerCase()) || (t.reference && t.reference.toLowerCase().includes(transactionSearch.toLowerCase()))) || [];

  const handleSignOff = () => {
    if (runToSignOff) {
      updateRun({ ...runToSignOff, status: 'Signed off' });
      const proj = projects.find(p => p.id === runToSignOff.projectId);
      if (proj) {
         updateProject({ ...proj, status: 'Signed off' });
      }
      setIsSignOffModalOpen(false);
      setRunToSignOff(null);
      setSignOffReviewNotes('');
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto pb-12 w-full space-y-8">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <button 
          onClick={() => { setStep('clients'); setSelectedProjectId(null); setSelectedAccountId(null); }}
          className={`hover:text-indigo-600 transition-colors ${step === 'clients' ? 'text-slate-900 font-bold' : ''}`}
        >
          Clients
        </button>
        
        {step !== 'clients' && (
          <>
            <span className="text-slate-300">/</span>
            <button 
              onClick={() => { setStep('projects'); setSelectedProjectId(null); setSelectedAccountId(null); }}
              className={`hover:text-indigo-600 transition-colors ${step === 'projects' ? 'text-slate-900 font-bold' : ''}`}
            >
              Projects ({currentClient.name})
            </button>
          </>
        )}

        {step === 'run-details' && selectedProjectId && (
          <>
            <span className="text-slate-300">/</span>
            <button 
              onClick={() => { setCurrentRun(null); setSelectedAccountId(null); }}
              className={`hover:text-indigo-600 transition-colors ${!currentRun ? 'text-slate-900 font-bold' : ''}`}
            >
              Project Versions
            </button>
            {currentRun && (
              <>
                <span className="text-slate-300">/</span>
                <button 
                  onClick={() => setSelectedAccountId(null)}
                  className={`hover:text-indigo-600 transition-colors ${!selectedAccountId ? 'text-slate-900 font-bold' : ''}`}
                >
                  {currentRun.name}
                </button>
              </>
            )}
            {selectedAccountId && selectedAccount && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-bold">{selectedAccount.accountNumber}</span>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col min-h-[500px]">
        {/* Step 1: Clients List */}
        {step === 'clients' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Select Client Node</h2>
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {filteredClients.map(client => (
                <div 
                  key={client.id} 
                  onClick={() => handleClientSelect(client.id)}
                  className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100/60 hover:border-indigo-100 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.1)] cursor-pointer transition-all duration-300 group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#f4f7fe] flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300 shrink-0">
                      <Building className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      {client.industry}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-6 leading-tight">{client.name}</h3>
                  <div className="flex items-center justify-between border-t border-slate-100/80 pt-4 mt-auto">
                    <span className="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0 duration-300">Open Node</span>
                    <MoveRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Projects List */}
        {step === 'projects' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex items-center justify-between mb-8">
               <div>
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                   {currentClient.name} Projects
                 </h2>
                 <p className="text-slate-500 font-medium text-sm">Select an active audit engagement to view results.</p>
               </div>
               
               <div className="flex items-center gap-4">
                 <div className="relative w-64">
                   <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input 
                     type="text" 
                     placeholder="Search projects..." 
                     value={projectSearch}
                     onChange={e => setProjectSearch(e.target.value)}
                     className="w-full pl-9 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                   />
                 </div>
                 <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
                  <DialogTrigger render={<Button className="bg-indigo-600 text-white font-bold h-10 px-5 hover:bg-indigo-700 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200" />}>
                      <PlusCircle className="w-4 h-4" /> New Project
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-slate-900 mb-1">Create New Project</DialogTitle>
                      <DialogDescription className="text-sm font-medium text-slate-500">
                        Add a new audit engagement project for '{currentClient.name}'.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 mt-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project Name</label>
                        <input 
                          type="text" 
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="e.g. FY 2024-25" 
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900" 
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reporting Period</label>
                        <select 
                          value={newProjectPeriod}
                          onChange={(e) => setNewProjectPeriod(e.target.value as 'Quarterly' | 'FY')}
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900" 
                        >
                          <option value="FY">Financial Year End</option>
                          <option value="Quarterly">Quarterly</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                      <Button variant="ghost" onClick={() => setIsNewProjectModalOpen(false)} className="font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl">Cancel</Button>
                      <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">Create Project</Button>
                    </div>
                  </DialogContent>
               </Dialog>
               </div>
               
             </div>
             
             <div className="bg-white w-full border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8fafc] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">Project Name</th>
                      <th className="px-6 py-4 font-bold">Period</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 text-right font-bold">View Runs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredProjects.map(project => (
                      <tr 
                        key={project.id} 
                        onClick={() => handleProjectSelect(project.id)}
                        className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                      >
                        <td className="px-6 py-4 align-middle">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium align-middle">
                          {project.periodType}: {new Date(project.periodStart).toLocaleDateString()} - {new Date(project.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${project.status === 'In progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' : project.status === 'Signed off' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right align-middle">
                           <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center ml-auto group-hover:bg-indigo-50 transition-colors">
                             <MoveRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                           </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProjects.length === 0 && (
                      <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-medium bg-white">No projects found. Create one to begin an audit engagement.</td></tr>
                    )}
                  </tbody>
                </table>
             </div>
             
             {/* Action Logs Removed */}
          </div>
        )}

        {/* Step 3: Run Accounts & Drill-down */}
        {step === 'run-details' && (
          <div className="flex flex-col h-full bg-transparent relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
            
            {currentRun && !selectedAccountId && filteredRuns.length > 0 && (
               <div className="flex gap-6 w-full shrink-0 pt-2 px-1">
                 <div className="flex-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -top-10 left-10 w-48 h-32 bg-indigo-400 blur-[80px] opacity-20 rounded-full z-0"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-6 relative z-10 border border-slate-200">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                        {accounts.length}
                      </h2>
                      <p className="text-slate-500 font-medium text-sm">Total Accounts</p>
                    </div>
                 </div>

                 <div className="flex-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -top-10 right-0 w-64 h-32 bg-red-400 blur-[80px] opacity-10 rounded-full"></div>
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6 relative z-10 border border-red-100/50">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                        {accounts.filter(a => a.flaggedCount > 0).length}
                      </h2>
                      <p className="text-slate-500 font-medium text-sm">Flagged Accounts</p>
                    </div>
                 </div>

                 <div className="flex-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-48 h-32 bg-emerald-400 blur-[80px] opacity-20 rounded-full z-0"></div>
                     <div className="absolute bottom-0 -left-10 w-48 h-32 bg-cyan-400 blur-[80px] opacity-10 rounded-full z-0"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 relative z-10 border border-emerald-100/50">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                        {accounts.filter(a => a.flaggedCount === 0).length}
                      </h2>
                      <p className="text-slate-500 font-medium text-sm">Passed Accounts</p>
                    </div>
                 </div>

                 <div className="flex-1 bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -bottom-10 right-0 w-48 h-32 bg-amber-400 blur-[80px] opacity-20 rounded-full"></div>
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6 relative z-10 border border-amber-200/50">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                        {currentRun.metrics.overrides || 0}
                      </h2>
                      <p className="text-slate-500 font-medium text-sm">Warnings <span className="text-[11px] font-normal opacity-70 ml-1">(No Rules Applied)</span></p>
                    </div>
                 </div>
               </div>
            )}

            <div className={`border-slate-100 rounded-2xl flex-1 overflow-hidden flex flex-col ${currentRun ? 'bg-white border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]' : 'bg-transparent'}`}>
              {currentRun && (
              <div className="p-4 border-b border-slate-100/80 flex items-center justify-between bg-white z-20 relative">
                <div className="flex items-center gap-3">
                  {selectedAccountId && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-50 rounded-lg shrink-0" onClick={() => setSelectedAccountId(null)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  {!selectedAccountId ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">{!currentRun ? 'Project Versions' : 'Project Results'}</h4>
                    </div>
                  ) : (
                    <h4 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                       </div>
                      {selectedAccount?.accountNumber} <span className="font-medium text-slate-500">· {selectedAccount?.accountName}</span>
                    </h4>
                  )}
                </div>
                {!selectedAccountId && (
                   <div className="flex items-center gap-3">
                       {filteredRuns.length > 0 && (
                         <div className="flex gap-2 items-center mr-2 relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Search accounts..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className="pl-8 pr-3 text-xs border border-slate-200 rounded-lg h-9 outline-none w-48 font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm bg-white" />
                         </div>
                       )}
                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 rounded-lg shadow-sm" onClick={() => alert("Simulating export for " + currentRun.name)}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export Results
                      </Button>
                      
                      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                        <DialogTrigger render={<Button size="sm" className="h-8 text-[11px] font-bold px-4 rounded-lg shadow-sm transition-all focus:outline-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-px" />}>
                           Execute New Version
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-slate-100 shadow-2xl">
                           <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-slate-900">Upload Files for New Run</DialogTitle>
                              <DialogDescription className="text-slate-500 font-medium">Provide the current year, previous year, and chart of accounts to execute a new test version.</DialogDescription>
                           </DialogHeader>

                           <div className="space-y-4 py-4">
                             {[
                               { label: 'Current Year GL', state: cyFile, setter: setCyFile },
                               { label: 'Previous Year GL', state: pyFile, setter: setPyFile },
                               { label: 'Chart of Accounts', state: coaFile, setter: setCoaFile },
                             ].map((uploadItem, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if(file) uploadItem.setter(file);
                                  };
                                  input.click();
                                }}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                      <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900 text-sm">{uploadItem.label}</span>
                                      <span className="text-xs font-medium text-slate-500">
                                        {uploadItem.state ? uploadItem.state.name : 'Click to select CSV/Excel file'}
                                      </span>
                                    </div>
                                  </div>
                                  {uploadItem.state ? (
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <PlusCircle className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                             ))}
                           </div>

                           <div className="flex justify-end pt-4 border-t border-slate-100 gap-3 mt-2">
                              <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                              <Button 
                                onClick={executeNewRun} 
                                disabled={isExecuting || (!cyFile && runs.length === 0)}
                                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl transition-all shadow-md ${isExecuting ? 'opacity-80' : ''}`}
                              >
                                {isExecuting ? 'Processing...' : 'Run Diagnostics'}
                              </Button>
                           </div>
                        </DialogContent>
                      </Dialog>



                      <div className="w-px h-6 bg-slate-200 mx-1" />
                     <Button variant="ghost" size="icon" className={`h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors ${isSidebarOpen ? 'bg-indigo-50 text-indigo-600' : ''}`} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                       <PanelRight className="w-4 h-4" />
                     </Button>
                  </div>
                )}
                {selectedAccountId && (
                  <div className="flex items-center gap-3">
                     <Button variant="ghost" size="icon" className={`h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors ${isSidebarOpen ? 'bg-indigo-50 text-indigo-600' : ''}`} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                       <PanelRight className="w-4 h-4" />
                     </Button>
                  </div>
                )}
              </div>
              )}

              {filteredRuns.length === 0 ? (
                 <div className="flex-1 p-16 text-center flex flex-col items-center justify-center m-8 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-indigo-50/50 rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-indigo-100/50">
                       <FileDigit className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">No intelligence gathered yet</h3>
                    <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">Execute the initial run for this project by providing the current year GL, previous year GL, and Chart of Accounts.</p>
                    <Button onClick={() => setIsUploadModalOpen(true)} disabled={isExecuting} className={`h-12 px-8 rounded-xl font-bold text-sm shadow-xl transition-all duration-300 ${isExecuting ? 'bg-indigo-400 cursor-not-allowed shadow-indigo-100 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5'}`}>
                       Execute Initial Run
                    </Button>
                 </div>
              ) : (
                <>
                  <div className="flex-1 overflow-x-auto relative bg-slate-50/30">
                  <AnimatePresence mode="wait">
                    {!currentRun ? (
                      <motion.div
                        key="versions-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="w-full h-full bg-transparent relative mt-3 flex flex-col gap-6"
                      >
                         <div className="flex items-center justify-between">
                           <div>
                             <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                               {currentClient?.name} — {projects.find(p => p.id === selectedProjectId)?.name}
                             </h3>
                             <p className="text-sm font-medium text-slate-500 mt-1">
                               {filteredRuns.length} runs · {projects.find(p => p.id === selectedProjectId)?.status}
                             </p>
                           </div>
                           <div className="flex items-center gap-4">
                             <div className="relative w-64">
                               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                               <input 
                                 type="text" 
                                 placeholder="Search runs..." 
                                 value={runSearch}
                                 onChange={e => setRunSearch(e.target.value)}
                                 className="w-full pl-9 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                               />
                             </div>
                             <Button onClick={() => setIsUploadModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 rounded-xl shadow-md flex items-center gap-2 transition-all">
                               <PlusCircle className="w-4 h-4" /> New Test Run
                             </Button>
                           </div>
                         </div>
                         <div className="flex flex-col gap-4 overflow-y-auto pb-8">
                           {filteredRuns.map((run, index) => {
                             const totalBaseFlags = run.metrics.flagsFound + run.metrics.flagsResolved; // baseline
                             const resolvedPct = totalBaseFlags > 0 ? Math.round((run.metrics.flagsResolved / totalBaseFlags) * 100) : 0;
                             
                             return (
                               <div 
                                 key={run.id}
                                 onClick={() => { setCurrentRun(run); setSelectedAccountId(null); }}
                                 className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
                               >
                                 <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
                                 
                                 <div className="flex justify-between items-start mb-6">
                                   <div>
                                     <div className="flex items-center gap-3 mb-2">
                                       <h4 className="font-bold text-lg text-slate-900">{run.name}</h4>
                                       {index === 0 && <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-100">Latest</span>}
                                       <span className="text-slate-400 text-sm font-medium">·</span>
                                       <span className="text-slate-500 text-sm font-medium">
                                         {new Date(run.timestamp).toLocaleDateString()} · {new Date(run.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                       </span>
                                     </div>
                                     <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${run.status === 'Ready for review' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                          {run.status}
                                        </span>
                                        <span className="text-[12px] font-medium text-slate-400 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Rulebook: GL Scrutiny</span>
                                     </div>
                                   </div>
                                    <div className="flex items-center gap-3">
                                      {run.status === 'Ready for review' && (
                                        <>
                                          <Dialog open={runToSignOff?.id === run.id} onOpenChange={(val) => { if(val) setRunToSignOff(run); else setRunToSignOff(null);}}>
                                            <DialogTrigger render={<Button variant="outline" className="h-9 px-4 text-xs font-bold bg-white text-slate-700 hover:text-slate-900 shadow-sm rounded-xl" onClick={(e) => { e.stopPropagation(); }} />}>
                                              Reviewer sign-off ↗
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
                                              <div className="p-6">
                                                <h3 className="font-bold text-slate-900 text-xl tracking-tight mb-2">Reviewer Sign-off</h3>
                                                <p className="text-sm font-medium text-slate-500 mb-6">You are about to sign off on <strong>{run.name}</strong>. This will mark the version and its project as completed.</p>
                                                <div className="flex flex-col gap-2 mb-8">
                                                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Review Notes (Optional)</label>
                                                   <textarea
                                                      className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-medium text-slate-900"
                                                      placeholder="Add any final notes or observations..."
                                                      value={signOffReviewNotes}
                                                      onChange={(e) => setSignOffReviewNotes(e.target.value)}
                                                      onClick={e => e.stopPropagation()}
                                                   />
                                                </div>
                                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                                   <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setRunToSignOff(null); }} className="font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl">Cancel</Button>
                                                   <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 rounded-xl shadow-md" onClick={(e) => { e.stopPropagation(); handleSignOff(); }}>Yes, Sign Off</Button>
                                                </div>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                          <Button variant="outline" className="h-9 px-4 text-xs font-bold bg-white text-slate-700 hover:text-slate-900 shadow-sm rounded-xl" onClick={(e) => e.stopPropagation()}>Export report ↗</Button>
                                        </>
                                      )}
                                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors border border-slate-100">
                                        <MoveRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                      </div>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-5 gap-6 border-t border-slate-100 pt-6">
                                   <div className="flex flex-col">
                                     <span className="text-2xl font-bold text-slate-900 mb-1">{run.metrics.totalRows.toLocaleString()}</span>
                                     <span className="text-sm font-medium text-slate-500">Total transactions</span>
                                   </div>
                                   <div className="flex flex-col border-l border-slate-100 pl-6">
                                     <div className="flex items-end gap-2 mb-1">
                                        <span className="text-2xl font-bold text-red-600 leading-none">{run.metrics.flagsFound.toLocaleString()}</span>
                                        {run.metrics.flagsDiff && (
                                          <span className={`text-sm font-bold pb-0.5 ${run.metrics.flagsDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {run.metrics.flagsDiff > 0 ? '+' : ''}{run.metrics.flagsDiff}
                                          </span>
                                        )}
                                     </div>
                                     <span className="text-sm font-medium text-slate-500">Flagged</span>
                                   </div>
                                   <div className="flex flex-col border-l border-slate-100 pl-6">
                                     <span className="text-2xl font-bold text-slate-900 mb-1">{run.metrics.passed?.toLocaleString() || (run.metrics.totalRows - run.metrics.flagsFound).toLocaleString()}</span>
                                     <span className="text-sm font-medium text-slate-500">Passed</span>
                                   </div>
                                   <div className="flex flex-col border-l border-slate-100 pl-6">
                                     <span className="text-2xl font-bold text-slate-900 mb-1">{run.metrics.overrides?.toLocaleString() || 0}</span>
                                     <span className="text-sm font-medium text-slate-500">Warnings</span>
                                   </div>
                                   <div className="flex flex-col justify-center border-l border-slate-100 pl-6">
                                      <span className="text-sm font-bold text-slate-700 mb-2">
                                        {run.metrics.flagsResolved} of {totalBaseFlags} resolved {totalBaseFlags > 0 ? `(${resolvedPct}%)` : ''}
                                        {run.metrics.flagsFound > 0 && totalBaseFlags > 0 ? ` · ${run.metrics.flagsFound} remaining` : ''}
                                      </span>
                                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                         <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${resolvedPct}%` }}></div>
                                      </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                      </motion.div>
                    ) : !selectedAccountId ? (
                      <motion.div
                        key="account-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="w-full h-full bg-white relative rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] mt-3 overflow-hidden flex flex-col"
                      >
                          <div className="p-4 bg-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-100 shrink-0">
                             <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center w-full justify-between">
                               <h3 className="font-bold text-slate-900 tracking-tight text-lg">GL Accounts</h3>
                               <div className="flex flex-wrap gap-2 items-center">
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer">Data Views <ChevronDown className="w-3 h-3 ml-1" /></Button>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer"><Filter className="w-3 h-3 mr-1.5 text-slate-400" /> Filters</Button>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer ml-auto"><Download className="w-3 h-3 mr-1.5 text-slate-400" /> Export All</Button>
                               </div>
                             </div>
                          </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full border-collapse text-left bg-white">
                          <thead className="sticky top-0 bg-white text-[12px] font-medium text-slate-500 capitalize tracking-wide border-b border-slate-100 z-10">
                            <tr>
                              <th className="px-5 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 w-4 h-4 accent-indigo-600 focus:ring-indigo-500 cursor-pointer" /></th>
                              <th className="px-3 py-4 font-medium">GL Account & Description</th>
                              <th className="px-3 py-4 font-medium">Category</th>
                              <th className="px-3 py-4 font-medium">Total Rows</th>
                              <th className="px-3 py-4 font-medium">Flagged</th>
                              <th className="px-3 py-4 font-medium text-center">Status</th>
                              <th className="px-3 py-4 font-medium">Total Value (CY)</th>
                              <th className="px-5 py-4 font-medium text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm text-slate-600 divide-y divide-slate-50">
                            {filteredAccounts.map(account => (
                              <tr 
                                key={account.id} 
                                onClick={() => setSelectedAccountId(account.id)}
                                className={`transition-colors cursor-pointer hover:bg-slate-50/50 ${account.status === 'flagged' ? 'bg-orange-50/30' : ''}`}
                              >
                                <td className="px-5 py-4 align-middle"><input type="checkbox" className="rounded border-slate-300 w-4 h-4 accent-indigo-600 focus:ring-indigo-500 cursor-pointer" onClick={(e) => e.stopPropagation()} /></td>
                                <td className="px-3 py-4 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                      <Briefcase className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{account.accountNumber} - {account.accountName}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-4 align-middle text-slate-500">Operating</td>
                                <td className="px-3 py-4 font-medium align-middle">{account.totalRows.toLocaleString()}</td>
                                <td className="px-3 py-4 align-middle">
                                  {account.flaggedCount > 0 ? (
                                    <span className="text-orange-600 font-bold">
                                      {account.flaggedCount} Flags
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">0 Flags</span>
                                  )}
                                </td>
                                <td className="px-3 py-4 text-center align-middle">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${account.status === 'flagged' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {account.status === 'flagged' ? 'Pending Review' : 'Completed'}
                                  </span>
                                </td>
                                <td className="px-3 py-4 font-medium text-slate-900 align-middle">
                                  ${(account.totalValue/1000).toLocaleString(undefined, { minimumFractionDigits: 1 })}k
                                </td>
                                <td className="px-5 py-4 text-right align-middle">
                                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center ml-auto hover:bg-slate-200 transition-colors border border-slate-200">
                                    <MoveRight className="w-4 h-4 text-slate-500 hover:text-slate-700 transition-colors" />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="transaction-detail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="w-full flex h-full"
                      >
                        {/* Left side: Transactions Table */}
                        <div className="flex-1 overflow-x-auto bg-white relative rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] mt-3">
                          <div className="p-4 bg-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-100">
                             <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center w-full justify-between">
                               <h3 className="font-bold text-slate-900 tracking-tight text-lg">Transactions</h3>
                               <div className="flex flex-wrap gap-2 items-center">
                                 <div className="relative w-56 mr-2">
                                   <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                   <input type="text" placeholder="Search transactions..." value={transactionSearch} onChange={e => setTransactionSearch(e.target.value)} className="pl-8 pr-3 text-xs border border-slate-200 rounded-lg h-9 outline-none w-full font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm bg-white" />
                                 </div>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer">Data Views <ChevronDown className="w-3 h-3 ml-1" /></Button>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer"><Filter className="w-3 h-3 mr-1.5 text-slate-400" /> Filters</Button>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer">Date <ChevronDown className="w-3 h-3 ml-1" /></Button>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer">Keywords <ChevronDown className="w-3 h-3 ml-1" /></Button>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer">Amount <ChevronDown className="w-3 h-3 ml-1" /></Button>
                                 <Button variant="outline" size="sm" className="h-9 text-xs font-medium text-slate-600 bg-white shadow-sm border-slate-200 hover:bg-slate-50 cursor-pointer ml-auto"><Download className="w-3 h-3 mr-1.5 text-slate-400" /> Export All</Button>
                               </div>
                             </div>
                          </div>
                          <table className="w-full text-sm border-collapse text-left">
                            <thead className="bg-white text-[12px] font-medium text-slate-500 capitalize tracking-wide border-b border-slate-100 sticky top-[69px] z-10">
                              <tr>
                                <th className="px-5 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 w-4 h-4 accent-indigo-600 focus:ring-indigo-500 cursor-pointer" /></th>
                                <th className="px-3 py-4 font-medium">Date</th>
                                <th className="px-3 py-4 font-medium">Account Code</th>
                                <th className="px-3 py-4 font-medium">Account Type</th>
                                <th className="px-3 py-4 font-medium">Account</th>
                                <th className="px-3 py-4 font-medium">Source</th>
                                <th className="px-3 py-4 font-medium">Description</th>
                                <th className="px-3 py-4 font-medium">Reference</th>
                                <th className="px-3 py-4 text-right font-medium">Debit</th>
                                <th className="px-3 py-4 text-right font-medium">Credit</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white text-sm divide-y divide-slate-50">
                              {filteredTransactions.map(tx => (
                                <tr key={tx.id} className={`hover:bg-slate-50/50 transition-colors ${tx.isFlagged ? 'bg-orange-50/30 hover:bg-orange-50/50' : ''}`}>
                                  <td className="px-5 py-4 align-middle"><input type="checkbox" className="rounded border-slate-300 w-4 h-4 accent-indigo-600 focus:ring-indigo-500 cursor-pointer" /></td>
                                  <td className="px-3 py-4 whitespace-nowrap text-slate-600 align-middle">
                                    {new Date(tx.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-4 text-slate-600 font-medium align-middle">
                                    {tx.accountCode}
                                  </td>
                                  <td className="px-3 py-4 text-slate-600 align-middle">
                                    {tx.accountType}
                                  </td>
                                  <td className="px-3 py-4 text-slate-600 align-middle">
                                    {tx.account}
                                  </td>
                                  <td className="px-3 py-4 text-slate-600 align-middle">
                                    {tx.source}
                                  </td>
                                  <td className="px-3 py-4 text-slate-900 font-medium align-middle truncate max-w-[150px]">
                                    {tx.description}
                                  </td>
                                  <td className="px-3 py-4 text-slate-500 align-middle">
                                    {tx.reference}
                                  </td>
                                  <td className="px-3 py-4 text-right text-slate-900 font-medium align-middle">
                                    {tx.debit !== null ? `$${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                  </td>
                                  <td className="px-3 py-4 text-right text-slate-900 font-medium align-middle">
                                    {tx.credit !== null ? `$${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Animated Right Sidebar */}
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: 320 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 320 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      className="absolute right-0 top-[73px] bottom-0 w-[400px] bg-white shadow-[-20px_0_40px_rgba(30,41,59,0.08)] border-l border-slate-100/80 z-30 flex flex-col"
                    >
                      <div className="p-6 border-b border-slate-100/80 bg-white flex items-center justify-between shrink-0">
                         <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><BarChart4 className="w-5 h-5 text-indigo-600" /> {selectedAccountId ? 'Account Intel' : 'Run Summary'}</h3>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
                           <X className="w-5 h-5" />
                         </Button>
                      </div>
                      
                      <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        {selectedAccountId ? (
                           <>
                             <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Account Status</p>
                               <div className="flex items-center gap-3">
                                 <div className="flex-1">
                                   <div className={`px-4 py-2 inline-block rounded-lg text-sm font-bold uppercase tracking-widest border ${selectedAccount?.status === 'flagged' ? 'bg-red-50 text-red-700 border-red-200 shadow-[0_2px_10px_rgba(239,68,68,0.1)]' : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_2px_10px_rgba(16,185,129,0.1)]'}`}>
                                     {selectedAccount?.status}
                                   </div>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Flagged Value Impact</p>
                               <h4 className="font-mono text-3xl font-bold text-slate-900 mb-2">
                                 ${((selectedAccount?.transactions.filter(t=>t.isFlagged).reduce((s,t)=>s+t.amount,0) || 0) / 1000).toFixed(1)}k
                               </h4>
                               <p className="text-xs text-slate-500 font-medium">Out of ${(selectedAccount?.totalValue || 0).toLocaleString()} total value</p>
                             </div>

                             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5">Top Triggered Rules</p>
                               <div className="space-y-4">
                                 {(() => {
                                    const freqs: Record<string, number> = {};
                                    selectedAccount?.transactions.forEach(t => {
                                      if (t.isFlagged) {
                                        t.violatedRules.forEach(r => freqs[r] = (freqs[r] || 0) + 1);
                                      }
                                    });
                                    return Object.entries(freqs).sort((a,b)=>b[1]-a[1]).map(([ruleId, count]) => {
                                      const rule = rules.find(r => r.id === ruleId);
                                      return (
                                        <div key={ruleId} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                                          <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 text-xs">{ruleId}</span>
                                              <span className="font-medium text-slate-600 truncate max-w-[160px] text-xs">{rule?.name}</span>
                                            </span>
                                            <span className="font-bold text-slate-900 bg-white shadow-sm border border-slate-100 px-2 py-1 rounded-md text-xs">{count} flags</span>
                                          </div>
                                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(count / (selectedAccount?.flaggedCount || 1)) * 100}%` }}></div>
                                          </div>
                                        </div>
                                      )
                                    });
                                 })()}
                                 {selectedAccount?.flaggedCount === 0 && <p className="text-xs text-slate-400 font-medium">No active rule violations directly impacting this account.</p>}
                               </div>
                             </div>
                           </>
                        ) : (
                           <>
                             {/* Run-Level intel */}
                             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] mb-6">
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">Top Flagged Node</p>
                               {topFlaggedAccount && topFlaggedAccount.flaggedCount > 0 ? (
                                 <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50">
                                   <p className="font-bold text-slate-900 border-b border-red-100 pb-3 mb-3">
                                     {topFlaggedAccount.accountNumber} <span className="font-medium text-slate-500 ml-1 block text-xs mt-1">{topFlaggedAccount.accountName}</span>
                                   </p>
                                   <div className="flex gap-4">
                                      <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Flags</p>
                                        <p className="text-xl font-bold text-red-600">{topFlaggedAccount.flaggedCount}</p>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                         <p className="text-xs font-bold text-red-600 uppercase mt-2 bg-red-100/50 inline-block px-2 py-0.5 rounded">{topFlaggedAccount.status}</p>
                                      </div>
                                   </div>
                                 </div>
                               ) : (
                                  <p className="text-xs text-slate-400 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">No flags in this active engagement run.</p>
                               )}
                             </div>

                             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5">Top Risk Categories</p>
                               <div className="space-y-5">
                                 {Object.entries(runRuleFreqs).sort((a,b)=>b[1]-a[1]).map(([ruleId, count]) => {
                                    const rule = rules.find(r => r.id === ruleId);
                                    return (
                                      <div key={ruleId} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-start justify-between text-sm mb-3">
                                          <div className="flex flex-col gap-1 max-w-[200px]">
                                              <span className="font-bold text-slate-800">{ruleId}</span>
                                              <span className="font-medium text-slate-500 leading-tight text-xs">{rule?.name}</span>
                                          </div>
                                          <span className="font-bold text-red-600 bg-red-50 text-xs px-2 py-1 rounded inline-flex shrink-0 shadow-sm border border-red-100">{count} flags</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                          <div className="bg-red-500 h-full rounded-full" style={{ width: `${(count / totalRunFlags) * 100}%` }}></div>
                                        </div>
                                      </div>
                                    )
                                 })}
                                 {Object.keys(runRuleFreqs).length === 0 && <p className="text-xs text-slate-400 font-medium">No flags triggered any risk templates.</p>}
                               </div>
                             </div>
                           </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
        )}

      </div>
    </div>
  );
};
