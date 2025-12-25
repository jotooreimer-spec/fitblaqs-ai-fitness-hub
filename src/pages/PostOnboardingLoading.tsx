import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import postOnboardingBg from "@/assets/post-onboarding-bg.png";
import fitblaqsLogo from "@/assets/fitblaqs-logo.png";

const PostOnboardingLoading = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    // Navigate to dashboard after 3 seconds
    const navTimer = setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center relative transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        backgroundImage: `url(${postOnboardingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <span className="text-white/80 text-sm font-medium">Fb</span>
          <span className="text-white font-bold">FitBlaqs</span>
          <span className="text-white/60 text-xs">Power & Healthy</span>
        </div>

        {/* Main Text */}
        <div className="text-left px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
            STRENGTHEN<br />
            YOUR ARMS<br />
            IN 30 DAYS
          </h1>
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 mt-4">
            <span className="text-white font-semibold text-sm">LEAP</span>
            <span className="text-white/80 text-sm ml-2">FITNESS</span>
          </div>
        </div>

        {/* Stats at bottom */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-8 px-8">
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-yellow-500 text-2xl">🏆</span>
              <span className="text-white font-bold text-2xl">50M+</span>
              <span className="text-yellow-500 text-2xl">🏆</span>
            </div>
            <p className="text-white/60 text-xs">INSTALLS</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-yellow-500 text-2xl">🏆</span>
              <div>
                <div className="flex text-yellow-400 text-xs">★★★★★</div>
                <span className="text-white font-bold text-2xl">4.9</span>
              </div>
              <span className="text-yellow-500 text-2xl">🏆</span>
            </div>
            <p className="text-white/60 text-xs">370K+ Reviews</p>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
};

export default PostOnboardingLoading;
