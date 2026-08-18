sed -i 's/Clock, Briefcase, Award, Zap, Crosshair, Network/Clock, Briefcase, Award, Zap, Crosshair, Network, Calculator/' src/components/b2b/area-empresarial/CorporateEnterprisePlatform.tsx

sed -i '/const CEPCommandCenter = () => (/c\
const CEPCommandCenter = () => {\n\
  const [showCalculator, setShowCalculator] = useState(false);\n\
  const [trainingCosts, setTrainingCosts] = useState(50000);\n\
  const [turnoverReduction, setTurnoverReduction] = useState(5);\n\
  const [productivityGain, setProductivityGain] = useState(10);\n\
\n\
  const averageSalary = 50000;\n\
  const numEmployees = 100;\n\
  const turnoverCostPerEmployee = averageSalary * 0.5;\n\
  const savingsFromTurnover = (numEmployees * (turnoverReduction / 100)) * turnoverCostPerEmployee;\n\
  const savingsFromProductivity = numEmployees * averageSalary * (productivityGain / 100);\n\
  const totalSavings = savingsFromTurnover + savingsFromProductivity;\n\
  const netROI = totalSavings - trainingCosts;\n\
  const roiPercentage = trainingCosts > 0 ? ((netROI / trainingCosts) * 100).toFixed(1) : 0;\n\
\n\
  return (\n\
    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 py-16 relative overflow-hidden shadow-2xl">' src/components/b2b/area-empresarial/CorporateEnterprisePlatform.tsx

