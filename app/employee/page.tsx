'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  ArrowRight, 
  CheckCircle, 
  User, 
  LogOut, 
  ClipboardCheck,
  Zap,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { FACTORS } from '@/lib/constants';

export default function EmployeePage() {
  const router = useRouter();
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [endReading, setEndReading] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const cRes = await fetch('/api/cycles');
      const { activeCycle: cycle, progress: prog } = await cRes.json();
      setActiveCycle(cycle);
      setProgress(prog);

      if (cycle) {
        const [mRes, rRes] = await Promise.all([
          fetch('/api/machines'),
          fetch(`/api/readings?cycleId=${cycle.id}`)
        ]);
        setMachines(await mRes.json());
        setReadings(await rRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'employee') {
      router.push('/login');
    } else {
      fetchStatus();
    }
  }, [router, fetchStatus]);

  const handleStartCycle = async () => {
    setLoading(true);
    const res = await fetch('/api/cycles', { method: 'POST' });
    if (res.ok) {
      await fetchStatus();
    }
    setLoading(false);
  };

  const handleFinishCycle = async () => {
    if (!confirm('Deseja encerrar o ciclo atual? Certifique-se de que todas as leituras estão corretas.')) return;
    
    const res = await fetch('/api/cycles', { method: 'PUT' });
    if (res.ok) {
      setActiveCycle(null);
      setMachines([]);
      setReadings([]);
      alert('Ciclo finalizado com sucesso!');
      fetchStatus();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleSaveReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: selectedMachine.id,
        endReading: parseFloat(endReading)
      })
    });

    if (res.ok) {
      setSelectedMachine(null);
      setEndReading('');
      fetchStatus();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao salvar leitura');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const isMachineRead = (id: number) => readings.some(r => r.machine_id === id);
  const getMachineReading = (id: number) => readings.find(r => r.machine_id === id);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Ciclo de Leitura</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Funcionário</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-black">
          <LogOut size={22} />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full mb-24">
        {!activeCycle ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
              <Zap size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Pronto para começar?</h2>
              <p className="text-gray-500">Abra um novo ciclo para coletar as leituras de hoje.</p>
            </div>
            <button 
              onClick={handleStartCycle}
              disabled={loading}
              className="bg-black text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
            >
              <Play fill="white" size={20} /> Iniciar Ciclo
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-black text-white p-6 rounded-[32px] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Progresso do Ciclo</span>
                  <span className="font-mono text-xl font-bold">{progress.completed} / {progress.total}</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  />
                </div>
                {progress.completed === progress.total && progress.total > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex flex-col gap-4"
                  >
                    <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex items-center gap-3">
                      <CheckCircle className="text-emerald-400" size={24} />
                      <p className="text-sm font-medium">Todas as leituras foram concluídas!</p>
                    </div>
                    <button 
                      onClick={handleFinishCycle}
                      className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      FINALIZAR DIA
                    </button>
                  </motion.div>
                )}
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {/* Machine List */}
            <div className="grid grid-cols-1 gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-2">Máquinas para Coleta</h3>
              {machines.map((machine) => {
                const isRead = isMachineRead(machine.id);
                const reading = getMachineReading(machine.id);

                return (
                  <motion.button 
                    layout
                    key={machine.id}
                    disabled={isRead}
                    onClick={() => setSelectedMachine(machine)}
                    className={`flex items-center justify-between p-5 rounded-[24px] border transition-all ${
                      isRead 
                        ? 'bg-white border-transparent opacity-60' 
                        : 'bg-white border-gray-100 shadow-sm hover:border-black active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${
                        isRead ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'
                      }`}>
                        {machine.number}
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${isRead ? 'text-gray-400' : 'text-gray-900'}`}>
                          Máquina {machine.number}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">T{machine.type} | ESCALA 1/{FACTORS[machine.type as keyof typeof FACTORS]}</p>
                      </div>
                    </div>
                    {isRead ? (
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600 uppercase">Coletado</p>
                        <p className="font-mono font-bold text-sm">R$ {reading.amount.toFixed(2)}</p>
                      </div>
                    ) : (
                      <ChevronRight className="text-gray-300" size={24} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Reading Modal */}
      <AnimatePresence>
        {selectedMachine && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md p-8 rounded-t-[40px] sm:rounded-[40px] shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedMachine(null)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-2xl">
                  {selectedMachine.number}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Leitura Final</h3>
                  <p className="text-sm text-gray-500">Registrando movimento hoje</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl mb-8 flex justify-between items-center border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Leitura Anterior</p>
                  <p className="font-mono text-xl font-bold text-gray-900">{selectedMachine.current_reading}</p>
                </div>
                <div className="h-10 w-[1px] bg-gray-200"></div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cálculo</p>
                  <p className="text-sm font-bold text-gray-900 italic font-serif">Tipo {selectedMachine.type}</p>
                </div>
              </div>

              <form onSubmit={handleSaveReading} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 block mb-2 ml-1">Nova Leitura (Relógio)</label>
                  <input 
                    type="number"
                    step="any"
                    autoFocus
                    value={endReading}
                    onChange={(e) => setEndReading(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-6 rounded-2xl text-3xl font-mono font-bold focus:ring-2 focus:ring-black outline-none transition-all text-center"
                    placeholder="00000.00"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="rotate-180" size={18} />
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || !endReading}
                  className="w-full bg-black text-white font-bold py-5 rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-xl shadow-black/20"
                >
                  <Zap size={20} fill="white" /> Gravar Leitura
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
