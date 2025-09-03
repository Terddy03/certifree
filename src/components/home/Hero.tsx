import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ParticleBackground from "./ParticleBackground";

export const Hero = () => {
  const stats = [
    { label: "Skills", value: "200+" },
    { label: "Industries", value: "25+" },
    { label: "Certs Listed", value: "100+" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#000814] text-white min-h-[calc(100vh-64px)] flex items-center">
      <ParticleBackground />
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `radial-gradient(ellipse at top left, #001d3d 0%, transparent 50%), radial-gradient(ellipse at bottom right, #003566 0%, transparent 50%)` }}></div>

      <div className="container mx-auto px-6 relative z-10 py-10 md:py-12 lg:py-16 w-full">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <Badge variant="outline" className="bg-[#ffc300]/10 border-[#ffc300]/30 text-[#ffd60a] px-5 py-2 text-base font-semibold rounded-full shadow-md backdrop-blur-sm">
               Level Up: Fresh Certifications Added Weekly
            </Badge>
          </motion.div>

          <motion.h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}>
            Forge Your Future,
            <br className="hidden md:block" />
            <span className="text-[#ffd60a]"> Certification by Certification.</span>
          </motion.h1>

          <motion.p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}>
            Unlock a world of free, industry-recognized IT and business certifications.
            Gain the edge you need to accelerate your career, without the cost.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <Button className="bg-[#ffd60a] hover:bg-[#ffd60a] text-black font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all duration-300" asChild>
              <Link to="/certifications">
                Start Your Journey <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" className="border-2 border-[#003566] text-white bg-[#001d3d] font-semibold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-[#003566] hover:border-[#003566] transition-all duration-300" asChild>
              <Link to="/how-it-works">How does it work?</Link>
            </Button>
          </motion.div>

          <motion.div className="grid grid-cols-3 gap-6 max-w-xl mx-auto pt-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
            {stats.map((s, idx) => (
              <motion.div key={s.label} className="bg-[#001d3d] p-6 rounded-xl shadow-xl border border-[#003566]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 + idx * 0.08 }}>
                <div className="text-4xl font-extrabold text-[#ffd60a]">{s.value}</div>
                <div className="text-xs uppercase tracking-wide text-gray-400 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};