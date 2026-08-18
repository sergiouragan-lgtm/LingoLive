sed -i '288,371c\
      <ROICalculator />' src/components/b2b/area-empresarial/CorporateEnterprisePlatform.tsx

sed -i '202,228d' src/components/b2b/area-empresarial/CorporateEnterprisePlatform.tsx

cat << 'INNER_EOF' >> src/components/b2b/area-empresarial/CorporateEnterprisePlatform.tsx

const ROICalculator = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [trainingCosts, setTrainingCosts] = useState(50000);
  const [turnoverReduction, setTurnoverReduction] = useState(5);
  const [productivityGain, setProductivityGain] = useState(10);

  const averageSalary = 50000;
  const numEmployees = 100;
  const turnoverCostPerEmployee = averageSalary * 0.5;
  const savingsFromTurnover = (numEmployees * (turnoverReduction / 100)) * turnoverCostPerEmployee;
  const savingsFromProductivity = numEmployees * averageSalary * (productivityGain / 100);
  const totalSavings = savingsFromTurnover + savingsFromProductivity;
  const netROI = totalSavings - trainingCosts;
  const roiPercentage = trainingCosts > 0 ? ((netROI / trainingCosts) * 100).toFixed(1) : 0;

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-white font-bold text-lg">Calculadora de ROI de Formação</h3>
        </div>
        <button 
          onClick={() => setShowCalculator(!showCalculator)}
          className="text-xs font-bold text-slate-300 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-lg border border-white/10"
        >
          {showCalculator ? "Ocultar Calculadora" : "Abrir Calculadora"}
        </button>
      </div>

      {showCalculator && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-white/10 pt-6 mt-2">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Custos de Formação (Estimativa Anual €)</label>
              <input 
                type="range" 
                min="5000" max="250000" step="5000"
                value={trainingCosts}
                onChange={(e) => setTrainingCosts(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-right text-white font-mono mt-1">€ {trainingCosts.toLocaleString()}</div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Redução Esperada de Evasão (Turnover) (%)</label>
              <input 
                type="range" 
                min="0" max="25" step="1"
                value={turnoverReduction}
                onChange={(e) => setTurnoverReduction(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="text-right text-white font-mono mt-1">{turnoverReduction}%</div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Ganho de Produtividade Esperado (%)</label>
              <input 
                type="range" 
                min="0" max="30" step="1"
                value={productivityGain}
                onChange={(e) => setProductivityGain(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="text-right text-white font-mono mt-1">{productivityGain}%</div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
            <h4 className="text-sm font-bold text-slate-300 mb-6 text-center">Resultados Projetados (Base: 100 Colaboradores)</h4>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Poupança em Retenção:</span>
                <span className="text-emerald-400 font-mono font-bold">€ {savingsFromTurnover.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Aumento de Valor Produzido:</span>
                <span className="text-amber-400 font-mono font-bold">€ {savingsFromProductivity.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <span className="text-slate-300 font-bold">Poupança Bruta Total:</span>
                <span className="text-white font-mono font-bold">€ {totalSavings.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
            </div>

            <div className="bg-indigo-500/20 p-4 rounded-xl border border-indigo-500/30 text-center">
              <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider block mb-1">ROI Líquido Estimado</span>
              <span className="text-3xl font-black text-white">€ {netROI.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              <span className="text-emerald-400 text-sm font-bold ml-2">({roiPercentage}%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
INNER_EOF
