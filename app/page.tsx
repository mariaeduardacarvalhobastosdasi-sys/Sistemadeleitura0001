'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (!role) {
      router.push('/login');
    } else if (role === 'manager') {
      router.push('/manager');
    } else {
      router.push('/employee');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-black rounded-xl"></div>
        <p className="text-sm font-medium text-gray-400">Carregando Gestão Pro...</p>
      </div>
    </div>
  );
}
