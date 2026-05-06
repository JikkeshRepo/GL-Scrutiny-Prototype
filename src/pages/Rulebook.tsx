import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppContext } from '../context/AppContext';
import { Sparkles, Code2, Layers, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

export const Rulebook: React.FC = () => {
  const { rules, addRule } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedLogic, setGeneratedLogic] = useState("");
  const [name, setName] = useState("");
  const [ruleSearch, setRuleSearch] = useState("");

  const filteredRules = rules.filter(r => r.name.toLowerCase().includes(ruleSearch.toLowerCase()) || r.description.toLowerCase().includes(ruleSearch.toLowerCase()) || r.id.toLowerCase().includes(ruleSearch.toLowerCase()));

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedLogic(`def evaluate(transaction):\n    # AI Generated Logic\n    if transaction.department == 'Marketing' and transaction.amount > 50000:\n        return True\n    return False`);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSave = () => {
    if (name && generatedLogic) {
      addRule({
        id: `R00${rules.length + 1}`,
        name,
        description: prompt || 'Custom generated rule',
        status: 'active',
        severity: 'medium',
        pythonCode: generatedLogic
      });
      setPrompt("");
      setGeneratedLogic("");
      setName("");
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto pb-12 w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rulebook Node</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage and generate AI-powered rules for GL scrutiny.</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button className="gap-2 bg-indigo-600 font-bold hover:bg-indigo-700 text-white rounded-xl px-5 h-10 shadow-lg shadow-indigo-200 transition-all" />}>
            <Sparkles className="w-4 h-4" />
            Generate Rule
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border-slate-100 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900 font-bold mb-1">AI Rule Generator</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Describe the anomaly or pattern you want to flag in natural language.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 mt-2">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Rule Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Excessive Marketing Spend" className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prompt" className="text-slate-500 font-bold text-[11px] uppercase tracking-wider mt-2">Rule Description</Label>
                <div className="relative">
                  <Input 
                    id="prompt" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Flag marketing expenses over $50k" 
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900 pr-[110px]"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !prompt}
                    className="absolute right-1.5 top-1.5 h-8 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-200"
                  >
                    {isGenerating ? 'Thinking...' : 'Generate Code'}
                  </Button>
                </div>
              </div>
              
              {generatedLogic && (
                <div className="grid gap-2 mt-4">
                  <Label className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-wider"><Code2 className="w-4 h-4 text-indigo-500" /> Generated Logic</Label>
                  <pre className="p-5 rounded-xl bg-[#0f172a] text-indigo-300 text-[13px] font-mono overflow-x-auto shadow-inner border border-slate-800">
                    {generatedLogic}
                  </pre>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="submit" onClick={handleSave} disabled={!generatedLogic || !name} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all">Save Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 blur-[100px] opacity-[0.03] rounded-full point-events-none"></div>
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Standard Integrity Rulebook
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Foundational rules for general ledger anomaly detection.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                 type="text" 
                 placeholder="Search rules..." 
                 value={ruleSearch}
                 onChange={e => setRuleSearch(e.target.value)}
                 className="w-full pl-9 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-100 text-xs shadow-sm">
              {rules.length} Active Rules
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredRules.map(rule => (
            <div key={rule.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-indigo-200 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.08)] hover:bg-white transition-all duration-300">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${
                  rule.severity === 'high' ? 'bg-orange-500' : 
                  rule.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>
              <div className="flex justify-between items-start mb-4 mt-1">
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-white shadow-sm px-2.5 py-1 rounded-md uppercase border border-slate-200">
                  {rule.id}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${rule.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {rule.status}
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">{rule.name}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed font-medium mb-4 flex-1">
                {rule.description}
              </p>
              
              {rule.pythonCode && (
                 <div className="bg-[#0f172a] rounded-xl p-3 mb-4 overflow-x-auto shadow-inner border border-slate-700/50">
                    <pre className="text-[11px] font-mono text-indigo-300 leading-relaxed">
                       {rule.pythonCode}
                    </pre>
                 </div>
              )}

              <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center mt-auto">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Severity</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm ${
                  rule.severity === 'high' ? 'text-orange-700 bg-orange-50 border border-orange-100' : 
                  rule.severity === 'medium' ? 'text-amber-700 bg-amber-50 border border-amber-100' : 'text-slate-600 bg-white border border-slate-200'
                }`}>
                  {rule.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
