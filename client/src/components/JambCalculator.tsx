import { Calculator, Delete, RotateCcw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calculateExpression, formatCalculation } from "@/game/calculator";

export const CALCULATOR_KEYS = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "(", "+", ")", "⌫", "AC", "="];
const keys = CALCULATOR_KEYS;
const calculationValue = (key: string) => key === "÷" ? "/" : key === "×" ? "*" : key === "−" ? "-" : key;

export function JambCalculator({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [expression, setExpression] = useState("");
  const [feedback, setFeedback] = useState("");
  const append = (value: string) => {
    setExpression((current) => current === "0" ? value : `${current}${value}`);
    setFeedback("");
  };
  const evaluate = () => {
    try {
      const result = formatCalculation(calculateExpression(expression));
      setExpression(result);
      setFeedback("Result");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Check calculation");
    }
  };
  const press = (key: string) => {
    if (key === "AC") { setExpression(""); setFeedback(""); return; }
    if (key === "⌫") { setExpression((current) => current.slice(0, -1)); setFeedback(""); return; }
    if (key === "=") { evaluate(); return; }
    append(calculationValue(key));
  };
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^[0-9.+\-*/()]$/.test(event.key)) { event.preventDefault(); append(event.key); }
      if (event.key === "Enter" || event.key === "=") { event.preventDefault(); evaluate(); }
      if (event.key === "Backspace") { event.preventDefault(); press("⌫"); }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, expression]);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><button className="icon-button calculator-trigger" aria-label="Open JAMB calculator" title="Calculator"><Calculator size={18} /></button></DialogTrigger>
    <DialogContent className="calculator-dialog" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>JAMB calculator</DialogTitle></DialogHeader>
      <div className="calculator-display" aria-live="polite"><span>{feedback || "Ready"}</span><output>{expression || "0"}</output></div>
      <div className="calculator-keypad">{keys.map((key) => <button key={key} type="button" className={`calculator-key calculator-${key === "=" ? "equals" : key === "AC" ? "clear" : "standard"}`} onClick={() => press(key)} aria-label={key === "⌫" ? "Backspace" : key === "AC" ? "Clear calculator" : key === "=" ? "Calculate" : key}>{key === "⌫" ? <Delete size={17} /> : key === "AC" ? <><RotateCcw size={14} /> AC</> : key}</button>)}</div>
      <p className="calculator-note">Use numbers, brackets, +, −, × and ÷. Keyboard input also works.</p>
    </DialogContent>
  </Dialog>;
}
