import { BookOpen, Mail, Twitter, Github, Linkedin } from "lucide-react";
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
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Study Guides", href: "/guides" },
        { label: "Practice Tests", href: "/practice" },
        { label: "Career Paths", href: "/careers" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Contact Us", href: "/contact" },
        { label: "Community", href: "/community" },
        { label: "Status", href: "/status" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
        { label: "GDPR", href: "/gdpr" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Github, href: "https://github.com", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Mail, href: "mailto:hello@certifree.com", label: "Email" },
  ];

  return (
    <footer className="bg-[#000814] text-gray-300 border-t border-[#001d3d] py-16 md:py-20">
      <div className="container mx-auto px-6">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          {/* Brand & Newsletter */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#003566] shadow-lg">
                <BookOpen className="h-7 w-7 text-[#ffc300]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Certi<span className="text-[#ffd60a]">Free</span></h3>
                <p className="text-sm text-gray-400">Free IT & Business Certifications</p>
              </div>
            </div>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Discover and pursue high-quality, free certifications from top providers. 
              Advance your career with verified skills and credentials that employers trust.
            </p>
            
            {/* Newsletter Signup */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg">Stay Ahead with Our Newsletter</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  placeholder="Enter your email address" 
                  className="flex-1 bg-[#001d3d] border-[#003566] text-white placeholder-gray-500 focus:border-[#ffc300] focus:ring-[#ffc300] h-12"
                />
                <Button className="bg-[#ffc300] text-[#001d3d] font-bold py-3 px-6 rounded-full shadow-md hover:bg-[#ffd60a] transition-colors duration-200">Subscribe</Button>
              </div>
              <p className="text-xs text-gray-500">
                Get exclusive insights, new certification alerts, and career tips delivered to your inbox.
              </p>
            </div>
          </div>

          {/* Quick Stats - Visually integrated with new design */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#001d3d] p-8 rounded-xl shadow-xl border border-[#003566] flex flex-col items-center text-center">
              <div className="text-4xl font-extrabold text-[#ffd60a] mb-2">500+</div>
              <p className="text-sm text-gray-400 font-medium">Free Certifications</p>
            </div>
            <div className="bg-[#001d3d] p-8 rounded-xl shadow-xl border border-[#003566] flex flex-col items-center text-center">
              <div className="text-4xl font-extrabold text-[#ffd60a] mb-2">50+</div>
              <p className="text-sm text-gray-400 font-medium">Global Providers</p>
            </div>
            <div className="bg-[#001d3d] p-8 rounded-xl shadow-xl border border-[#003566] flex flex-col items-center text-center">
              <div className="text-4xl font-extrabold text-[#ffd60a] mb-2">10K+</div>
              <p className="text-sm text-gray-400 font-medium">Thriving Learners</p>
            </div>
            <div className="bg-[#001d3d] p-8 rounded-xl shadow-xl border border-[#003566] flex flex-col items-center text-center">
              <div className="text-4xl font-extrabold text-[#ffd60a] mb-2">25+</div>
              <p className="text-sm text-gray-400 font-medium">Career Pathways</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-5">
              <h4 className="font-bold text-white text-lg">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
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
            © 2024 CertiFree. All rights reserved. <span className="mx-2">|</span> Empowering careers through accessible education.
          </div>
          
          {/* Social Links */}
          <div className="flex items-center space-x-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#001d3d] text-gray-400 hover:bg-[#003566] hover:text-[#ffd60a] transition-colors duration-200 shadow-md"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};