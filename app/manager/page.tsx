'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FACTORS } from '@/lib/constants';

export default function ManagerPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'machines' | 'history'>('dashboard');
  
  // Registration Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newType, setNewType] = useState('1');
  const [newInitial, setNewInitial] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [mRes, rRes] = await Promise.all([
        fetch('/api/machines'),
        fetch('/api/reports')
      ]);
      const mData = await mRes.json();
      const rData = await rRes.json();
      setMachines(mData);
      setReports(rData);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'manager') {
      router.push('/login');
    } else {
      fetchData();
    }
  }, [router, fetchData]);

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: newNumber,
        type: parseInt(newType),
        initial_reading: parseFloat(newInitial)
      })
    });

    if (res.ok) {
      setShowAddForm(false);
      setNewNumber('');
      setNewInitial('');
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao cadastrar');
    }
  };

  const handleDeleteMachine = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta máquina?')) return;
    
    await fetch(`/api/machines?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-black text-white p-6 flex flex-col shrink-0">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black">GP</div>
          <h1 className="font-bold text-xl tracking-tight">Gestão Pro</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Máquinas" 
            active={activeTab === 'machines'} 
            onClick={() => setActiveTab('machines')} 
          />
          <NavItem 
            icon={<Calendar size={20} />} 
            label="Histórico" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 p-3 text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 capitalize">
            {activeTab === 'dashboard' ? 'Resumo Financeiro' : activeTab === 'machines' ? 'Gestão de Máquinas' : 'Histórico de Ciclos'}
          </h2>
          <p className="text-gray-500">Bem-vindo, Gerente.</p>
        </header>

        {activeTab === 'dashboard' && reports && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                label="Total do Dia" 
                value={reports.day} 
                icon={<TrendingUp className="text-emerald-500" />} 
                trend="+12%"
              />
              <StatCard 
                label="Total da Semana" 
                value={reports.week} 
                icon={<Layers className="text-blue-500" />} 
              />
              <StatCard 
                label="Total do Mês" 
                value={reports.month} 
                icon={<Calendar className="text-purple-500" />} 
              />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 italic font-serif">Últimos Movimentos</h3>
              <div className="space-y-4">
                {reports.history.map((cycle: any) => (
                  <div key={cycle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      {cycle.is_open ? (
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                          <AlertCircle size={20} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={20} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">Ciclo #{cycle.id}</p>
                        <p className="text-xs text-gray-500">
                          {cycle.is_open ? 'Em andamento' : `Finalizado em ${new Date(cycle.closed_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cycle.total_amount || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'machines' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{machines.length} Máquinas Ativas</h3>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
              >
                <Plus size={20} /> Nova Máquina
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {machines.map((machine) => (
                <motion.div 
                  layout
                  key={machine.id}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl">
                      {machine.number}
                    </div>
                    <button 
                      onClick={() => handleDeleteMachine(machine.id)}
                      className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tipo de Máquina</span>
                      <span className="font-bold">T{machine.type} (Div {FACTORS[machine.type as keyof typeof FACTORS]})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Contador Atual</span>
                      <span className="font-mono font-semibold">{machine.current_reading}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Modal de Cadastro */}
            <AnimatePresence>
              {showAddForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-md p-8 rounded-[40px] shadow-2xl"
                  >
                    <h3 className="text-2xl font-bold mb-6">Cadastrar Máquina</h3>
                    <form onSubmit={handleAddMachine} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Número da Máquina</label>
                        <input 
                          autoFocus
                          value={newNumber}
                          onChange={(e) => setNewNumber(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none"
                          placeholder="Ex. 05"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Tipo / Escala</label>
                        <select 
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none"
                        >
                          <option value="1">Tipo 1 (Div/100)</option>
                          <option value="2">Tipo 2 (Div/10)</option>
                          <option value="3">Tipo 3 (Div/4)</option>
                          <option value="4">Tipo 4 (Sem Div)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Relógio Inicial</label>
                        <input 
                          type="number"
                          step="any"
                          value={newInitial}
                          onChange={(e) => setNewInitial(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none font-mono"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      {error && <p className="text-red-500 text-sm">{error}</p>}

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <button 
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="p-4 rounded-2xl font-bold bg-gray-100 hover:bg-gray-200 transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          className="p-4 rounded-2xl font-bold bg-black text-white hover:bg-gray-800 transition-all shadow-lg shadow-black/20"
                        >
                          Salvar
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl font-medium transition-all ${
        active 
          ? 'bg-white text-black shadow-lg shadow-white/5' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: any, trend?: string }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-2xl">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900 font-mono tracking-tighter">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
        </p>
      </div>
    </div>
  );
}
