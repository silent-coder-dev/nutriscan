'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (healthProfile: {
    dietaryPreference: string;
    allergies: string;
    medicalConditions: string;
  }) => void;
  onSkip: () => void;
}

const DIET_OPTIONS = [
  'Standard Omnivore',
  'Vegetarian',
  'Strict Vegan',
  'Jain (No Onion/Garlic/Root)',
  'Eggetarian',
  'Halal Conscious',
  'Keto / Low-Carb',
];

const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Gluten / Celiac',
  'Cow Milk / Lactose',
  'Soy',
  'Eggs',
  'Shellfish / Seafood',
  'Sesame',
];

const MEDICAL_OPTIONS = [
  'Type-2 Diabetes',
  'Hypertension (Low Sodium)',
  'High Cholesterol',
  'Acid Reflux / GERD',
  'PCOS / PCOD',
  'Thyroid Imbalance',
];

const STEPS = [
  {
    title: 'How do you eat?',
    blurb: "Pick what fits your everyday diet. We'll flag ingredients that don't match.",
    customLabel: 'Or describe your own',
    customPlaceholder: 'e.g. Low histamine, pescatarian…',
  },
  {
    title: 'Anything you must avoid?',
    blurb: 'Select every allergen that applies. These get a loud warning on every scan.',
    customLabel: 'Others (comma separated)',
    customPlaceholder: 'e.g. Mustard, sulphites…',
  },
  {
    title: 'Any health conditions?',
    blurb: 'Optional. Helps us tune warnings for salt, sugar and certain additives.',
    customLabel: 'Anything else worth noting',
    customPlaceholder: 'e.g. Gout / uric acid…',
  },
];

export default function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedDiet, setSelectedDiet] = useState<string>('Standard Omnivore');
  const [customDiet, setCustomDiet] = useState('');

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');

  const [selectedMedical, setSelectedMedical] = useState<string[]>([]);
  const [customMedical, setCustomMedical] = useState('');

  if (!isOpen) return null;

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinish = () => {
    const finalDiet = customDiet.trim() || selectedDiet;

    const allAllergies = [...selectedAllergies];
    if (customAllergy.trim()) allAllergies.push(customAllergy.trim());

    const allMedical = [...selectedMedical];
    if (customMedical.trim()) allMedical.push(customMedical.trim());

    onComplete({
      dietaryPreference: finalDiet,
      allergies: allAllergies.join(', '),
      medicalConditions: allMedical.join(', '),
    });
  };

  const current = STEPS[step - 1];

  const options =
    step === 1 ? DIET_OPTIONS : step === 2 ? ALLERGY_OPTIONS : MEDICAL_OPTIONS;
  const isActive = (opt: string) =>
    step === 1
      ? selectedDiet === opt && !customDiet
      : step === 2
      ? selectedAllergies.includes(opt)
      : selectedMedical.includes(opt);
  const onPick = (opt: string) => {
    if (step === 1) {
      setSelectedDiet(opt);
      setCustomDiet('');
    } else if (step === 2) {
      toggleItem(selectedAllergies, setSelectedAllergies, opt);
    } else {
      toggleItem(selectedMedical, setSelectedMedical, opt);
    }
  };
  const customValue = step === 1 ? customDiet : step === 2 ? customAllergy : customMedical;
  const setCustomValue = step === 1 ? setCustomDiet : step === 2 ? setCustomAllergy : setCustomMedical;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] w-full max-w-xl p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] font-semibold">0{step} / 03</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`h-1.5 w-10 rounded-full transition-colors ${s <= step ? 'bg-leaf' : 'bg-line'}`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-[13px] font-semibold text-muted hover:text-fg underline underline-offset-4 cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <h3 className="font-display text-[32px] leading-tight font-extrabold tracking-[-0.03em]">
              {current.title}
            </h3>
            <p className="text-muted mt-1.5">{current.blurb}</p>

            <div className="flex flex-wrap gap-2 mt-6">
              {options.map((opt) => {
                const active = isActive(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onPick(opt)}
                    aria-pressed={active}
                    className={`chip ${active ? (step === 2 ? 'chip-warn' : 'chip-on') : ''}`}
                  >
                    {active && step !== 1 && <Check className="w-3.5 h-3.5" />}
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="field-label">{current.customLabel}</label>
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={current.customPlaceholder}
                className="field"
              />
            </div>

            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2)}
                  className="btn-ghost"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => (step < 3 ? setStep((step + 1) as 2 | 3) : handleFinish())}
                className="btn-primary flex-1"
              >
                {step < 3 ? 'Continue' : 'Finish setup'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
