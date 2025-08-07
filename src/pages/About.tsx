import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart,
  Zap,
  Users,
  CheckCircle,
  Award,
  BookOpen,
  Code,
  Cloud,
  Database,
  Shield,
  Globe,
  Lightbulb,
  DollarSign,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGlobalStats } from "@/hooks/useGlobalStats";

const About = () => {
  const { stats, loading, error } = useGlobalStats();

  const values = [
    {
      icon: Heart,
      title: "Accessible Education",
      description: "We believe quality education should be free and accessible to everyone, regardless of background or financial situation."
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Every certification on our platform is carefully vetted to ensure it meets industry standards and provides real value."
    },
    {
      icon: Globe,
      title: "Global Community",
      description: "Building a worldwide community of learners who support and inspire each other's professional growth."
    },
    {
      icon: Lightbulb,
      title: "Innovation Focus",
      description: "Continuously improving our platform with cutting-edge features to enhance the learning experience."
    }
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "Former education technology executive with 15+ years experience democratizing learning.",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Michael Chen",
      role: "CTO",
      bio: "Full-stack engineer passionate about building scalable platforms that impact millions of learners.",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Content",
      bio: "Learning experience designer ensuring our certification curation meets the highest standards.",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      twitter: "#"
    },
    {
      name: "David Kim",
      role: "Product Manager",
      bio: "User experience advocate focused on making professional development accessible and engaging.",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      twitter: "#"
    }
  ];

  const milestones = [
    {
      year: "2021",
      title: "Founded",
      description: "CertiFree was born from a simple idea: make quality certifications accessible to everyone."
    },
    {
      year: "2022",
      title: "First 100 Certifications",
      description: "Reached our first milestone by curating 100 high-quality free certifications."
    },
    {
      year: "2023",
      title: "Community Growth",
      description: "Welcomed our 10,000th learner and expanded to cover 8 major career domains."
    },
    {
      year: "2024",
      title: "Platform Evolution",
      description: "Launched advanced features including progress tracking and personalized recommendations."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted py-20">
          <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 bg-primary/10 border-primary/20 text-primary px-4 py-2">
                About CertiFree
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gradient-hero">Democratizing</span>
                <br />
                <span className="text-foreground">Professional Education</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                We're on a mission to make high-quality professional certifications accessible to everyone. 
                No matter where you are in your career journey, we're here to help you discover, learn, 
                and grow with completely free certifications from the world's top providers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/certifications">
                    Explore Certifications
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">
                    Get in Touch
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/40">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
              Our Impact
            </h2>
            {loading ? (
              <div className="text-center">
                <p>Loading stats...</p>
              </div>
            ) : error ? (
              <div className="text-center text-destructive">
                <p>Error loading stats: {error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center card-elegant">
                  <CardContent className="p-6">
                    <Users className="h-10 w-10 text-primary mb-4 mx-auto" />
                    <p className="text-4xl font-bold text-gradient-hero mb-2">{stats.totalUsers.toLocaleString()}+</p>
                    <h3 className="text-xl font-semibold text-foreground">Registered Users</h3>
                  </CardContent>
                </Card>
                <Card className="text-center card-elegant">
                  <CardContent className="p-6">
                    <BookOpen className="h-10 w-10 text-primary mb-4 mx-auto" />
                    <p className="text-4xl font-bold text-gradient-hero mb-2">{stats.totalCertifications.toLocaleString()}+</p>
                    <h3 className="text-xl font-semibold text-foreground">Certifications Available</h3>
                  </CardContent>
                </Card>
                <Card className="text-center card-elegant">
                  <CardContent className="p-6">
                    <Award className="h-10 w-10 text-primary mb-4 mx-auto" />
                    <p className="text-4xl font-bold text-gradient-hero mb-2">{stats.totalCertificationsCompleted.toLocaleString()}+</p>
                    <h3 className="text-xl font-semibold text-foreground">Certifications Completed</h3>
                  </CardContent>
                </Card>
            </div>
            )}
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  <span className="text-gradient-hero">Our Mission</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  To remove barriers and democratize access to professional development, 
                  empowering individuals worldwide to advance their careers through high-quality, 
                  free certifications.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {values.map((value, index) => (
                  <Card 
                    key={value.title} 
                    className="card-elegant hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <value.icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {value.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  <span className="text-gradient">Our Story</span>
                </h2>
              </div>

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div 
                    key={milestone.year}
                    className="flex items-start gap-6 animate-fade-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground font-bold">{milestone.year}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="text-gradient-hero">Meet Our Team</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Passionate professionals dedicated to making quality education accessible to everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card 
                  key={member.name} 
                  className="card-elegant hover-lift text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium text-sm mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {member.bio}
                    </p>
                    
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={member.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary-variant">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Join thousands of learners who are advancing their careers with free, 
                high-quality certifications from top providers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/certifications">
                    Browse Certifications
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                  <Link to="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;