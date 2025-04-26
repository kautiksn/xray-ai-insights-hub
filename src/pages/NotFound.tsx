
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-medical-darkest-gray">
      <div className="text-center max-w-md p-6 rounded-lg border border-medical-dark-gray/30 bg-medical-darker-gray/70">
        <div className="flex justify-center mb-4">
          <AlertCircle size={64} className="text-medical-blue" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-medical-blue">404</h1>
        <p className="text-xl text-gray-300 mb-6">
          This page could not be found
        </p>
        <Button className="bg-medical-blue hover:bg-medical-dark-blue" asChild>
          <a href="/">Return to Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
