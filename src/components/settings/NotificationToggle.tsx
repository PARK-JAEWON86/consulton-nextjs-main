"use client";

interface NotificationToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NotificationToggle = ({
  label,
  description,
  checked,
  onChange,
}: NotificationToggleProps) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1">
        <div className="flex items-center">
          <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

export default NotificationToggle;
