import { Mail, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ContactSection = () => {
  return (
    <section id="contact" className="scroll-mt-20 bg-[#001d3d] text-white py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Get in touch</h2>
          <p className="text-lg text-gray-300 mb-10">
            Have questions, feedback, or partnership ideas? We’d love to hear from you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-[#000f24] border border-[#003566] rounded-xl p-6 text-left">
              <Mail className="h-6 w-6 text-[#ffd60a] mb-3" />
              <h3 className="text-xl font-semibold mb-1">Email</h3>
              <p className="text-gray-400">terddy03@gmail.com</p>
            </div>
            <div className="bg-[#000f24] border border-[#003566] rounded-xl p-6 text-left">
              <MessageSquare className="h-6 w-6 text-[#ffd60a] mb-3" />
              <h3 className="text-xl font-semibold mb-1">Community</h3>
              <p className="text-gray-400">Join our FB group to connect with learners.</p>
            </div>
            <div className="bg-[#000f24] border border-[#003566] rounded-xl p-6 text-left">
              <Send className="h-6 w-6 text-[#ffd60a] mb-3" />
              <h3 className="text-xl font-semibold mb-1">Feature requests</h3>
              <p className="text-gray-400">Suggest improvements and new certifications.</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button asChild className="bg-[#ffd60a] text-black hover:bg-[#ffd60a] font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-[0_0_28px_rgba(255,214,10,0.45)] transform transition-all duration-300 hover:scale-[1.04]">
              <a href="/contact">Email us</a>
            </Button>
            <Button
              variant="outline"
              asChild
              className="bg-white text-[#001d3d] border-2 border-[#003566] hover:bg-[#003566] hover:text-white"
            >
              <a href="https://www.facebook.com/groups/1094040635392732" target="_blank" rel="noopener noreferrer">Join community</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}; 