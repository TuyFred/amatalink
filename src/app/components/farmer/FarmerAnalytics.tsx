import React, { useEffect, useState } from 'react';
import { milkApi } from '../../api';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';

export default function FarmerAnalytics(){
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try{
      const records = await milkApi.getFarmerRecords();
      const map = new Map<string, number>();
      (records||[]).forEach((r:any)=>{
        const d = new Date(r.collection_date).toLocaleDateString();
        map.set(d, (map.get(d)||0) + Number(r.liters));
      });
      const data = Array.from(map.entries()).map(([date, liters])=>({ date, liters }));
      setSeries(data.reverse());
    }catch(e:any){ toast.error('Failed to load analytics: '+(e.message||e)); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4">Analytics</h3>
      {loading ? <div>Loading...</div> : (
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <XAxis dataKey="date" tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="liters" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
