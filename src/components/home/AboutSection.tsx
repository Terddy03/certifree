import React from "react";
import { Globe, Lightbulb, GraduationCap } from "lucide-react";

export const AboutSection = () => {
  return (
    <section id="about" className="bg-[#001d3d] text-white py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
          Our Mission: Empowering Futures, <br className="hidden sm:block" /> One Certification at a Time.
        </h2>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-16 leading-relaxed">
          At CertiFree, we believe that access to quality education and career advancement opportunities should be universal. We are dedicated to breaking down financial barriers, providing a curated platform for free, recognized IT and business certifications.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Value Proposition 1 */}
          <div className="space-y-6 flex flex-col items-center">
            <div className="p-5 rounded-full bg-[#003566] text-[#ffd60a] shadow-lg">
              <Lightbulb className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">Innovation & Accessibility</h3>
            <p className="text-base text-gray-400 leading-relaxed">
              We constantly scout for the latest and most relevant free certifications, ensuring you stay ahead in a rapidly evolving job market. Education should be free and accessible to all.
            </p>
          </div>

          {/* Value Proposition 2 */}
          <div className="space-y-6 flex flex-col items-center">
            <div className="p-5 rounded-full bg-[#003566] text-[#ffd60a] shadow-lg">
              <GraduationCap className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">Quality & Recognition</h3>
            <p className="text-base text-gray-400 leading-relaxed">
              Every certification featured on CertiFree is from reputable organizations, offering genuine value and industry recognition to boost your professional profile.
            </p>
          </div>

          {/* Value Proposition 3 */}
          <div className="space-y-6 flex flex-col items-center">
            <div className="p-5 rounded-full bg-[#003566] text-[#ffd60a] shadow-lg">
              <Globe className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">Community & Growth</h3>
            <p className="text-base text-gray-400 leading-relaxed">
              Join a thriving community of learners. Share insights, collaborate on study materials, and grow together as you navigate your certification journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}; 