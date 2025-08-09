import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Award, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  const stats = [
    { label: "Skills", value: "500+" },
    { label: "Industries", value: "50+" },
    { label: "Learners", value: "10K+" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#000814] text-white pt-8 md:pt-12 lg:pt-16 pb-14 md:pb-20 lg:pb-24">
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `radial-gradient(ellipse at top left, #001d3d 0%, transparent 50%), radial-gradient(ellipse at bottom right, #003566 0%, transparent 50%)` }}></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="bg-[#ffc300]/10 border-[#ffc300]/30 text-[#ffd60a] px-5 py-2 text-base font-semibold rounded-full shadow-md backdrop-blur-sm">
            🚀 Level Up: Fresh Certifications Added Weekly
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
            Forge Your Future,
            <br className="hidden md:block" />
            <span className="text-[#9b8cff]"> Certification by Certification.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Unlock a world of free, industry-recognized IT and business certifications.
            Gain the edge you need to accelerate your career, without the cost.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="bg-[#6c5ce7] hover:bg-[#8d7bff] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300" asChild>
              <Link to="/certifications">
                Start Your Journey <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" className="border-2 border-[#003566] text-white bg-[#001d3d] font-semibold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-[#003566] hover:border-[#003566] transition-all duration-300" asChild>
              <Link to="#about">How does it work?</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto pt-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#001d3d] p-6 rounded-xl shadow-xl border border-[#003566]">
                <div className="text-4xl font-extrabold text-[#9b8cff]">{s.value}</div>
                <div className="text-xs uppercase tracking-wide text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};