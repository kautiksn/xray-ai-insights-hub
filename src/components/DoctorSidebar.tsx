
import React, { useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Doctor {
  id: string;
  name: string;
}

interface DoctorSidebarProps {
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSelectDoctor: (doctor: Doctor) => void;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  doctors,
  currentDoctor,
  onSelectDoctor,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Sidebar toggle button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-medical-dark-gray rounded-md nav-button"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-medical-darker-gray border-r border-medical-gray/20 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-medical-blue mb-6 flex items-center">
            <User size={18} className="mr-2" /> Select Doctor
          </h2>
          
          <ul className="space-y-2">
            {doctors.map((doctor) => (
              <li key={doctor.id}>
                <button
                  className={cn(
                    "w-full text-left py-2 px-4 rounded-md transition-colors",
                    doctor.id === currentDoctor.id
                      ? "bg-medical-blue/20 text-medical-blue"
                      : "hover:bg-medical-dark-gray/70"
                  )}
                  onClick={() => {
                    onSelectDoctor(doctor);
                    setIsOpen(false);
                  }}
                >
                  {doctor.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};
