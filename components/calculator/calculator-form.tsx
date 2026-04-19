import { useState, useEffect } from 'react';
import { calculateCost, CalculatorInput, CalculatorOutput } from '@/lib/calculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CalculatorForm() {
  const [input, setInput] = useState<CalculatorInput>({
    printType: 'fdm',
    quantity: 1,
    printerCount: 1,
    filamentCost: 2000,
    partWeight: 100,
    partVolume: 50,
    printHours: 3,
    printMinutes: 0,
    electricityCost: 5.47,
    printerWattage: 300,
    laborHourlyRate: 500,
    postProcessingHours: 1,
    paintingEnabled: false,
    paintingTime: 0,
    compressorPower: 500,
    paintChemistry: 100,
    paintArea: 100,
    failureRate: 5,
    complexity: 1,
    equipmentCost: 100000,
    equipmentLifespan: 10000,
    monthlyRent: 15000
  });

  const [output, setOutput] = useState<CalculatorOutput | null>(null);

  const handleCalculate = () => {
    setOutput(calculateCost(input));
  };
  
  useEffect(() => {
    handleCalculate();
  }, [input]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Input Form */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="parameters">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parameters">Параметры</TabsTrigger>
            <TabsTrigger value="postprocessing">Постобработка</TabsTrigger>
            <TabsTrigger value="equipment">Оборудование</TabsTrigger>
          </TabsList>
          
          <TabsContent value="parameters" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип печати</Label>
                <Select value={input.printType} onValueChange={(v) => setInput({...input, printType: v as 'fdm' | 'sla'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fdm">FDM (Пластик)</SelectItem>
                    <SelectItem value="sla">SLA (Фотополимер)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Количество (шт)</Label>
                <Input type="number" min="1" value={input.quantity} onChange={(e) => setInput({...input, quantity: Number(e.target.value)})} />
              </div>
              {input.printType === 'fdm' ? (
                <div className="space-y-2">
                  <Label>Вес детали (г)</Label>
                  <Input type="number" min="0" value={input.partWeight} onChange={(e) => setInput({...input, partWeight: Number(e.target.value)})} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Объем детали (мл)</Label>
                  <Input type="number" min="0" value={input.partVolume} onChange={(e) => setInput({...input, partVolume: Number(e.target.value)})} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Стоимость материала (₽/кг или ₽/л)</Label>
                <Input type="number" min="0" value={input.filamentCost} onChange={(e) => setInput({...input, filamentCost: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Время печати (часы)</Label>
                <Input type="number" min="0" value={input.printHours} onChange={(e) => setInput({...input, printHours: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Время печати (минуты)</Label>
                <Input type="number" min="0" max="59" value={input.printMinutes} onChange={(e) => setInput({...input, printMinutes: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Количество параллельных принтеров</Label>
                <Input type="number" min="1" value={input.printerCount} onChange={(e) => setInput({...input, printerCount: Number(e.target.value)})} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="postprocessing" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Часы постобработки</Label>
                <Input type="number" min="0" value={input.postProcessingHours} onChange={(e) => setInput({...input, postProcessingHours: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Ставка труда (₽/час)</Label>
                <Input type="number" min="0" value={input.laborHourlyRate} onChange={(e) => setInput({...input, laborHourlyRate: Number(e.target.value)})} />
              </div>
              <div className="flex items-center gap-2 col-span-1 sm:col-span-2 mt-4 p-4 border rounded-lg bg-card">
                <input
                  type="checkbox"
                  id="painting"
                  checked={input.paintingEnabled}
                  onChange={(e) => setInput({...input, paintingEnabled: (e.target as HTMLInputElement).checked})}
                  className="w-4 h-4 text-primary rounded border-input focus:ring-primary"
                />
                <Label htmlFor="painting" className="text-base cursor-pointer">Включить грунтовку и покраску</Label>
              </div>
              {input.paintingEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>Время покраски (часы)</Label>
                    <Input type="number" min="0" value={input.paintingTime} onChange={(e) => setInput({...input, paintingTime: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Площадь покраски (см²)</Label>
                    <Input type="number" min="0" value={input.paintArea} onChange={(e) => setInput({...input, paintArea: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Химия на деталь (₽)</Label>
                    <Input type="number" min="0" value={input.paintChemistry} onChange={(e) => setInput({...input, paintChemistry: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Мощность компрессора/вытяжки (Вт)</Label>
                    <Input type="number" min="0" value={input.compressorPower} onChange={(e) => setInput({...input, compressorPower: Number(e.target.value)})} />
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="equipment" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Стоимость оборудования (₽)</Label>
                <Input type="number" min="0" value={input.equipmentCost} onChange={(e) => setInput({...input, equipmentCost: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Ресурс до кап. ремонта (часы)</Label>
                <Input type="number" min="1" value={input.equipmentLifespan} onChange={(e) => setInput({...input, equipmentLifespan: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Аренда помещения (₽/мес)</Label>
                <Input type="number" min="0" value={input.monthlyRent} onChange={(e) => setInput({...input, monthlyRent: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Электричество (₽/кВт⋅ч)</Label>
                <Input type="number" min="0" value={input.electricityCost} onChange={(e) => setInput({...input, electricityCost: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Мощность принтера (Вт)</Label>
                <Input type="number" min="0" value={input.printerWattage} onChange={(e) => setInput({...input, printerWattage: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Вероятность брака (%)</Label>
                <Input type="number" min="0" max="100" value={input.failureRate} onChange={(e) => setInput({...input, failureRate: Number(e.target.value)})} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Сложность проекта (1.0 = норма, 2.0 = очень сложно)</Label>
                <Input type="number" min="1" step="0.1" value={input.complexity} onChange={(e) => setInput({...input, complexity: Number(e.target.value)})} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <Button onClick={handleCalculate} className="w-full" size="lg">
          Обновить расчет
        </Button>
      </div>
      
      {/* Right: Results */}
      <div className="space-y-6">
        <h3 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Cost Allocation (Qty: {input.quantity})</h3>
        {output && (
          <div className="glass rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden h-full">
             <div className="absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-12 -translate-y-12">
               <svg viewBox="0 0 100 100" className="fill-white"><circle cx="50" cy="50" r="50"/></svg>
             </div>
             
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="serif italic text-lg opacity-90">Filament Consumption</span>
                    <span className="text-[10px] opacity-40">Plastic / Resin</span>
                  </div>
                  <span className="text-xl">₽{output.materialCost.toFixed(2)}</span>
                </div>
                <div className="h-[1px] w-full bg-white/10"></div>
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="serif italic text-lg opacity-90">Energy Consumption</span>
                    <span className="text-[10px] opacity-40">Power & electricity</span>
                  </div>
                  <span className="text-xl">₽{output.powerCost.toFixed(2)}</span>
                </div>
                <div className="h-[1px] w-full bg-white/10"></div>
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="serif italic text-lg opacity-90">Wear & Amortization</span>
                    <span className="text-[10px] opacity-40">Machine life offset</span>
                  </div>
                  <span className="text-xl">₽{output.depreciationCost.toFixed(2)}</span>
                </div>
                <div className="h-[1px] w-full bg-white/10"></div>
                
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="serif italic text-lg opacity-90">Labor & Post-processing</span>
                    <span className="text-[10px] opacity-40">Time offset + Rent</span>
                  </div>
                  <span className="text-xl">₽{(output.laborCost + output.postProcessingCost + output.rentCost).toFixed(2)}</span>
                </div>
                
                {(input.paintingEnabled || input.complexity > 1) && <div className="h-[1px] w-full bg-white/10"></div>}
                
                {input.paintingEnabled && (
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="serif italic text-lg opacity-90">Painting & Finishing</span>
                      <span className="text-[10px] opacity-40">Chemicals and labor</span>
                    </div>
                    <span className="text-xl">₽{output.paintingCost.toFixed(2)}</span>
                  </div>
                 )}
                 {(input.paintingEnabled && input.complexity > 1) && <div className="h-[1px] w-full bg-white/10"></div>}
                 {input.complexity > 1 && (
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="serif italic text-lg opacity-90">Complexity Margin</span>
                      <span className="text-[10px] opacity-40">Added difficulty multiplier</span>
                    </div>
                    <span className="text-xl">₽{output.complexityCost.toFixed(2)}</span>
                  </div>
                 )}
                 <div className="h-[1px] w-full bg-white/10"></div>
                 <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="serif italic text-lg opacity-90">Margin / Buffer</span>
                    <span className="text-[10px] opacity-40">Success safety factor ({input.failureRate}%)</span>
                  </div>
                  <span className="text-xl">₽{output.riskCost.toFixed(2)}</span>
                </div>
             </div>
             
             <div className="mt-8 pt-8 border-t border-white/20 relative z-10 flex flex-col items-end">
                 <span className="text-[10px] uppercase tracking-[0.4em] opacity-40">Project Estimate</span>
                 <div className="text-[60px] md:text-[80px] leading-none serif font-light mt-2 gold-text">
                    ₽{Math.floor(output.totalCost)}<span className="text-3xl">.{(output.totalCost % 1).toFixed(2).substring(2)}</span>
                 </div>
                 <div className="text-xs text-white/40 mt-2">Unit Cost: <span className="text-white">₽{(output.totalCost / input.quantity).toFixed(2)}</span></div>
                 
                 <div className="w-full mt-6 flex gap-2">
                    <div className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full gold-bg" style={{width: `${Math.min(100, (output.materialCost / output.totalCost) * 100)}%`}}></div>
                    </div>
                    <div className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-white/60" style={{width: `${Math.min(100, (output.laborCost / output.totalCost) * 100)}%`}}></div>
                    </div>
                    <div className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-white/40" style={{width: `${Math.min(100, (output.depreciationCost / output.totalCost) * 100)}%`}}></div>
                    </div>
                 </div>
             </div>
             
          </div>
        )}
      </div>
    </div>
  );
}
