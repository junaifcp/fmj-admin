
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect to landing page
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Index;
