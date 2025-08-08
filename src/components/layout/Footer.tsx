import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  const footerSections = [
    {
      title: "Platform",
      links: [
        { label: "Certifications", href: "/certifications" },
        { label: "Categories", href: "/categories" },
        { label: "Providers", href: "/providers" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "Community", href: "https://www.facebook.com/groups/1094040635392732" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-[#000814] text-gray-300 border-t border-[#001d3d] py-16 md:py-20">
      <div className="container mx-auto px-6">
        {/* Brand */}
        <div className="flex items-center space-x-4 mb-12">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#003566] shadow-lg">
            <BookOpen className="h-7 w-7 text-[#ffc300]" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Certi<span className="text-[#ffd60a]">Free</span></h3>
            <p className="text-sm text-gray-400">Free IT & Business Certifications</p>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-5">
              <h4 className="font-bold text-white text-lg">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : '_self'}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-base text-gray-400 hover:text-[#ffd60a] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#001d3d]">
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            © 2024 CertiFree. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};