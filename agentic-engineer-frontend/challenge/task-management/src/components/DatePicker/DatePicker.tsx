import { useState, useMemo, useCallback } from 'react';
import { WheelPicker } from '@ncdai/react-wheel-picker';
import '@ncdai/react-wheel-picker/style.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(month: number, year: number): string[] {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
}

function getYears(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => String(current - 2 + i));
}

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

// iOS-style 3D wheel date picker using @ncdai/react-wheel-picker
export function DatePicker({ value, onChange }: DatePickerProps) {
  const parsed = useMemo(() => {
    if (!value) {
      const now = new Date();
      return {
        month: MONTHS[now.getMonth()],
        day: String(now.getDate()).padStart(2, '0'),
        year: String(now.getFullYear()),
      };
    }
    const [y, m, d] = value.split('-').map(Number);
    return {
      month: MONTHS[m - 1],
      day: String(d).padStart(2, '0'),
      year: String(y),
    };
  }, [value]);

  const [pickerValue, setPickerValue] = useState(parsed);
  const years = useMemo(() => getYears(), []);

  const days = useMemo(() => {
    const monthIndex = MONTHS.indexOf(pickerValue.month);
    const year = Number(pickerValue.year);
    return getDaysInMonth(monthIndex, year);
  }, [pickerValue.month, pickerValue.year]);

  const monthOptions = useMemo(() =>
    MONTHS.map((m) => ({ value: m, label: m })),
  []);

  const dayOptions = useMemo(() =>
    days.map((d) => ({ value: d, label: d })),
  [days]);

  const yearOptions = useMemo(() =>
    years.map((y) => ({ value: y, label: y })),
  [years]);

  const emitChange = useCallback((updated: typeof parsed) => {
    const m = String(MONTHS.indexOf(updated.month) + 1).padStart(2, '0');
    onChange(`${updated.year}-${m}-${updated.day}`);
  }, [onChange]);

  const handleMonthChange = useCallback((val: string) => {
    const monthIndex = MONTHS.indexOf(val);
    const year = Number(pickerValue.year);
    const maxDay = new Date(year, monthIndex + 1, 0).getDate();
    const day = String(Math.min(Number(pickerValue.day), maxDay)).padStart(2, '0');
    const updated = { month: val, day, year: pickerValue.year };
    setPickerValue(updated);
    emitChange(updated);
  }, [pickerValue, emitChange]);

  const handleDayChange = useCallback((val: string) => {
    const updated = { ...pickerValue, day: val };
    setPickerValue(updated);
    emitChange(updated);
  }, [pickerValue, emitChange]);

  const handleYearChange = useCallback((val: string) => {
    const monthIndex = MONTHS.indexOf(pickerValue.month);
    const maxDay = new Date(Number(val), monthIndex + 1, 0).getDate();
    const day = String(Math.min(Number(pickerValue.day), maxDay)).padStart(2, '0');
    const updated = { month: pickerValue.month, day, year: val };
    setPickerValue(updated);
    emitChange(updated);
  }, [pickerValue, emitChange]);

  return (
    <div className="date-picker">
      <WheelPicker
        options={monthOptions}
        value={pickerValue.month}
        onValueChange={handleMonthChange}
        classNames={{ option: 'date-picker__option-month' }}
      />
      <WheelPicker
        key={`${pickerValue.month}-${pickerValue.year}`}
        options={dayOptions}
        value={pickerValue.day}
        onValueChange={handleDayChange}
      />
      <WheelPicker
        options={yearOptions}
        value={pickerValue.year}
        onValueChange={handleYearChange}
      />
    </div>
  );
}
