import { Navigate } from "react-router-dom";

const Index = () => {
  const hasOnboarded = localStorage.getItem("catchup-onboarded") === "true";
  return <Navigate to={hasOnboarded ? "/home" : "/onboarding"} replace />;
};

export default Index;
