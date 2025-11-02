import React from "react";
import { ChevronRight } from "lucide-react";

function SidebarLink({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors ${
        isActive
          ? "bg-green-100 text-green-700 font-semibold"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

export default SidebarLink;
