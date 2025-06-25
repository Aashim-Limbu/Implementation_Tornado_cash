import {InputHTMLAttributes} from "react";

type InputProps = {
    label: string;
    id: string;
    className?: string;
    wrapperClassName?: string;
    placeholder?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export default function Input({
    id,
    label,
    placeholder = "",
    className = "",
    wrapperClassName = "",
    ...inputProps
}: InputProps) {
    return (
        <div className={wrapperClassName}>
            <label htmlFor={id} className="block text-sm font-medium">
                {label}
            </label>
            <div className="mt-2">
                <input
                    id={id}
                    name={id}
                    placeholder={placeholder}
                    className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900  outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm ${className}`}
                    {...inputProps}
                />
            </div>
        </div>
    );
}
