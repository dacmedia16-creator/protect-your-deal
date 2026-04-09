const KPICard = ({ label, value, change, positive = true }: { label: string; value: string; change: string; positive?: boolean }) => (
  <div className="bg-[#1E293B] rounded-lg p-3 border border-white/5">
    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
    <p className={`text-[10px] mt-1 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>{change}</p>
  </div>
);

const FunnelBar = ({ label, value, width, color }: { label: string; value: string; width: string; color: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-[9px] text-white/40 w-16 text-right shrink-0">{label}</span>
    <div className="flex-1 h-5 bg-white/5 rounded-sm overflow-hidden">
      <div className={`h-full rounded-sm ${color} flex items-center px-2`} style={{ width }}>
        <span className="text-[9px] font-semibold text-white">{value}</span>
      </div>
    </div>
  </div>
);

const RankRow = ({ pos, name, value, medal }: { pos: number; name: string; value: string; medal?: string }) => (
  <div className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
    <span className="text-[10px] w-4 text-center">{medal || pos}</span>
    <span className="text-[10px] text-white/70 flex-1 truncate">{name}</span>
    <span className="text-[10px] font-semibold text-white">{value}</span>
  </div>
);

const DashboardMockup = () => {
  const bars = [
    { month: 'Out', h: 45, confirmed: 30, sales: 12 },
    { month: 'Nov', h: 55, confirmed: 38, sales: 18 },
    { month: 'Dez', h: 40, confirmed: 28, sales: 10 },
    { month: 'Jan', h: 65, confirmed: 48, sales: 22 },
    { month: 'Fev', h: 72, confirmed: 52, sales: 28 },
    { month: 'Mar', h: 80, confirmed: 60, sales: 32 },
  ];

  return (
    <div className="bg-[#0D1520] rounded-xl border border-white/10 p-4 md:p-5 shadow-2xl w-full max-w-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]" />
          <span className="text-xs font-semibold text-white/80">Painel Construtora</span>
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-white/5 rounded text-[9px] text-white/30 flex items-center justify-center">Período ▾</div>
          <div className="h-5 w-20 bg-white/5 rounded text-[9px] text-white/30 flex items-center justify-center">Empreend. ▾</div>
          <div className="h-5 w-16 bg-white/5 rounded text-[9px] text-white/30 flex items-center justify-center">Parceira ▾</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <KPICard label="Registros" value="847" change="↑ 12% vs anterior" />
        <KPICard label="Confirmados" value="623" change="↑ 8%" />
        <KPICard label="Confirmação" value="73,6%" change="↑ 2,1pp" />
        <KPICard label="Vendas" value="142" change="↑ 18%" />
        <KPICard label="Valor vendido" value="R$ 48,2M" change="↑ 22%" />
        <KPICard label="Ticket médio" value="R$ 339K" change="↑ 3%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Funnel */}
        <div className="bg-[#1E293B]/50 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Funil de Conversão</p>
          <div className="space-y-1.5">
            <FunnelBar label="Criadas" value="847" width="100%" color="bg-[#60A5FA]" />
            <FunnelBar label="Confirmadas" value="623" width="73%" color="bg-[#3B82F6]" />
            <FunnelBar label="No-show" value="89" width="14%" color="bg-amber-500/80" />
            <FunnelBar label="Vendas" value="142" width="22%" color="bg-emerald-500" />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[8px] text-white/30">Taxa confirmação: 73,6%</span>
            <span className="text-[8px] text-white/30">Taxa conversão: 16,8%</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-[#1E293B]/50 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Evolução 6 Meses</p>
          <div className="flex items-end gap-1.5 h-24">
            {bars.map((b) => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
                  <div className="w-full rounded-t-sm bg-emerald-500/60" style={{ height: `${b.sales}%` }} />
                  <div className="w-full bg-[#3B82F6]/60" style={{ height: `${b.confirmed - b.sales}%` }} />
                  <div className="w-full bg-[#60A5FA]/30" style={{ height: `${b.h - b.confirmed}%` }} />
                </div>
                <span className="text-[8px] text-white/30">{b.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <span className="text-[8px] text-white/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]/40" />Total</span>
            <span className="text-[8px] text-white/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]/70" />Confirm.</span>
            <span className="text-[8px] text-white/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Vendas</span>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#1E293B]/50 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Top Imobiliárias</p>
          <RankRow pos={1} name="Imob. Centro" value="32 vendas" medal="🥇" />
          <RankRow pos={2} name="Prime Imóveis" value="28 vendas" medal="🥈" />
          <RankRow pos={3} name="Rede Sul" value="21 vendas" medal="🥉" />
          <RankRow pos={4} name="Casa & Lar" value="18 vendas" />
          <RankRow pos={5} name="Elite Imóveis" value="14 vendas" />
        </div>
        <div className="bg-[#1E293B]/50 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Top Corretores</p>
          <RankRow pos={1} name="Ana Souza" value="18 vendas" medal="🥇" />
          <RankRow pos={2} name="Carlos Lima" value="15 vendas" medal="🥈" />
          <RankRow pos={3} name="Mariana R." value="12 vendas" medal="🥉" />
          <RankRow pos={4} name="Pedro Alves" value="10 vendas" />
          <RankRow pos={5} name="Julia Mendes" value="9 vendas" />
        </div>
        <div className="bg-[#1E293B]/50 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider mb-2">Top Empreendimentos</p>
          <RankRow pos={1} name="Res. Parque Sul" value="R$ 12,4M" medal="🥇" />
          <RankRow pos={2} name="Edifício Aurora" value="R$ 9,8M" medal="🥈" />
          <RankRow pos={3} name="Vila das Flores" value="R$ 7,2M" medal="🥉" />
          <RankRow pos={4} name="Torre Leste" value="R$ 6,1M" />
          <RankRow pos={5} name="Cond. Horizonte" value="R$ 5,5M" />
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
