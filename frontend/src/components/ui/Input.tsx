import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  suffix?: string;
  prefixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, suffix, prefixIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[12px] font-medium text-[#4A554E] mb-1">
            {label}
            {props.required && <span className="text-[#DC2626] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-[8px]">
          {prefixIcon && (
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8CA696]">
              {prefixIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-9 bg-white text-[#17201B] placeholder:text-[#9CA8A0] text-[13px] border rounded-[8px] transition-colors duration-150 py-1.5 px-3',
              'focus:outline-none focus:ring-1 focus:ring-[#006B35] focus:border-[#006B35]',
              prefixIcon && 'pl-8',
              suffix && 'pr-10',
              error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#E2E8E4]',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[11px] font-medium text-[#66736C]">
              {suffix}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-[11px] text-[#DC2626] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-[11px] text-[#66736C]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
