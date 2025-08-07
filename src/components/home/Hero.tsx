import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Award, Lightbulb, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  const stats = [
    { icon: CheckCircle, label: "Skills Mastered", value: "500+" },
    { icon: Award, label: "Industry Recognized", value: "50+" },
    { icon: Lightbulb, label: "Pathways Unlocked", value: "10K+" },
    { icon: TrendingUp, label: "Career Boosts", value: "95%" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#000814] text-white py-16 md:py-24 lg:py-32">
      {/* Background Elements - Subtle geometric patterns or light glow */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `radial-gradient(ellipse at top left, #001d3d 0%, transparent 50%), radial-gradient(ellipse at bottom right, #003566 0%, transparent 50%)` }}></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Content - Wider column on larger screens */}
          <div className="lg:col-span-7 space-y-10 text-center lg:text-left animate-fade-in">
            {/* Badge */}
            <Badge variant="outline" className="bg-[#ffc300]/10 border-[#ffc300]/30 text-[#ffd60a] px-5 py-2 text-base font-semibold rounded-full shadow-md backdrop-blur-sm">
              🚀 Level Up: Fresh Certifications Added Weekly
            </Badge>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight text-white tracking-tighter">
                Forge Your Future, <br className="hidden md:block"/> <span className="text-[#ffd60a]">Certification by Certification.</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Unlock a world of free, industry-recognized IT and business certifications. 
                Gain the edge you need to accelerate your career, without the cost.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <Button className="bg-[#ffc300] text-[#001d3d] font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-[#ffd60a] transition-all duration-300 transform hover:-translate-y-1" asChild>
                <Link to="/certifications">
                  Start Your Journey <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" className="border-2 border-[#003566] text-white bg-[#001d3d] font-semibold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-[#003566] hover:border-[#003566] transition-all duration-300 transform hover:-translate-y-1" asChild>
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>

          {/* Visual/Stats - Narrower column on larger screens */}
          <div className="lg:col-span-5 space-y-12 flex flex-col items-center lg:items-end animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {/* Stats Grid - Enhanced visual */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="bg-[#001d3d] p-8 rounded-xl shadow-xl border border-[#003566] flex flex-col items-center text-center hover:scale-[1.03] transition-transform duration-300 ease-out"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <div className="mb-4 p-4 rounded-full bg-[#003566] flex items-center justify-center shadow-lg">
                    <stat.icon className="h-7 w-7 text-[#ffc300]" />
                  </div>
                  <div className="text-4xl font-extrabold text-[#ffd60a] mb-2">{stat.value}</div>
                  <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Feature Highlight */}
            <div className="w-full max-w-md bg-[#001d3d] p-8 rounded-xl shadow-xl border border-[#003566] text-center animate-bounce-in" style={{ animationDelay: "0.7s" }}>
              <div className="w-20 h-20 rounded-full bg-[#003566] mx-auto mb-5 flex items-center justify-center shadow-xl">
                <Award className="h-10 w-10 text-[#ffd60a]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Quality, Accessibility, Impact.</h3>
              <p className="text-gray-400 text-base leading-relaxed">
                Every certification on CertiFree is curated for quality and impact, ensuring you get the most relevant skills for today's job market.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};